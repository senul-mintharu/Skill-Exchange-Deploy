# SCRUM-70: Mark Job Outcome — Implementation

## Overview

This document describes the implementation of **SCRUM-70**:

**User Story:** As a Service Seeker, I want to mark the outcome of an assigned job as completed or not completed, so that the request status reflects the real job outcome.

Scope for SCRUM-70:

- Allow seeker to mark an **ASSIGNED** request as **COMPLETED**
- Allow seeker to mark an **ASSIGNED** request as **NOT_COMPLETED**
- Require user confirmation before applying status change
- Immediately reflect updated status in request details view

Out of scope:

- Request assignment workflow (handled in **SCRUM-67**)
- Assigned worker/status display baseline UI (handled in **SCRUM-68**)

---

## Acceptance Criteria Coverage (Gherkin)

### AC1 — Mark completed

**Given** a seeker has a request with status `ASSIGNED`  
**When** the seeker clicks **Mark as Completed** and confirms the action  
**Then** the system updates the request status to `COMPLETED` and returns updated request details

Implemented by:

- Frontend action button in `RequestDetailsPage.jsx` shown only when status is `ASSIGNED`
- Backend endpoint: `PUT /api/requests/{requestId}/status` with body `{ "status": "COMPLETED" }`
- UI refresh after success via re-fetch of request details

### AC2 — Confirmation dialog

**Given** a seeker initiates a job outcome action  
**When** the seeker clicks either **Mark as Completed** or **Mark as Not Completed**  
**Then** the system shows a confirmation dialog before calling the backend

Implemented by:

- Shared confirmation flow in `RequestDetailsPage.jsx` using `window.confirm(...)`
- Shared handler for both outcomes to avoid duplicated logic

### AC4 — Status reflection

**Given** a seeker updates the job outcome successfully  
**When** the request details page is refreshed in-place after the API response  
**Then** the updated request status is displayed immediately and action buttons are no longer shown

Implemented by:

- Existing SCRUM-68 status display reused in **Assigned Worker & Status** section
- Conditional rendering keeps outcome buttons visible only for `ASSIGNED`
- Immediate data refresh after successful status update

---

## Backend

### New endpoint

| Method | Endpoint                           | Purpose                                                                      |
| ------ | ---------------------------------- | ---------------------------------------------------------------------------- |
| `PUT`  | `/api/requests/{requestId}/status` | Allows seeker to mark assigned request outcome as completed or not completed |

Validation + logic implemented:

- Validate request exists (`NotFoundException` if missing)
- Validate request belongs to seeker (`UnauthorizedException` if not owner)
- Validate current status is `ASSIGNED` (`BadRequestException` otherwise)
- Validate target status is only `COMPLETED` or `NOT_COMPLETED`
- Update and persist request status
- Return updated `RequestResponse` DTO

Notes:

- Existing endpoints remain unchanged.
- Transition rule is strictly enforced: `ASSIGNED` -> `COMPLETED` / `NOT_COMPLETED`.
- Logic is kept inside the requests module.

---

## Frontend

### Updated Page

**`frontend/src/pages/seeker/RequestDetailsPage.jsx`**

- Added two seeker-only outcome buttons when `request.status === "ASSIGNED"`:
  - **Mark as Completed**
  - **Mark as Not Completed**
- Added shared confirmation + submit handler for both actions
- Calls status update API and refreshes request details on success
- Shows user feedback message after action
- Keeps existing layout/sections and SCRUM-68 status display behavior intact

### API call function

**`frontend/src/services/requestService.js`**

- Added `updateRequestStatus(id, status)`
- Calls: `PUT /requests/{id}/status?seekerId=1`
- Sends body: `{ status }`

Status update behavior:

- Buttons render only while status is `ASSIGNED`
- During update, buttons are disabled
- After successful update and refresh, status badge reflects new value and buttons are hidden

---

## Files Added / Updated

### Backend

- `backend/WedaLK/demo/src/main/java/lk/wedalk/requests/dto/RequestStatusUpdateRequest.java` (new)
- `backend/WedaLK/demo/src/main/java/lk/wedalk/requests/controller/ServiceRequestController.java` (new status endpoint)
- `backend/WedaLK/demo/src/main/java/lk/wedalk/requests/service/ServiceRequestService.java` (status update validation + logic)

### Frontend

- `frontend/src/pages/seeker/RequestDetailsPage.jsx` (outcome buttons, confirmation, refresh)
- `frontend/src/services/requestService.js` (status update API helper)

---

## Manual Test Cases (aligned with ACs)

### Mark completed

1. Use a request in `ASSIGNED` status.
2. Open request details from **My Requests**.
3. Click **Mark as Completed**.
4. Confirm in the dialog.
5. Verify success message is shown.
6. Verify status now shows `Completed` and outcome buttons are hidden.

### Mark not completed

1. Use a request in `ASSIGNED` status.
2. Open request details from **My Requests**.
3. Click **Mark as Not Completed**.
4. Confirm in the dialog.
5. Verify success message is shown.
6. Verify status now shows `NOT_COMPLETED` (or mapped display label if present) and outcome buttons are hidden.

### Status updates correctly

1. Trigger either outcome action on an `ASSIGNED` request.
2. Verify the page refreshes request data after success.
3. Confirm the status badge in **Assigned Worker & Status** reflects the latest value immediately.

### Buttons hidden after update

1. Start with `ASSIGNED` and confirm outcome buttons are visible.
2. Complete one status update successfully.
3. Confirm both outcome buttons are no longer rendered for the updated request.
