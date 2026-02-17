package lk.wedalk.common.exceptions;

/**
 * BadRequestException.java — Bad Request Exception
 *
 * Thrown when the client sends invalid data (e.g., missing required fields,
 * invalid status transitions, duplicate submissions).
 * Should be caught by a @ControllerAdvice global exception handler and return
 * HTTP 400.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
