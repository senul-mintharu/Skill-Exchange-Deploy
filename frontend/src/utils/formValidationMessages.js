/**
 * Form-friendly API and validation messages (SCRUM-115).
 *
 * Maps common backend errors and network failures to short, actionable copy
 * so users can fix input without guessing.
 */

const NETWORK =
  'Cannot reach the server. Check your internet connection, then try again.';

const SESSION =
  'Your session has expired. Please sign in again, then resubmit the form.';

/**
 * @param {unknown} err - Axios error or similar
 * @param {string} [fallback] - When no specific message is available
 * @returns {string}
 */
export function getApiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;

  if (typeof err.userMessage === 'string' && err.userMessage.trim()) {
    return err.userMessage.trim();
  }

  const code = err.code;
  const message = err.message;
  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || message === 'Network Error') {
    return NETWORK;
  }

  const status = err.response?.status;
  const data = err.response?.data;
  const raw =
    (typeof data?.message === 'string' && data.message) ||
    (typeof data?.error === 'string' && data.error) ||
    '';

  if (typeof raw === 'string' && raw.trim()) {
    return mapBackendMessageToFriendly(raw.trim(), status);
  }

  if (status === 401) {
    return SESSION;
  }
  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (status === 404) {
    return 'The requested item was not found. It may have been removed.';
  }
  if (status === 409) {
    return 'This action conflicts with existing data. Refresh and try again.';
  }
  if (status === 503) {
    return 'The service is temporarily unavailable. Please try again shortly.';
  }
  if (status >= 500) {
    return 'A server error occurred. Please try again later.';
  }

  return fallback;
}

/**
 * @param {string} message - Backend message
 * @param {number} [httpStatus]
 * @returns {string}
 */
function mapBackendMessageToFriendly(message, httpStatus) {
  const m = message.toLowerCase();

  if (m.includes('email') && (m.includes('already') || m.includes('exists') || m.includes('registered'))) {
    return 'This email is already in use. Sign in instead, or register with a different email.';
  }

  if (m.includes('invalid email') && m.includes('password')) {
    return 'We could not sign you in. Check your email and password, or reset your approach and try again.';
  }

  if (m === 'file too large' || m.includes('file too large') || m.includes('max upload')) {
    return 'This file is too large. Choose a smaller file that meets the size limit shown on the form.';
  }

  if (m.includes('document file is required') || m.includes('document is required')) {
    return 'Please choose a file to upload before submitting.';
  }

  if (httpStatus === 401) {
    return SESSION;
  }

  return message;
}

/**
 * Client-side: validate email pattern (loose, user-facing).
 * @param {string} value
 * @returns {string|undefined} error message or undefined if OK
 */
export function validateEmailFormat(value) {
  const t = String(value || '').trim();
  if (!t) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
    return 'Use a valid email address, for example name@example.com.';
  }
  return undefined;
}

/**
 * @param {string} password
 * @param {number} [min=6]
 */
export function validatePasswordLength(password, min = 6) {
  if (!password) return 'Password is required.';
  if (password.length < min) return `Password must be at least ${min} characters.`;
  return undefined;
}
