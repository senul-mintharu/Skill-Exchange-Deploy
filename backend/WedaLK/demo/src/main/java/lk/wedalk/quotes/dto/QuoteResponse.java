package lk.wedalk.quotes.dto;

/**
 * QuoteResponse.java — Quotation Response DTO
 *
 * <p>This file should contain: - Fields: - Long id - Long requestId - String requestTitle — from
 * ServiceRequest entity - Long workerId - String workerName — from User entity - double
 * workerRating — from WorkerProfile - boolean workerVerified — from WorkerProfile - double price -
 * String message - int estimatedDays - QuoteStatus status - LocalDateTime createdAt -
 * Lombok: @Data, @Builder, @NoArgsConstructor, @AllArgsConstructor - Static method:
 * fromEntity(Quotation quote)
 *
 * <p>Purpose: Returned when fetching quotes. Includes worker info for comparison.
 */
