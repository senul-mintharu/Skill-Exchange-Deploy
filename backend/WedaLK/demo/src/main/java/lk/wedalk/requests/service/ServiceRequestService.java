package lk.wedalk.requests.service;

import lk.wedalk.common.PagedResponse;
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
import org.springframework.util.StringUtils;
import lk.wedalk.common.enums.QuoteStatus;
import lk.wedalk.common.enums.RequestStatus;
import lk.wedalk.common.enums.ServiceCategory;
import lk.wedalk.common.exceptions.UnauthorizedException;
import lk.wedalk.users.model.Role;
import lk.wedalk.common.enums.UrgencyLevel;
import lk.wedalk.common.exceptions.BadRequestException;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.profiles.repository.WorkerProfileRepository;
import lk.wedalk.requests.dto.RequestCreateRequest;
import lk.wedalk.requests.dto.RequestResponse;
import lk.wedalk.requests.dto.RequestStatusUpdateRequest;
import lk.wedalk.requests.dto.WorkerAssignedJobResponse;
import lk.wedalk.requests.model.ServiceRequest;
import lk.wedalk.requests.repository.ServiceRequestRepository;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 * ServiceRequestService.java — Service Request Business Logic
 *
 * <p>
 * Handles creation, retrieval, status transitions, and payment slip management
 * for service requests.
 *
 * <p>Status lifecycle:
 * PENDING_PAYMENT → PAYMENT_UNDER_REVIEW → OPEN → ASSIGNED → WORKER_COMPLETED → COMPLETED
 *                                                                               → NOT_COMPLETED (dispute)
 */
@Service
@RequiredArgsConstructor
public class ServiceRequestService {

  private static final long MAX_SLIP_SIZE_BYTES = 5L * 1024L * 1024L;
  private static final Set<String> ALLOWED_SLIP_TYPES = Set.of("image/jpeg", "image/png", "application/pdf");
  private static final Set<String> ALLOWED_SLIP_EXTENSIONS = Set.of("jpg", "jpeg", "png", "pdf");

  @Value("${app.upload.dir:./uploads}")
  private String uploadDir;

  private final ServiceRequestRepository serviceRequestRepository;
  private final UserRepository userRepository;
  private final WorkerProfileRepository workerProfileRepository;

  // -------------------------------------------------------------------------
  // SEEKER: create request (starts as PENDING_PAYMENT)
  // -------------------------------------------------------------------------

  @Transactional
  public RequestResponse createRequest(Long seekerId, RequestCreateRequest request) {
    User seeker = userRepository.findById(seekerId)
        .orElseThrow(() -> new NotFoundException("Authenticated seeker not found"));

    if (seeker.getRole() != Role.SEEKER) {
      throw new UnauthorizedException("Only seekers can create service requests");
    }

    ServiceRequest serviceRequest = ServiceRequest.builder()
        .title(request.getTitle())
        .description(request.getDescription())
        .category(request.getCategory())
        .locationArea(request.getLocationArea())
        .budget(request.getBudget())
        .urgency(request.getUrgency() != null ? request.getUrgency() : UrgencyLevel.MEDIUM)
        .status(RequestStatus.PENDING_PAYMENT)
        .seeker(seeker)
        .build();

    return mapToResponse(serviceRequestRepository.save(serviceRequest));
  }

  // -------------------------------------------------------------------------
  // SEEKER: upload payment slip (PENDING_PAYMENT → PAYMENT_UNDER_REVIEW)
  // -------------------------------------------------------------------------

  @Transactional
  public RequestResponse uploadRequestPaymentSlip(Long requestId, Long seekerId, MultipartFile slip) {
    ServiceRequest request = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));

    if (!request.getSeeker().getId().equals(seekerId)) {
      throw new UnauthorizedException("You can only upload payment for your own requests");
    }

    if (request.getStatus() != RequestStatus.PENDING_PAYMENT) {
      throw new BadRequestException("Payment slip can only be uploaded for requests awaiting payment. Current status: " + request.getStatus());
    }

    validateSlip(slip);

    String extension = getExtension(slip.getOriginalFilename());
    String storedName = "request-" + requestId + "-" + UUID.randomUUID() + "." + extension;
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

    request.setPaymentSlipPath(dest.toString());
    request.setPaymentRejectionNote(null);
    request.setStatus(RequestStatus.PAYMENT_UNDER_REVIEW);
    return mapToResponse(serviceRequestRepository.save(request));
  }

  // -------------------------------------------------------------------------
  // ADMIN: payment slip review
  // -------------------------------------------------------------------------

  @Transactional(readOnly = true)
  public List<RequestResponse> getPendingPaymentSlips() {
    return serviceRequestRepository
        .findByStatusOrderByCreatedAtDesc(RequestStatus.PAYMENT_UNDER_REVIEW)
        .stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
  }

  @Transactional
  public RequestResponse approvePaymentSlip(Long requestId, Long adminId) {
    ServiceRequest request = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));

    if (request.getStatus() != RequestStatus.PAYMENT_UNDER_REVIEW) {
      throw new BadRequestException("Only requests under payment review can be approved. Current status: " + request.getStatus());
    }

    request.setStatus(RequestStatus.OPEN);
    return mapToResponse(serviceRequestRepository.save(request));
  }

  @Transactional
  public RequestResponse rejectPaymentSlip(Long requestId, Long adminId, String reason) {
    ServiceRequest request = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));

    if (request.getStatus() != RequestStatus.PAYMENT_UNDER_REVIEW) {
      throw new BadRequestException("Only requests under payment review can be rejected. Current status: " + request.getStatus());
    }

    request.setStatus(RequestStatus.PENDING_PAYMENT);
    request.setPaymentSlipPath(null);
    request.setPaymentRejectionNote(StringUtils.hasText(reason) ? reason.trim() : null);
    return mapToResponse(serviceRequestRepository.save(request));
  }

  @Transactional(readOnly = true)
  public StoredSlipFile getRequestPaymentSlipFile(Long requestId) {
    ServiceRequest request = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));

    String slipPath = request.getPaymentSlipPath();
    if (!StringUtils.hasText(slipPath)) {
      throw new NotFoundException("No payment slip has been uploaded for this request");
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

  // -------------------------------------------------------------------------
  // Read operations
  // -------------------------------------------------------------------------
  @Transactional
  public RequestResponse uploadRequestPaymentSlip(Long requestId, Long seekerId, MultipartFile slip) {
    ServiceRequest request = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));

    if (!request.getSeeker().getId().equals(seekerId)) {
      throw new UnauthorizedException("You can only upload payment for your own requests");
    }

    if (request.getStatus() != RequestStatus.PENDING_PAYMENT) {
      throw new BadRequestException("Payment slip can only be uploaded for requests awaiting payment. Current status: " + request.getStatus());
    }

    validateSlip(slip);

    String extension = getExtension(slip.getOriginalFilename());
    String storedName = "request-" + requestId + "-" + UUID.randomUUID() + "." + extension;
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

    request.setPaymentSlipPath(dest.toString());
    request.setStatus(RequestStatus.PAYMENT_UNDER_REVIEW);
    ServiceRequest saved = serviceRequestRepository.save(request);
    return mapToResponse(saved);
  }

  @Transactional(readOnly = true)
  public List<RequestResponse> getPendingPaymentSlips() {
    return serviceRequestRepository
        .findByStatusOrderByCreatedAtDesc(RequestStatus.PAYMENT_UNDER_REVIEW)
        .stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
  }

  @Transactional
  public RequestResponse approvePaymentSlip(Long requestId, Long adminId) {
    ServiceRequest request = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));

    if (request.getStatus() != RequestStatus.PAYMENT_UNDER_REVIEW) {
      throw new BadRequestException("Only requests under payment review can be approved. Current status: " + request.getStatus());
    }

    request.setStatus(RequestStatus.OPEN);
    ServiceRequest saved = serviceRequestRepository.save(request);
    return mapToResponse(saved);
  }

  @Transactional
  public RequestResponse rejectPaymentSlip(Long requestId, Long adminId, String reason) {
    ServiceRequest request = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));

    if (request.getStatus() != RequestStatus.PAYMENT_UNDER_REVIEW) {
      throw new BadRequestException("Only requests under payment review can be rejected. Current status: " + request.getStatus());
    }

    request.setStatus(RequestStatus.PENDING_PAYMENT);
    request.setPaymentSlipPath(null);
    request.setPaymentRejectionNote(StringUtils.hasText(reason) ? reason.trim() : null);
    ServiceRequest saved = serviceRequestRepository.save(request);
    return mapToResponse(saved);
  }

  @Transactional(readOnly = true)
  public StoredSlipFile getRequestPaymentSlipFile(Long requestId) {
    ServiceRequest request = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));

    String slipPath = request.getPaymentSlipPath();
    if (!StringUtils.hasText(slipPath)) {
      throw new NotFoundException("No payment slip has been uploaded for this request");
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

  @Transactional(readOnly = true)
  public List<RequestResponse> getMyRequests(Long seekerId) {
    return serviceRequestRepository.findBySeekerId(seekerId)
        .stream().map(this::mapToResponse).collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public PagedResponse<RequestResponse> browseOpenRequests(
      String keyword, ServiceCategory category, String locationArea,
      int page, int size, String sortBy) {

    Sort sort = switch (sortBy) {
      case "budget-high" -> Sort.by(Sort.Direction.DESC, "budget");
      case "budget-low" -> Sort.by(Sort.Direction.ASC, "budget");
      case "urgency" -> Sort.by(Sort.Direction.DESC, "urgency");
      default -> Sort.by(Sort.Direction.DESC, "createdAt");
    };

    Pageable pageable = PageRequest.of(page, size, sort);
    String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
    String loc = (locationArea != null && !locationArea.isBlank()) ? locationArea.trim() : null;

    Page<ServiceRequest> requestPage = serviceRequestRepository.browseOpenRequests(
        RequestStatus.OPEN, kw, category, loc, pageable);

    List<RequestResponse> content = requestPage.getContent().stream()
        .map(this::mapToResponse).collect(Collectors.toList());

    return PagedResponse.<RequestResponse>builder()
        .content(content)
        .page(requestPage.getNumber())
        .size(requestPage.getSize())
        .totalElements(requestPage.getTotalElements())
        .totalPages(requestPage.getTotalPages())
        .last(requestPage.isLast())
        .build();
  }

  @Transactional(readOnly = true)
  public List<RequestResponse> searchRequests(String locationArea, ServiceCategory category) {
    List<ServiceRequest> requests;

    if (locationArea != null && category != null) {
      requests = serviceRequestRepository.findByLocationAreaContainingIgnoreCaseAndCategoryAndStatus(
          locationArea, category, RequestStatus.OPEN);
    } else if (locationArea != null) {
      requests = serviceRequestRepository.findByLocationAreaContainingIgnoreCaseAndStatus(
          locationArea, RequestStatus.OPEN);
    } else if (category != null) {
      requests = serviceRequestRepository.findByCategoryAndStatus(category, RequestStatus.OPEN);
    } else {
      requests = serviceRequestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.OPEN);
    }

    return requests.stream().map(this::mapToResponse).collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<RequestResponse> getOpenRequests() {
    return serviceRequestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.OPEN)
        .stream().map(this::mapToResponse).collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public RequestResponse getRequestById(Long requestId) {
    return mapToResponse(serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found")));
  }

  @Transactional(readOnly = true)
  public List<WorkerAssignedJobResponse> getAssignedRequestsForWorker(Long workerId) {
    return serviceRequestRepository.findAssignedRequestsByWorkerId(workerId, QuoteStatus.ACCEPTED)
        .stream().map(this::mapToWorkerAssignedJobResponse).collect(Collectors.toList());
  }

  // -------------------------------------------------------------------------
  // SEEKER: edit request (only while OPEN)
  // -------------------------------------------------------------------------

  @Transactional
  public RequestResponse updateRequest(Long requestId, Long seekerId, RequestCreateRequest requestData) {
    ServiceRequest existingRequest = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));

    if (!existingRequest.getSeeker().getId().equals(seekerId)) {
      throw new UnauthorizedException("You can only update your own service requests");
    }

    existingRequest.setTitle(requestData.getTitle());
    existingRequest.setCategory(requestData.getCategory());
    existingRequest.setLocationArea(requestData.getLocationArea());
    existingRequest.setDescription(requestData.getDescription());
    existingRequest.setUrgency(requestData.getUrgency());
    existingRequest.setBudget(requestData.getBudget());

    return mapToResponse(serviceRequestRepository.save(existingRequest));
  }

  // -------------------------------------------------------------------------
  // WORKER: mark job as done (ASSIGNED → WORKER_COMPLETED)
  // -------------------------------------------------------------------------

  @Transactional
  public RequestResponse workerMarkJobDone(Long requestId, Long workerId) {
    ServiceRequest request = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));

    if (request.getAssignedWorker() == null || !request.getAssignedWorker().getId().equals(workerId)) {
      throw new UnauthorizedException("You are not the assigned worker for this request");
    }

    if (request.getStatus() != RequestStatus.ASSIGNED) {
      throw new BadRequestException("You can only mark a job as done when it is in ASSIGNED status. Current status: " + request.getStatus());
    }

    request.setStatus(RequestStatus.WORKER_COMPLETED);
    return mapToResponse(serviceRequestRepository.save(request));
  }

  // -------------------------------------------------------------------------
  // SEEKER: confirm completion (WORKER_COMPLETED → COMPLETED)
  // Disputes are handled separately by DisputeService (WORKER_COMPLETED → NOT_COMPLETED)
  // -------------------------------------------------------------------------

  @Transactional
  public RequestResponse updateRequestStatus(
      Long requestId,
      Long seekerId,
      RequestStatusUpdateRequest requestData) {
    ServiceRequest request = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));

    if (!request.getSeeker().getId().equals(seekerId)) {
      throw new UnauthorizedException("You can only update status for your own requests.");
    }

    if (request.getStatus() != RequestStatus.WORKER_COMPLETED) {
      throw new BadRequestException(
          "You can only confirm completion after the worker has marked the job as done. Current status: " + request.getStatus());
    }

    RequestStatus targetStatus = requestData.getStatus();
    if (targetStatus != RequestStatus.COMPLETED) {
      throw new BadRequestException("Status must be COMPLETED. To report an issue, use the Raise Dispute option.");
    }

    request.setStatus(targetStatus);
    return mapToResponse(serviceRequestRepository.save(request));
  }

  // -------------------------------------------------------------------------
  // SEEKER: delete request
  // -------------------------------------------------------------------------

  @Transactional
  public void deleteRequest(Long requestId, Long seekerId) {
    ServiceRequest existingRequest = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));

    if (!existingRequest.getSeeker().getId().equals(seekerId)) {
      throw new UnauthorizedException("You can only delete your own service requests");
    }

    serviceRequestRepository.delete(existingRequest);
  }

  // -------------------------------------------------------------------------
  // Mapping helpers
  // -------------------------------------------------------------------------

  private RequestResponse mapToResponse(ServiceRequest request) {
    Long assignedWorkerId = request.getAssignedWorker() != null ? request.getAssignedWorker().getId() : null;
    Long assignedWorkerProfileId = assignedWorkerId == null
        ? null
        : workerProfileRepository.findByUserId(assignedWorkerId).map(p -> p.getId()).orElse(null);

    return RequestResponse.builder()
        .id(request.getId())
        .title(request.getTitle())
        .description(request.getDescription())
        .category(request.getCategory())
        .locationArea(request.getLocationArea())
        .budget(request.getBudget())
        .urgency(request.getUrgency())
        .status(request.getStatus())
        .createdAt(request.getCreatedAt())
        .updatedAt(request.getUpdatedAt())
        .seekerId(request.getSeeker().getId())
        .seekerName(request.getSeeker().getFullName())
        .seekerPhone(request.getSeeker().getPhoneNumber())
        .assignedWorkerId(assignedWorkerId)
        .assignedWorkerName(assignedWorkerId != null ? request.getAssignedWorker().getFullName() : null)
        .assignedWorkerProfileId(assignedWorkerProfileId)
        .paymentSlipUploaded(StringUtils.hasText(request.getPaymentSlipPath()))
        .paymentRejectionNote(request.getPaymentRejectionNote())
        .build();
  }

  private WorkerAssignedJobResponse mapToWorkerAssignedJobResponse(ServiceRequest request) {
    return WorkerAssignedJobResponse.builder()
        .requestId(request.getId())
        .requestTitle(request.getTitle())
        .seekerName(request.getSeeker().getFullName())
        .seekerPhone(request.getSeeker().getPhoneNumber())
        .locationArea(request.getLocationArea())
        .budget(request.getBudget())
        .status(request.getStatus())
        .build();
  }

  // -------------------------------------------------------------------------
  // Payment slip helpers
  // -------------------------------------------------------------------------

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
}
