package lk.wedalk.admin.service;

/**
 * AdminService.java — Admin Business Logic
 *
 * <p>This file should contain: - @Service annotation - Inject UserRepository,
 * ServiceRequestRepository, DisputeRepository, VerificationRepository - Methods: - List<UserDto>
 * getAllUsers(Role filterByRole) - void suspendUser(Long userId, SuspendUserRequest request) - void
 * unsuspendUser(Long userId) - Map<String, Object> getPlatformStats() - Total users (by role) -
 * Total requests (by status) - Total open disputes - Total pending verifications
 *
 * <p>Purpose: Admin-specific business logic — user management and platform statistics.
 */
