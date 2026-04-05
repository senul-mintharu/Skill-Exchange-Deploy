package lk.wedalk.profiles.service;

import lk.wedalk.profiles.dto.WorkerProfileCreateRequest;
import lk.wedalk.profiles.dto.WorkerProfileResponse;
import lk.wedalk.profiles.dto.WorkerProfileUpdateRequest;
import lk.wedalk.profiles.model.WorkerProfile;
import lk.wedalk.profiles.repository.WorkerProfileRepository;
import lk.wedalk.common.exceptions.BadRequestException;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.common.exceptions.UnauthorizedException;
import lk.wedalk.reviews.repository.ReviewRepository;
import lk.wedalk.users.model.Role;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkerProfileService {

    private final WorkerProfileRepository workerProfileRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    @Transactional
    public WorkerProfileResponse createProfile(Long userId, WorkerProfileCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Authenticated user not found"));

        if (user.getRole() != Role.WORKER) {
            throw new UnauthorizedException("Only workers can create worker profiles");
        }

        if (workerProfileRepository.findByUserId(userId).isPresent()) {
            throw new BadRequestException("Worker profile already exists for this user");
        }

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getContactNumber() != null) {
            user.setPhoneNumber(request.getContactNumber());
        }
        userRepository.save(user);

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
                .orElseThrow(() -> new NotFoundException("Profile not found"));
        return mapToResponse(profile);
    }

    public WorkerProfileResponse getProfileByUserId(Long userId) {
        WorkerProfile profile = workerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Profile not found for user"));
        return mapToResponse(profile);
    }

    @Transactional
    public WorkerProfileResponse updateProfile(Long id, Long currentUserId, WorkerProfileUpdateRequest request) {
        WorkerProfile profile = workerProfileRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Profile not found"));

        if (!profile.getUser().getId().equals(currentUserId)) {
            throw new UnauthorizedException("You can only update your own worker profile");
        }

        if (request.getFullName() != null)
            profile.getUser().setFullName(request.getFullName());
        if (request.getContactNumber() != null)
            profile.getUser().setPhoneNumber(request.getContactNumber());
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

    @Transactional
    public void deleteProfile(Long id, Long currentUserId) {
        WorkerProfile profile = workerProfileRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Profile not found"));

        if (!profile.getUser().getId().equals(currentUserId)) {
            throw new UnauthorizedException("You can only delete your own worker profile");
        }

        workerProfileRepository.delete(profile);
    }

    private WorkerProfileResponse mapToResponse(WorkerProfile profile) {
        Long userId = profile.getUser().getId();

        String verificationStatus = profile.getUser().getVerificationStatus() != null
                ? profile.getUser().getVerificationStatus().name()
                : "NONE";

        // Compute real rating and job count from the reviews table
        Double averageRating = reviewRepository.findAverageRatingByWorkerId(userId);
        int totalJobsCompleted = reviewRepository.findByWorkerId(userId).size();

        return new WorkerProfileResponse(
                profile.getId(),
                userId,
                profile.getUser().getFullName(),
                profile.getUser().getPhoneNumber(),
                profile.getBio(),
                profile.getProfilePictureUrl(),
                profile.getSkills(),
                profile.getDistrict(),
                profile.getServiceAreas(),
                profile.getHourlyRate(),
                profile.getAvailability(),
                verificationStatus,
                averageRating,
                totalJobsCompleted);
    }
}
