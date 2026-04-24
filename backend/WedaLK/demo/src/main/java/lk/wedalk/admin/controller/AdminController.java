package lk.wedalk.admin.controller;

import java.util.List;
import lk.wedalk.admin.service.AdminService;
import lk.wedalk.common.ApiResponse;
import lk.wedalk.users.dto.UserDto;
import lk.wedalk.users.model.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

  private final AdminService adminService;

  @GetMapping("/users")
  public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) Role role,
      @RequestParam(required = false) String status) {
    List<UserDto> users = adminService.getAllUsers(search, role, status);
    return ResponseEntity.ok(ApiResponse.success(users, "Users retrieved successfully"));
  }

  /**
   * Toggles the suspended status of a user account.
   *
   * <p>Deactivates an active account or reactivates a suspended one.
   * Protected by the existing {@code /api/admin/**} ADMIN-only security rule.
   *
   * @param id the ID of the user to toggle
   * @return the updated {@link UserDto} wrapped in {@link ApiResponse}
   */
  @PatchMapping("/users/{id}/status")
  public ResponseEntity<ApiResponse<UserDto>> toggleUserStatus(@PathVariable Long id) {
    UserDto updated = adminService.toggleUserStatus(id);
    String message = Boolean.TRUE.equals(updated.getIsSuspended())
        ? "User account deactivated successfully."
        : "User account reactivated successfully.";
    return ResponseEntity.ok(ApiResponse.success(updated, message));
  }
}
