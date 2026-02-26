package lk.wedalk.common.exceptions;

/**
 * UnauthorizedException.java — Unauthorized Access Exception
 *
 * <p>Thrown when a user tries to access a resource or perform an action they are not authorized for
 * (e.g., a SEEKER trying to submit a quote, or a non-admin accessing admin endpoints). Should be
 * caught by a @ControllerAdvice global exception handler and return HTTP 401/403.
 */
public class UnauthorizedException extends RuntimeException {

  public UnauthorizedException(String message) {
    super(message);
  }
}
