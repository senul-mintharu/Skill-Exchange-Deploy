# SCRUM-88: View Worker Reviews & Ratings — Implementation

## Overview

This document describes the implementation of **SCRUM-88**:

**User Story:** As a user viewing a worker profile, I want to see the worker's reviews and average rating, so that I can evaluate service quality before engaging.

Scope for SCRUM-88:

- Display all reviews for a **specific** worker
- Show computed **average rating** and star visualization
- Render each review with **reviewer name**, **rating**, **comment**, and **date**
- Handle empty state: **"This worker has not received any reviews yet."**
- Preserve backend-provided sort order (**latest first**)

Out of scope:

- Review creation/submission flow (handled in **SCRUM-86**)
- Worker verification decision logic and badge rules (handled in **SCRUM-85**)

---

## Acceptance Criteria Coverage (Gherkin)

### AC1 — Display average rating and review list

**Given** a worker has one or more reviews  
**When** the profile page is opened  
**Then** the system displays the average rating and the full review list

Implemented by:

- Frontend fetch from backend endpoint: `GET /api/reviews/worker/{workerId}`
- Average rating calculation in UI from fetched review ratings: `sum(rating) / count`
- Star visualization for:
  - Overall average rating
  - Each individual review rating
- Review card fields shown:
  - `reviewerName`
  - `rating` (stars)
  - `comment`
  - `createdAt` (formatted date)

### AC2 — Display empty state

**Given** a worker has no reviews  
**When** the profile page is opened  
**Then** the system displays **"This worker has not received any reviews yet."** centered in the reviews section

Implemented by:

- Conditional empty-state card in worker profile UI when API returns an empty array

### AC3 — Sort reviews by date

**Given** multiple reviews exist  
**When** the profile page displays the review list  
**Then** reviews are shown latest first by created date

Implemented by:

- Backend query sorted by `createdAt DESC`
- Frontend renders reviews in received order (no client-side re-sorting)

---

## Backend

### Endpoint

| Method | Endpoint                         | Purpose                                                  |
| ------ | -------------------------------- | -------------------------------------------------------- |
| `GET`  | `/api/reviews/worker/{workerId}` | Returns worker reviews in descending creation time order |

### Sorting

- Reviews are fetched with `createdAt DESC` (latest first).

### DTO fields returned for worker review listing

- `reviewerName`
- `rating`
- `comment`
- `createdAt`

### Backend data flow

1. Controller receives `workerId` from path.
2. Service calls review repository for worker reviews.
3. Repository query joins reviewer (seeker) and applies descending date sort.
4. Service maps entities to lightweight worker review DTO.
5. Controller returns list response.

---

## Frontend

### WorkerProfile.jsx updates (implemented in shared worker profile UI)

**`frontend/src/components/ui/WorkerProfilePanel.jsx`**

- Uses review data passed from profile pages.
- Computes `averageRating` from fetched reviews (`sum / count`) using memoized calculation.
- Shows average rating value and star visualization under worker details.
- Renders review list cards in API order with reviewer, stars, comment, and formatted date.
- Shows centered empty state with required text when review list is empty.
- Keeps existing verified badge behavior unchanged.

### Review fetch source

- Profile pages fetch reviews from:
  - `reviewService.getReviewsForWorker(workerUserId)`
- Pages passing data into the worker profile panel:
  - `frontend/src/pages/worker/WorkerProfilePage.jsx`
  - `frontend/src/pages/public/PublicWorkerProfilePage.jsx`

---

## Files Added / Updated

### Backend

- `backend/WedaLK/demo/src/main/java/lk/wedalk/reviews/dto/WorkerReviewResponse.java` (new lightweight DTO)
- `backend/WedaLK/demo/src/main/java/lk/wedalk/reviews/repository/ReviewRepository.java` (sorted worker review query)
- `backend/WedaLK/demo/src/main/java/lk/wedalk/reviews/service/ReviewService.java` (worker review mapping to lightweight DTO)
- `backend/WedaLK/demo/src/main/java/lk/wedalk/reviews/controller/ReviewController.java` (worker review endpoint response type)

### Frontend

- `frontend/src/components/ui/WorkerProfilePanel.jsx` (average rating, stars, review cards, empty state)

---

## Manual Test Cases (aligned with ACs)

### AC1 — Worker with reviews displays correctly

1. Use a worker account/profile with multiple existing reviews.
2. Open worker profile page.
3. Verify average rating is displayed (e.g., `4.5`) with stars.
4. Verify each review card shows reviewer name, stars, comment, and date.

### AC2 — Worker with no reviews shows empty message

1. Use a worker profile with no reviews.
2. Open worker profile page.
3. Verify centered message appears: **"This worker has not received any reviews yet."**

### AC3 — Reviews are sorted latest first

1. Seed or identify worker reviews with different `createdAt` values.
2. Open worker profile page.
3. Verify newest review appears first and ordering matches backend response order.
