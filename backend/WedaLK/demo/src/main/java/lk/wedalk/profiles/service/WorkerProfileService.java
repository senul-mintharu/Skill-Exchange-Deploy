package lk.wedalk.profiles.service;

import lk.wedalk.common.enums.WorkerRegistrationPaymentStatus;
import lk.wedalk.profiles.dto.WorkerProfileCreateRequest;
import lk.wedalk.profiles.dto.WorkerProfileResponse;
import lk.wedalk.profiles.dto.WorkerProfileUpdateRequest;
import lk.wedalk.profiles.model.WorkerProfile;
import lk.wedalk.profiles.repository.WorkerProfileRepository;
import lk.wedalk.common.exceptions.BadRequestException;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.common.exceptions.UnauthorizedException;
import lk.wedalk.reviews.repository.ReviewRepository;
import lk.wedalk.verification.repository.VerificationRepository;
import lk.wedalk.users.model.Role;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkerProfileService {

    private static final long MAX_SLIP_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_SLIP_TYPES = Set.of("image/jpeg", "image/png", "application/pdf");
    private static final Set<String> ALLOWED_SLIP_EXTENSIONS = Set.of("jpg", "jpeg", "png", "pdf");

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private final WorkerProfileRepository workerProfileRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final VerificationRepository verificationRepository;

    @Transactional
    public WorkerProfileResponse createProfile(Long userId, WorkerProfileCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Authenticated user not found"));

        if (user.getRole() != Role.WORKER) {
            throw new UnauthorizedException("Only workers can create worker profiles");
        }

        if (workerProfileRepository.findByUserId(userId).isPresent()) {
            throw new BadRequestException("Worker profile already exists for this user");
        }

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getContactNumber() != null) {
            user.setPhoneNumber(request.getContactNumber());
        }
        userRepository.save(user);

        WorkerProfile profile = WorkerProfile.builder()
                .user(user)
                .bio(request.getBio())
                .profilePictureUrl(request.getProfilePictureUrl())
                .skills(request.getSkills())
                .district(request.getDistrict())
                .serviceAreas(request.getServiceAreas())
                .hourlyRate(request.getHourlyRate())
                .availability(request.getAvailability())
                .registrationPaymentStatus(WorkerRegistrationPaymentStatus.PENDING_PAYMENT)
                .build();

        WorkerProfile savedProfile = workerProfileRepository.save(profile);
        return mapToResponse(savedProfile);
    }

    public List<WorkerProfileResponse> getAllProfiles() {
        return workerProfileRepository.findAll()
                .stream()
                .filter(p -> p.getRegistrationPaymentStatus() == WorkerRegistrationPaymentStatus.APPROVED)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Public or authenticated viewer: only {@link WorkerRegistrationPaymentStatus#APPROVED} profiles
     * are visible to others; owners always see their own row.
     */
    public WorkerProfileResponse getProfileForViewer(Long profileId, Long viewerUserId) {
        WorkerProfile profile = workerProfileRepository.findById(profileId)
                .orElseThrow(() -> new NotFoundException("Profile not found"));

        if (profile.getRegistrationPaymentStatus() == WorkerRegistrationPaymentStatus.APPROVED) {
            return mapToResponse(profile);
        }
        if (viewerUserId != null && viewerUserId.equals(profile.getUser().getId())) {
            return mapToResponse(profile);
        }
        throw new NotFoundException("Profile not found");
    }

    public WorkerProfileResponse getProfileByUserIdForViewer(Long userId, Long viewerUserId) {
        WorkerProfile profile = workerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Profile not found for user"));
        return getProfileForViewer(profile.getId(), viewerUserId);
    }

    @Transactional
    public WorkerProfileResponse updateProfile(Long id, Long currentUserId, WorkerProfileUpdateRequest request) {
        WorkerProfile profile = workerProfileRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Profile not found"));

        if (!profile.getUser().getId().equals(currentUserId)) {
            throw new UnauthorizedException("You can only update your own worker profile");
        }

        if (request.getFullName() != null)
            profile.getUser().setFullName(request.getFullName());
        if (request.getContactNumber() != null)
            profile.getUser().setPhoneNumber(request.getContactNumber());
        if (request.getBio() != null)
            profile.setBio(request.getBio());
        if (request.getProfilePictureUrl() != null)
            profile.setProfilePictureUrl(request.getProfilePictureUrl());
        if (request.getSkills() != null)
            profile.setSkills(request.getSkills());
        if (request.getDistrict() != null)
            profile.setDistrict(request.getDistrict());
        if (request.getServiceAreas() != null)
            profile.setServiceAreas(request.getServiceAreas());
        if (request.getHourlyRate() != null)
            profile.setHourlyRate(request.getHourlyRate());
        if (request.getAvailability() != null)
            profile.setAvailability(request.getAvailability());

        WorkerProfile savedProfile = workerProfileRepository.save(profile);
        return mapToResponse(savedProfile);
    }

    @Transactional
    public WorkerProfileResponse uploadProfilePaymentSlip(Long profileId, Long userId, MultipartFile slip) {
        WorkerProfile profile = workerProfileRepository.findById(profileId)
                .orElseThrow(() -> new NotFoundException("Worker profile not found"));

        if (!profile.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You can only upload payment for your own profile");
        }

        if (profile.getRegistrationPaymentStatus() != WorkerRegistrationPaymentStatus.PENDING_PAYMENT) {
            throw new BadRequestException(
                    "Payment slip can only be uploaded while registration payment is pending. Current status: "
                            + profile.getRegistrationPaymentStatus());
        }

        validateSlip(slip);

        String extension = getExtension(slip.getOriginalFilename());
        String storedName = "profile-" + profileId + "-" + UUID.randomUUID() + "." + extension;
        Path dir = Paths.get(uploadDir, "payment-slips");
        Path dest = dir.resolve(storedName);

        try {
            Files.createDirectories(dir);
            try (InputStream in = slip.getInputStream()) {
                Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw new BadRequestException("Failed to store payment slip", ex);
        }

        profile.setPaymentSlipPath(dest.toString());
        profile.setRegistrationPaymentStatus(WorkerRegistrationPaymentStatus.PAYMENT_UNDER_REVIEW);
        profile.setPaymentRejectionNote(null);
        WorkerProfile saved = workerProfileRepository.save(profile);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<WorkerProfileResponse> getPendingProfilePaymentSlips() {
        return workerProfileRepository
                .findByRegistrationPaymentStatusOrderByUpdatedAtAsc(
                        WorkerRegistrationPaymentStatus.PAYMENT_UNDER_REVIEW)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkerProfileResponse approveProfileRegistrationPayment(Long profileId, Long adminId) {
        WorkerProfile profile = workerProfileRepository.findById(profileId)
                .orElseThrow(() -> new NotFoundException("Worker profile not found"));

        if (profile.getRegistrationPaymentStatus() != WorkerRegistrationPaymentStatus.PAYMENT_UNDER_REVIEW) {
            throw new BadRequestException(
                    "Only profiles under payment review can be approved. Current status: "
                            + profile.getRegistrationPaymentStatus());
        }

        profile.setRegistrationPaymentStatus(WorkerRegistrationPaymentStatus.APPROVED);
        profile.setPaymentRejectionNote(null);
        return mapToResponse(workerProfileRepository.save(profile));
    }

    @Transactional
    public WorkerProfileResponse rejectProfileRegistrationPayment(Long profileId, Long adminId, String reason) {
        WorkerProfile profile = workerProfileRepository.findById(profileId)
                .orElseThrow(() -> new NotFoundException("Worker profile not found"));

        if (profile.getRegistrationPaymentStatus() != WorkerRegistrationPaymentStatus.PAYMENT_UNDER_REVIEW) {
            throw new BadRequestException(
                    "Only profiles under payment review can be rejected. Current status: "
                            + profile.getRegistrationPaymentStatus());
        }

        profile.setRegistrationPaymentStatus(WorkerRegistrationPaymentStatus.PENDING_PAYMENT);
        profile.setPaymentSlipPath(null);
        profile.setPaymentRejectionNote(StringUtils.hasText(reason) ? reason.trim() : null);
        return mapToResponse(workerProfileRepository.save(profile));
    }

    @Transactional(readOnly = true)
    public StoredSlipFile getProfilePaymentSlipFile(Long profileId) {
        WorkerProfile profile = workerProfileRepository.findById(profileId)
                .orElseThrow(() -> new NotFoundException("Worker profile not found"));

        String slipPath = profile.getPaymentSlipPath();
        if (!StringUtils.hasText(slipPath)) {
            throw new NotFoundException("No payment slip has been uploaded for this profile");
        }

        Path path = Paths.get(slipPath);
        if (!Files.exists(path) || !Files.isRegularFile(path) || !Files.isReadable(path)) {
            throw new NotFoundException("Payment slip file could not be retrieved");
        }

        String fileName = path.getFileName().toString();
        String ext = getExtension(fileName).toLowerCase(Locale.ROOT);
        String contentType = switch (ext) {
            case "pdf" -> "application/pdf";
            case "png" -> "image/png";
            default -> "image/jpeg";
        };

        return new StoredSlipFile(path, fileName, contentType);
    }

    public record StoredSlipFile(Path path, String fileName, String contentType) {}

    @Transactional
    public void deleteProfile(Long id, Long currentUserId) {
        WorkerProfile profile = workerProfileRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Profile not found"));

        if (!profile.getUser().getId().equals(currentUserId)) {
            throw new UnauthorizedException("You can only delete your own worker profile");
        }

        workerProfileRepository.delete(profile);
    }

    private WorkerProfileResponse mapToResponse(WorkerProfile profile) {
        Long userId = profile.getUser().getId();
        String verificationStatus = resolveVerificationStatus(userId, profile.getUser());

        // Compute real rating and job count from the reviews table
        Double averageRating = reviewRepository.findAverageRatingByWorkerId(userId);
        int totalJobsCompleted = reviewRepository.findByWorkerId(userId).size();

        WorkerRegistrationPaymentStatus regStatus = profile.getRegistrationPaymentStatus() != null
                ? profile.getRegistrationPaymentStatus()
                : WorkerRegistrationPaymentStatus.APPROVED;

        return new WorkerProfileResponse(
                profile.getId(),
                userId,
                profile.getUser().getFullName(),
                profile.getUser().getPhoneNumber(),
                profile.getBio(),
                profile.getProfilePictureUrl(),
                profile.getSkills(),
                profile.getDistrict(),
                profile.getServiceAreas(),
                profile.getHourlyRate(),
                profile.getAvailability(),
                verificationStatus,
                averageRating,
                totalJobsCompleted,
                regStatus.name(),
                profile.getPaymentRejectionNote(),
                profile.getUpdatedAt());
    }

    private void validateSlip(MultipartFile slip) {
        if (slip == null || slip.isEmpty()) {
            throw new BadRequestException("Payment slip file is required");
        }
        if (slip.getSize() > MAX_SLIP_SIZE_BYTES) {
            throw new BadRequestException("Payment slip file must not exceed 5 MB");
        }
        String ext = getExtension(slip.getOriginalFilename());
        String contentType = slip.getContentType();
        if (!ALLOWED_SLIP_EXTENSIONS.contains(ext)
                || contentType == null
                || !ALLOWED_SLIP_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Only JPG, PNG, or PDF files are accepted for payment slips");
        }
    }

    private String getExtension(String fileName) {
        if (fileName == null) return "";
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) return "";
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private String resolveVerificationStatus(Long userId, User user) {
        return verificationRepository.findByWorkerId(userId)
                .map(submission -> submission.getStatus().name())
                .orElseGet(() -> user.getVerificationStatus() != null
                        ? user.getVerificationStatus().name()
                        : "NONE");
    }
}
