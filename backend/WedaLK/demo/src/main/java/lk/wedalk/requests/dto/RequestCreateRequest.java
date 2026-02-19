package lk.wedalk.requests.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lk.wedalk.common.enums.ServiceCategory;
import lk.wedalk.common.enums.UrgencyLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * RequestCreateRequest.java — Create Service Request DTO
 *
 * Used by seekers when posting a new service request.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequestCreateRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Category is required")
    private ServiceCategory category;

    @NotBlank(message = "Location area is required")
    @Size(max = 100, message = "Location area must not exceed 100 characters")
    private String locationArea;

    private Double budget;

    private UrgencyLevel urgency; // Optional, defaults to MEDIUM in service layer
}
