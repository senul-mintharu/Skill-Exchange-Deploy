# SCRUM-14: Worker Browse Open Requests — Implementation

## Overview

This document describes the full-stack implementation of the **"Worker wants to see a list of open requests so that I can decide which jobs to quote for"** user story.

The implementation replaces the original `FindWorkPage` with a properly named `BrowseRequestsPage` and adds six key improvements: server-side pagination, keyword/title search, server-side sorting, skeleton loading cards, auto-apply category filter, and a separate location filter.

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

**User Story:** Worker wants to see a list of open requests so that I can decide which jobs to quote for.

### Task 1 — Backend: Fetch Open Requests API

| Acceptance Criteria | Status |
|---|---|
| API returns only OPEN requests | Done — `browseOpenRequests` query filters by `RequestStatus.OPEN` |
| Response schema matches frontend needs | Done — `PagedResponse<RequestResponse>` includes all fields + pagination metadata |

### Task 2 — Frontend: Build "Browse Requests" List Page

| Acceptance Criteria | Status |
|---|---|
| Worker can see a list of open requests | Done — `BrowseRequestsPage` renders paginated card grid |
| Empty state shown when no requests exist | Done — contextual empty message with filter-aware text + "Clear Filters" button |

### Task 3 — Integration & Testing: Verify Data Flow

| Acceptance Criteria | Status |
|---|---|
| List updates correctly from backend | Done — `fetchRequests()` calls paginated API, formats and renders |
| No UI crash on API failure | Done — error state with retry button, try-catch in all async paths |

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Page renamed | `FindWorkPage` → `BrowseRequestsPage` | Matches the correct component name from the project stub |
| Route renamed | `/find-work` → `/browse-requests` | Consistent with the component name |
| Pagination | Server-side via Spring Data `Pageable` | Scales with large datasets; client doesn't load all records |
| Page size | 9 items per page | Fills a 3-column grid evenly (3 rows of 3) |
| Keyword search | JPQL `LIKE` on `title` and `description` | Covers the two most relevant text fields; case-insensitive |
| Sort | Server-side via Spring `Sort` | Correct ordering on paginated data (client-side sort only works on current page) |
| Loading state | Skeleton cards instead of spinner | Better perceived performance; matches the card layout |
| Category filter | Auto-apply on change | Reduces clicks; immediate feedback |
| Location/keyword | Apply on Enter key press | Avoids excessive API calls while typing |
| Backward compat | Kept `/api/requests/open` and `/api/requests/search` | Existing pages (MyRequests, etc.) still work |

---

## Backend Changes

### New File: `PagedResponse.java`

**Path:** `backend/.../common/PagedResponse.java`

Generic paginated response wrapper used by the browse endpoint:

| Field | Type | Description |
|-------|------|-------------|
| `content` | `List<T>` | Current page of results |
| `page` | `int` | Current page number (0-indexed) |
| `size` | `int` | Page size |
| `totalElements` | `long` | Total matching records across all pages |
| `totalPages` | `int` | Total number of pages |
| `last` | `boolean` | Whether this is the last page |

### Updated: `ServiceRequestRepository.java`

**Path:** `backend/.../requests/repository/ServiceRequestRepository.java`

Added `browseOpenRequests()` — a custom JPQL query with `Pageable` support:

```java
@Query("SELECT sr FROM ServiceRequest sr WHERE sr.status = :status " +
       "AND (:keyword IS NULL OR LOWER(sr.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
       "    OR LOWER(sr.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
       "AND (:category IS NULL OR sr.category = :category) " +
       "AND (:locationArea IS NULL OR LOWER(sr.locationArea) LIKE LOWER(CONCAT('%', :locationArea, '%')))")
Page<ServiceRequest> browseOpenRequests(
        @Param("status") RequestStatus status,
        @Param("keyword") String keyword,
        @Param("category") ServiceCategory category,
        @Param("locationArea") String locationArea,
        Pageable pageable);
```

**Key design choices:**
- Parameters are nullable — passing `null` means "no filter" for that field
- Keyword searches both `title` and `description` with case-insensitive `LIKE`
- Location uses `LIKE` for partial matching (e.g., "Colombo" matches "Colombo 03")
- `Pageable` handles both pagination and sorting in a single query

All existing repository methods were preserved for backward compatibility.

### Updated: `ServiceRequestService.java`

**Path:** `backend/.../requests/service/ServiceRequestService.java`

Added `browseOpenRequests()` method:

**Sort mapping:**
| Frontend Value | Spring Sort |
|---|---|
| `newest` (default) | `createdAt DESC` |
| `budget-high` | `budget DESC` |
| `budget-low` | `budget ASC` |
| `urgency` | `urgency DESC` |

**Parameter normalization:**
- Empty/blank strings are converted to `null` so the JPQL query treats them as "no filter"
- This avoids needing separate query methods for each filter combination

The existing `getOpenRequests()` and `searchRequests()` methods were preserved.

### Updated: `ServiceRequestController.java`

**Path:** `backend/.../requests/controller/ServiceRequestController.java`

Added `GET /api/requests/browse` endpoint:

```java
@GetMapping("/browse")
public ResponseEntity<ApiResponse<PagedResponse<RequestResponse>>> browseRequests(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) ServiceCategory category,
        @RequestParam(required = false) String locationArea,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "9") int size,
        @RequestParam(defaultValue = "newest") String sortBy)
```

The existing `/open` and `/search` endpoints were preserved.

---

## Frontend Changes

### Renamed: FindWorkPage → BrowseRequestsPage

| Old | New |
|-----|-----|
| `frontend/src/pages/worker/FindWorkPage.jsx` | Deleted |
| `frontend/src/pages/worker/FindWorkPage.css` | Deleted |
| `frontend/src/pages/worker/BrowseRequestsPage.jsx` | Full rewrite (was stub) |
| `frontend/src/pages/worker/BrowseRequestsPage.css` | Created |

### Updated: `App.js`

**Path:** `frontend/src/App.js`

- Import changed: `FindWorkPage` → `BrowseRequestsPage`
- Route changed: `/find-work` → `/browse-requests`

### Updated: `Navbar.jsx`

**Path:** `frontend/src/components/common/Navbar.jsx`

- Desktop nav link: `/find-work` → `/browse-requests`
- Mobile drawer link: `/find-work` → `/browse-requests`
- Display label remains "Find Work" (user-facing text unchanged)

### Updated: `requestService.js`

**Path:** `frontend/src/services/requestService.js`

Added `browseRequests(params)` function:

```javascript
export const browseRequests = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.category) query.append('category', params.category);
    if (params.locationArea) query.append('locationArea', params.locationArea);
    if (params.page !== undefined) query.append('page', params.page);
    if (params.size) query.append('size', params.size);
    if (params.sortBy) query.append('sortBy', params.sortBy);

    const response = await apiClient.get(`/requests/browse?${query.toString()}`);
    return response.data.data;
};
```

Returns `{ content, page, size, totalElements, totalPages, last }`.

The existing `getOpenRequests()` was preserved for backward compat.

### BrowseRequestsPage.jsx — Feature Breakdown

**Path:** `frontend/src/pages/worker/BrowseRequestsPage.jsx`

#### 1. Server-Side Pagination

- Page size: 9 (fills 3x3 grid)
- Pagination controls: Prev/Next buttons + numbered page buttons
- Ellipsis (`...`) shown when there are many pages
- First/last page always accessible
- Smooth scroll to top on page change
- Total results count displayed: "**X** jobs available/found"

#### 2. Keyword Search

- Input field with search icon, placeholder "Search by keyword..."
- Searches across `title` and `description` on the backend (case-insensitive)
- Triggered by pressing Enter key
- Resets to page 0 on new search

#### 3. Location Filter

- Separate input field with location icon, placeholder "Filter by location..."
- Partial matching (e.g., "Colombo" matches "Colombo 03")
- Triggered by pressing Enter key

#### 4. Category Filter (Auto-Apply)

- Dropdown with all 12 service categories from `constants.js`
- **Auto-applies** on selection change — no "Search" button needed
- Resets to page 0 when changed

#### 5. Server-Side Sort (Auto-Apply)

- Dropdown: Newest First, Budget High→Low, Budget Low→High, Urgency Most Urgent
- **Auto-applies** on selection change
- Sort is applied server-side for correct ordering across pages

#### 6. Skeleton Loading Cards

Instead of a spinner, the loading state shows 9 skeleton cards that match the real card layout:

- **Skeleton header**: badge placeholder + small line
- **Skeleton body**: title line, subtitle line, description lines, date line
- **Skeleton footer**: budget placeholder + button placeholder
- All elements use a shimmer animation (`br-shimmer` keyframe)

#### 7. Error & Empty States

- **Error state**: Error icon + message + "Try Again" button
- **Empty state (no filters)**: "No jobs available right now. Check back later for new opportunities!"
- **Empty state (with filters)**: "Try adjusting your filters or clearing them." + "Clear Filters" button

#### 8. Clear Filters

- "Clear" button appears in the filter bar when any filter is active
- Resets keyword, category, location, and sort to defaults
- Triggers a fresh fetch

### BrowseRequestsPage.css — Styles

**Path:** `frontend/src/pages/worker/BrowseRequestsPage.css`

All CSS classes use the `br-` prefix (Browse Requests). Key sections:

- **Layout**: `.browse-requests-container`, `.br-grid` (auto-fill 340px columns)
- **Cards**: `.br-card` with header/body/footer, hover lift effect
- **Skeletons**: `.br-skeleton-card`, `.br-skeleton-line` with shimmer animation
- **Filters**: `.br-filter-bar` with glassmorphism backdrop, `.br-keyword-input`, `.br-location-input`
- **Pagination**: `.br-pagination`, `.br-page-btn` with active state
- **Urgency badges**: Color-coded (low=green, medium=amber, high=red, urgent=deep red)
- **Responsive**: Single column on mobile, stacked filters, full-width pagination

---

## API Endpoints

### New Endpoint

```
GET /api/requests/browse
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `keyword` | String | `null` | Search in title and description |
| `category` | ServiceCategory | `null` | Filter by category enum value |
| `locationArea` | String | `null` | Partial match on location |
| `page` | int | `0` | Page number (0-indexed) |
| `size` | int | `9` | Items per page |
| `sortBy` | String | `newest` | Sort: `newest`, `budget-high`, `budget-low`, `urgency` |

**Example Request:**

```
GET /api/requests/browse?keyword=tap&category=PLUMBING&page=0&size=9&sortBy=newest
```

**Example Response:**

```json
{
  "success": true,
  "message": "Browse results retrieved successfully",
  "data": {
    "content": [
      {
        "id": 1,
        "title": "Fix leaking kitchen tap",
        "description": "Kitchen tap is leaking heavily...",
        "category": "PLUMBING",
        "locationArea": "Colombo 03",
        "budget": 5000.00,
        "urgency": "HIGH",
        "status": "OPEN",
        "createdAt": "2026-02-19T10:00:00",
        "seekerName": "John Seeker"
      }
    ],
    "page": 0,
    "size": 9,
    "totalElements": 1,
    "totalPages": 1,
    "last": true
  }
}
```

### Preserved Endpoints

| Method | Endpoint | Status |
|---|---|---|
| `GET` | `/api/requests/open` | Unchanged — returns all open requests (unpaginated) |
| `GET` | `/api/requests/search` | Unchanged — search by location/category (unpaginated) |

---

## Files Changed

### New Files (3)

| File | Description |
|------|-------------|
| `backend/.../common/PagedResponse.java` | Paginated response DTO |
| `frontend/src/pages/worker/BrowseRequestsPage.jsx` | Full page rewrite (was stub) |
| `frontend/src/pages/worker/BrowseRequestsPage.css` | Page styles with skeletons |

### Modified Files (5)

| File | Changes |
|------|---------|
| `backend/.../repository/ServiceRequestRepository.java` | Added `browseOpenRequests` JPQL query |
| `backend/.../service/ServiceRequestService.java` | Added `browseOpenRequests` method with sort mapping |
| `backend/.../controller/ServiceRequestController.java` | Added `GET /browse` endpoint |
| `frontend/src/services/requestService.js` | Added `browseRequests()` function |
| `frontend/src/App.js` | Route: `/find-work` → `/browse-requests`, import updated |
| `frontend/src/components/common/Navbar.jsx` | Nav links: `/find-work` → `/browse-requests` |

### Deleted Files (2)

| File | Reason |
|------|--------|
| `frontend/src/pages/worker/FindWorkPage.jsx` | Replaced by BrowseRequestsPage |
| `frontend/src/pages/worker/FindWorkPage.css` | Replaced by BrowseRequestsPage.css |

---

## Verification

1. **Frontend build**: `npx react-scripts build` — compiles with no errors
2. **Backend build**: `mvn spring-boot:run` — verify no startup errors
3. **Browse page**: Navigate to `/browse-requests`
   - Skeleton cards appear while loading
   - Cards render with title, category, location, budget, urgency
   - Total count shows correctly
4. **Keyword search**: Type "tap" and press Enter — only matching requests shown
5. **Category filter**: Select "Plumbing" — auto-applies, results filter immediately
6. **Sort**: Change to "Budget: High to Low" — auto-applies, order changes
7. **Location filter**: Type "Colombo" and press Enter — filters by location
8. **Clear filters**: Click "Clear" — resets all filters and sort
9. **Pagination**: If > 9 results, page controls appear and work correctly
10. **Empty state**: Apply impossible filter combination — empty message with "Clear Filters" button
11. **Error state**: Stop backend, reload page — error message with "Try Again" button
12. **Navbar**: "Find Work" link navigates to `/browse-requests` (desktop + mobile)

---

_Document generated for SCRUM-14 branch — February 2026_
