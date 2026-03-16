package lk.wedalk.quotes.repository;

import lk.wedalk.quotes.model.Quotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * QuotationRepository — Data Access Layer for Quotation entities.
 */
@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {

    /**
     * Fetch all quotes submitted for a specific service request.
     * Used by the seeker's "Compare Quotes" view (Story 3).
     */
    List<Quotation> findByRequestIdOrderByPriceAsc(Long requestId);

    /**
     * Fetch all quotes submitted by a specific worker.
     * Used by the worker's "My Quotes" view (Story 2).
     */
    List<Quotation> findByWorkerIdOrderByCreatedAtDesc(Long workerId);

    /**
     * Check if a worker has already submitted a quote for a given request.
     * Used to enforce the one-quote-per-worker constraint (AC4).
     */
    boolean existsByRequestIdAndWorkerId(Long requestId, Long workerId);
}
