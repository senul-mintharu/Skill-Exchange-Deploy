package lk.wedalk.quotes.dto;

/**
 * QuoteCreateRequest.java — Create Quotation DTO
 *
 * <p>This file should contain: - Fields: - Long requestId — the service request to quote on -
 * double price — @Positive, quoted price in LKR - String message — worker's proposal/message - int
 * estimatedDays — @Positive, estimated completion time - Validation: @NotNull on
 * requestId, @Positive on price - Lombok: @Data, @NoArgsConstructor, @AllArgsConstructor
 *
 * <p>Purpose: Used by workers when submitting a quote for a service request.
 */
