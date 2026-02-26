package lk.wedalk.disputes.dto;

/**
 * DisputeResponse.java — Dispute Response DTO
 *
 * <p>This file should contain: - Fields: - Long id - Long requestId - String requestTitle - Long
 * seekerId - String seekerName - Long workerId - String workerName - String seekerReason - String
 * workerResponse - DisputeStatus status - String resolution - String resolvedByName - LocalDateTime
 * createdAt - LocalDateTime resolvedAt -
 * Lombok: @Data, @Builder, @NoArgsConstructor, @AllArgsConstructor - Static method:
 * fromEntity(Dispute dispute)
 *
 * <p>Purpose: Returned when fetching dispute details for admin or user views.
 */
