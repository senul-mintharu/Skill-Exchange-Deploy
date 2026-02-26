package lk.wedalk.profiles.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerProfileCreateRequest {

    @NotBlank(message = "Bio is required")
    private String bio;

    @NotEmpty(message = "At least one skill is required")
    private List<String> skills;

    @NotBlank(message = "District is required")
    private String district;

    @NotEmpty(message = "At least one service area is required")
    private List<String> serviceAreas;

    private double hourlyRate;

    private String availability;
}
