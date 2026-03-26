package lk.wedalk.requests.service;

import lk.wedalk.common.PagedResponse;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lk.wedalk.common.enums.QuoteStatus;
import lk.wedalk.common.enums.RequestStatus;
import lk.wedalk.common.enums.ServiceCategory;
import lk.wedalk.common.exceptions.UnauthorizedException;
import lk.wedalk.profiles.repository.WorkerProfileRepository;
import lk.wedalk.quotes.model.Quotation;
import lk.wedalk.quotes.repository.QuotationRepository;
import lk.wedalk.users.model.Role;
import lk.wedalk.common.enums.UrgencyLevel;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.requests.dto.RequestCreateRequest;
import lk.wedalk.requests.dto.RequestResponse;
import lk.wedalk.requests.dto.WorkerAssignedJobResponse;
import lk.wedalk.requests.model.ServiceRequest;
import lk.wedalk.requests.repository.ServiceRequestRepository;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ServiceRequestService.java — Service Request Business Logic
 *
 * <p>
 * Handles creation, retrieval, and search for service requests.
 */
@Service
@RequiredArgsConstructor
public class ServiceRequestService {

  private final ServiceRequestRepository serviceRequestRepository;
  private final UserRepository userRepository;
  private final WorkerProfileRepository workerProfileRepository;
  private final QuotationRepository quotationRepository;

  @Transactional
  public RequestResponse createRequest(Long seekerId, RequestCreateRequest request) {
    User seeker = userRepository.findById(seekerId)
        .orElseThrow(() -> new NotFoundException("Authenticated seeker not found"));

    if (seeker.getRole() != Role.SEEKER) {
      throw new UnauthorizedException("Only seekers can create service requests");
    }

    // Create service request
    ServiceRequest serviceRequest = ServiceRequest.builder()
        .title(request.getTitle())
        .description(request.getDescription())
        .category(request.getCategory())
        .locationArea(request.getLocationArea())
        .budget(request.getBudget())
        .urgency(request.getUrgency() != null ? request.getUrgency() : UrgencyLevel.MEDIUM)
        .status(RequestStatus.OPEN)
        .seeker(seeker)
        .build();

    ServiceRequest savedRequest = serviceRequestRepository.save(serviceRequest);
    return mapToResponse(savedRequest);
  }

  @Transactional(readOnly = true)
  public List<RequestResponse> getMyRequests(Long seekerId) {
    List<ServiceRequest> requests = serviceRequestRepository.findBySeekerId(seekerId);
    return requests.stream().map(this::mapToResponse).collect(Collectors.toList());
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

    // Pass null for empty strings so the query treats them as "no filter"
    String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
    String loc = (locationArea != null && !locationArea.isBlank()) ? locationArea.trim() : null;

    Page<ServiceRequest> requestPage = serviceRequestRepository.browseOpenRequests(
        RequestStatus.OPEN, kw, category, loc, pageable);

    List<RequestResponse> content = requestPage.getContent().stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());

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
    List<ServiceRequest> requests = serviceRequestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.OPEN);
    return requests.stream().map(this::mapToResponse).collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public RequestResponse getRequestById(Long requestId) {
    ServiceRequest request = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));
    return mapToResponse(request, true);
  }

  @Transactional(readOnly = true)
  public List<WorkerAssignedJobResponse> getAssignedRequestsForWorker(Long workerId) {
    List<ServiceRequest> requests = serviceRequestRepository.findAssignedRequestsByWorkerId(
        workerId, QuoteStatus.ACCEPTED);

    return requests.stream().map(this::mapToWorkerAssignedJobResponse).collect(Collectors.toList());
  }

  @Transactional
  public RequestResponse updateRequest(Long requestId, Long seekerId, RequestCreateRequest requestData) {
    ServiceRequest existingRequest = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));

    if (!existingRequest.getSeeker().getId().equals(seekerId)) {
      throw new UnauthorizedException("You can only update your own service requests");
    }

    // Update fields
    existingRequest.setTitle(requestData.getTitle());
    existingRequest.setCategory(requestData.getCategory());
    existingRequest.setLocationArea(requestData.getLocationArea());
    existingRequest.setDescription(requestData.getDescription());
    existingRequest.setUrgency(requestData.getUrgency());
    existingRequest.setBudget(requestData.getBudget());

    ServiceRequest savedRequest = serviceRequestRepository.save(existingRequest);
    return mapToResponse(savedRequest);
  }

  @Transactional
  public void deleteRequest(Long requestId, Long seekerId) {
    ServiceRequest existingRequest = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));

    if (!existingRequest.getSeeker().getId().equals(seekerId)) {
      throw new UnauthorizedException("You can only delete your own service requests");
    }

    serviceRequestRepository.delete(existingRequest);
  }

  private RequestResponse mapToResponse(ServiceRequest request) {
    return mapToResponse(request, false);
  }

  private RequestResponse mapToResponse(ServiceRequest request, boolean includeAssignedWorkerLookup) {
    Optional<User> assignedWorkerOpt = Optional.ofNullable(request.getAssignedWorker());
    if (includeAssignedWorkerLookup && assignedWorkerOpt.isEmpty()) {
      assignedWorkerOpt = quotationRepository.findByRequestIdOrderByPriceAsc(request.getId()).stream()
          .filter(q -> q.getStatus() == QuoteStatus.ACCEPTED)
          .map(Quotation::getWorker)
          .findFirst();
    }

    Long assignedWorkerId = null;
    String assignedWorkerName = null;
    Long assignedWorkerProfileId = null;

    if (assignedWorkerOpt.isPresent()) {
      User assignedWorker = assignedWorkerOpt.get();
      assignedWorkerId = assignedWorker.getId();
      assignedWorkerName = assignedWorker.getFullName();
      assignedWorkerProfileId = workerProfileRepository
          .findByUserId(assignedWorkerId)
          .map(profile -> profile.getId())
          .orElse(null);
    }

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
        .assignedWorkerName(assignedWorkerName)
        .assignedWorkerProfileId(assignedWorkerProfileId)
        .build();
  }

  private WorkerAssignedJobResponse mapToWorkerAssignedJobResponse(ServiceRequest request) {
    return WorkerAssignedJobResponse.builder()
        .requestId(request.getId())
        .requestTitle(request.getTitle())
        .seekerName(request.getSeeker().getFullName())
        .status(request.getStatus())
        .build();
  }
}
