package lk.wedalk.quotes.controller;

/**
 * QuotationController.java — Quotation REST Controller
 *
 * <p>This file should contain: - @RestController, @RequestMapping("/api/quotes") annotations -
 * Inject QuotationService - Endpoints: - POST /api/quotes — Submit a quote (worker) - GET
 * /api/quotes/request/{requestId} — Get all quotes for a request (seeker) - GET /api/quotes/my —
 * Get current worker's submitted quotes - PATCH /api/quotes/{quoteId}/accept — Accept a quote
 * (seeker) - PATCH /api/quotes/{quoteId}/reject — Reject a quote (seeker) - All endpoints return
 * ApiResponse<QuoteResponse>
 *
 * <p>Purpose: Exposes quotation management APIs — submit, compare, accept/reject.
 */
