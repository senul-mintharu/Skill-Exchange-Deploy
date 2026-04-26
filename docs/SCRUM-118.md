# SCRUM-118 — Graceful Error Handling

## Overview

This document summarizes the implementation completed for **SCRUM-118**:

**User Story:** As a system, I want to handle common errors gracefully, so that users are not blocked by failures.

The implementation standardized backend and frontend error handling so users receive consistent, actionable messages and recovery options instead of unclear failures.

---

## What Was Implemented

### 1. Backend Exception Handling Improvements

Updated `backend/WedaLK/demo/src/main/java/lk/wedalk/common/GlobalExceptionHandler.java`:

- Corrected `UnauthorizedException` mapping to `401 Unauthorized`
- Added explicit handlers:
  - `ConflictException` -> `409 Conflict`
  - `ServiceUnavailableException` -> `503 Service Unavailable`
  - `DataIntegrityViolationException` -> `409 Conflict` (safe conflict message)
  - `IllegalArgumentException` -> `400 Bad Request`
- Kept standardized error response shape via `ApiResponse.ErrorResponse`

Added new exception classes:

- `backend/WedaLK/demo/src/main/java/lk/wedalk/common/exceptions/ConflictException.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/common/exceptions/ServiceUnavailableException.java`

### 2. Frontend API Error Normalization

Updated `frontend/src/services/apiClient.js`:

- Added request timeout (`15000ms`)
- Added normalized error payload on rejected requests:
  - `error.userMessage`
  - `error.normalized { status, code, message, rawMessage }`
- Added one automatic retry for transient `GET` failures only:
  - network/timeout
  - HTTP `502`, `503`, `504`
- Preserved existing auth clear behavior on `401`

### 3. Friendly Message Mapping

Updated `frontend/src/utils/formValidationMessages.js`:

- Prioritizes normalized `err.userMessage`
- Added consistent fallbacks for key statuses (`401`, `403`, `404`, `409`, `503`, `5xx`)

Updated `frontend/src/utils/httpErrors.js`:

- Uses normalized `err.userMessage` first before status-based mapping

### 4. Recovery UX on Key Pages

Updated `frontend/src/pages/admin/UserManagementPage.jsx`:

- Uses centralized `getApiErrorMessage(...)`
- Added **Retry loading users** action when list loading fails

Updated `frontend/src/pages/worker/SubmitQuotePage.jsx`:

- Uses centralized friendly error mapping when loading request details fails
- Added **Retry** action for request-detail loading failures

Updated `frontend/src/pages/seeker/CreateRequestPage.jsx`:

- Improved session-expired detection using normalized status (`err.normalized.status`)

---

## Files Changed

- `backend/WedaLK/demo/src/main/java/lk/wedalk/common/GlobalExceptionHandler.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/common/exceptions/ConflictException.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/common/exceptions/ServiceUnavailableException.java`
- `frontend/src/services/apiClient.js`
- `frontend/src/utils/formValidationMessages.js`
- `frontend/src/utils/httpErrors.js`
- `frontend/src/pages/admin/UserManagementPage.jsx`
- `frontend/src/pages/worker/SubmitQuotePage.jsx`
- `frontend/src/pages/seeker/CreateRequestPage.jsx`
- `docs/SCRUM-118.md`

---

## Verification

After implementation, these checks completed successfully:

- Backend: `mvn test`
- Frontend: `npm run lint`
- Frontend: `npm run build`
- Frontend: `npm test -- --watchAll=false --runInBand`

