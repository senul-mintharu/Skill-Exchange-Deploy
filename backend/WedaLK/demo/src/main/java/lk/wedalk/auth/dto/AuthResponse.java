package lk.wedalk.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AuthResponse.java — Authentication Response DTO
 *
 * <p>
 * Contains JWT token and user information after successful authentication.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

  private String token;
  @Builder.Default
  private String type = "Bearer";
  private Long userId;
  private String email;
  private String fullName;
  private String role;
  /** Account phone (e.g. from registration). Helps the app pre-fill worker profile contact. */
  private String phoneNumber;

  public AuthResponse(String token, Long userId, String email, String fullName, String role) {
    this.token = token;
    this.type = "Bearer";
    this.userId = userId;
    this.email = email;
    this.fullName = fullName;
    this.role = role;
  }
}
