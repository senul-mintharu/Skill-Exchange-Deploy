package lk.wedalk.users.dto;

/**
 * UserDto.java — User Data Transfer Object
 *
 * <p>This file should contain: - Fields (safe to expose — NO password): - Long id - String fullName
 * - String email - String phone - String district - Role role - boolean isSuspended - LocalDateTime
 * createdAt - Lombok: @Data, @Builder, @NoArgsConstructor, @AllArgsConstructor - Static method:
 * fromEntity(User user) — converts User entity to UserDto
 *
 * <p>Purpose: Used to return user information to the frontend without exposing sensitive data like
 * the password hash.
 */
