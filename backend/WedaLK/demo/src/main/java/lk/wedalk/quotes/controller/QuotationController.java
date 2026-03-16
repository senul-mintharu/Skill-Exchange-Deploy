package lk.wedalk.quotes.controller;

import jakarta.validation.Valid;
import lk.wedalk.common.ApiResponse;
import lk.wedalk.quotes.dto.QuoteCreateRequest;
import lk.wedalk.quotes.dto.QuoteResponse;
import lk.wedalk.quotes.service.QuotationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * QuotationController — REST endpoints for quotation management.
 *
 * Base path: /api/quotes
 *
 * Story 1 (this sprint):
 * POST /api/quotes — worker submits a quote
 *
 * Story 2 (this sprint):
 * GET /api/quotes/my — worker's submitted quotes
 * DELETE /api/quotes/{quoteId} — worker withdraws a quote
 *
 * Story 3 (this sprint):
 * GET /api/quotes/request/{requestId} — seeker views quotes on a request
 * PATCH /api/quotes/{quoteId}/accept — seeker accepts a quote
 * PATCH /api/quotes/{quoteId}/reject — seeker rejects a quote
 *
 * Note: workerId / seekerId are passed as query params until JWT auth is wired.
 */
@RestController
@RequestMapping("/api/quotes")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class QuotationController {

    private final QuotationService quotationService;

    // =========================================================================
    // Story 1 — Submit a Quotation
    // =========================================================================

    @PostMapping
    public ResponseEntity<ApiResponse<QuoteResponse>> submitQuote(
            @Valid @RequestBody QuoteCreateRequest request,
            @RequestParam(defaultValue = "2") Long workerId) {

        QuoteResponse response = quotationService.createQuote(workerId, request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Quotation submitted successfully!"));
    }

    // =========================================================================
    // Story 2 — Worker: View & Manage Quotations
    // =========================================================================

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<QuoteResponse>>> getMyQuotes(
            @RequestParam(defaultValue = "2") Long workerId) {

        List<QuoteResponse> quotes = quotationService.getQuotesByWorker(workerId);
        return ResponseEntity.ok(ApiResponse.success(quotes, "Quotations retrieved successfully"));
    }

    @DeleteMapping("/{quoteId}")
    public ResponseEntity<ApiResponse<QuoteResponse>> withdrawQuote(
            @PathVariable Long quoteId,
            @RequestParam(defaultValue = "2") Long workerId) {

        QuoteResponse response = quotationService.withdrawQuote(quoteId, workerId);
        return ResponseEntity.ok(ApiResponse.success(response, "Quotation withdrawn successfully"));
    }

    // =========================================================================
    // Story 3 — Seeker: View, Accept, Reject
    // =========================================================================

    @GetMapping("/request/{requestId}")
    public ResponseEntity<ApiResponse<List<QuoteResponse>>> getQuotesByRequest(
            @PathVariable Long requestId) {

        List<QuoteResponse> quotes = quotationService.getQuotesByRequest(requestId);
        return ResponseEntity.ok(ApiResponse.success(quotes, "Quotes retrieved successfully"));
    }

    @PatchMapping("/{quoteId}/accept")
    public ResponseEntity<ApiResponse<QuoteResponse>> acceptQuote(
            @PathVariable Long quoteId,
            @RequestParam(defaultValue = "1") Long seekerId) {

        QuoteResponse response = quotationService.acceptQuote(quoteId, seekerId);
        return ResponseEntity.ok(ApiResponse.success(response, "Quote accepted successfully"));
    }

    @PatchMapping("/{quoteId}/reject")
    public ResponseEntity<ApiResponse<QuoteResponse>> rejectQuote(
            @PathVariable Long quoteId,
            @RequestParam(defaultValue = "1") Long seekerId) {

        QuoteResponse response = quotationService.rejectQuote(quoteId, seekerId);
        return ResponseEntity.ok(ApiResponse.success(response, "Quote rejected"));
    }
}
