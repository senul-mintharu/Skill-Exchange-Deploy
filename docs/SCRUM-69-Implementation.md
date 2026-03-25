# SCRUM-69: Worker View Assigned Jobs — Implementation

## Overview

This document describes the implementation of **SCRUM-69**:

**User Story:** As a Skilled Worker, I want to view all service requests assigned to me, so that I can track and open my active jobs.

Scope for SCRUM-69:

- Provide a dedicated worker endpoint to retrieve assigned jobs
- Display assigned jobs in a worker-facing page with title, seeker name, and status
- Handle empty state: **"No assigned jobs yet"**
- Allow navigation to request details from each job item

Out of scope:

- Request assignment workflow (handled in **SCRUM-67**)
- Seeker assigned-worker display on request details (handled in **SCRUM-68**)

---

## Acceptance Criteria Coverage (Gherkin)

### AC1 — View assigned jobs

**Given** a worker has assigned jobs  
**When** the worker opens the My Jobs page  
**Then** the system displays a list of assigned jobs with request title, seeker name, and job status

Implemented by:

- Frontend page: `MyJobsPage.jsx` at `"/my-jobs"`
- Backend endpoint used: `GET /api/requests/worker/{workerId}`

### AC2 — Empty state

**Given** a worker has no assigned jobs  
**When** the worker opens the My Jobs page  
**Then** the system displays **"No assigned jobs yet"**

Implemented by:

- Empty-state card when the API returns an empty array

### AC3 — Navigate to job details

**Given** a job is displayed in the list  
**When** the worker clicks a job item  
**Then** the system navigates to the request details page

Implemented by:

- Each job card links to `"/requests/{requestId}"`

---

## Backend

### New endpoint

| Method | Endpoint                          | Purpose                                                                   |
| ------ | --------------------------------- | ------------------------------------------------------------------------- |
| `GET`  | `/api/requests/worker/{workerId}` | Returns all requests assigned to a worker with minimal job summary fields |

Logic implemented:

- Fetch requests associated with accepted quotations for the given worker
- Resolve seeker name from the request’s seeker relationship
- Map each result into a minimal worker jobs DTO containing:
  - `requestId`
  - `requestTitle`
  - `seekerName`
  - `status`

Notes:

- Existing endpoints remain unchanged.
- Logic is kept within the requests module with repository + service mapping.

---

## Frontend

### New/Completed Page

**`frontend/src/pages/worker/MyJobsPage.jsx`**

- Fetches assigned jobs via `requestService.getMyAssignedJobs(workerId)`
- Displays a responsive card list with:
  - Request title
  - Seeker name
  - Clear status badge
- Shows required empty state message when no jobs exist
- Makes each job card clickable to request details route

**Styling:** `frontend/src/pages/worker/MyJobsPage.css`

### Route integration

**`frontend/src/App.js`**

- Added route:
  - `"/my-jobs"` → `MyJobsPage`

### UI behavior

- Loading state while API call is in progress
- Error state with retry action when API fails
- Empty state text for zero assigned jobs
- Click-through navigation for each job item

---

## Files Added / Updated

### Backend

- `backend/WedaLK/demo/src/main/java/lk/wedalk/requests/dto/WorkerAssignedJobResponse.java` (new)
- `backend/WedaLK/demo/src/main/java/lk/wedalk/requests/repository/ServiceRequestRepository.java` (worker assigned jobs query)
- `backend/WedaLK/demo/src/main/java/lk/wedalk/requests/service/ServiceRequestService.java` (worker assigned jobs service + mapping)
- `backend/WedaLK/demo/src/main/java/lk/wedalk/requests/controller/ServiceRequestController.java` (new endpoint)

### Frontend

- `frontend/src/pages/worker/MyJobsPage.jsx` (new)
- `frontend/src/pages/worker/MyJobsPage.css` (new)
- `frontend/src/services/requestService.js` (assigned jobs API method)
- `frontend/src/App.js` (route wiring)
- `frontend/src/components/common/Navbar.jsx` (minimal nav entry)
- `frontend/src/components/common/Breadcrumb.jsx` (label)

---

## Manual Test Cases (aligned with ACs)

### AC1 — Worker has assigned jobs

1. Ensure worker has at least one assigned request.
2. Navigate to `"/my-jobs"`.
3. Confirm each item shows **request title**, **seeker name**, and **status**.

### AC2 — Worker has no jobs

1. Use a worker account with no assigned requests.
2. Navigate to `"/my-jobs"`.
3. Confirm the message **"No assigned jobs yet"** is shown.

### AC3 — Navigate to details

1. On the My Jobs page, click any job card.
2. Confirm it navigates to the request details route: `"/requests/{requestId}"`.
