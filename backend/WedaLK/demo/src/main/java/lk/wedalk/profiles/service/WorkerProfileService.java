package lk.wedalk.profiles.service;

import lk.wedalk.profiles.dto.WorkerProfileCreateRequest;
import lk.wedalk.profiles.dto.WorkerProfileResponse;
import lk.wedalk.profiles.dto.WorkerProfileUpdateRequest;
import lk.wedalk.profiles.model.WorkerProfile;
import lk.wedalk.profiles.repository.WorkerProfileRepository;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkerProfileService {

    private final WorkerProfileRepository workerProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    public WorkerProfileResponse createProfile(WorkerProfileCreateRequest request) {
        // Automatically generate a User for the profile (Sprint 1 simplification)
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        String fullName = Optional.ofNullable(request.getFullName())
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .orElse("Worker_" + uniqueSuffix);
        User newUser = User.builder()
                .fullName(fullName)
                .email("worker_" + uniqueSuffix + "@test.com")
                .password("password")
                .phone(request.getContactNumber())
                .role(lk.wedalk.users.model.Role.WORKER)
                .build();
        User user = userRepository.save(newUser);

        WorkerProfile profile = WorkerProfile.builder()
                .user(user)
                .bio(request.getBio())
                .profilePictureUrl(request.getProfilePictureUrl())
                .skills(request.getSkills())
                .district(request.getDistrict())
                .serviceAreas(request.getServiceAreas())
                .hourlyRate(request.getHourlyRate())
                .availability(request.getAvailability())
                .build();

        WorkerProfile savedProfile = workerProfileRepository.save(profile);
        return mapToResponse(savedProfile);
    }

    public List<WorkerProfileResponse> getAllProfiles() {
        return workerProfileRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public WorkerProfileResponse getProfile(Long id) {
        WorkerProfile profile = workerProfileRepository.findById(id)
                .orElseThrow(() -> new lk.wedalk.common.exceptions.NotFoundException("Profile not found"));
        return mapToResponse(profile);
    }

    public WorkerProfileResponse getProfileByUserId(Long userId) {
        WorkerProfile profile = workerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new lk.wedalk.common.exceptions.NotFoundException("Profile not found for user"));
        return mapToResponse(profile);
    }

    @Transactional
    public WorkerProfileResponse updateProfile(Long id, WorkerProfileUpdateRequest request) {
        WorkerProfile profile = workerProfileRepository.findById(id)
                .orElseThrow(() -> new lk.wedalk.common.exceptions.NotFoundException("Profile not found"));

        if (request.getFullName() != null)
            profile.getUser().setFullName(request.getFullName());
        if (request.getContactNumber() != null)
            profile.getUser().setPhone(request.getContactNumber());
        if (request.getBio() != null)
            profile.setBio(request.getBio());
        if (request.getProfilePictureUrl() != null)
            profile.setProfilePictureUrl(request.getProfilePictureUrl());
        if (request.getSkills() != null)
            profile.setSkills(request.getSkills());
        if (request.getDistrict() != null)
            profile.setDistrict(request.getDistrict());
        if (request.getServiceAreas() != null)
            profile.setServiceAreas(request.getServiceAreas());
        if (request.getHourlyRate() != null)
            profile.setHourlyRate(request.getHourlyRate());
        if (request.getAvailability() != null)
            profile.setAvailability(request.getAvailability());

        WorkerProfile savedProfile = workerProfileRepository.save(profile);
        return mapToResponse(savedProfile);
    }

    private WorkerProfileResponse mapToResponse(WorkerProfile profile) {
        return new WorkerProfileResponse(
                profile.getId(),
                profile.getUser().getId(), // returning userId
                profile.getUser().getFullName(),
                profile.getUser().getPhone(),
                profile.getBio(),
                profile.getProfilePictureUrl(),
                profile.getSkills(),
                profile.getDistrict(),
                profile.getServiceAreas(),
                profile.getHourlyRate(),
                profile.getAvailability());
    }
}
