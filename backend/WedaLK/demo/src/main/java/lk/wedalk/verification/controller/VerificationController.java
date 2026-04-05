package lk.wedalk.verification.controller;

import jakarta.validation.Valid;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;
import lk.wedalk.common.ApiResponse;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.users.model.Role;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lk.wedalk.verification.dto.VerificationSubmitRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class VerificationController {

    private final ApplicationContext applicationContext;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> submitVerification(
            @Valid @RequestBody VerificationSubmitRequest request) {
        AuthenticatedUser currentUser = requireAuthenticatedUser();

        // Defense-in-depth role check in controller even though security config already
        // restricts route.
        if (currentUser.role() != Role.WORKER) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only workers can submit verification");
        }

        submitWithAuthenticatedWorkerId(currentUser.userId(), toPayloadMap(request));

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(null, "Verification submitted successfully"));
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

    private void submitWithAuthenticatedWorkerId(Long workerId, Map<String, Object> request) {
        Object verificationService;
        try {
            verificationService = applicationContext.getBean("verificationService");
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Verification service is unavailable");
        }

        Method submitMethod = null;
        for (Method method : verificationService.getClass().getMethods()) {
            if ("submitVerification".equals(method.getName()) && method.getParameterCount() == 2) {
                submitMethod = method;
                break;
            }
        }

        if (submitMethod == null) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "submitVerification(workerId, request) method not found");
        }

        try {
            submitMethod.invoke(verificationService, workerId, request);
        } catch (IllegalAccessException | InvocationTargetException ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to submit verification",
                    ex);
        }
    }

    private Map<String, Object> toPayloadMap(VerificationSubmitRequest request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("documentFile", request.getDocumentFile());
        payload.put("metadata", request.getMetadata());
        return payload;
    }

    private void reviewWithAuthenticatedAdminId(
            Long submissionId,
            Long adminId,
            String status,
            String adminNotes) {
        Object verificationService;
        try {
            verificationService = applicationContext.getBean("verificationService");
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Verification service is unavailable");
        }

        Method reviewMethod = null;
        for (Method method : verificationService.getClass().getMethods()) {
            if ("reviewSubmission".equals(method.getName()) && method.getParameterCount() == 3) {
                reviewMethod = method;
                break;
            }
        }

        if (reviewMethod == null) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "reviewSubmission(submissionId, adminId, request) method not found");
        }

        Map<String, Object> trustedPayload = new HashMap<>();
        trustedPayload.put("submissionId", submissionId);
        trustedPayload.put("decision", status);
        trustedPayload.put("adminNotes", adminNotes);

        try {
            reviewMethod.invoke(verificationService, submissionId, adminId, trustedPayload);
        } catch (IllegalAccessException | InvocationTargetException ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to review verification submission",
                    ex);
        }
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        return String.valueOf(value);
    }

    private record AuthenticatedUser(Long userId, Role role) {
    }
}
