package lk.wedalk.reviews.service;

/**
 * ReviewService.java — Review Business Logic
 *
 * <p>This file should contain: - @Service annotation - Inject ReviewRepository,
 * ServiceRequestRepository, WorkerProfileService - Methods: - ReviewResponse createReview(Long
 * reviewerId, ReviewCreateRequest request) - Validate request is COMPLETED - Check reviewer hasn't
 * already reviewed this request - Save review and recalculate worker's average rating -
 * List<ReviewResponse> getReviewsForWorker(Long workerId) - List<ReviewResponse>
 * getReviewsBySeeker(Long seekerId) - double getAverageRating(Long workerId)
 *
 * <p>Purpose: Handles review creation and retrieval, plus rating recalculation.
 */
