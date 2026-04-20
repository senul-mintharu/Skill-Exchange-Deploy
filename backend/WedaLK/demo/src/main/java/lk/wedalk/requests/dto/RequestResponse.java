package lk.wedalk.requests.dto;

import java.time.LocalDateTime;
import lk.wedalk.common.enums.RequestStatus;
import lk.wedalk.common.enums.ServiceCategory;
import lk.wedalk.common.enums.UrgencyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * RequestResponse.java — Service Request Response DTO
 *
 * <p>
 * Returned when fetching service request details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestResponse {

  private Long id;
  private String title;
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

  // Assigned worker information (SCRUM-68)
  private Long assignedWorkerId;
  private String assignedWorkerName;
  private Long assignedWorkerProfileId;

  // Payment info (SCRUM-106)
  private boolean paymentSlipUploaded;
}
