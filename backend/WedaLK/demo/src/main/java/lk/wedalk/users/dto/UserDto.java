package lk.wedalk.users.dto;

import java.time.LocalDateTime;
import lk.wedalk.users.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {

	private Long id;
	private String fullName;
	private String email;
	private String phoneNumber;
	private String district;
	private String role;
	private Boolean isSuspended;
	private LocalDateTime createdAt;

	public static UserDto fromEntity(User user) {
		return UserDto.builder()
				.id(user.getId())
				.fullName(user.getFullName())
				.email(user.getEmail())
				.phoneNumber(user.getPhoneNumber())
				.district(user.getDistrict())
				.role(user.getRole() != null ? user.getRole().name() : null)
				.isSuspended(user.getIsSuspended())
				.createdAt(user.getCreatedAt())
				.build();
	}
}
