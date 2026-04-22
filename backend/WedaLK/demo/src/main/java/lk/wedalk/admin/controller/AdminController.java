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
}
