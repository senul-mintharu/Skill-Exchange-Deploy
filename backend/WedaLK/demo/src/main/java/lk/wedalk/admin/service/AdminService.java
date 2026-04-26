package lk.wedalk.admin.service;

import java.util.List;
import java.util.Locale;
import lk.wedalk.common.exceptions.BadRequestException;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.users.dto.UserDto;
import lk.wedalk.users.model.Role;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public List<UserDto> getAllUsers(String search, Role role, String status) {
    String normalizedSearch = normalizeToNull(search);
    String normalizedStatus = normalizeToNull(status);

    return userRepository.findAdminUsers(normalizedSearch, role, normalizedStatus).stream()
        .map(UserDto::fromEntity)
        .toList();
  }

  /**
   * Toggles the suspended status of a user account.
   *
   * <p>Deactivates an active account or reactivates a suspended one.
   * Admin accounts are protected from suspension to prevent privilege escalation.
   *
   * @param userId the ID of the user to toggle
   * @return the updated {@link UserDto} reflecting the new status
   * @throws NotFoundException   if no user exists with the given ID
   * @throws BadRequestException if the target account belongs to an ADMIN
   */
  @Transactional
  public UserDto toggleUserStatus(Long userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new NotFoundException("User not found with id: " + userId));

    if (user.getRole() == Role.ADMIN) {
      throw new BadRequestException("Admin accounts cannot be deactivated.");
    }

    user.setIsSuspended(!Boolean.TRUE.equals(user.getIsSuspended()));
    User saved = userRepository.save(user);
    return UserDto.fromEntity(saved);
  }

  private String normalizeToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim().toLowerCase(Locale.ROOT);
  }
}
