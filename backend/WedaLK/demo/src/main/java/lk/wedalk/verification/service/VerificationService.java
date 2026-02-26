package lk.wedalk.verification.service;

/**
 * VerificationService.java — Verification Business Logic
 *
 * <p>This file should contain: - @Service annotation - Inject VerificationRepository,
 * WorkerProfileRepository, UserRepository - Methods: - VerificationSubmission
 * submitVerification(Long workerId, VerificationSubmitRequest request) -
 * List<VerificationSubmission> getPendingSubmissions() — for admin review queue -
 * VerificationSubmission getSubmissionByWorker(Long workerId) - void reviewSubmission(Long adminId,
 * VerificationDecisionRequest request) - Update submission status - Update worker profile's
 * verificationStatus accordingly
 *
 * <p>Purpose: Manages the worker verification flow — submit, review queue, approve/reject.
 */
