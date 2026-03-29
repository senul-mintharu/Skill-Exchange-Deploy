package lk.wedalk.requests.controller;

import jakarta.validation.Valid;
import java.util.List;
import lk.wedalk.common.ApiResponse;
import lk.wedalk.common.PagedResponse;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.common.enums.ServiceCategory;
import lk.wedalk.requests.dto.RequestCreateRequest;
import lk.wedalk.requests.dto.RequestResponse;
import lk.wedalk.requests.dto.RequestStatusUpdateRequest;
import lk.wedalk.requests.dto.WorkerAssignedJobResponse;
import lk.wedalk.requests.service.ServiceRequestService;
import lk.wedalk.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * ServiceRequestController.java — Service Request REST Controller
 *
 * <p>
 * Exposes service request CRUD and search APIs. Authentication is disabled -
 * all endpoints are
 * publicly accessible.
 */
@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // Allow frontend access
public class ServiceRequestController {

  private final ServiceRequestService serviceRequestService;
  private final UserRepository userRepository;

  private Long requireCurrentUserId() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String email = auth.getName();
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new NotFoundException("Authenticated user not found"))
        .getId();
  }

  @PostMapping
  public ResponseEntity<ApiResponse<RequestResponse>> createRequest(@Valid @RequestBody RequestCreateRequest request) {
    RequestResponse response = serviceRequestService.createRequest(requireCurrentUserId(), request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(response, "Service request created successfully"));
  }

  @GetMapping("/my")
  public ResponseEntity<ApiResponse<List<RequestResponse>>> getMyRequests() {
    List<RequestResponse> requests = serviceRequestService.getMyRequests(requireCurrentUserId());
    return ResponseEntity.ok(ApiResponse.success(requests, "Requests retrieved successfully"));
  }

  @GetMapping("/open")
  public ResponseEntity<ApiResponse<List<RequestResponse>>> getOpenRequests() {
    List<RequestResponse> requests = serviceRequestService.getOpenRequests();
    return ResponseEntity.ok(ApiResponse.success(requests, "Open requests retrieved successfully"));
  }

  @GetMapping("/browse")
  public ResponseEntity<ApiResponse<PagedResponse<RequestResponse>>> browseRequests(
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) ServiceCategory category,
      @RequestParam(required = false) String locationArea,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "9") int size,
      @RequestParam(defaultValue = "newest") String sortBy) {
    PagedResponse<RequestResponse> response = serviceRequestService.browseOpenRequests(
        keyword, category, locationArea, page, size, sortBy);
    return ResponseEntity.ok(ApiResponse.success(response, "Browse results retrieved successfully"));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<RequestResponse>> getRequestById(@PathVariable Long id) {
    RequestResponse request = serviceRequestService.getRequestById(id);
    return ResponseEntity.ok(ApiResponse.success(request, "Request retrieved successfully"));
  }

  @GetMapping("/worker/{workerId}")
  public ResponseEntity<ApiResponse<List<WorkerAssignedJobResponse>>> getAssignedRequestsForWorker(
      @PathVariable Long workerId) {
    List<WorkerAssignedJobResponse> requests = serviceRequestService.getAssignedRequestsForWorker(workerId);
    return ResponseEntity.ok(ApiResponse.success(requests, "Assigned requests retrieved successfully"));
  }

  @GetMapping("/worker/my")
  public ResponseEntity<ApiResponse<List<WorkerAssignedJobResponse>>> getMyAssignedRequests() {
    List<WorkerAssignedJobResponse> requests = serviceRequestService.getAssignedRequestsForWorker(requireCurrentUserId());
    return ResponseEntity.ok(ApiResponse.success(requests, "Assigned requests retrieved successfully"));
  }

  @GetMapping("/search")
  public ResponseEntity<ApiResponse<List<RequestResponse>>> searchRequests(
      @RequestParam(required = false) String locationArea,
      @RequestParam(required = false) ServiceCategory category) {
    List<RequestResponse> requests = serviceRequestService.searchRequests(locationArea, category);
    return ResponseEntity.ok(ApiResponse.success(requests, "Search completed successfully"));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<RequestResponse>> updateRequest(
      @PathVariable Long id,
      @Valid @RequestBody RequestCreateRequest request) {
    RequestResponse response = serviceRequestService.updateRequest(id, requireCurrentUserId(), request);
    return ResponseEntity.ok(ApiResponse.success(response, "Service request updated successfully"));
  }

  @PutMapping("/{requestId}/status")
  public ResponseEntity<ApiResponse<RequestResponse>> updateRequestStatus(
      @PathVariable Long requestId,
      @Valid @RequestBody RequestStatusUpdateRequest request,
      @RequestParam(required = false, defaultValue = "1") Long seekerId) {
    RequestResponse response = serviceRequestService.updateRequestStatus(requestId, seekerId, request);
    return ResponseEntity.ok(ApiResponse.success(response, "Request status updated successfully"));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> deleteRequest(@PathVariable Long id) {
    serviceRequestService.deleteRequest(id, requireCurrentUserId());
    return ResponseEntity.ok(ApiResponse.success(null, "Service request deleted successfully"));
  }
}
