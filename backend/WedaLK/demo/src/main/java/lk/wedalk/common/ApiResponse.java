package lk.wedalk.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * ApiResponse.java — Standard API Response Wrapper
 *
 * <p>
 * Provides a consistent JSON response format across all endpoints.
 * Success example: { "success": true, "message": "OK", "data": { ... } }
 * Error example:   { "success": false, "message": "Not found", "data": null }
 *
 * <p>For richer error payloads (with timestamp, status code, and detail), use
 * {@link ErrorResponse} via the global exception handler.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {

  private boolean success;
  private String message;
  private T data;

  public static <T> ApiResponse<T> success(T data, String message) {
    return new ApiResponse<>(true, message, data);
  }

  public static <T> ApiResponse<T> error(String message) {
    return new ApiResponse<>(false, message, null);
  }

  public static <T> ApiResponse<T> error(String message, T data) {
    return new ApiResponse<>(false, message, data);
  }

  // ─── Structured error payload ────────────────────────────────────────

  /**
   * A richer error body returned by the global exception handler.
   * The frontend can read {@code response.data.message} (same path as before)
   * and optionally use {@code status}, {@code error}, {@code detail}, and
   * {@code timestamp} for logging, debugging, or UI display.
   */
  @Data
  @AllArgsConstructor
  @NoArgsConstructor
  public static class ErrorResponse {
    private boolean success;
    private int status;
    private String error;
    private String message;
    private String detail;
    private Instant timestamp;

    public static ErrorResponse of(int status, String error, String message) {
      return new ErrorResponse(false, status, error, message, null, Instant.now());
    }

    public static ErrorResponse of(int status, String error, String message, String detail) {
      return new ErrorResponse(false, status, error, message, detail, Instant.now());
    }
  }
}
