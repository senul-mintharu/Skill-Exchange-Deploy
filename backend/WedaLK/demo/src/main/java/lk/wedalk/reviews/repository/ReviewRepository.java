package lk.wedalk.reviews.repository;

/**
 * ReviewRepository.java — Review Data Access Layer
 *
 * <p>This file should contain: - Interface extending JpaRepository<Review, Long> - Custom query
 * methods: - List<Review> findByRevieweeId(Long revieweeId) - List<Review> findByReviewerId(Long
 * reviewerId) - Optional<Review> findByRequestIdAndReviewerId(Long requestId, Long reviewerId) -
 * boolean existsByRequestIdAndReviewerId(Long requestId, Long reviewerId) - @Query to calculate
 * average rating for a worker: Double findAverageRatingByRevieweeId(Long revieweeId)
 *
 * <p>Purpose: Data access for reviews — supports lookup by worker, seeker, and rating calculations.
 */
