package lk.wedalk.users.service;

import lk.wedalk.common.exceptions.BadRequestException;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.users.dto.UpdateMeRequest;
import lk.wedalk.users.dto.UserDto;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

	private final UserRepository userRepository;

	@Transactional(readOnly = true)
	public UserDto getCurrentUserByEmail(String email) {
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new NotFoundException("Authenticated user not found"));
		return UserDto.fromEntity(user);
	}

	@Transactional
	public UserDto updateCurrentUserByEmail(String email, UpdateMeRequest request) {
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new NotFoundException("Authenticated user not found"));

		String normalizedEmail = request.getEmail().trim().toLowerCase();
		if (!user.getEmail().equalsIgnoreCase(normalizedEmail) && userRepository.existsByEmail(normalizedEmail)) {
			throw new BadRequestException("Email is already registered");
		}

		user.setFullName(request.getFullName().trim());
		user.setEmail(normalizedEmail);
		user.setPhoneNumber(request.getPhoneNumber());
		user.setDistrict(request.getDistrict());

		User saved = userRepository.save(user);
		return UserDto.fromEntity(saved);
	}

	@Transactional
	public void deleteCurrentUserByEmail(String email) {
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new NotFoundException("Authenticated user not found"));
		userRepository.delete(user);
	}
}
