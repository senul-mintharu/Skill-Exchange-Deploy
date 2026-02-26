package lk.wedalk.profiles.dto;

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
public class WorkerProfileUpdateRequest {
    private String bio;

    @NotEmpty(message = "Skills cannot be empty")
    private List<String> skills;

    private String district;

    @NotEmpty(message = "Service Areas cannot be empty")
    private List<String> serviceAreas;

    private Double hourlyRate; // Use Wrapper to allow null (partial update if needed, but for now full update
                               // support)
    private String availability;
}
