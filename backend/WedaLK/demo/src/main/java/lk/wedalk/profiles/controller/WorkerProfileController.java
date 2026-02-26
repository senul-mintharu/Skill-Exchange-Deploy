package lk.wedalk.profiles.controller;

import jakarta.validation.Valid;
import lk.wedalk.profiles.dto.WorkerProfileCreateRequest;
import lk.wedalk.profiles.dto.WorkerProfileResponse;
import lk.wedalk.profiles.service.WorkerProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // Allow frontend
public class WorkerProfileController {

    private final WorkerProfileService workerProfileService;

    @PostMapping
    public ResponseEntity<WorkerProfileResponse> createProfile(@Valid @RequestBody WorkerProfileCreateRequest request) {
        WorkerProfileResponse response = workerProfileService.createProfile(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkerProfileResponse> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(workerProfileService.getProfile(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<WorkerProfileResponse> getProfileByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(workerProfileService.getProfileByUserId(userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkerProfileResponse> updateProfile(@PathVariable Long id,
            @Valid @RequestBody lk.wedalk.profiles.dto.WorkerProfileUpdateRequest request) {
        return ResponseEntity.ok(workerProfileService.updateProfile(id, request));
    }
}
