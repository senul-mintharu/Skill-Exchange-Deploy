package lk.wedalk.verification.repository;

/**
 * VerificationRepository.java — Verification Data Access Layer
 *
 * <p>This file should contain: - Interface extending JpaRepository<VerificationSubmission, Long> -
 * Custom query methods: - Optional<VerificationSubmission> findByWorkerId(Long workerId) -
 * List<VerificationSubmission> findByStatus(VerificationStatus status) -
 * List<VerificationSubmission> findByStatusOrderBySubmittedAtAsc(VerificationStatus status)
 *
 * <p>Purpose: Data access for verification submissions — supports filtering by status for admin
 * review queue.
 */
