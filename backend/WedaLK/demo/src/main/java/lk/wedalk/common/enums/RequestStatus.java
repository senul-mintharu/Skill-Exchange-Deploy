package lk.wedalk.common.enums;

/**
 * RequestStatus.java — Service Request Status Enumeration
 *
 * <p>Tracks the lifecycle of a service request: - PENDING_PAYMENT: Request created, awaiting
 * payment slip upload - PAYMENT_UNDER_REVIEW: Slip uploaded, waiting for admin approval - OPEN:
 * Payment approved, request is posted and accepting quotes - ASSIGNED: A quote has been accepted,
 * worker is assigned - IN_PROGRESS: Work has started - COMPLETED: The seeker confirms the job was
 * completed successfully - NOT_COMPLETED: The seeker reports the job was not completed (triggers
 * dispute) - CANCELLED: The request was cancelled by the seeker before assignment
 */
public enum RequestStatus {
  PENDING_PAYMENT,
  PAYMENT_UNDER_REVIEW,
  OPEN,
  ASSIGNED,
  IN_PROGRESS,
  COMPLETED,
  NOT_COMPLETED,
  CANCELLED
}
