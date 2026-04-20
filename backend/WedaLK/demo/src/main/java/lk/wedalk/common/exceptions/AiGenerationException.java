package lk.wedalk.common.exceptions;

/**
 * Raised when the AI description draft service is unavailable or times out.
 */
public class AiGenerationException extends RuntimeException {

  public AiGenerationException(String message) {
    super(message);
  }

  public AiGenerationException(String message, Throwable cause) {
    super(message, cause);
  }
}
