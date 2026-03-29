package lk.wedalk.users.controller;

import jakarta.validation.Valid;
import lk.wedalk.common.ApiResponse;
import lk.wedalk.users.dto.UpdateMeRequest;
import lk.wedalk.users.dto.UserDto;
import lk.wedalk.users.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getMe(Authentication authentication) {
        UserDto user = userService.getCurrentUserByEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(user, "Current user retrieved successfully"));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> updateMe(
            Authentication authentication,
            @Valid @RequestBody UpdateMeRequest request) {
        UserDto updated = userService.updateCurrentUserByEmail(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Profile updated successfully"));
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteMe(Authentication authentication) {
        userService.deleteCurrentUserByEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "Account deleted successfully"));
    }
}
