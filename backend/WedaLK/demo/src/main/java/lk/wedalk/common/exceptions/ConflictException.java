package lk.wedalk.common.exceptions;

/**
 * Raised when a request cannot be completed due to a conflicting resource state.
 */
public class ConflictException extends RuntimeException {

  public ConflictException(String message) {
    super(message);
  }

  public ConflictException(String message, Throwable cause) {
    super(message, cause);
  }
}
