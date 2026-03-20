# SCRUM-71: Browse Workers — Explore Service Providers

## Story

**As a** Service Seeker,
**I want to** browse a list of workers,
**So that** I can explore available service providers.

**Epic:** Worker Discovery
**Sprint:** Sprint 2
**Branch:** `SCRUM-71-Explore-Service-Providers`

---

## Description

The system provides a page where service seekers can browse all registered skilled workers on the platform. Each worker entry displays key information such as the worker's name, primary skill or category, and service area to help seekers identify suitable candidates.

This browsing feature supports worker discovery and helps seekers proactively find workers before posting a request or accepting a quotation.

---

## Acceptance Criteria

| ID      | Criteria                                                                                                                                                              | Status      |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **AC1** | Given registered workers exist in the system, when the seeker opens the "Browse Workers" page, then the system shall display a list of all available skilled workers. | Implemented |
| **AC2** | Given workers are displayed in the list, then each worker entry shall show the worker's name, primary skill, and service area.                                        | Implemented |
| **AC3** | Given no workers are registered in the system, when the seeker opens the Browse Workers page, then the system shall display a "No workers available" message.         | Implemented |

---

## Implementation Summary

### Architecture

```
[Frontend]                         [Backend]                         [Database]
BrowseWorkersPage.jsx  --HTTP-->  WorkerProfileController.java  --> PostgreSQL
  |                                  |                               (worker_profiles
  |-- profileService.js              |-- WorkerProfileService.java    + users tables)
  |     getAllProfiles()             |     getAllProfiles()
  |                                  |-- WorkerProfileRepository
  v                                  v     .findAll()
 Card Grid UI                     ApiResponse<List<WorkerProfileResponse>>
```

### Data Flow

1. User navigates to `/browse-workers`
2. `BrowseWorkersPage.jsx` calls `getAllProfiles()` from `profileService.js`
3. Frontend sends `GET /api/profiles` to backend
4. `WorkerProfileController.getAllProfiles()` calls `WorkerProfileService.getAllProfiles()`
5. Service fetches all `WorkerProfile` entities via `WorkerProfileRepository.findAll()`
6. Each entity is mapped to `WorkerProfileResponse` DTO (id, userId, fullName, bio, skills, district, serviceAreas, hourlyRate, availability)
7. Response wrapped in `ApiResponse` and returned as JSON
8. Frontend renders a card grid with worker details
9. Client-side filtering allows searching by skill/name and location

---

## Files Changed

### Backend (2 files modified)

#### 1. `WorkerProfileService.java`

**Path:** `backend/WedaLK/demo/src/main/java/lk/wedalk/profiles/service/WorkerProfileService.java`
**Change:** Added `getAllProfiles()` method

```java
public List<WorkerProfileResponse> getAllProfiles() {
    return workerProfileRepository.findAll()
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
}
```

- Fetches all worker profiles from the database
- Maps each `WorkerProfile` entity to `WorkerProfileResponse` DTO using the existing `mapToResponse()` helper
- Returns a list of DTOs

#### 2. `WorkerProfileController.java`

**Path:** `backend/WedaLK/demo/src/main/java/lk/wedalk/profiles/controller/WorkerProfileController.java`
**Change:** Added `GET /api/profiles` endpoint

```java
@GetMapping
public ResponseEntity<ApiResponse<List<WorkerProfileResponse>>> getAllProfiles() {
    List<WorkerProfileResponse> profiles = workerProfileService.getAllProfiles();
    return ResponseEntity.ok(ApiResponse.success(profiles, "Worker profiles retrieved successfully"));
}
```

- New `@GetMapping` on `/api/profiles` (no additional path)
- Wraps the response in `ApiResponse` for consistency with `ServiceRequestController` pattern
- Returns HTTP 200 with the list of all worker profiles

### Frontend (5 files — 2 created, 3 modified)

#### 3. `profileService.js` (Modified)

**Path:** `frontend/src/services/profileService.js`
**Change:** Added `getAllProfiles()` API function

```javascript
export const getAllProfiles = async () => {
  const response = await apiClient.get("/profiles");
  return response.data;
};
```

- Calls `GET /api/profiles` via the shared `apiClient` (Axios instance with baseURL `http://localhost:8081/api`)
- Returns the full response data (which contains `{ success, message, data: [...] }`)

#### 4. `BrowseWorkersPage.jsx` (Created)

**Path:** `frontend/src/pages/seeker/BrowseWorkersPage.jsx`
**Purpose:** Main page component for browsing workers

**Features:**

- **Worker Card Grid** — Displays all workers in a responsive grid layout
- **Each Card Shows:**
  - Avatar with first letter of name
  - Worker's full name (AC2)
  - Primary skill — first skill in the skills array (AC2)
  - Service area — district and service areas (AC2)
  - Bio excerpt (2-line clamp)
  - Skill tags (up to 4 displayed, "+N" for overflow)
  - Hourly rate
  - "View Profile" button linking to `/workers/:id`
- **Client-Side Filtering:**
  - Search input — filters by skill name or worker name
  - Location input — filters by district or service areas
  - Clear button to reset all filters
- **Loading State** — 6 skeleton cards with shimmer animation
- **Error State** — Error message with retry button
- **Empty State** — "No workers available" message (AC3), distinguishes between no workers at all vs. no filter matches
- **Results Count** — Shows number of workers found/available

#### 5. `BrowseWorkersPage.css` (Created)

**Path:** `frontend/src/pages/seeker/BrowseWorkersPage.css`
**Purpose:** Styles for the Browse Workers page

- Follows the **Ocean Theme** design system (consistent with `BrowseRequestsPage.css`)
- Uses `bw-` CSS class prefix to avoid naming conflicts with `br-` (Browse Requests)
- Responsive breakpoints:
  - Desktop: multi-column grid (`minmax(340px, 1fr)`)
  - Tablet (768px): single-column, stacked filters
  - Small phone (480px): reduced padding, smaller fonts
  - Extra small (360px): stacked footer, full-width button
- Card hover effects: elevation lift, top gradient border reveal
- Skeleton loading animation with shimmer effect

#### 6. `App.js` (Modified)

**Path:** `frontend/src/App.js`
**Change:** Added route and import for BrowseWorkersPage

```jsx
import BrowseWorkersPage from "./pages/seeker/BrowseWorkersPage";

// Inside Routes:
{
  /* SCRUM-71: Seeker - Browse Workers / Explore Service Providers */
}
<Route path="/browse-workers" element={<BrowseWorkersPage />} />;
```

#### 7. `Navbar.jsx` (Modified)

**Path:** `frontend/src/components/common/Navbar.jsx`
**Change:** Added "Browse Workers" navigation link in both desktop and mobile views

- **Desktop nav** (portal variant): Added `<NavLink to="/browse-workers">Browse Workers</NavLink>` between "Find Work" and "My Requests"
- **Mobile drawer** (portal variant): Added matching `<NavLink>` for the mobile navigation drawer

---

## API Reference

### `GET /api/profiles`

Retrieves all registered worker profiles.

**Request:**

```
GET http://localhost:8081/api/profiles
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Worker profiles retrieved successfully",
  "data": [
    {
      "id": 1,
      "userId": 5,
      "fullName": "Kamal Perera",
      "bio": "Experienced plumber with 10 years of service",
      "skills": ["Plumbing", "Pipe Fitting"],
      "district": "Colombo",
      "serviceAreas": ["Colombo", "Gampaha"],
      "hourlyRate": 1500.0,
      "availability": "Weekdays"
    },
    {
      "id": 2,
      "userId": 8,
      "fullName": "Nimal Silva",
      "bio": "Certified electrician",
      "skills": ["Electrical", "Wiring"],
      "district": "Kandy",
      "serviceAreas": ["Kandy", "Matale"],
      "hourlyRate": 1200.0,
      "availability": "Full-time"
    }
  ]
}
```

**Response (200 OK — Empty):**

```json
{
  "success": true,
  "message": "Worker profiles retrieved successfully",
  "data": []
}
```

---

## UI States

| State                  | Condition                                        | Display                                                           |
| ---------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| **Loading**            | API call in progress                             | 6 skeleton cards with shimmer animation                           |
| **Populated**          | Workers exist in database                        | Card grid with worker info, result count                          |
| **Empty (no workers)** | API returns empty array, no filters active       | "No workers available" message with person_off icon               |
| **Empty (no matches)** | API returns data but filters exclude all results | "No workers match your search criteria" with Clear Filters button |
| **Error**              | API call fails                                   | Error message with error_outline icon and "Try Again" button      |

---

## Navigation

| Location                | Link Text      | Path              | Visible When             |
| ----------------------- | -------------- | ----------------- | ------------------------ |
| Desktop Navbar (portal) | Browse Workers | `/browse-workers` | Always in portal variant |
| Mobile Drawer (portal)  | Browse Workers | `/browse-workers` | Always in portal variant |
| Worker Card             | View Profile   | `/workers/:id`    | On each worker card      |

---

## Testing Checklist

| #   | Test Case                                           | Expected Result                                                                             |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | Navigate to `/browse-workers` with workers in DB    | Grid of worker cards is displayed                                                           |
| 2   | Verify each card shows name, skill, service area    | Name (h3), primary skill (first skill with build icon), district (location_on icon) visible |
| 3   | Navigate to `/browse-workers` with no workers in DB | "No workers available" message displayed                                                    |
| 4   | Type in skill search input                          | Cards filter by skill name or worker name (client-side)                                     |
| 5   | Type in location filter input                       | Cards filter by district or service area (client-side)                                      |
| 6   | Click "Clear" button                                | All filters reset, full list displayed                                                      |
| 7   | Click a worker card                                 | Navigates to `/workers/:id` (Public Worker Profile Page)                                    |
| 8   | Click "Browse Workers" in desktop navbar            | Navigates to `/browse-workers`, link shows active state                                     |
| 9   | Click "Browse Workers" in mobile drawer             | Navigates to `/browse-workers`, drawer closes                                               |
| 10  | Test on tablet viewport (768px)                     | Single column layout, stacked filters                                                       |
| 11  | Test on mobile viewport (480px)                     | Compact cards, smaller fonts                                                                |
| 12  | Check browser console                               | No console errors or warnings                                                               |
| 13  | Simulate API failure                                | Error state with retry button displayed                                                     |
| 14  | Click "Try Again" on error state                    | API call retried                                                                            |

---

## Dependencies

- **Backend:** Spring Boot 3.2.2, Spring Data JPA, PostgreSQL
- **Frontend:** React 18, React Router DOM, Axios
- **Existing Components Used:**
  - `ApiResponse.java` — Generic API response wrapper
  - `WorkerProfileResponse.java` — DTO for worker profile data
  - `WorkerProfileRepository.java` — JPA repository (`findAll()` inherited)
  - `apiClient.js` — Axios instance configured with base URL
  - `MainLayout.jsx` — Layout wrapper with Navbar
  - `PublicWorkerProfilePage.jsx` — Links to this existing page from worker cards

---

## Business Value

Expands seeker access to the worker pool, enabling proactive discovery of service providers beyond passive quotation waiting. This is the foundation of the **Worker Discovery** epic and directly supports the platform's goal of connecting seekers with skilled workers.
