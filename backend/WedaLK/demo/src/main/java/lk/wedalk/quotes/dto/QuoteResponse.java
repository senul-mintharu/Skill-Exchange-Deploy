package lk.wedalk.quotes.dto;

import lk.wedalk.common.enums.QuoteStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * QuoteResponse — DTO returned for every quotation API operation.
 *
 * Contains all fields a client needs to display a quote:
 * worker info, request context, price, ETA, status, and timestamps.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuoteResponse {

    private Long id;

    // ── Request context ──────────────────────────────────────────────────────
    private Long requestId;
    private String requestTitle;

    // ── Worker info ──────────────────────────────────────────────────────────
    private Long workerId;
    private String workerName;

    // ── Quote details ────────────────────────────────────────────────────────
    private double price;
    private int estimatedDays;
    private String message;
    private QuoteStatus status;

    // ── Timestamps ───────────────────────────────────────────────────────────
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
