package lk.wedalk.profiles.controller;

import jakarta.validation.Valid;
import lk.wedalk.common.ApiResponse;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.profiles.dto.WorkerProfileCreateRequest;
import lk.wedalk.profiles.dto.WorkerProfileResponse;
import lk.wedalk.profiles.service.WorkerProfileService;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // Allow frontend
public class WorkerProfileController {

    private final WorkerProfileService workerProfileService;
    private final UserRepository userRepository;

    private Long requireCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository
                .findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Authenticated user not found"))
                .getId();
    }

    /** {@code null} when anonymous or not logged in. */
    private Long tryGetCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null
                || !auth.isAuthenticated()
                || auth instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return userRepository.findByEmail(auth.getName()).map(User::getId).orElse(null);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkerProfileResponse>>> getAllProfiles() {
        List<WorkerProfileResponse> profiles = workerProfileService.getAllProfiles();
        return ResponseEntity.ok(ApiResponse.success(profiles, "Worker profiles retrieved successfully"));
    }

    @PostMapping
    public ResponseEntity<WorkerProfileResponse> createProfile(@Valid @RequestBody WorkerProfileCreateRequest request) {
        WorkerProfileResponse response = workerProfileService.createProfile(requireCurrentUserId(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkerProfileResponse> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(workerProfileService.getProfileForViewer(id, tryGetCurrentUserId()));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<WorkerProfileResponse> getProfileByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(workerProfileService.getProfileByUserIdForViewer(userId, tryGetCurrentUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkerProfileResponse> updateProfile(@PathVariable Long id,
            @Valid @RequestBody lk.wedalk.profiles.dto.WorkerProfileUpdateRequest request) {
        return ResponseEntity.ok(workerProfileService.updateProfile(id, requireCurrentUserId(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProfile(@PathVariable Long id) {
        workerProfileService.deleteProfile(id, requireCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(null, "Worker profile deleted successfully"));
    }
}
