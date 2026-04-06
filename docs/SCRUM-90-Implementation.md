# SCRUM-90: Admin Disputes Management Dashboard — Implementation

## Overview

This document describes the implementation of SCRUM-90:

User Story: As an Administrator, I want to view disputes raised for jobs, so that I can review problematic cases.

Scope for SCRUM-90:

- Add a Disputes Management page under the Admin dashboard
- Fetch and display only OPEN disputes in a structured table
- Display Job ID, Seeker, Worker, Reason snippet, and Date Raised
- Default sort by Date Raised (newest first)
- Add pagination for high-volume dispute sets
- Add row/button navigation to full job details page
- Render established empty state when no OPEN disputes are present

Out of scope:

- Dispute resolution workflow changes (resolve action behavior unchanged)
- New dispute creation rules (covered by prior dispute stories)

---

## Acceptance Criteria Coverage (Gherkin)

### AC1 — Display Active Disputes Data Table

Given an Administrator is logged in and navigates to the Disputes dashboard  
When the page data loads successfully  
Then the system displays all OPEN disputes in a table  
And each row shows Job ID, Seeker Name, Worker Name, Reason snippet, Date Raised  
And sorting is newest Date Raised first

Implemented by:

- Backend endpoint returns OPEN-only disputes via paginated query
- Backend sort is createdAt descending (newest first)
- Frontend table columns map directly to required fields

### AC2 — Handle High Volumes of Disputes

Given there are more than 10 active disputes  
When admin views dashboard  
Then results are paginated  
And UI provides Previous/Next controls

Implemented by:

- Backend supports page and size query parameters
- Frontend requests page size = 10
- Frontend renders Previous/Next controls and current page metadata

### AC3 — Empty State Fallback

Given there are zero OPEN disputes  
When admin views dashboard  
Then table is hidden  
And centered empty state message is displayed

Implemented by:

- Frontend shows EmptyState component when dispute list is empty
- Empty state title text: There are no active disputes requiring attention.

### AC4 — Interactive Navigation

Given admin is viewing populated disputes table  
When they click a row or View Details button  
Then system navigates to full details page for that job

Implemented by:

- Row click and View Details button navigate to /admin/jobs/{requestId}
- New admin job details page fetches full request details for review context

---

## Backend Changes

### Updated endpoint behavior

- GET /api/disputes/open now supports:
  - page (default 0)
  - size (default 10)
- Returns PagedResponse<DisputeResponse>
- Includes only OPEN disputes
- Sorted by createdAt descending (newest first)

### Authorization hardening

- GET /api/disputes/open is explicitly restricted to ADMIN role in security config
- Controller also enforces role check defensively

---

## Frontend Changes

### Disputes Management page

- Implemented admin disputes table UI
- Added required columns and reason snippet truncation
- Added empty-state fallback pattern
- Added pagination controls (Previous/Next)
- Added row and button navigation to job detail view

### Admin Job Details page

- New page: /admin/jobs/:requestId
- Fetches full job/request details and displays key metadata
- Provides back navigation to disputes list

### Routing and navigation

- Added admin routes:
  - /admin/disputes
  - /admin/jobs/:requestId
- Ensured admin navbar includes:
  - Verifications
  - Disputes

---

## Files Updated

### Backend

- backend/WedaLK/demo/src/main/java/lk/wedalk/disputes/repository/DisputeRepository.java
- backend/WedaLK/demo/src/main/java/lk/wedalk/disputes/service/DisputeService.java
- backend/WedaLK/demo/src/main/java/lk/wedalk/disputes/controller/DisputeController.java
- backend/WedaLK/demo/src/main/java/lk/wedalk/config/SecurityConfig.java

### Frontend

- frontend/src/pages/admin/DisputeReviewPage.jsx
- frontend/src/pages/admin/AdminJobDetailsPage.jsx
- frontend/src/services/disputeService.js
- frontend/src/App.js
- frontend/src/components/common/Navbar.jsx

---

## Validation Results

- Backend compile: passed (mvn -DskipTests compile)
- Frontend lint: passed (npm run lint)
- Frontend tests: passed (npm test -- --watchAll=false)

---

## Manual Test Cases

### 1. OPEN disputes table render

1. Log in as ADMIN.
2. Open /admin/disputes.
3. Verify table displays OPEN disputes with required columns.
4. Verify newest dispute appears first.

### 2. Pagination behavior

1. Seed more than 10 OPEN disputes.
2. Open /admin/disputes.
3. Verify only first page displays initially.
4. Click Next and Previous; verify page changes correctly.

### 3. Empty state behavior

1. Ensure no disputes are OPEN.
2. Open /admin/disputes.
3. Verify table is hidden.
4. Verify centered message: There are no active disputes requiring attention.

### 4. Job details navigation

1. Open /admin/disputes with data.
2. Click a row and also test View Details button.
3. Verify navigation to /admin/jobs/{requestId}.
4. Verify full job details are visible.
