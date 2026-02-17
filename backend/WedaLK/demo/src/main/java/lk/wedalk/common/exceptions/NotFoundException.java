package lk.wedalk.common.exceptions;

/**
 * NotFoundException.java — Resource Not Found Exception
 *
 * Thrown when a requested resource (user, request, quote, etc.) does not exist.
 * Should be caught by a @ControllerAdvice global exception handler and return
 * HTTP 404.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }

    public NotFoundException(String entityName, String field, Object value) {
        super(String.format("%s not found with %s: %s", entityName, field, value));
    }
}
