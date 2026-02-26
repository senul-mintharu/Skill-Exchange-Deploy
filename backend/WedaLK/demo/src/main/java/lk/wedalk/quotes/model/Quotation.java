package lk.wedalk.quotes.model;

/**
 * Quotation.java — Quotation JPA Entity
 *
 * <p>This file should contain: - @Entity, @Table(name = "quotations") annotations - Fields: - Long
 * id — @Id, @GeneratedValue - ServiceRequest request — @ManyToOne, the request this quote is for -
 * User worker — @ManyToOne, the worker submitting the quote - double price — quoted price in LKR -
 * String message — worker's message/proposal to the seeker - int estimatedDays — estimated days to
 * complete the work - QuoteStatus status — @Enumerated(EnumType.STRING) — PENDING, ACCEPTED,
 * REJECTED - LocalDateTime createdAt - LocalDateTime updatedAt -
 * Lombok: @Data, @Builder, @NoArgsConstructor, @AllArgsConstructor
 *
 * <p>Relationships: - @ManyToOne: ServiceRequest - @ManyToOne: User (worker)
 *
 * <p>Constraints: - Unique constraint on (request_id, worker_id) — one quote per worker per request
 */
