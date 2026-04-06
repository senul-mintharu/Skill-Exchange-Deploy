package lk.wedalk.disputes.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lk.wedalk.common.ApiResponse;
import lk.wedalk.common.PagedResponse;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.disputes.dto.DisputeCreateRequest;
import lk.wedalk.disputes.dto.DisputeResponse;
import lk.wedalk.disputes.service.DisputeService;
import lk.wedalk.users.model.Role;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * DisputeController.java — Dispute REST Controller
 *
 * <p>
 * Exposes dispute management APIs for seekers and admins.
 *
 * <p>
 * SCRUM-94: The POST endpoint delegates ownership validation to DisputeService,
 * which verifies the authenticated seeker is the original author of the
 * ServiceRequest.
 */
@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class DisputeController {

    private final DisputeService disputeService;
    private final UserRepository userRepository;

    private record AuthenticatedUser(Long userId, Role role) {
    }

    private Long requireCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository
                .findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Authenticated user not found"))
                .getId();
    }

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

        return new AuthenticatedUser(user.getId(), role);
    }

    /**
     * POST /api/disputes — Create a dispute (seeker, when marking "Not Completed").
     *
     * <p>
     * SCRUM-94: Only the seeker who originally posted the service request
     * can submit a dispute. Workers are blocked entirely.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<DisputeResponse>> createDispute(
            @Valid @RequestBody DisputeCreateRequest request) {
        DisputeResponse response = disputeService.createDispute(requireCurrentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Dispute created successfully"));
    }

    /**
     * GET /api/disputes/{id} — Get dispute details.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DisputeResponse>> getDisputeById(@PathVariable Long id) {
        DisputeResponse dispute = disputeService.getDisputeById(id);
        return ResponseEntity.ok(ApiResponse.success(dispute, "Dispute retrieved successfully"));
    }

    /**
     * GET /api/disputes/open — Get all open disputes (admin).
     */
    @GetMapping("/open")
    public ResponseEntity<ApiResponse<PagedResponse<DisputeResponse>>> getOpenDisputes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        AuthenticatedUser currentUser = requireAuthenticatedUser();
        if (currentUser.role() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can view open disputes");
        }

        PagedResponse<DisputeResponse> disputes = disputeService.getOpenDisputesPaged(page, size);
        return ResponseEntity.ok(ApiResponse.success(disputes, "Open disputes retrieved successfully"));
    }

    /**
     * GET /api/disputes/my — Get current user's disputes.
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<DisputeResponse>>> getMyDisputes() {
        List<DisputeResponse> disputes = disputeService.getDisputesBySeeker(requireCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(disputes, "Your disputes retrieved successfully"));
    }

    /**
     * PUT /api/disputes/{id}/resolve — Resolve dispute (admin only).
     */
    @PutMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<DisputeResponse>> resolveDispute(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> requestBody) {
        AuthenticatedUser currentUser = requireAuthenticatedUser();
        if (currentUser.role() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can resolve disputes");
        }

        String resolution = requestBody == null ? null : asString(requestBody.get("resolution"));
        if (resolution == null || resolution.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "resolution is required");
        }

        DisputeResponse response = disputeService.resolveDispute(id, currentUser.userId(), resolution.trim());
        return ResponseEntity.ok(ApiResponse.success(response, "Dispute resolved successfully"));
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        return String.valueOf(value);
    }
}
