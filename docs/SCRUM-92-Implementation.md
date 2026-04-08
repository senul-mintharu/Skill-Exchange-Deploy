# SCRUM-92: Worker Dispute Dashboard Integration — Implementation

## Overview

**Sprint:** Sprint 4 
**Type:** Feature / Frontend + Backend
**Status:** ✅ Complete

**User Story:** As a Skilled Worker, I want to see the status of disputes related to my jobs, so that I understand the resolution process.

This document describes the implementation of SCRUM-92, adding a "Your Disputes" tracking section to the Worker Dashboard to provide transparency on open and resolved disputes filed against the worker's assigned jobs.

---

## Acceptance Criteria Coverage

### AC1 — View Open Disputes
**Given** a worker has a job that was disputed by a seeker  
**When** they check their dashboard  
**Then** they shall see the job flagged with an "Open Dispute" warning  
**And** they can click to view the seeker's complaint/reason for the dispute

**Implementation:**
- The 'Your Disputes' section renders an expanded detail view for each dispute object.
- Disputes with the `OPEN` status display a red 'Open Dispute' `StatusPill`.
- The worker can toggle the 'View complaint' button to expand a panel containing the `seekerReason` string and details of the dispute.
- The UI gracefully collapses and expands one dispute at a time.

### AC2 — View Resolved Disputes
**Given** a platform administrator has made a final decision on a worker's dispute  
**When** the worker views the dispute details  
**Then** the status shall show as "Resolved"  
**And** the worker shall be able to read the administrator's final resolution notes

**Implementation:**
- Resolved disputes render a green 'Resolved' `StatusPill`.
- Upon expanding the dispute details, the worker is shown the `resolution` notes written by the Admin, in addition to the `seekerReason`.
- The UI includes the timestamp formatted date of `resolvedAt`.

### AC3 — Empty State
**Given** a worker has a perfect record with no disputed jobs  
**When** they view the disputes section of their dashboard  
**Then** the system shall display a message stating "You have no active or past disputes."

**Implementation:**
- A custom `EmptyState` block is rendered if `disputes.length === 0`.
- The exact required message string is presented along with supportive contextual text ("Jobs completed without issues will not appear here. Keep delivering great work!").

---

## Technical Implementation

### Backend Updates

Prior to this SCRUM, workers had no way to access disputes targeted against them. A new endpoint and service method were required.

**`lk.wedalk.disputes.service.DisputeService`:**
- **Added `getDisputesByWorker(Long workerId)`:** Uses the existing repository method `findByWorkerId` to fetch disputes, and sorts them newest-first by their `createdAt` date.

**`lk.wedalk.disputes.controller.DisputeController`:**
- **Added `GET /api/disputes/worker`:** A new REST endpoint restricted solely to the `WORKER` role (using RBAC validation) to allow the currently authenticated worker to safely fetch disputes tied specifically to their assigned properties. 

### Frontend Updates

**`src/services/disputeService.js`:**
- Provided a new HTTP wrapper API matching the backend: `getMyWorkerDisputes()`.

**`src/pages/worker/WorkerDashboard.jsx`:**
- **Data Fetching:** Updated `loadDashboard` to include `getMyWorkerDisputes()` via `Promise.allSettled`. If this request fails, the application treats it via a non-fatal fallback (displaying zero disputes) rather than failing the entire dashboard load.
- **UI Structure:** Added a distinct `SectionCard` named "Dispute History / Your Disputes" before the Quick Actions aside. 
- **Header Badge:** Displays a danger pill with the count of active OPEN disputes to immediately catch the worker's eye at a glance.
- **Interaction Model:** Built a dynamic mapping over the disputes list incorporating a boolean `isOpen` check and toggled `expandedDisputeId` state to cleanly handle the expandable resolution log required by AC1 & AC2.

---

## Files Changed

### Backend
- `backend/WedaLK/demo/src/main/java/lk/wedalk/disputes/service/DisputeService.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/disputes/controller/DisputeController.java`

### Frontend
- `frontend/src/services/disputeService.js`
- `frontend/src/pages/worker/WorkerDashboard.jsx`

### Added
- `docs/SCRUM-92-Implementation.md` (this file)
