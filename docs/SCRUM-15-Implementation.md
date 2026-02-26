# SCRUM-15: Worker View Request Details — Implementation

## Overview

This document describes the full-stack implementation of the **"Worker want to view request details so that I can understand the problem clearly"** user story.

The implementation creates a dedicated `WorkerRequestDetailsPage` with a worker-focused design, adds a `GlobalExceptionHandler` for proper HTTP error responses, and fixes stale route references in the existing seeker details page.

---

## Table of Contents

- [User Story & Acceptance Criteria](#user-story--acceptance-criteria)
- [Architecture Decisions](#architecture-decisions)
- [Backend Changes](#backend-changes)
- [Frontend Changes](#frontend-changes)
- [API Endpoints](#api-endpoints)
- [Files Changed](#files-changed)
- [Verification](#verification)

---

## User Story & Acceptance Criteria

**User Story:** Worker want to view request details so that I can understand the problem clearly.

### Task 1 — Backend: Request Details API

| Acceptance Criteria                | Status                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| Valid ID returns full request JSON | Done — `GET /api/requests/{id}` returns all fields via `RequestResponse` DTO                      |
| Invalid ID returns 404             | Done — `GlobalExceptionHandler` catches `NotFoundException` → HTTP 404 with `ApiResponse.error()` |

### Task 2 — Frontend: Request Details Page UI

| Acceptance Criteria                             | Status                                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Worker can click a request and see details      | Done — `BrowseRequestsPage` "View Details" → `/requests/:id` → `WorkerRequestDetailsPage`                        |
| User-friendly message shown for missing request | Done — 404 shows "Request Not Found" with `search_off` icon; other errors show "Something Went Wrong" with retry |

### Task 3 — Integration & UX Validation

| Acceptance Criteria                                | Status                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| API data renders correctly                         | Done — title, description, budget, urgency, location, category, seeker info all displayed                     |
| Layout is readable and consistent with other pages | Done — Ocean theme, `wrd-` CSS prefix, consistent card system, color-coded badges matching BrowseRequestsPage |

---

## Architecture Decisions

| Decision             | Choice                                                            | Rationale                                                                                                 |
| -------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Separate worker page | `WorkerRequestDetailsPage` instead of shared `RequestDetailsPage` | Worker needs different layout, CTA, sidebar content; avoids cluttering seeker page with more conditionals |
| CSS prefix           | `wrd-` (Worker Request Details)                                   | Avoids conflicts with seeker's `rd-` prefix; consistent with `br-` pattern from BrowseRequestsPage        |
| Error handling       | `GlobalExceptionHandler` with `@RestControllerAdvice`             | Centralized; benefits ALL endpoints (not just request details); uses existing `ApiResponse` format        |
| Loading state        | Skeleton cards with shimmer                                       | Matches BrowseRequestsPage's skeleton pattern; better perceived performance than spinner                  |
| 404 vs generic error | Distinct UI for each                                              | Worker sees "Request Not Found" (may have been removed) vs "Something Went Wrong" (retry button)          |
| Send Quote button    | Navigates to `/requests/:id/quote`                                | Wires to existing `SubmitQuotePage` stub (Sprint 2 feature); no placeholder alert                         |
| Seeker info display  | Name + phone in sidebar card                                      | Data already in API response (`seekerName`, `seekerPhone`); helps worker evaluate the job                 |
| JPQL null parameters | `COALESCE(:param, '') = ''`                                       | Hibernate 6 compatible; avoids null binding issues with `:param IS NULL` pattern                          |

---

## Backend Changes

### New File: `GlobalExceptionHandler.java`

**Path:** `backend/.../common/GlobalExceptionHandler.java`

Centralized exception handling using `@RestControllerAdvice`:

| Exception               | HTTP Status     | Response                                                               |
| ----------------------- | --------------- | ---------------------------------------------------------------------- |
| `NotFoundException`     | 404 Not Found   | `{ success: false, message: "Service request not found", data: null }` |
| `BadRequestException`   | 400 Bad Request | `{ success: false, message: "...", data: null }`                       |
| `UnauthorizedException` | 403 Forbidden   | `{ success: false, message: "...", data: null }`                       |

All responses use the existing `ApiResponse.error(message)` format for consistency.

**Impact:** Benefits all existing endpoints that throw these exceptions — `deleteRequest`, `updateRequest`, `getRequestById`, etc. Previously, unhandled `NotFoundException` resulted in a raw 500 error from Spring.

### Updated: `ServiceRequestRepository.java`

**Path:** `backend/.../requests/repository/ServiceRequestRepository.java`

Fixed `browseOpenRequests()` JPQL query for Hibernate 6 compatibility:

**Before (bug):**

```java
"AND (:keyword IS NULL OR LOWER(sr.title) LIKE ... OR LOWER(sr.description) LIKE ...)"
```

**After (fix):**

```java
"AND (COALESCE(:keyword, '') = '' OR (LOWER(sr.title) LIKE ... OR LOWER(sr.description) LIKE ...))"
```

Two changes:

1. **`COALESCE(:keyword, '') = ''`** replaces `:keyword IS NULL` — avoids Hibernate 6's null parameter binding issue with PostgreSQL
2. **Inner parentheses** around the two LIKE conditions — ensures correct operator precedence

Same fix applied to the `locationArea` parameter.

---

## Frontend Changes

### New File: `WorkerRequestDetailsPage.jsx`

**Path:** `frontend/src/pages/worker/WorkerRequestDetailsPage.jsx`

Dedicated worker-focused request details page (362 lines). Key sections:

#### 1. Skeleton Loading State

Instead of a spinner, shows shimmer skeleton matching the page layout:

- Skeleton header card (teal header + body)
- Skeleton description card
- Skeleton details grid (2x2)
- Skeleton sidebar cards

#### 2. Error & 404 States

| State         | Icon            | Title                  | Actions                                 |
| ------------- | --------------- | ---------------------- | --------------------------------------- |
| 404           | `search_off`    | "Request Not Found"    | "Browse Requests" button                |
| Generic error | `error_outline` | "Something Went Wrong" | "Browse Requests" + "Try Again" buttons |

Error card is a centered white card with rounded corners, distinct from the main layout.

#### 3. Header Card

- **Top bar** (teal background): Category badge with emoji icon, color-coded urgency badge, status badge, relative time ("3 days ago")
- **Body** (white): Large title, meta chips (location, posted date, request ID)

#### 4. Description Card

Section with `description` icon, "Job Description" heading, and full description text in a styled background block.

#### 5. Details Grid Card

2x2 grid of detail tiles, each with a color-coded icon:

| Tile             | Icon Color                      | Content                        |
| ---------------- | ------------------------------- | ------------------------------ |
| Estimated Budget | Green                           | `formatBudget()` output        |
| Urgency Level    | Context-aware (green/amber/red) | Urgency enum value             |
| Service Location | Blue                            | Location area text             |
| Category         | Purple                          | `formatCategoryLabel()` output |

#### 6. Sidebar — Send Quote CTA

Prominent teal gradient card with:

- Budget display (large font)
- "Send Quote" button (white, navigates to `/requests/:id/quote`)
- Hint text: "Submit your price and proposal to the seeker"

#### 7. Sidebar — Seeker Info Card

Shows the request poster's information:

- Avatar circle with first letter of name
- Full name
- Phone number with phone icon (if available)

#### 8. Sidebar — Tips Card

"Tips for a Winning Quote" with 4 items:

- Offer a competitive price within the budget range
- Describe your relevant experience clearly
- Provide a realistic timeline estimate
- Be professional and responsive to follow-ups

#### 9. Sidebar — Browse Similar Link

Link to `/browse-requests?category={CATEGORY}` — lets workers find similar jobs in the same category.

### New File: `WorkerRequestDetailsPage.css`

**Path:** `frontend/src/pages/worker/WorkerRequestDetailsPage.css`

Complete styling (696 lines) with `wrd-` prefix. Key sections:

- **Layout**: `.wrd-container` (max-width 1280px), `.wrd-grid` (2fr 1fr on desktop, 1fr on mobile)
- **Header**: `.wrd-header-card` with teal top bar, badges, and white body
- **Urgency badges**: Color-coded — `.wrd-urgency-badge.low` (green), `.medium` (amber), `.high` (red), `.urgent` (deep red)
- **Details grid**: `.wrd-details-grid` (2-column) with colored icon tiles
- **CTA card**: `.wrd-cta-card` with teal gradient and white "Send Quote" button
- **Seeker card**: `.wrd-seeker-avatar` (gradient circle), name and phone display
- **Skeleton**: `.wrd-skeleton-line` with `wrd-shimmer` keyframe animation, width/height utility classes
- **Responsive**: Single column at 640px, stacked header badges, full-width buttons

### Updated: `App.js`

**Path:** `frontend/src/App.js`

| Change | Before                                                                   | After                                                                                  |
| ------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Import | —                                                                        | Added `import WorkerRequestDetailsPage from './pages/worker/WorkerRequestDetailsPage'` |
| Route  | `<Route path="/requests/:requestId" element={<RequestDetailsPage />} />` | `<Route path="/requests/:requestId" element={<WorkerRequestDetailsPage />} />`         |

Seeker route `/my-requests/:requestId` → `RequestDetailsPage` unchanged.

### Updated: `RequestDetailsPage.jsx` (Seeker)

**Path:** `frontend/src/pages/seeker/RequestDetailsPage.jsx`

Three changes:

1. **404-specific error handling** (lines 42-48):

```javascript
if (err.response && err.response.status === 404) {
  setError("This request was not found. It may have been removed.");
} else {
  setError("Failed to load request details. Please try again.");
}
```

2. **Fixed stale back links** (lines 74, 88):
   - Error state: `/find-work` → `/browse-requests`, text → "Back to Browse Requests"
   - Breadcrumb: `/find-work` → `/browse-requests`, text → "Back to Browse Requests"

---

## API Endpoints

### Request Details Endpoint

```
GET /api/requests/{id}
```

| Scenario   | HTTP Status | Response Body                                                                 |
| ---------- | ----------- | ----------------------------------------------------------------------------- |
| Valid ID   | 200         | `{ success: true, message: "Request retrieved successfully", data: { ... } }` |
| Invalid ID | 404         | `{ success: false, message: "Service request not found", data: null }`        |

**Response fields (data):**

| Field          | Type            | Description                      |
| -------------- | --------------- | -------------------------------- |
| `id`           | Long            | Request ID                       |
| `title`        | String          | Request title/heading            |
| `description`  | String          | Full description                 |
| `category`     | ServiceCategory | Enum: PLUMBING, ELECTRICAL, etc. |
| `locationArea` | String          | Service location                 |
| `budget`       | Double          | Estimated budget in LKR          |
| `urgency`      | UrgencyLevel    | Enum: LOW, MEDIUM, HIGH, URGENT  |
| `status`       | RequestStatus   | Enum: OPEN, ASSIGNED, etc.       |
| `createdAt`    | LocalDateTime   | When the request was posted      |
| `updatedAt`    | LocalDateTime   | Last update timestamp            |
| `seekerId`     | Long            | Seeker's user ID                 |
| `seekerName`   | String          | Seeker's full name               |
| `seekerPhone`  | String          | Seeker's phone number            |

### Global Error Responses (New)

All endpoints now return consistent error responses via `GlobalExceptionHandler`:

| Exception               | HTTP Status | Example                                                    |
| ----------------------- | ----------- | ---------------------------------------------------------- |
| `NotFoundException`     | 404         | `{ success: false, message: "Service request not found" }` |
| `BadRequestException`   | 400         | `{ success: false, message: "Invalid request data" }`      |
| `UnauthorizedException` | 403         | `{ success: false, message: "Not authorized" }`            |

---

## Files Changed

### New Files (3)

| File                                                     | Description                                           |
| -------------------------------------------------------- | ----------------------------------------------------- |
| `backend/.../common/GlobalExceptionHandler.java`         | Centralized `@RestControllerAdvice` exception handler |
| `frontend/src/pages/worker/WorkerRequestDetailsPage.jsx` | Worker-focused request details page                   |
| `frontend/src/pages/worker/WorkerRequestDetailsPage.css` | Page styles with `wrd-` prefix                        |

### Modified Files (3)

| File                                                   | Changes                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `frontend/src/App.js`                                  | Import + route `/requests/:requestId` → `WorkerRequestDetailsPage`               |
| `frontend/src/pages/seeker/RequestDetailsPage.jsx`     | Fixed `/find-work` → `/browse-requests` links, added 404-specific error handling |
| `backend/.../repository/ServiceRequestRepository.java` | COALESCE fix for Hibernate 6 null parameter binding in browse query              |

---

## Verification

1. **Frontend build**: `npx react-scripts build` — compiles with no errors
2. **Backend build**: `mvn spring-boot:run` — verify no startup errors
3. **Happy path**: Navigate to `/browse-requests` → click "View Details" on any card
   - Skeleton loading appears briefly
   - Page renders with header (badges, title, meta), description, details grid, sidebar
   - Budget, urgency, location, category all display correctly
   - Seeker name and phone visible in sidebar
4. **Send Quote button**: Click "Send Quote" → navigates to `/requests/:id/quote`
5. **Browse Similar**: Click "Browse similar X jobs" → navigates to `/browse-requests?category=X`
6. **Back navigation**: Click "Back to Browse Requests" → navigates to `/browse-requests`
7. **404 test**: Navigate to `/requests/99999` (non-existent ID)
   - Shows "Request Not Found" card with `search_off` icon
   - "Browse Requests" button links back correctly
8. **Error test**: Stop backend, reload page
   - Shows "Something Went Wrong" card with `error_outline` icon
   - "Try Again" button reloads the page
9. **Seeker details still work**: Navigate to `/my-requests/:id`
   - Seeker view renders with edit/delete buttons
   - Back link goes to `/my-requests` (not `/browse-requests`)
10. **Browse page fixed**: Navigate to `/browse-requests`
    - Requests load correctly (COALESCE fix)
    - Keyword search, category filter, location filter all work

---

_Document generated for SCRUM-15 branch — February 2026_
