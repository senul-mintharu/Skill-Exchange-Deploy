# SCRUM-94 — Restrict Review & Dispute Submission to Involved Seekers

**Sprint:** Sprint 3  
**Type:** Backend Security / Business Rule Enforcement  
**Status:** ✅ Complete  

---

## Story

> As a system, I want to restrict review and dispute submission to seekers involved in the job, so that only relevant users can submit feedback or disputes.

---

## Acceptance Criteria

### AC1 — Reject Unrelated Seekers
**Given** a user is logged in as a Seeker  
**When** they attempt to submit a review or dispute for a job they did not hire a worker for  
**Then** the system shall block the submission  
**And** return a `403 Forbidden` error indicating they do not have permission for this job

### AC2 — Accept Involved Seekers
**Given** a user is logged in as a Seeker  
**When** they submit a review or dispute for a job they originally posted and hired for  
**Then** the system shall accept the submission successfully

### AC3 — Prevent Worker Submissions
**Given** a user is logged in as a Worker  
**When** they attempt to submit a review or dispute against a Seeker  
**Then** the system shall block the submission  
**And** return an error stating that only Seekers can initiate reviews or disputes

---

## Implementation

### Database — `V2__reviews_disputes.sql`

Two new tables added:

```sql
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES service_requests(id),
    reviewer_id INTEGER NOT NULL REFERENCES users(id),
    reviewee_id INTEGER NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (request_id, reviewer_id)
);

CREATE TABLE disputes (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL UNIQUE REFERENCES service_requests(id),
    seeker_id INTEGER NOT NULL REFERENCES users(id),
    worker_id INTEGER NOT NULL REFERENCES users(id),
    seeker_reason TEXT NOT NULL,
    worker_response TEXT,
    status VARCHAR(20) DEFAULT 'OPEN',
    resolution TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Backend Files

| File | Package | Description |
|------|---------|-------------|
| `DisputeStatus.java` | `common.enums` | Enum: `OPEN`, `RESOLVED` |
| `Review.java` | `reviews.model` | JPA entity — request, reviewer (seeker), reviewee (worker), rating, comment |
| `Dispute.java` | `disputes.model` | JPA entity — request, seeker, worker, reason, status, resolution |
| `ReviewCreateRequest.java` | `reviews.dto` | Request body: `requestId`, `rating` (1–5), `comment` |
| `ReviewResponse.java` | `reviews.dto` | Response: full review data with names |
| `DisputeCreateRequest.java` | `disputes.dto` | Request body: `requestId`, `reason` |
| `DisputeResponse.java` | `disputes.dto` | Response: full dispute data with names and status |
| `ReviewRepository.java` | `reviews.repository` | `existsByRequestIdAndReviewerId`, `findByRevieweeId`, `findByReviewerId` |
| `DisputeRepository.java` | `disputes.repository` | `existsByRequestId`, `findBySeekerId`, `findByStatus` |
| `ReviewService.java` | `reviews.service` | Ownership validation + review lifecycle |
| `DisputeService.java` | `disputes.service` | Ownership validation + dispute lifecycle |
| `ReviewController.java` | `reviews.controller` | REST endpoints for reviews |
| `DisputeController.java` | `disputes.controller` | REST endpoints for disputes |

---

### Ownership Validation Logic

#### ReviewService — `createReview(Long reviewerId, ReviewCreateRequest request)`

```java
// 1. Verify reviewer exists and is a SEEKER
if (reviewer.getRole() != Role.SEEKER) {
    throw new UnauthorizedException("Only seekers can submit reviews");
}

// 2. Verify the ServiceRequest exists
ServiceRequest serviceRequest = serviceRequestRepository.findById(request.getRequestId())
    .orElseThrow(() -> new NotFoundException("Service request not found"));

// 3. SCRUM-94: Verify the authenticated seeker is the OWNER of the request
if (!serviceRequest.getSeeker().getId().equals(reviewerId)) {
    throw new UnauthorizedException(
        "You do not have permission to review this job. " +
        "Only the seeker who posted this request can submit a review."
    );
}

// 4. Verify request is COMPLETED
if (serviceRequest.getStatus() != RequestStatus.COMPLETED) {
    throw new BadRequestException(
        "Reviews can only be submitted for completed requests. " +
        "Current status: " + serviceRequest.getStatus()
    );
}

// 5. Prevent duplicate reviews
if (reviewRepository.existsByRequestIdAndReviewerId(request.getRequestId(), reviewerId)) {
    throw new BadRequestException("You have already submitted a review for this request");
}
```

#### DisputeService — `createDispute(Long seekerId, DisputeCreateRequest request)`

```java
// 1. Verify seeker exists and is a SEEKER
if (seeker.getRole() != Role.SEEKER) {
    throw new UnauthorizedException("Only seekers can initiate disputes");
}

// 2. Verify the ServiceRequest exists
ServiceRequest serviceRequest = serviceRequestRepository.findById(request.getRequestId())
    .orElseThrow(() -> new NotFoundException("Service request not found"));

// 3. SCRUM-94: Verify the authenticated seeker is the OWNER of the request
if (!serviceRequest.getSeeker().getId().equals(seekerId)) {
    throw new UnauthorizedException(
        "You do not have permission to dispute this job. " +
        "Only the seeker who posted this request can submit a dispute."
    );
}

// 4. Verify request is ASSIGNED or NOT_COMPLETED
if (serviceRequest.getStatus() != RequestStatus.ASSIGNED
        && serviceRequest.getStatus() != RequestStatus.NOT_COMPLETED) {
    throw new BadRequestException(
        "Disputes can only be created for ASSIGNED or NOT_COMPLETED requests. " +
        "Current status: " + serviceRequest.getStatus()
    );
}

// 5. Prevent duplicate disputes
if (disputeRepository.existsByRequestId(request.getRequestId())) {
    throw new BadRequestException("A dispute has already been raised for this request");
}
```

---

### API Endpoints

#### Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/reviews` | SEEKER (JWT) | Submit a review for a completed job |
| `GET` | `/api/reviews/my` | SEEKER (JWT) | Get all reviews submitted by the current seeker |
| `GET` | `/api/reviews/worker/{workerId}` | Any (JWT) | Get all reviews for a specific worker |

**POST /api/reviews — Request Body:**
```json
{
  "requestId": 7,
  "rating": 5,
  "comment": "Excellent work! Very professional."
}
```

**POST /api/reviews — Success Response (201):**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "id": 2,
    "requestId": 7,
    "reviewerId": 16,
    "reviewerName": "Test Seeker One",
    "revieweeId": 18,
    "revieweeName": "Test Worker",
    "rating": 5,
    "comment": "Excellent work! Very professional.",
    "createdAt": "2026-04-01T22:31:10.157239"
  }
}
```

#### Disputes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/disputes` | SEEKER (JWT) | Submit a dispute for an unresolved job |
| `GET` | `/api/disputes/my` | SEEKER (JWT) | Get all disputes submitted by the current seeker |
| `GET` | `/api/disputes/{id}` | Any (JWT) | Get a specific dispute by ID |
| `GET` | `/api/disputes/open` | ADMIN (JWT) | Get all open disputes (admin dashboard) |

**POST /api/disputes — Request Body:**
```json
{
  "requestId": 8,
  "reason": "The worker did not complete the electrical work as agreed."
}
```

**POST /api/disputes — Success Response (201):**
```json
{
  "success": true,
  "message": "Dispute created successfully",
  "data": {
    "id": 4,
    "requestId": 8,
    "requestTitle": "SCRUM94 Dispute Test Request",
    "seekerId": 16,
    "seekerName": "Test Seeker One",
    "workerId": 18,
    "workerName": "Test Worker",
    "seekerReason": "The worker did not complete the electrical work as agreed.",
    "workerResponse": null,
    "status": "OPEN",
    "resolution": null,
    "resolvedAt": null,
    "createdAt": "2026-04-01T22:31:10.577984"
  }
}
```

---

### Error Responses

| Scenario | HTTP | Message |
|----------|------|---------|
| Worker submits review | `403` | `"Only seekers can submit reviews"` |
| Unrelated seeker submits review | `403` | `"You do not have permission to review this job. Only the seeker who posted this request can submit a review."` |
| Review on non-COMPLETED request | `400` | `"Reviews can only be submitted for completed requests. Current status: {status}"` |
| Duplicate review | `400` | `"You have already submitted a review for this request"` |
| Worker submits dispute | `403` | `"Only seekers can initiate disputes"` |
| Unrelated seeker submits dispute | `403` | `"You do not have permission to dispute this job. Only the seeker who posted this request can submit a dispute."` |
| Dispute on COMPLETED request | `400` | `"Disputes can only be created for ASSIGNED or NOT_COMPLETED requests. Current status: {status}"` |
| Duplicate dispute | `400` | `"A dispute has already been raised for this request"` |

---

### Frontend

#### `frontend/src/services/reviewService.js`
```js
export const submitReview = (payload) =>
  apiClient.post('/reviews', payload).then(r => r.data.data);

export const getMyReviews = () =>
  apiClient.get('/reviews/my').then(r => r.data.data);

export const getReviewsForWorker = (workerId) =>
  apiClient.get(`/reviews/worker/${workerId}`).then(r => r.data.data);
```

#### `frontend/src/services/disputeService.js`
```js
export const submitDispute = (payload) =>
  apiClient.post('/disputes', payload).then(r => r.data.data);

export const getMyDisputes = () =>
  apiClient.get('/disputes/my').then(r => r.data.data);

export const getDisputeById = (id) =>
  apiClient.get(`/disputes/${id}`).then(r => r.data.data);

export const getOpenDisputes = () =>
  apiClient.get('/disputes/open').then(r => r.data.data);
```

#### `frontend/src/pages/seeker/RequestDetailsPage.jsx`

**Review section** — rendered only when `!isWorker && request.status === 'COMPLETED'`:
- Interactive 1–5 star rating (amber highlight)
- Optional comment textarea
- Submit button with loading spinner
- Success/error `AlertPanel` feedback
- `reviewSubmitted` flag prevents re-submission

**Dispute section** — rendered only when `!isWorker && request.status === 'NOT_COMPLETED'`:
- Required reason textarea
- Submit button with loading spinner
- Success/error `AlertPanel` feedback
- `disputeSubmitted` flag prevents re-submission

Both sections are completely hidden from workers (`isWorker` check based on route path).

---

### Bug Fixed (Discovered During Testing)

**File:** `ServiceRequestController.java`  
**Method:** `updateRequestStatus`  
**Issue:** The endpoint was using `@RequestParam(required=false, defaultValue="1") Long seekerId`, which hardcoded the seeker identity to user ID 1 instead of reading from the JWT token. This caused all status update requests to fail with `403 Forbidden` for any user other than user ID 1.  
**Fix:** Removed the `seekerId` query parameter entirely; the method now calls `requireCurrentUserId()` to extract the authenticated user's ID from the JWT.

---

## Test Results

All 15 API tests passed via automated PowerShell test script (`test-scrum94.ps1`):

| # | Test | Expected | Result |
|---|------|----------|--------|
| 1 | [AC3] Worker → POST /api/reviews | 403 | ✅ |
| 2 | [AC1] Unrelated seeker → POST /api/reviews | 403 | ✅ |
| 3 | [AC2] Owning seeker → POST /api/reviews | 201 | ✅ |
| 4 | [EDGE] Duplicate review | 400 | ✅ |
| 5 | [EDGE] Review on NOT_COMPLETED request | 400 | ✅ |
| 6 | GET /api/reviews/my | 200 | ✅ |
| 7 | GET /api/reviews/worker/{id} | 200 | ✅ |
| 8 | [AC3] Worker → POST /api/disputes | 403 | ✅ |
| 9 | [AC1] Unrelated seeker → POST /api/disputes | 403 | ✅ |
| 10 | [AC2] Owning seeker → POST /api/disputes | 201 | ✅ |
| 11 | [EDGE] Duplicate dispute | 400 | ✅ |
| 12 | [EDGE] Dispute on COMPLETED request | 400 | ✅ |
| 13 | GET /api/disputes/my | 200 | ✅ |
| 14 | GET /api/disputes/{id} | 200 | ✅ |
| 15 | GET /api/disputes/open (admin) | 200 | ✅ |

---

## Files Changed

### New Files
| File | Type |
|------|------|
| `backend/.../db/migration/V2__reviews_disputes.sql` | DB Migration |
| `backend/.../common/enums/DisputeStatus.java` | Enum |
| `backend/.../reviews/model/Review.java` | JPA Entity |
| `backend/.../disputes/model/Dispute.java` | JPA Entity |
| `backend/.../reviews/dto/ReviewCreateRequest.java` | DTO |
| `backend/.../reviews/dto/ReviewResponse.java` | DTO |
| `backend/.../disputes/dto/DisputeCreateRequest.java` | DTO |
| `backend/.../disputes/dto/DisputeResponse.java` | DTO |
| `backend/.../reviews/repository/ReviewRepository.java` | Repository |
| `backend/.../disputes/repository/DisputeRepository.java` | Repository |
| `backend/.../reviews/service/ReviewService.java` | Service |
| `backend/.../disputes/service/DisputeService.java` | Service |
| `backend/.../reviews/controller/ReviewController.java` | Controller |
| `backend/.../disputes/controller/DisputeController.java` | Controller |
| `frontend/src/services/reviewService.js` | Frontend Service |
| `frontend/src/services/disputeService.js` | Frontend Service |

### Modified Files
| File | Change |
|------|--------|
| `frontend/src/pages/seeker/RequestDetailsPage.jsx` | Added Review + Dispute submission sections |
| `backend/.../requests/controller/ServiceRequestController.java` | Fixed `updateRequestStatus` to use JWT identity |

---

*Implemented in Sprint 3 — LankaFIX Platform*
