package lk.wedalk.requests.dto;

import jakarta.validation.constraints.NotNull;
import lk.wedalk.common.enums.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * RequestStatusUpdateRequest.java — Request status update payload for seeker
 * outcome marking.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequestStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private RequestStatus status;
}