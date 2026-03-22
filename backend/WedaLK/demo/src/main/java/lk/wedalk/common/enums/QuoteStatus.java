package lk.wedalk.common.enums;

/**
 * QuoteStatus — Quotation Status Enumeration
 *
 * Tracks the lifecycle of a worker's quotation:
 * - PENDING : Submitted, awaiting the seeker's decision
 * - ACCEPTED : Seeker accepted this quote (worker is assigned)
 * - REJECTED : Seeker rejected this quote, or accepted a different one
 * - WITHDRAWN: Worker withdrew the quote before any seeker action
 */
public enum QuoteStatus {
    PENDING,
    ACCEPTED,
    NOT_ACCEPTED,
    REJECTED,
    WITHDRAWN
}
