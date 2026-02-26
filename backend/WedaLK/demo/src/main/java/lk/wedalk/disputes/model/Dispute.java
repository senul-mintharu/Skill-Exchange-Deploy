package lk.wedalk.disputes.model;

/**
 * Dispute.java — Dispute JPA Entity
 *
 * <p>This file should contain: - @Entity, @Table(name = "disputes") annotations - Fields: - Long id
 * — @Id, @GeneratedValue - ServiceRequest request — @OneToOne, the request marked as "Not
 * Completed" - User seeker — @ManyToOne, the seeker who raised the dispute - User worker
 * — @ManyToOne, the assigned worker - String seekerReason — seeker's explanation of why the job
 * wasn't completed - String workerResponse — worker's response/explanation (nullable) -
 * DisputeStatus status — @Enumerated — OPEN, RESOLVED - String resolution — admin's resolution
 * decision (nullable) - User resolvedBy — @ManyToOne (nullable), admin who resolved - LocalDateTime
 * createdAt - LocalDateTime resolvedAt — nullable -
 * Lombok: @Data, @Builder, @NoArgsConstructor, @AllArgsConstructor
 *
 * <p>Purpose: Created automatically when a seeker marks a request as "Not Completed". Admin reviews
 * and resolves the dispute.
 */
