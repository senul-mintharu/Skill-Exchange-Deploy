package lk.wedalk.common.exceptions;

/**
 * Raised when a downstream dependency is temporarily unavailable.
 */
public class ServiceUnavailableException extends RuntimeException {

  public ServiceUnavailableException(String message) {
    super(message);
  }

  public ServiceUnavailableException(String message, Throwable cause) {
    super(message, cause);
  }
}
