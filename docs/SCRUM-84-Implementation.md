# SCRUM-84: Admin Verification Review Dashboard — Implementation

## Overview

This document describes the implementation of SCRUM-84:

User Story: As an Administrator, I want to review worker verification submissions, so that I can approve or reject them.

Scope for SCRUM-84:

- Provide an admin dashboard page for reviewing pending verification submissions
- Show pending queue data (worker name, submitted date, document link)
- Support approve and reject decisions from the admin UI
- Require rejection reason for reject decisions
- Remove reviewed submissions from the pending queue immediately after decision
- Use centralized ErrorBanner for API errors during status updates and document retrieval
- Handle missing or corrupted documents gracefully with clear admin-facing message

Out of scope:

- Worker submission workflow (already covered in SCRUM-83)
- Broader admin dashboard redesign beyond verification review route

---

## Acceptance Criteria Coverage (Gherkin)

### AC1 — View Pending Submissions List

Given an Administrator is viewing the verifications dashboard  
When the page loads  
Then the system shall display a list of all workers who currently have a PENDING verification status  
And the list shall display the worker name, submitted date, and a link to view documents

Implemented by:

- Frontend page at route /admin/verification
- Data source: GET /api/verification/pending
- Queue rendering includes worker details, submitted timestamp, and View Document action

### AC2 — Approve a Submission

Given an Administrator is reviewing a specific worker pending document  
When the Admin clicks Approve  
Then the system shall update the worker status to APPROVED  
And remove the worker from pending list  
And display a success notification

Implemented by:

- UI action button calls reviewSubmission(submissionId, true)
- Backend updates submission status and worker verification status
- Frontend removes approved item from local pending queue state
- Success message shown via success banner in page

### AC3 — Reject a Submission

Given an Administrator is reviewing a pending document  
When the Admin clicks Reject  
Then the system prompts for a brief reason  
And on submission updates the worker status to REJECTED  
And displays a success notification

Implemented by:

- Reject action opens inline rejection reason textarea
- Frontend blocks reject confirmation when reason is empty
- Backend validates and requires admin notes for rejection
- Frontend removes rejected item from pending queue on success

### AC4 — Handle Missing Documents Gracefully

Given an Administrator attempts to view a missing or corrupted document  
When the Admin clicks View Document  
Then the system shows a clear error message  
And still allows the admin to reject submission

Implemented by:

- Backend endpoint GET /api/verification/{id}/document validates file path and readability
- Missing/corrupt file returns Not Found style error with clear message
- Frontend catches document load failure and renders ErrorBanner with actionable text
- Reject flow remains available in same row after document load failure

---

## Backend

### Endpoints and business logic

Added and updated verification review backend behavior:

- GET /api/verification/pending
  - Returns oldest-first list of pending verification submissions
- GET /api/verification/{id}/document
  - Admin-only file retrieval for uploaded verification documents
  - Returns clear retrieval error when file is missing or unreadable
- PUT /api/verification/{id}/status?approve=true|false
  - Admin-only decision endpoint
  - Status is derived server-side from approve flag
  - Reject path requires adminNotes
  - Only PENDING submissions can be reviewed

### Security

Security rules ensure admin-only access for review actions and document viewing:

- PUT /api/verification/*/status requires ADMIN
- GET /api/verification/*/document requires ADMIN
- GET /api/verification/pending requires ADMIN

### Data consistency

On review decision:

- VerificationSubmission status is updated
- reviewedAt, reviewedBy, adminNotes are recorded
- Worker user.verificationStatus is synchronized to APPROVED or REJECTED

---

## Frontend

### Admin verification review page

Implemented page and interactions for admin queue processing:

- Load and render pending queue
- Approve action with optimistic removal from queue
- Reject action with required reason prompt and confirmation
- View Document action opens blob in new browser tab
- Clear empty state when no pending submissions exist

### Error handling using ErrorBanner

Centralized ErrorBanner usage for:

- Pending list load failures
- Approve API failures
- Reject API failures
- Missing/corrupt document retrieval failures

### Success feedback

Success notifications displayed for:

- Approval completion
- Rejection completion

---

## Files Updated

### Backend

- backend/WedaLK/demo/src/main/java/lk/wedalk/verification/controller/VerificationController.java
- backend/WedaLK/demo/src/main/java/lk/wedalk/verification/service/VerificationService.java
- backend/WedaLK/demo/src/main/java/lk/wedalk/config/SecurityConfig.java

### Frontend

- frontend/src/pages/admin/VerificationReviewPage.jsx
- frontend/src/services/verificationService.js
- frontend/src/App.js
- frontend/src/components/common/Navbar.jsx

---

## Manual Test Cases

### 1. Pending queue display

1. Log in as admin.
2. Open /admin/verification.
3. Verify pending workers list is visible.
4. Verify each row shows name, submitted date, and View Document action.

### 2. Approve flow

1. Click Approve on a pending submission.
2. Verify success notification appears.
3. Verify row is removed from pending queue.
4. Verify worker verification status becomes APPROVED in backend data.

### 3. Reject flow

1. Click Reject on a pending submission.
2. Attempt confirm without reason and verify validation message.
3. Enter reason and confirm rejection.
4. Verify success notification appears.
5. Verify row is removed and status is REJECTED.

### 4. Missing document handling

1. Break or remove stored file for a pending submission.
2. Click View Document for that submission.
3. Verify clear retrieval error banner appears.
4. Verify Reject action is still available and works.

---

## Verification Notes

Current local check results during implementation:

- Frontend lint passed
- Frontend tests passed
- Backend test suite had an existing context wiring failure unrelated to SCRUM-84 behavior
