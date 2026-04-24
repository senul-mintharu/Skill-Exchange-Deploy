package lk.wedalk.common.enums;

/**
 * Admin-selected outcome when resolving an open dispute.
 *
 * <p>{@link #COMPLETE_JOB} — Close the dispute and mark the service request completed again.
 * <p>{@link #SUSPEND_WORKER} — Close the dispute and suspend the assigned worker account (job stays not completed).
 */
public enum DisputeResolveOutcome {
  COMPLETE_JOB,
  SUSPEND_WORKER
}
