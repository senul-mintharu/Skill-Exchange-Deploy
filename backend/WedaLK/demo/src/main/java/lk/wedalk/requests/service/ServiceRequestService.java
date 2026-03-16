package lk.wedalk.requests.service;

import lk.wedalk.common.PagedResponse;
import java.util.List;
import java.util.stream.Collectors;
import lk.wedalk.common.enums.RequestStatus;
import lk.wedalk.common.enums.ServiceCategory;
import lk.wedalk.users.model.Role;
import lk.wedalk.common.enums.UrgencyLevel;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.requests.dto.RequestCreateRequest;
import lk.wedalk.requests.dto.RequestResponse;
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

  @Transactional
  public RequestResponse createRequest(Long seekerId, RequestCreateRequest request) {
    // Get or create test user
    User seeker = userRepository.findById(seekerId).orElseGet(() -> createTestUser(seekerId));

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

  /** Create a test user if not exists */
  private User createTestUser(Long userId) {
    User user = User.builder()
        .id(userId)
        .fullName("Test User")
        .email("test" + userId + "@example.com")
        .password("password")
        .role(Role.SEEKER)
        .build();
    return userRepository.save(user);
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
    return mapToResponse(request);
  }

  @Transactional
  public RequestResponse updateRequest(Long requestId, RequestCreateRequest requestData) {
    ServiceRequest existingRequest = serviceRequestRepository.findById(requestId)
        .orElseThrow(() -> new NotFoundException("Service request not found"));

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
  public void deleteRequest(Long requestId) {
    if (!serviceRequestRepository.existsById(requestId)) {
      throw new NotFoundException("Service request not found");
    }
    serviceRequestRepository.deleteById(requestId);
  }

  private RequestResponse mapToResponse(ServiceRequest request) {
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
        .build();
  }
}
