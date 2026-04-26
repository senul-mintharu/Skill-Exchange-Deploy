package lk.wedalk.payment;

import lk.wedalk.common.ApiResponse;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.profiles.dto.WorkerProfileResponse;
import lk.wedalk.profiles.service.WorkerProfileService;
import lk.wedalk.requests.dto.RequestResponse;
import lk.wedalk.requests.service.ServiceRequestService;
import lk.wedalk.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * PaymentController — handles bank transfer payment slip uploads for:
 * - Service requests (SEEKER uploads slip to publish their request)
 * - Worker profiles (WORKER uploads slip to complete profile registration)
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class PaymentController {

    private final ServiceRequestService serviceRequestService;
    private final WorkerProfileService workerProfileService;
    private final UserRepository userRepository;

    @PostMapping(value = "/requests/{requestId}/payment-slip", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<RequestResponse>> uploadRequestPaymentSlip(
            @PathVariable Long requestId,
            @RequestParam("slip") MultipartFile slip) {
        RequestResponse response = serviceRequestService.uploadRequestPaymentSlip(
                requestId, requireCurrentUserId(), slip);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment slip uploaded. Your request is now published."));
    }

    @PostMapping(value = "/profiles/{profileId}/payment-slip", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<WorkerProfileResponse>> uploadProfilePaymentSlip(
            @PathVariable Long profileId,
            @RequestParam("slip") MultipartFile slip) {
        WorkerProfileResponse response = workerProfileService.uploadProfilePaymentSlip(
                profileId, requireCurrentUserId(), slip);
        return ResponseEntity.ok(ApiResponse.success(
                response,
                "Payment slip received. Your profile will become active after an administrator approves the payment."));
    }

    // -------------------------------------------------------------------------
    // Admin — Payment slip review endpoints (SCRUM-106)
    // -------------------------------------------------------------------------

    @GetMapping("/admin/profile-payment-slips/pending")
    public ResponseEntity<ApiResponse<List<WorkerProfileResponse>>> getPendingProfilePaymentSlips() {
        List<WorkerProfileResponse> slips = workerProfileService.getPendingProfilePaymentSlips();
        return ResponseEntity.ok(
                ApiResponse.success(slips, "Pending worker profile payment slips retrieved successfully"));
    }

    @PostMapping("/admin/profiles/{profileId}/payment-approve")
    public ResponseEntity<ApiResponse<WorkerProfileResponse>> approveProfileRegistrationPayment(
            @PathVariable Long profileId) {
        WorkerProfileResponse response =
                workerProfileService.approveProfileRegistrationPayment(profileId, requireCurrentUserId());
        return ResponseEntity.ok(
                ApiResponse.success(response, "Payment approved. This worker profile is now active."));
    }

    @PostMapping("/admin/profiles/{profileId}/payment-reject")
    public ResponseEntity<ApiResponse<WorkerProfileResponse>> rejectProfileRegistrationPayment(
            @PathVariable Long profileId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = (body != null) ? body.get("reason") : null;
        WorkerProfileResponse response = workerProfileService.rejectProfileRegistrationPayment(
                profileId, requireCurrentUserId(), reason);
        return ResponseEntity.ok(
                ApiResponse.success(response, "Payment rejected. The worker must upload a new slip."));
    }

    @GetMapping("/profiles/{profileId}/payment-slip/view")
    public ResponseEntity<Resource> viewProfilePaymentSlip(@PathVariable Long profileId) {
        WorkerProfileService.StoredSlipFile slip = workerProfileService.getProfilePaymentSlipFile(profileId);
        Resource resource = new FileSystemResource(slip.path());

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(slip.contentType());
        } catch (IllegalArgumentException ignored) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(slip.fileName()).build().toString())
                .body(resource);
    }

    @GetMapping("/admin/payment-slips/pending")
    public ResponseEntity<ApiResponse<List<RequestResponse>>> getPendingPaymentSlips() {
        List<RequestResponse> slips = serviceRequestService.getPendingPaymentSlips();
        return ResponseEntity.ok(ApiResponse.success(slips, "Pending payment slips retrieved successfully"));
    }

    @PostMapping("/admin/requests/{requestId}/payment-approve")
    public ResponseEntity<ApiResponse<RequestResponse>> approvePaymentSlip(@PathVariable Long requestId) {
        RequestResponse response = serviceRequestService.approvePaymentSlip(requestId, requireCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(response, "Payment approved. Request is now published."));
    }

    @PostMapping("/admin/requests/{requestId}/payment-reject")
    public ResponseEntity<ApiResponse<RequestResponse>> rejectPaymentSlip(
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = (body != null) ? body.get("reason") : null;
        RequestResponse response = serviceRequestService.rejectPaymentSlip(requestId, requireCurrentUserId(), reason);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment rejected. Seeker must re-upload a valid slip."));
    }

    @GetMapping("/requests/{requestId}/payment-slip/view")
    public ResponseEntity<Resource> viewRequestPaymentSlip(@PathVariable Long requestId) {
        ServiceRequestService.StoredSlipFile slip = serviceRequestService.getRequestPaymentSlipFile(requestId);
        Resource resource = new FileSystemResource(slip.path());

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(slip.contentType());
        } catch (IllegalArgumentException ignored) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(slip.fileName()).build().toString())
                .body(resource);
    }

    private Long requireCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository
                .findByEmail(auth.getName())
                .orElseThrow(() -> new NotFoundException("Authenticated user not found"))
                .getId();
    }
}
