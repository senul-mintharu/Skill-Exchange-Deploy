package lk.wedalk.requests.dto;

import lk.wedalk.common.enums.RequestStatus;
import lk.wedalk.common.enums.ServiceCategory;
import lk.wedalk.common.enums.UrgencyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * RequestResponse.java — Service Request Response DTO
 *
 * Returned when fetching service request details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestResponse {

    private Long id;
    private String description;
    private ServiceCategory category;
    private String locationArea;
    private Double budget;
    private UrgencyLevel urgency;
    private RequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Seeker information
    private Long seekerId;
    private String seekerName;
    private String seekerPhone;
}
