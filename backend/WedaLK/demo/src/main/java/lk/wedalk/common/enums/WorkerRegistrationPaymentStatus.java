package lk.wedalk.common.enums;

/**
 * Payment lifecycle for worker profile registration (one-time platform fee).
 *
 * <p>{@link #PENDING_PAYMENT} — Profile saved; slip not yet accepted for review (or rejected).
 * <p>{@link #PAYMENT_UNDER_REVIEW} — Slip uploaded; awaiting admin approval.
 * <p>{@link #APPROVED} — Admin approved; profile is eligible for public listing and quoting.
 */
public enum WorkerRegistrationPaymentStatus {
  PENDING_PAYMENT,
  PAYMENT_UNDER_REVIEW,
  APPROVED
}
