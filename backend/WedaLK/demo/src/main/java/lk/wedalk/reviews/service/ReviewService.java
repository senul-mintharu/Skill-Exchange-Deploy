package lk.wedalk.reviews.service;

import java.util.List;
import java.util.stream.Collectors;
import lk.wedalk.common.enums.RequestStatus;
import lk.wedalk.common.exceptions.BadRequestException;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.common.exceptions.UnauthorizedException;
import lk.wedalk.requests.model.ServiceRequest;
import lk.wedalk.requests.repository.ServiceRequestRepository;
import lk.wedalk.reviews.dto.ReviewCreateRequest;
import lk.wedalk.reviews.dto.ReviewResponse;
import lk.wedalk.reviews.model.Review;
import lk.wedalk.reviews.repository.ReviewRepository;
import lk.wedalk.users.model.Role;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ReviewService.java — Review Business Logic
 *
 * <p>
 * Handles review creation and retrieval, plus rating recalculation.
 *
 * <p>
 * SCRUM-94: Enforces strict ownership validation —
 * only the seeker who originally posted the service request can submit a
 * review.
 * Workers are blocked from submitting reviews entirely.
 */
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final UserRepository userRepository;

    /**
     * Creates a review for a completed service request.
     *
     * <p>
     * SCRUM-94 Ownership Validation:
     * <ul>
     * <li>AC3: Only users with role SEEKER can submit reviews</li>
     * <li>AC1/AC2: The authenticated seeker must be the original author of the
     * ServiceRequest</li>
     * </ul>
     *
     * @param seekerId the ID of the authenticated user attempting to submit the
     *                 review
     * @param request  the review creation payload
     * @return ReviewResponse with the created review details
     */
    @Transactional
    public ReviewResponse createReview(Long seekerId, ReviewCreateRequest request) {
        // Fetch the authenticated user
        User seeker = userRepository.findById(seekerId)
                .orElseThrow(() -> new NotFoundException("Authenticated user not found"));

        // AC3 — Prevent Worker Submissions: Only seekers can submit reviews
        if (seeker.getRole() != Role.SEEKER) {
            throw new UnauthorizedException("Only seekers can submit reviews");
        }

        // Fetch the service request
        ServiceRequest serviceRequest = serviceRequestRepository.findById(request.getRequestId())
                .orElseThrow(() -> new NotFoundException("Service request not found"));

        // AC1/AC2 — Ownership Validation: Verify the reviewer is the original seeker of
        // this request
        if (!serviceRequest.getSeeker().getId().equals(seekerId)) {
            throw new UnauthorizedException(
                    "You do not have permission to review this job. Only the seeker who posted this request can submit a review.");
        }

        // Validate request is COMPLETED
        if (serviceRequest.getStatus() != RequestStatus.COMPLETED) {
            throw new BadRequestException("Reviews can only be submitted for completed requests. Current status: "
                    + serviceRequest.getStatus());
        }

        // AC3 — Prevent duplicate reviews per request + seeker
        if (reviewRepository.existsByRequestIdAndSeekerId(request.getRequestId(), seekerId)) {
            throw new BadRequestException("You have already submitted a review for this request");
        }

        // Determine the worker from the service request.
        User worker = serviceRequest.getAssignedWorker();
        if (worker == null) {
            throw new BadRequestException("No worker is assigned to this request");
        }

        // Save review
        Review review = Review.builder()
                .request(serviceRequest)
                .seeker(seeker)
                .worker(worker)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review savedReview = reviewRepository.save(review);
        return mapToResponse(savedReview);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsForWorker(Long workerId) {
        List<Review> reviews = reviewRepository.findByWorkerId(workerId);
        return reviews.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsBySeeker(Long seekerId) {
        List<Review> reviews = reviewRepository.findBySeekerIdOrderByCreatedAtDesc(seekerId);
        return reviews.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public double getAverageRating(Long workerId) {
        Double avg = reviewRepository.findAverageRatingByWorkerId(workerId);
        return avg != null ? avg : 0.0;
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .requestId(review.getRequest().getId())
                .reviewerId(review.getSeeker().getId())
                .reviewerName(review.getSeeker().getFullName())
                .revieweeId(review.getWorker().getId())
                .revieweeName(review.getWorker().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
