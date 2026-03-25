# SCRUM-68: Seeker View Assigned Worker & Job Status — Implementation

## Overview

This document describes the implementation of **SCRUM-68**:

**User Story:** As a Service Seeker, I want to view the assigned worker and current job status for my request, so that I can clearly track who is handling the job and what stage it is in.

Scope for SCRUM-68:

- Display assigned worker details on request details view
- Display mapped job status label for seeker visibility
- Show explicit no-assignment state when no worker is assigned

Out of scope:

- Quote comparison UI (handled in **SCRUM-65**)
- Quote acceptance/assignment workflow actions (handled in **SCRUM-67**)

---

## Acceptance Criteria Coverage (Gherkin)

### AC1 — Display assigned worker

**Given** a request has an assigned worker  
**When** the seeker opens the request details page  
**Then** the system shows the worker name and a clickable link to the worker profile

Implemented by:

- Frontend section: **Assigned Worker & Status** in `RequestDetailsPage.jsx`
- Worker link route: `"/workers/{id}"`
- Backend response fields consumed: `assignedWorkerName`, `assignedWorkerId`

### AC2 — Display job status

**Given** a request is in `ASSIGNED`, `IN_PROGRESS`, or `COMPLETED` status  
**When** the seeker views request details  
**Then** the system displays a clear status label (`Assigned`, `In Progress`, `Completed`)

Implemented by:

- Frontend status mapping helper in `RequestDetailsPage.jsx`
- Status badge rendered in the **Assigned Worker & Status** section
- Backend response field consumed: `status`

### AC3 — No assignment state

**Given** a request does not have an assigned worker  
**When** the seeker opens request details  
**Then** the system displays **"No worker assigned yet"**

Implemented by:

- Conditional UI fallback in `RequestDetailsPage.jsx` when `assignedWorkerId` is not present

---

## Backend

### API extension

| Method | Endpoint             | Purpose                                                              |
| ------ | -------------------- | -------------------------------------------------------------------- |
| `GET`  | `/api/requests/{id}` | Returns request details including assigned worker and current status |

Extended response fields:

- `assignedWorkerId`
- `assignedWorkerName`
- `status`

Notes:

- No new endpoint was introduced.
- Existing response contract was preserved; fields were only extended.
- Request details endpoint remains backward compatible.

---

## Frontend

### Updated Page

**`frontend/src/pages/seeker/RequestDetailsPage.jsx`**

- Added new section: **Assigned Worker & Status**
- Displays worker name with link to `"/workers/{id}"` when assigned
- Displays fallback text **"No worker assigned yet"** when unassigned
- Displays user-friendly status labels:
  - `ASSIGNED` → `Assigned`
  - `IN_PROGRESS` → `In Progress`
  - `COMPLETED` → `Completed`
- Reused existing styling patterns and status badge style to keep UI consistent

---

## Files Updated

### Backend

- `backend/WedaLK/demo/src/main/java/lk/wedalk/requests/model/ServiceRequest.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/requests/dto/RequestResponse.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/requests/service/ServiceRequestService.java`

### Frontend

- `frontend/src/pages/seeker/RequestDetailsPage.jsx`

---

## Manual Test Cases (aligned with ACs)

### AC1 — Assigned worker visible

1. Use a request that has an assigned worker.
2. Open `My Requests` and navigate to that request’s details page.
3. Confirm the **Assigned Worker & Status** section shows worker name.
4. Click the worker name and confirm navigation to `"/workers/{id}"`.

### AC2 — Status visible

1. Use requests with statuses `ASSIGNED`, `IN_PROGRESS`, and `COMPLETED`.
2. Open each request details page.
3. Confirm status badge text appears as `Assigned`, `In Progress`, and `Completed` respectively.

### AC3 — No assignment message

1. Use a request without an assigned worker.
2. Open the request details page.
3. Confirm the section shows **"No worker assigned yet"**.
