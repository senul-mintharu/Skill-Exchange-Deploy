package lk.wedalk.quotes.repository;

/**
 * QuotationRepository.java — Quotation Data Access Layer
 *
 * <p>This file should contain: - Interface extending JpaRepository<Quotation, Long> - Custom query
 * methods: - List<Quotation> findByRequestId(Long requestId) - List<Quotation> findByWorkerId(Long
 * workerId) - Optional<Quotation> findByRequestIdAndWorkerId(Long requestId, Long workerId) -
 * List<Quotation> findByRequestIdAndStatus(Long requestId, QuoteStatus status) - boolean
 * existsByRequestIdAndWorkerId(Long requestId, Long workerId)
 *
 * <p>Purpose: Data access for quotations — supports lookup by request, worker, and status.
 */
