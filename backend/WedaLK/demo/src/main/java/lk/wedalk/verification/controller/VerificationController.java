package lk.wedalk.verification.controller;

import lk.wedalk.common.ApiResponse;
import lk.wedalk.common.exceptions.BadRequestException;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.users.model.Role;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lk.wedalk.verification.dto.VerificationSubmitResponse;
import lk.wedalk.verification.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class VerificationController {

    private final UserRepository userRepository;
    private final VerificationService verificationService;

    @PostMapping
    public ResponseEntity<ApiResponse<VerificationSubmitResponse>> submitVerification(
            @RequestParam("document") MultipartFile document) {
        AuthenticatedUser currentUser = requireAuthenticatedUser();

        // Defense-in-depth role check in controller even though security config already
        // restricts route.
        if (currentUser.role() != Role.WORKER) {
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

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Object>> updateVerificationStatus(
            @PathVariable Long id,
            @RequestParam(name = "approve") boolean approve,
            @RequestBody(required = false) Map<String, Object> requestBody) {
        AuthenticatedUser currentUser = requireAuthenticatedUser();
        if (currentUser.role() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can review verification");
        }

        // Never trust client-provided status. Server assigns final decision strictly.
        String status = approve ? "APPROVED" : "REJECTED";
        String adminNotes = requestBody == null ? null : asString(requestBody.get("adminNotes"));

        reviewWithAuthenticatedAdminId(id, currentUser.userId(), status, adminNotes);
        return ResponseEntity.ok(ApiResponse.success(null, "Verification status updated successfully"));
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

    private record AuthenticatedUser(Long userId, Role role) {
    }
}
