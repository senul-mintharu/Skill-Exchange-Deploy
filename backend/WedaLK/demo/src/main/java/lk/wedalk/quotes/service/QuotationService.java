package lk.wedalk.quotes.service;

/**
 * QuotationService.java — Quotation Business Logic
 *
 * <p>This file should contain: - @Service annotation - Inject QuotationRepository,
 * ServiceRequestRepository, UserRepository - Methods: - QuoteResponse createQuote(Long workerId,
 * QuoteCreateRequest request) - Validate worker role, request exists, request is OPEN - Check
 * worker hasn't already quoted on this request - List<QuoteResponse> getQuotesByRequest(Long
 * requestId) - List<QuoteResponse> getQuotesByWorker(Long workerId) - QuoteResponse
 * acceptQuote(Long quoteId, Long seekerId) - Accept this quote, reject all others, assign worker,
 * update request status - QuoteResponse rejectQuote(Long quoteId, Long seekerId)
 *
 * <p>Purpose: Manages the quotation lifecycle — submit, list, accept, reject.
 */
