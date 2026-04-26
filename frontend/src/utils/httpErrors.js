/**
 * httpErrors.js — Centralized HTTP 401/403 error message resolver
 *
 * SCRUM-96: Maps Axios errors from trust-related endpoints to standardized,
 * user-friendly banner messages per the acceptance criteria.
 *
 * AC1 — Role restriction (wrong role):
 *   "You do not have the required permissions to perform this action."
 *
 * AC2 — Ownership restriction (right role, wrong job):
 *   "You can only perform this action on jobs you have created."
 *
 * All other errors fall back to the provided fallback string.
 */

const AC1_MESSAGE = 'You do not have the required permissions to perform this action.';
const AC2_MESSAGE = 'You can only perform this action on jobs you have created.';

/**
 * Keywords present in backend messages that indicate an ownership error (AC2).
 * If none of these match, a 403 is treated as a role restriction (AC1).
 */
const OWNERSHIP_KEYWORDS = [
  'permission to review',
  'permission to dispute',
  'only the seeker who posted',
  'does not belong',
  'not your job',
];

/**
 * Resolves an Axios error to the correct user-facing message string.
 *
 * @param {Error} err - The Axios error object from a failed request
 * @param {string} fallback - Fallback message for non-auth errors
 * @returns {string} The message to display in an ErrorBanner
 */
export function resolveHttpError(err, fallback) {
  if (typeof err?.userMessage === 'string' && err.userMessage.trim()) {
    return err.userMessage.trim();
  }

  const status = err?.response?.status;

  if (status === 401) {
    return AC1_MESSAGE;
  }

  if (status === 403) {
    const backendMessage = String(
      err?.response?.data?.message || err?.response?.data?.error || ''
    ).toLowerCase();

    const isOwnershipError = OWNERSHIP_KEYWORDS.some((kw) =>
      backendMessage.includes(kw)
    );

    return isOwnershipError ? AC2_MESSAGE : AC1_MESSAGE;
  }

  // Non-auth error — use the backend message if available, else the caller's fallback.
  return err?.response?.data?.message || fallback;
}
