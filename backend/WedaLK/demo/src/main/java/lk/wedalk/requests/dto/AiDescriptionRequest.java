package lk.wedalk.requests.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lk.wedalk.common.enums.ServiceCategory;
import lk.wedalk.common.enums.UrgencyLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiDescriptionRequest {

  @NotBlank(message = "Title is required")
  @Size(max = 150, message = "Title must not exceed 150 characters")
  private String title;

  @NotNull(message = "Category is required")
  private ServiceCategory category;

  @Size(max = 100, message = "Location area must not exceed 100 characters")
  private String locationArea;

  private UrgencyLevel urgency;

  @Size(max = 2000, message = "Existing description must not exceed 2000 characters")
  private String existingDescription;
}
