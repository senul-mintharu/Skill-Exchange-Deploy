package lk.wedalk.admin.service;

import java.util.Comparator;
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
    String normalizedSearch = normalize(search);
    String normalizedStatus = normalize(status);

    return userRepository.findAll().stream()
        .filter(user -> matchesRole(user, role))
        .filter(user -> matchesStatus(user, normalizedStatus))
        .filter(user -> matchesSearch(user, normalizedSearch))
        .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
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

  private boolean matchesRole(User user, Role role) {
    return role == null || user.getRole() == role;
  }

  private boolean matchesStatus(User user, String status) {
    if (status == null || status.isBlank()) {
      return true;
    }

    boolean suspended = Boolean.TRUE.equals(user.getIsSuspended());
    return switch (status) {
      case "active" -> !suspended;
      case "suspended" -> suspended;
      default -> true;
    };
  }

  private boolean matchesSearch(User user, String search) {
    if (search == null || search.isBlank()) {
      return true;
    }

    return containsIgnoreCase(user.getFullName(), search)
        || containsIgnoreCase(user.getEmail(), search)
        || containsIgnoreCase(user.getDistrict(), search)
        || containsIgnoreCase(user.getPhoneNumber(), search);
  }

  private boolean containsIgnoreCase(String value, String search) {
    return value != null && value.toLowerCase(Locale.ROOT).contains(search);
  }

  private String normalize(String value) {
    return value == null || value.isBlank() ? "" : value.trim().toLowerCase(Locale.ROOT);
  }
}
