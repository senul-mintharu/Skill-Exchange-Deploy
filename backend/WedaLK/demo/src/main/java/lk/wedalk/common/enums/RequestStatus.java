package lk.wedalk.common.enums;

/**
 * RequestStatus.java — Service Request Status Enumeration
 *
 * <p>Full lifecycle:
 * PENDING_PAYMENT    → Seeker created request, awaiting payment slip upload
 * PAYMENT_UNDER_REVIEW → Slip uploaded, awaiting admin approval
 * OPEN               → Payment approved, accepting worker quotations
 * ASSIGNED           → Seeker accepted a quotation, worker is on the job
 * WORKER_COMPLETED   → Worker marked job done, awaiting seeker confirmation
 * COMPLETED          → Seeker confirmed job was completed successfully
 * NOT_COMPLETED      → Seeker raised a dispute (triggers admin review)
 * CANCELLED          → Seeker cancelled before assignment
 */
public enum RequestStatus {
  PENDING_PAYMENT,
  PAYMENT_UNDER_REVIEW,
  OPEN,
  ASSIGNED,
  WORKER_COMPLETED,
  COMPLETED,
  NOT_COMPLETED,
  CANCELLED
}
