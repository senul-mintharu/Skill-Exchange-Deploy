package lk.wedalk.verification.model;

/**
 * VerificationDocument.java — Verification Document Entity (Optional)
 *
 * <p>This file should contain: - @Entity, @Table(name = "verification_documents") annotations -
 * Fields: - Long id — @Id, @GeneratedValue - VerificationSubmission submission — @ManyToOne, parent
 * submission - String documentType — type of document (e.g., "NIC", "Certificate", "License") -
 * String documentUrl — URL/path to the uploaded document - LocalDateTime uploadedAt -
 * Lombok: @Data, @NoArgsConstructor, @AllArgsConstructor
 *
 * <p>Purpose: Allows workers to submit multiple verification documents (e.g., NIC front/back, skill
 * certificates, trade licenses).
 */
