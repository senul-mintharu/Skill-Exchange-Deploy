package lk.wedalk.profiles.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String verificationStatus;
    private Double averageRating;
    private int totalJobsCompleted;
    /** PENDING_PAYMENT | PAYMENT_UNDER_REVIEW | APPROVED */
    private String registrationPaymentStatus;
    private String paymentRejectionNote;
    private LocalDateTime updatedAt;
}
