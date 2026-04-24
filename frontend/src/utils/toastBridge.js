/**
 * toastBridge.js — Bridges the React toast context to non-React modules.
 *
 * Problem: apiClient.js is a plain JS module and cannot call useToast().
 * Solution: ToastProvider registers its API here on mount; apiClient reads it.
 *
 * Usage (already wired — you shouldn't need to touch this):
 *   - ToastContext.jsx calls `setToastRef(api)` inside useEffect.
 *   - apiClient.js calls `getToastRef()?.error(message)` in its interceptor.
 */

let _toastRef = null;

export function setToastRef(ref) {
  _toastRef = ref;
}

export function getToastRef() {
  return _toastRef;
}
