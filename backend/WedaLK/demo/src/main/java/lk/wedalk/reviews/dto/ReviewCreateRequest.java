package lk.wedalk.reviews.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ReviewCreateRequest.java — Create Review DTO
 *
 * <p>
 * Used by seekers to leave a review for the worker after job completion.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewCreateRequest {

    @NotNull(message = "Request ID is required")
    private Long requestId;

    @NotNull(message = "Please select a star rating to submit your review")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    private String comment;
}
