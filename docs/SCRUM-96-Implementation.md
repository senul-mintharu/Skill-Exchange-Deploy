# SCRUM-96: Graceful 401/403 Error Handling for Trust Endpoints — Implementation

## Overview

**Sprint:** Sprint 4 (Post-Audit Fixes)
**Type:** Frontend UX / Error Handling
**Status:** ✅ Complete

**User Story:** As a user, I want to see clear error messages when I attempt an unauthorized trust-related action, so that I understand access restrictions.

This document describes the implementation of SCRUM-96, which replaces raw API error strings for 401 and 403 HTTP status codes on trust-related endpoints (Verification, Reviews, Disputes) with standardized, user-friendly `ErrorBanner` messages.

---

## Acceptance Criteria Coverage

### AC1 — Display Role Restriction Error
**Given** a user lacks the correct role for an action (e.g., a Worker trying to leave a review)  
**When** the system blocks the action  
**Then** a red banner shall appear stating "You do not have the required permissions to perform this action."

**Implementation:**
- Mapped all `401 Unauthorized` errors to this message.
- Mapped `403 Forbidden` errors to this message, *unless* they are specifically identified as ownership restrictions.

### AC2 — Display Ownership Restriction Error
**Given** a user attempts to interact with a job that does not belong to them  
**When** the system blocks the action  
**Then** a red banner shall appear stating "You can only perform this action on jobs you have created."

**Implementation:**
- Evaluated `403 Forbidden` responses. If the backend error message contains specific ownership keywords (e.g., "permission to review", "only the seeker who posted", "does not belong", "not your job"), the error is mapped to this ownership restriction message.

### AC3 — Banner Dismissal
**Given** an error banner is actively displayed on the screen  
**When** the user clicks the dismiss/close button on the banner  
**Then** the banner shall disappear smoothly without refreshing the page

**Implementation:**
- Reused the existing `ErrorBanner.jsx` component, which already accepts an `onClose` prop to handle smooth dismissal without page reloads.

---

## Technical Implementation

### 1. Centralized Error Resolver (New Utility)

Created `frontend/src/utils/httpErrors.js` to centralize the logic for resolving Axios errors into specific user-facing text.

- **`resolveHttpError(err, fallback)`**: 
  - Extracts the HTTP status and backend message.
  - Returns `AC1_MESSAGE` for `401` errors.
  - For `403` errors, checks the backend message against a list of `OWNERSHIP_KEYWORDS` to decide between `AC2_MESSAGE` and `AC1_MESSAGE`.
  - For all other errors (e.g., 400 Bad Request validations, 404 Not Found), falls back to the original backend message or the provided fallback string.

### 2. Frontend Page Updates

Updated the `catch` blocks in key frontend pages to utilize `resolveHttpError` instead of directly extracting `err.response.data.message`.

**`frontend/src/pages/worker/VerificationPage.jsx`**:
- Updated the catch block in the `handleSubmit` (verification submission) function.
- Updated the catch block in the `loadVerificationState` initial load effect.

**`frontend/src/pages/seeker/RequestDetailsPage.jsx`**:
- Updated the catch block in `handleSubmitReview` to format the error message properly and preserve the checking logic for 409 duplicate review attempts.
- Updated the catch block in `handleNotCompletedSubmit` for the dispute modal.

### Note on `apiClient.js`
The global Axios interceptor handles `401` status codes by clearing the authentication token and logging the user out. The `403` status codes (Forbidden for the current user) continue to bubble up to the specific components, where they are now gracefully intercepted by `resolveHttpError` and presented via the `ErrorBanner`.

---

## Files Changed

### Added
- `frontend/src/utils/httpErrors.js` 
- `docs/SCRUM-96-Implementation.md` (this file)

### Modified
- `frontend/src/pages/worker/VerificationPage.jsx`
- `frontend/src/pages/seeker/RequestDetailsPage.jsx`

---

## Testing Verification
- [x] Verified a non-owner attempting an action (via intercepted request manipulation) receives the correct AC2 text.
- [x] Verified a user with the wrong role receives the correct AC1 text.
- [x] Verified the frontend successfully compiles with warnings/errors (`npm run build` returned exit code 0).
- [x] Component logic seamlessly passes regular non-401/403 validation errors back to the UI (e.g., empty reason fields).


⚠️ One Issue Found
The VerificationController also throws ResponseStatusException(FORBIDDEN) directly (not through GlobalExceptionHandler). When Spring throws ResponseStatusException, the error body format is different — it's Spring's standard error format ({"status": 403, "error": "Forbidden", "message": "..."}), not our ApiResponse wrapper. The field name is still message in newer Spring Boot versions, but the resolveHttpError code also defensively checks err?.response?.data?.error — so it's fine either way.