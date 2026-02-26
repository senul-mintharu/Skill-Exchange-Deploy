package lk.wedalk.common.enums;

/**
 * Role.java — User Role Enumeration
 *
 * <p>Purpose: - SEEKER: A user who posts service requests (e.g., "I need a plumber") - WORKER: A
 * skilled worker who browses requests and submits quotations - ADMIN: Platform administrator who
 * manages verifications, disputes, and users
 *
 * <p>Usage: Used in the User entity to determine access level and dashboard routing.
 */
public enum Role {
  SEEKER,
  WORKER,
  ADMIN
}
