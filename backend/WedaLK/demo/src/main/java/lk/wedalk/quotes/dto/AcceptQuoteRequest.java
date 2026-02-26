package lk.wedalk.quotes.dto;

/**
 * AcceptQuoteRequest.java — Accept/Reject Quote DTO
 *
 * <p>This file should contain: - Fields: - Long quoteId — the quotation to accept or reject -
 * Lombok: @Data, @NoArgsConstructor, @AllArgsConstructor
 *
 * <p>Purpose: Used by the seeker to accept a specific quote for their request. When a quote is
 * accepted: 1. The quote's status changes to ACCEPTED 2. All other quotes for the same request are
 * REJECTED 3. The request status changes to ASSIGNED 4. The worker is assigned to the request
 *
 * <p>Alternative: You may also implement accept via path param: PATCH /api/quotes/{quoteId}/accept
 */
