package lk.wedalk.verification.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * VerificationStatusResponse — response payload for GET /api/verification/my
 * and items in the GET /api/verification/pending list.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationStatusResponse {

    private Long submissionId;
    private String verificationStatus;
    private String documentName;
    private Long documentSizeBytes;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private String adminNotes;

    // Worker details (useful for admin pending list)
    private Long workerId;
    private String workerName;
    private String workerEmail;
}
