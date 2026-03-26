package lk.wedalk.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMeRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @Email(message = "Email must be valid")
    @NotBlank(message = "Email is required")
    private String email;

    private String phoneNumber;

    private String district;
}
