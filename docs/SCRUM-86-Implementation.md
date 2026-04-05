# SCRUM-86: Worker Review System — Implementation

## Overview

This document describes the implementation of **SCRUM-86**:

**User Story:** As a Service Seeker, I want to submit a rating and review for a completed job, so that I can share feedback on the worker’s performance.

Scope for SCRUM-86:

- Show a **Leave a Review** section only when the request status is **COMPLETED**
- Allow seekers to submit a **star rating (1–5)** and optional **comment**
- Display submitted review immediately in **read-only mode**
- Prevent duplicate submissions for the same **request + seeker**
- Enforce required rating with clear validation feedback

Out of scope:

- Editing/deleting submitted reviews
- Worker-side review submission UI

---

## Acceptance Criteria Coverage (Gherkin)

### AC1 — Show review form for completed jobs

**Given** a seeker opens a request details page for a completed request  
**When** the request status is `COMPLETED`  
**Then** the system displays a **Leave a Review** section with rating, comment, and submit controls

Implemented by:

- Frontend page: `RequestDetailsPage.jsx`
- Conditional render: seeker view + request status `COMPLETED`
- UI controls: clickable 5-star input, optional comment textarea, submit button

### AC2 — Submit review and display immediately

**Given** a seeker fills the review form and submits  
**When** the backend accepts the review  
**Then** the review is shown immediately on the same page and the form is hidden

Implemented by:

- API call: `POST /api/reviews`
- Immediate UI update via local state (`existingReview`) after successful response
- Read-only review card renders rating and comment after submission

### AC3 — Prevent duplicate reviews

**Given** a review already exists for the same request and seeker  
**When** the seeker opens the completed request details page or attempts another submission  
**Then** the system shows the existing review in read-only mode and prevents duplicate submission

Implemented by:

- Frontend duplicate prevention:
  - Fetches seeker reviews and matches by `requestId`
  - If found, hides form and shows read-only rating/comment
- Backend integrity enforcement:
  - Duplicate check by `request + seeker`
  - Rejects duplicate create attempts

### AC4 — Enforce rating requirement

**Given** a seeker attempts to submit a review without selecting a rating  
**When** submit is triggered  
**Then** submission is blocked and the system shows:  
**"Please select a star rating to submit your review"**

Implemented by:

- Frontend validation in submit handler (rating required before API call)
- Backend DTO validation enforces required rating (defense in depth)
- Validation/API errors are surfaced to the user through `ErrorBanner`

---

## Backend

### Endpoint implemented

| Method | Endpoint       | Purpose                                         |
| ------ | -------------- | ----------------------------------------------- |
| `POST` | `/api/reviews` | Creates a seeker review for a completed request |

Additional endpoint used by frontend duplicate/read-only flow:

| Method | Endpoint          | Purpose                                    |
| ------ | ----------------- | ------------------------------------------ |
| `GET`  | `/api/reviews/my` | Returns current seeker’s submitted reviews |

### Entity

**`Review`**

- Persists:
  - `id`
  - `request` (`request_id`)
  - `seeker` (mapped to reviewer column)
  - `worker` (mapped to reviewee column)
  - `rating`
  - `comment`
  - `createdAt`
- Enforces unique review per request + seeker via DB unique constraint

### Validation + Duplicate Check

- Rating validation:
  - Required
  - Range `1–5`
  - Missing rating message: **"Please select a star rating to submit your review"**
- Business validation:
  - Request must be `COMPLETED`
  - Seeker identity is resolved from JWT-authenticated user context
  - Duplicate submissions are rejected for existing `request + seeker`

---

## Frontend

### Request Details Page Changes

**`frontend/src/pages/seeker/RequestDetailsPage.jsx`**

- Added review state for:
  - selected rating
  - comment
  - submission/loading flags
  - API/validation error message
  - existing review snapshot
- Added existing-review lookup on completed requests to drive read-only mode

### Star Rating UI

- Added a clean clickable star input (1–5)
- Added a visual star display for read-only mode
- Uses filled vs unfilled material icons for clear visual feedback

### Conditional Rendering

- Review section is shown only when:
  - seeker request details view
  - request status is `COMPLETED`
- If an existing review is found:
  - read-only rating/comment shown
  - form hidden
- If no review exists:
  - input form shown

### Error Handling

- Uses `ErrorBanner.jsx` for:
  - missing rating validation message
  - backend/API failures (including duplicate attempt responses)
- Prevents duplicate submissions during request by disabling submit while submitting

---

## Files Added / Updated

### Backend

- `backend/WedaLK/demo/src/main/java/lk/wedalk/reviews/model/Review.java` (updated)
- `backend/WedaLK/demo/src/main/java/lk/wedalk/reviews/dto/ReviewCreateRequest.java` (updated)
- `backend/WedaLK/demo/src/main/java/lk/wedalk/reviews/repository/ReviewRepository.java` (updated)
- `backend/WedaLK/demo/src/main/java/lk/wedalk/reviews/service/ReviewService.java` (updated)

### Frontend

- `frontend/src/pages/seeker/RequestDetailsPage.jsx` (updated)

---

## Manual Test Cases (aligned with ACs)

### Completed job → review allowed

1. Open a request in seeker view with status `COMPLETED`.
2. Confirm **Leave a Review** section is visible.
3. Confirm stars, comment textarea, and submit button are present.

### Not completed → blocked

1. Open a request with status `OPEN`, `ASSIGNED`, or `IN_PROGRESS`.
2. Confirm **Leave a Review** section is not shown.
3. Confirm no review submission controls are available.

### Submit review → visible immediately

1. On a completed request, select a rating and optionally enter a comment.
2. Click **Submit Review**.
3. Confirm the form is replaced immediately by read-only review content.
4. Confirm rating appears as filled stars and comment is shown.

### Duplicate → blocked

1. Submit a review for a completed request.
2. Reopen the same request details page.
3. Confirm existing review is shown in read-only mode and form is hidden.
4. If a duplicate submit is attempted through direct API/edge flow, confirm duplicate error is returned and UI remains read-only.

### Missing rating → error

1. Open a completed request review form.
2. Leave rating unselected.
3. Click **Submit Review**.
4. Confirm submission is blocked.
5. Confirm error shown: **"Please select a star rating to submit your review"**.
