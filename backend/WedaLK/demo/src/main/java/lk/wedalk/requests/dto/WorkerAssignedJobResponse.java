package lk.wedalk.requests.dto;

import lk.wedalk.common.enums.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * WorkerAssignedJobResponse.java — Assigned jobs list item for workers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerAssignedJobResponse {

    private Long requestId;
    private String requestTitle;
    private String seekerName;
    private String seekerPhone;
    private String locationArea;
    private Double budget;
    private RequestStatus status;
}
