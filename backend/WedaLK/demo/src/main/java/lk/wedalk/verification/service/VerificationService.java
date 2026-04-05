package lk.wedalk.verification.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lk.wedalk.common.enums.VerificationStatus;
import lk.wedalk.common.exceptions.BadRequestException;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.users.model.Role;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lk.wedalk.verification.dto.VerificationStatusResponse;
import lk.wedalk.verification.dto.VerificationSubmitResponse;
import lk.wedalk.verification.model.VerificationSubmission;
import lk.wedalk.verification.repository.VerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class VerificationService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "application/pdf");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "pdf");

    private final VerificationRepository verificationRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    public VerificationSubmitResponse submitVerification(Long workerId, MultipartFile document) {
        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new NotFoundException("Worker not found"));

        if (worker.getRole() != Role.WORKER) {
            throw new BadRequestException("Only workers can submit verification");
        }

        validateDocument(document);

        StoredFileMetadata storedFile = storeDocument(document, workerId);

        VerificationSubmission submission = verificationRepository.findByWorkerId(workerId)
                .orElseGet(VerificationSubmission::new);

        submission.setWorker(worker);
        submission.setDocumentName(storedFile.originalName());
        submission.setDocumentPath(storedFile.storedPath());
        submission.setDocumentContentType(storedFile.contentType());
        submission.setDocumentSizeBytes(storedFile.sizeBytes());
        submission.setStatus(VerificationStatus.PENDING);
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setReviewedAt(null);
        submission.setReviewedBy(null);
        submission.setAdminNotes(null);

        verificationRepository.save(submission);

        // Reflect PENDING status on the worker's profile immediately
        worker.setVerificationStatus(VerificationStatus.PENDING);
        userRepository.save(worker);

        return new VerificationSubmitResponse(VerificationStatus.PENDING.name(), storedFile.originalName());
    }

    /**
     * Returns the current worker's most recent verification submission,
     * or a "NONE" response if no submission exists yet.
     */
    public VerificationStatusResponse getMyVerification(Long workerId) {
        Optional<VerificationSubmission> optional = verificationRepository.findByWorkerId(workerId);

        if (optional.isEmpty()) {
            return VerificationStatusResponse.builder()
                    .workerId(workerId)
                    .verificationStatus(VerificationStatus.NONE.name())
                    .build();
        }

        return toStatusResponse(optional.get());
    }

    /**
     * Returns all submissions that are currently in PENDING status, ordered
     * oldest-first so admins process them in order of arrival.
     */
    public List<VerificationStatusResponse> getPendingSubmissions() {
        return verificationRepository
                .findByStatusOrderBySubmittedAtAsc(VerificationStatus.PENDING)
                .stream()
                .map(this::toStatusResponse)
                .collect(Collectors.toList());
    }

    public void reviewVerification(Long submissionId, Long adminId, String status, String adminNotes) {
        VerificationSubmission submission = verificationRepository.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Verification submission not found"));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new NotFoundException("Admin user not found"));

        VerificationStatus newStatus = VerificationStatus.valueOf(status);

        submission.setStatus(newStatus);
        submission.setReviewedAt(LocalDateTime.now());
        submission.setReviewedBy(admin);
        submission.setAdminNotes(adminNotes);

        verificationRepository.save(submission);

        // Propagate the decision to the worker's user record
        User worker = submission.getWorker();
        worker.setVerificationStatus(newStatus);
        userRepository.save(worker);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private VerificationStatusResponse toStatusResponse(VerificationSubmission s) {
        User worker = s.getWorker();
        return VerificationStatusResponse.builder()
                .submissionId(s.getId())
                .verificationStatus(s.getStatus() != null ? s.getStatus().name() : VerificationStatus.NONE.name())
                .documentName(s.getDocumentName())
                .documentSizeBytes(s.getDocumentSizeBytes())
                .submittedAt(s.getSubmittedAt())
                .reviewedAt(s.getReviewedAt())
                .adminNotes(s.getAdminNotes())
                .workerId(worker != null ? worker.getId() : null)
                .workerName(worker != null ? worker.getFullName() : null)
                .workerEmail(worker != null ? worker.getEmail() : null)
                .build();
    }

    private void validateDocument(MultipartFile document) {
        if (document == null || document.isEmpty()) {
            throw new BadRequestException("Document file is required");
        }

        if (document.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("File too large");
        }

        String originalFilename = document.getOriginalFilename();
        String extension = getExtension(originalFilename);
        String contentType = document.getContentType();

        if (!ALLOWED_EXTENSIONS.contains(extension)
                || contentType == null
                || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Unsupported format");
        }
    }

    private StoredFileMetadata storeDocument(MultipartFile document, Long workerId) {
        String extension = getExtension(document.getOriginalFilename());
        String safeStoredName = "worker-" + workerId + "-" + UUID.randomUUID() + "." + extension;

        Path destinationDirectory = Paths.get(uploadDir, "verification-documents");
        Path destinationPath = destinationDirectory.resolve(safeStoredName);

        try {
            Files.createDirectories(destinationDirectory);
            try (InputStream inputStream = document.getInputStream()) {
                Files.copy(inputStream, destinationPath, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw new BadRequestException("Failed to store verification document", ex);
        }

        return new StoredFileMetadata(
                safeFileName(document.getOriginalFilename()),
                destinationPath.toString(),
                document.getContentType().toLowerCase(Locale.ROOT),
                document.getSize());
    }

    private String getExtension(String fileName) {
        if (fileName == null) {
            return "";
        }

        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            return "";
        }

        return fileName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }

    private String safeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "document";
        }
        return Paths.get(fileName).getFileName().toString();
    }

    private record StoredFileMetadata(
            String originalName,
            String storedPath,
            String contentType,
            Long sizeBytes) {
    }
}
