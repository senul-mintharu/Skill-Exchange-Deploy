package lk.wedalk.common;

import jakarta.validation.ConstraintViolationException;
import lk.wedalk.common.exceptions.AiGenerationException;
import lk.wedalk.common.exceptions.BadRequestException;
import lk.wedalk.common.exceptions.ConflictException;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.common.exceptions.ServiceUnavailableException;
import lk.wedalk.common.exceptions.UnauthorizedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * GlobalExceptionHandler.java — Centralized Exception Handling
 *
 * Every error that reaches a controller (custom or framework-level) is caught
 * here and converted into a standardised {@link ApiResponse.ErrorResponse} JSON
 * body so the frontend always receives:
 *
 * <pre>{
 *   "success":   false,
 *   "status":    404,
 *   "error":     "Not Found",
 *   "message":   "Worker profile not found for user 42",
 *   "detail":    null,
 *   "timestamp": "2026-04-24T09:00:00Z"
 * }</pre>
 *
 * The {@code message} field is kept human-readable so it can be displayed
 * directly in the frontend's SystemError or ErrorBanner components.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ─── Custom application exceptions ─────────────────────────────────

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleNotFound(NotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleBadRequest(BadRequestException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<ApiResponse.ErrorResponse> handleUnauthorized(UnauthorizedException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleConflict(ConflictException ex) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(ServiceUnavailableException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleServiceUnavailable(ServiceUnavailableException ex) {
        return buildResponse(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
    }

    @ExceptionHandler(AiGenerationException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleAiGeneration(AiGenerationException ex) {
        return buildResponse(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
    }

    // ─── Spring Security exceptions ────────────────────────────────────

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return buildResponse(
                HttpStatus.FORBIDDEN,
                "You do not have permission to perform this action.");
    }

    // ─── Spring MVC / validation exceptions ────────────────────────────

    /**
     * @Valid bean-validation failures on @RequestBody DTOs.
     * Returns the first field error so the user gets a clear, actionable message.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .orElse("Validation failed");

        String detail = ex.getBindingResult().getFieldErrors().stream()
                .skip(1)
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse(null);

        return buildResponse(HttpStatus.BAD_REQUEST, message, detail);
    }

    /**
     * @Validated path/query-param constraint violations.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
                .findFirst()
                .map(cv -> cv.getMessage())
                .orElse("Constraint violation");

        return buildResponse(HttpStatus.BAD_REQUEST, message);
    }

    /**
     * Malformed or unreadable JSON request body.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleUnreadableMessage(HttpMessageNotReadableException ex) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "The request body is missing or contains invalid JSON.");
    }

    /**
     * Missing required query/path parameter.
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleMissingParam(MissingServletRequestParameterException ex) {
        String message = "Required parameter '" + ex.getParameterName() + "' is missing.";
        return buildResponse(HttpStatus.BAD_REQUEST, message);
    }

    /**
     * Type mismatch on a controller method argument (e.g. "abc" for a Long id).
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String message = "Parameter '" + ex.getName() + "' should be of type "
                + (ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown") + ".";
        return buildResponse(HttpStatus.BAD_REQUEST, message);
    }

    /**
     * Wrong HTTP method for the endpoint (e.g. POST to a GET-only route).
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        String message = "HTTP method '" + ex.getMethod() + "' is not supported for this endpoint.";
        return buildResponse(HttpStatus.METHOD_NOT_ALLOWED, message);
    }

    /**
     * File upload exceeds the configured maximum size.
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "The uploaded file exceeds the maximum allowed size.");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation: {}", ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage());
        return buildResponse(
                HttpStatus.CONFLICT,
                "The requested change conflicts with existing data. Please review your input and try again.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /**
     * No static resource found (Spring 6.1+ replacement for NoHandlerFoundException).
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleNoResourceFound(NoResourceFoundException ex) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "The requested resource was not found.");
    }

    // ─── Catch-all for unexpected errors ───────────────────────────────

    /**
     * Fallback handler for any exception not explicitly caught above.
     * Logs the full stack trace for debugging but returns a generic,
     * safe message to the frontend (no internal details leaked).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse.ErrorResponse> handleGenericException(Exception ex) {
        log.error("Unhandled exception caught by GlobalExceptionHandler", ex);
        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again later.");
    }

    // ─── Helpers ───────────────────────────────────────────────────────

    private ResponseEntity<ApiResponse.ErrorResponse> buildResponse(HttpStatus status, String message) {
        return ResponseEntity.status(status)
                .body(ApiResponse.ErrorResponse.of(
                        status.value(),
                        status.getReasonPhrase(),
                        message));
    }

    private ResponseEntity<ApiResponse.ErrorResponse> buildResponse(HttpStatus status, String message, String detail) {
        return ResponseEntity.status(status)
                .body(ApiResponse.ErrorResponse.of(
                        status.value(),
                        status.getReasonPhrase(),
                        message,
                        detail));
    }
}
