package lk.wedalk.verification.controller;

import java.util.List;
import java.util.Map;
import lk.wedalk.common.ApiResponse;
import lk.wedalk.common.exceptions.BadRequestException;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.users.model.Role;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lk.wedalk.verification.dto.VerificationStatusResponse;
import lk.wedalk.verification.dto.VerificationSubmitResponse;
import lk.wedalk.verification.service.VerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class VerificationController {

    private final UserRepository userRepository;
    private final VerificationService verificationService;

    /**
     * POST /api/verification — Submit a verification document (WORKER only).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<VerificationSubmitResponse>> submitVerification(
            @RequestParam("document") MultipartFile document) {
        AuthenticatedUser currentUser = requireAuthenticatedUser();

        // Defense-in-depth: double-check role even though SecurityConfig restricts this route.
        if (currentUser.role() != Role.WORKER) {
            log.warn("Unauthorized verification submission attempt by '{}' with role '{}'",
                    currentUser.email(), currentUser.role());
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only workers can submit verification");
        }

        if (document == null || document.isEmpty()) {
            throw new BadRequestException("Document file is required");
        }

        VerificationSubmitResponse response = verificationService.submitVerification(currentUser.userId(), document);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Verification submitted successfully"));
    }

    /**
     * GET /api/verification/my — Get the current worker's verification status.
     * Returns a NONE status response if no submission has been made yet.
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<VerificationStatusResponse>> getMyVerification() {
        AuthenticatedUser currentUser = requireAuthenticatedUser();

        if (currentUser.role() != Role.WORKER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only workers can access their verification status");
        }

        VerificationStatusResponse response = verificationService.getMyVerification(currentUser.userId());
        return ResponseEntity.ok(ApiResponse.success(response, "Verification status retrieved successfully"));
    }

    /**
     * GET /api/verification/pending — List all PENDING submissions (ADMIN only).
     * Ordered oldest-first so admins work through the queue in order.
     */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<VerificationStatusResponse>>> getPendingSubmissions() {
        AuthenticatedUser currentUser = requireAuthenticatedUser();

        if (currentUser.role() != Role.ADMIN) {
            log.warn("Unauthorized pending-submissions access attempt by '{}' with role '{}'",
                    currentUser.email(), currentUser.role());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can view pending submissions");
        }

        List<VerificationStatusResponse> pending = verificationService.getPendingSubmissions();
        return ResponseEntity.ok(ApiResponse.success(pending, "Pending submissions retrieved successfully"));
    }

    /**
     * PUT /api/verification/{id}/status — Approve or reject a submission (ADMIN only).
     *
     * <p>The approve flag is the single source of truth for the decision.
     * Any status value in the request body is completely ignored to prevent forgery.
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Object>> updateVerificationStatus(
            @PathVariable Long id,
            @RequestParam(name = "approve") boolean approve,
            @RequestBody(required = false) Map<String, Object> requestBody) {
        AuthenticatedUser currentUser = requireAuthenticatedUser();

        if (currentUser.role() != Role.ADMIN) {
            log.warn("Unauthorized verification review attempt by '{}' with role '{}'",
                    currentUser.email(), currentUser.role());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can review verification");
        }

        // Server derives status from the boolean — client cannot forge "APPROVED".
        String status = approve ? "APPROVED" : "REJECTED";
        String adminNotes = requestBody == null ? null : asString(requestBody.get("adminNotes"));

        verificationService.reviewVerification(id, currentUser.userId(), status, adminNotes);
        return ResponseEntity.ok(ApiResponse.success(null, "Verification status updated successfully"));
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private AuthenticatedUser requireAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Authenticated user not found"));

        Role role = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .findFirst()
                .map(authority -> authority.substring("ROLE_".length()))
                .map(Role::valueOf)
                .orElse(user.getRole());

        return new AuthenticatedUser(user.getId(), email, role);
    }

    private static String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private record AuthenticatedUser(Long userId, String email, Role role) {
    }
}
