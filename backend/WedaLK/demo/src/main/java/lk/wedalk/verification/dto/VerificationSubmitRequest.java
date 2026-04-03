package lk.wedalk.verification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerificationSubmitRequest {

    @NotBlank(message = "Document file is required")
    private String documentFile;

    @NotEmpty(message = "Metadata is required")
    private Map<String, Object> metadata;
}
