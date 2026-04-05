# SCRUM-87 — My Reviews Page (Seeker)

**Sprint:** Sprint 3  
**Type:** Frontend Feature / Backend Enhancement  
**Status:** ✅ Complete  

---

## Story

> As a Service Seeker, I want to see my submitted reviews so that I can track the feedback I have left for workers after completed jobs.

---

## Acceptance Criteria

### AC1 — Display Submitted Reviews
**Given** a user is logged in as a Seeker  
**When** they navigate to the My Reviews page  
**Then** the system shall display all reviews they have submitted  
**And** each review shall show the worker name, star rating, feedback text, and submission date

### AC2 — Empty State
**Given** a user is logged in as a Seeker  
**When** they navigate to the My Reviews page and have not submitted any reviews  
**Then** the system shall display an empty state message: "You have not submitted any reviews yet"

### AC3 — Reverse Chronological Order
**Given** a user is logged in as a Seeker  
**When** they view the My Reviews page  
**Then** reviews shall be displayed in reverse chronological order (most recent first)

---

## Implementation

### Backend Changes

#### `ReviewRepository.java` — Added ordered query method

```java
// New method for reverse chronological ordering (AC3)
List<Review> findByReviewerIdOrderByCreatedAtDesc(Long reviewerId);
```

#### `ReviewService.java` — Updated `getReviewsBySeeker`

```java
@Transactional(readOnly = true)
public List<ReviewResponse> getReviewsBySeeker(Long seekerId) {
    // Changed from findByReviewerId to findByReviewerIdOrderByCreatedAtDesc
    List<Review> reviews = reviewRepository.findByReviewerIdOrderByCreatedAtDesc(seekerId);
    return reviews.stream().map(this::mapToResponse).collect(Collectors.toList());
}
```

No new endpoint was required — `GET /api/reviews/my` already existed from SCRUM-94.

---

### Frontend — `MyReviewsPage.jsx`

**Route:** `/my-reviews` (SEEKER protected)  
**File:** `frontend/src/pages/seeker/MyReviewsPage.jsx`

#### Page Structure

```
MyReviewsPage
├── PageIntro (eyebrow: "My Reviews", back button to /my-requests)
├── LoadingPanel (while fetching)
├── AlertPanel [danger] (on fetch error, with retry button)
├── EmptyState (icon: rate_review, when reviews.length === 0)
└── SectionCard (when reviews.length > 0)
    ├── Header (review count, "Showing most recent first")
    └── Review list (divide-y)
        └── <article> per review
            ├── Worker avatar (initial letter, brand gradient)
            ├── Worker name (revieweeName)
            ├── StarRating component (1–5 filled amber stars)
            ├── Rating score (e.g. "5/5")
            ├── Submission date (formatted: "April 1, 2026")
            ├── Comment block (or "No written feedback" placeholder)
            └── Footer: Request #ID + "View Request" link
```

#### `StarRating` Component

```jsx
const StarRating = ({ rating }) => {
  const clamped = Math.min(5, Math.max(1, Math.round(rating)));
  return (
    <span className="flex items-center gap-0.5" aria-label={`${clamped} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`material-icons text-lg ${i < clamped ? 'text-amber-400' : 'text-gray-200'}`}>
          star
        </span>
      ))}
    </span>
  );
};
```

#### Data Flow

```
MyReviewsPage mounts
  → getMyReviews()                          [reviewService.js]
    → GET /api/reviews/my                   [ReviewController]
      → reviewService.getReviewsBySeeker()  [ReviewService]
        → findByReviewerIdOrderByCreatedAtDesc() [ReviewRepository]
          → returns List<ReviewResponse> ordered by createdAt DESC
```

---

### API Endpoint Used

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/reviews/my` | SEEKER (JWT) | Get all reviews submitted by the current seeker, ordered by most recent first |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Your reviews retrieved successfully",
  "data": [
    {
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
  ]
}
```

---

### Route Registration — `App.js`

```jsx
// Added inside <Route element={<ProtectedRoute allowedRoles={['SEEKER']} />}>
<Route path="/my-reviews" element={<MyReviewsPage />} />
```

The route is protected — unauthenticated users and non-SEEKER roles are redirected to login.

---

## Test Results

All 8 API tests passed via `test-scrum87.ps1`:

| # | Test | Expected | Result |
|---|------|----------|--------|
| 1 | Unauthenticated `GET /api/reviews/my` | 401 | ✅ |
| 2 | Seeker `GET /api/reviews/my` returns array | 200 | ✅ |
| 3 | Reviews in reverse chronological order | Most recent first | ✅ INFO (1 review in DB) |
| 4 | Seeker2 sees only own reviews (isolation) | 200, 0 reviews | ✅ |
| 5 | Worker `GET /api/reviews/my` returns empty | 200, 0 reviews | ✅ |
| 6 | Worker `POST /api/reviews` blocked (AC3) | 403 | ✅ |
| 7 | Unrelated seeker `POST /api/reviews` blocked (AC1) | 403 | ✅ |
| 8 | All `ReviewResponse` fields present | All 8 fields | ✅ |

---

## Files Changed

### New Files
| File | Type |
|------|------|
| `frontend/src/pages/seeker/MyReviewsPage.jsx` | React Page Component |
| `test-scrum87.ps1` | API Test Script |
| `docs/sprints/SCRUM-87.md` | Sprint Documentation |

### Modified Files
| File | Change |
|------|--------|
| `backend/.../reviews/repository/ReviewRepository.java` | Added `findByReviewerIdOrderByCreatedAtDesc` |
| `backend/.../reviews/service/ReviewService.java` | Updated `getReviewsBySeeker` to use ordered query |
| `frontend/src/App.js` | Registered `/my-reviews` route under SEEKER protected block |

---

## UI Components Used

| Component | Source | Purpose |
|-----------|--------|---------|
| `PageIntro` | `PortalPrimitives` | Page header with eyebrow, title, subtitle, back button |
| `SectionCard` | `PortalPrimitives` | Review list container |
| `EmptyState` | `PortalPrimitives` | Empty state when no reviews exist |
| `LoadingPanel` | `PortalPrimitives` | Loading spinner while fetching |
| `AlertPanel` | `PortalPrimitives` | Error state with retry button |
| `StarRating` | Local (inline) | Visual 1–5 amber star display |

---

*Implemented in Sprint 3 — LankaFIX Platform*
