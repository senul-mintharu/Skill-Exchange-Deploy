package lk.wedalk.verification.dto;

/**
 * VerificationDecisionRequest.java — Admin Verification Decision DTO
 *
 * <p>This file should contain: - Fields: - Long submissionId — @NotNull, the submission being
 * reviewed - VerificationStatus decision — @NotNull, APPROVED or REJECTED - String adminNotes —
 * optional notes explaining the decision - Lombok: @Data, @NoArgsConstructor, @AllArgsConstructor
 *
 * <p>Purpose: Used by admins to approve or reject a worker's verification submission. On approval,
 * the worker's profile verificationStatus is updated to APPROVED.
 */
