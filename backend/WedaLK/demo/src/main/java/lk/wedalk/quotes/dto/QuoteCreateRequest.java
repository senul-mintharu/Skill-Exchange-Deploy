package lk.wedalk.quotes.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * QuoteCreateRequest — DTO for submitting a new quotation.
 *
 * Validated at the controller layer via @Valid.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuoteCreateRequest {

    /** The service request this quote targets. */
    @NotNull(message = "Request ID is required")
    private Long requestId;

    /**
     * Quoted price in LKR.
     * Must be a positive value — free / zero-cost quotes are not allowed.
     */
    @NotNull(message = "Price is required")
    @Positive(message = "Price must be greater than zero")
    private Double price;

    /**
     * Estimated number of days to complete the work.
     * Must be at least 1 day.
     */
    @NotNull(message = "Estimated days is required")
    @Positive(message = "Estimated days must be at least 1")
    private Integer estimatedDays;

    /**
     * Optional proposal / cover message to the seeker.
     * Capped at 1000 characters to keep quotes concise.
     */
    @Size(max = 1000, message = "Message must be 1000 characters or fewer")
    private String message;
}
