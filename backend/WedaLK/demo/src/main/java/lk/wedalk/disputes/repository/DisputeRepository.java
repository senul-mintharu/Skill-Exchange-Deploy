package lk.wedalk.disputes.repository;

/**
 * DisputeRepository.java — Dispute Data Access Layer
 *
 * <p>This file should contain: - Interface extending JpaRepository<Dispute, Long> - Custom query
 * methods: - List<Dispute> findByStatus(DisputeStatus status) - Optional<Dispute>
 * findByRequestId(Long requestId) - List<Dispute> findBySeekerId(Long seekerId) - List<Dispute>
 * findByWorkerId(Long workerId) - List<Dispute> findByStatusOrderByCreatedAtAsc(DisputeStatus
 * status)
 *
 * <p>Purpose: Data access for disputes — supports admin review queue and user dispute history.
 */
