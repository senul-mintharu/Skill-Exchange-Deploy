package lk.wedalk.verification.model;

/**
 * VerificationSubmission.java — Verification Submission JPA Entity
 *
 * <p>This file should contain: - @Entity, @Table(name = "verification_submissions") annotations -
 * Fields: - Long id — @Id, @GeneratedValue - User worker — @ManyToOne, the worker submitting for
 * verification - String nicNumber — National Identity Card number - String documentUrl — URL/path
 * to uploaded ID document - String additionalNotes — optional notes from the worker -
 * VerificationStatus status — @Enumerated — PENDING, APPROVED, REJECTED - String adminNotes —
 * admin's decision notes (nullable) - User reviewedBy — @ManyToOne (nullable), the admin who
 * reviewed - LocalDateTime submittedAt - LocalDateTime reviewedAt — nullable -
 * Lombok: @Data, @Builder, @NoArgsConstructor, @AllArgsConstructor
 *
 * <p>Relationships: - @ManyToOne: User (worker) - @ManyToOne: User (admin reviewer, nullable)
 * - @OneToMany: VerificationDocument (optional, if storing multiple docs)
 */
