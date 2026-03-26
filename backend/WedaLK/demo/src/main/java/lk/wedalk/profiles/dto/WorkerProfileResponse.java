package lk.wedalk.profiles.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerProfileResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String contactNumber;
    private String bio;
    private String profilePictureUrl;
    private List<String> skills;
    private String district;
    private List<String> serviceAreas;
    private double hourlyRate;
    private String availability;
}
