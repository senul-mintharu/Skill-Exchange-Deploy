package lk.wedalk.verification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerificationSubmitResponse {

    private String verificationStatus;
    private String documentName;
}
