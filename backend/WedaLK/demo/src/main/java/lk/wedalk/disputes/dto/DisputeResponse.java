package lk.wedalk.disputes.dto;

import java.time.LocalDateTime;
import lk.wedalk.common.enums.DisputeResolveOutcome;
import lk.wedalk.common.enums.DisputeStatus;
import lk.wedalk.common.enums.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DisputeResponse.java — Dispute Response DTO
 *
 * <p>Returned to clients after dispute creation or retrieval.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisputeResponse {

    private Long id;
    private Long requestId;
    private String requestTitle;
    private Long seekerId;
    private String seekerName;
    private String seekerEmail;
    private String seekerPhone;
    private Long workerId;
    private String workerName;
    private String workerEmail;
    private String workerPhone;
    private RequestStatus requestStatus;
    private String seekerReason;
    private String workerResponse;
    private DisputeStatus status;
    private DisputeResolveOutcome resolveOutcome;
    private String resolution;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
}
