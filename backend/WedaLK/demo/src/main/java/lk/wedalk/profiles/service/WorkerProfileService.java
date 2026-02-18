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

@Service
@RequiredArgsConstructor
public class WorkerProfileService {

    private final WorkerProfileRepository workerProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    public WorkerProfileResponse createProfile(Long userId, WorkerProfileCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(
                        () -> new lk.wedalk.common.exceptions.NotFoundException("User not found with id: " + userId));

        if (workerProfileRepository.findByUserId(userId).isPresent()) {
            throw new lk.wedalk.common.exceptions.BadRequestException("Profile already exists for this user");
        }

        WorkerProfile profile = WorkerProfile.builder()
                .user(user)
                .bio(request.getBio())
                .skills(request.getSkills())
                .district(request.getDistrict())
                .serviceAreas(request.getServiceAreas())
                .hourlyRate(request.getHourlyRate())
                .build();

        WorkerProfile savedProfile = workerProfileRepository.save(profile);
        return mapToResponse(savedProfile);
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

        if (request.getBio() != null)
            profile.setBio(request.getBio());
        if (request.getSkills() != null)
            profile.setSkills(request.getSkills());
        if (request.getDistrict() != null)
            profile.setDistrict(request.getDistrict());
        if (request.getServiceAreas() != null)
            profile.setServiceAreas(request.getServiceAreas());
        if (request.getHourlyRate() != null)
            profile.setHourlyRate(request.getHourlyRate());

        WorkerProfile savedProfile = workerProfileRepository.save(profile);
        return mapToResponse(savedProfile);
    }

    // Mapping helper
    private WorkerProfileResponse mapToResponse(WorkerProfile profile) {
        // Assuming WorkerProfileResponse has a builder or adequate constructor
        // I need to check WorkerProfileResponse definition, but for now assuming it has
        // fields matching.
        // I will update WorkerProfileResponse in the next step to ensure it has these
        // fields.
        return new WorkerProfileResponse(
                profile.getId(),
                profile.getUser().getId(), // returning userId
                profile.getUser().getFullName(),
                profile.getBio(),
                profile.getSkills(),
                profile.getDistrict(),
                profile.getServiceAreas(),
                profile.getHourlyRate());
    }
}
