# SCRUM-13: Seeker Service Request — Title Field Implementation

## Overview

This document describes the full-stack implementation of the **title/subject field** for the **"Seeker wants to post a service request with description and category so that skilled workers can respond"** user story.

The title gives each service request a short heading, making it easier for workers and seekers to scan and identify requests in list views without reading the full description.

> **Note**: Photo upload was considered for this sprint but deferred to a future sprint to keep scope focused on the core user story.

---

## Table of Contents

- [Architecture Decisions](#architecture-decisions)
- [Backend Changes](#backend-changes)
- [Database Migration](#database-migration)
- [Frontend Changes](#frontend-changes)
- [API Endpoints](#api-endpoints)
- [Files Changed](#files-changed)

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Title placement | Step 1 of the wizard (alongside category & location) | Most natural position — users name what they need before describing it |
| Title validation | Required, max 150 characters | Ensures meaningful headings without excessive length |
| Currency prefix | Rs. | Sri Lankan Rupee, matching the application's locale |
| Title fallback | `request.title \|\| formatCategory(request.category)` | Backward compatibility with existing requests that don't have titles |

---

## Backend Changes

### Model Layer

#### `ServiceRequest.java`

**Path**: `backend/.../requests/model/ServiceRequest.java`

- Added `title` field: `@Column(length = 150) private String title;`

#### `RequestImage.java`

**Path**: `backend/.../requests/model/RequestImage.java`

- Remains a stub placeholder for future photo upload implementation

### DTO Layer

#### `RequestCreateRequest.java`

**Path**: `backend/.../requests/dto/RequestCreateRequest.java`

- Added `@NotBlank @Size(max = 150) private String title;`
- Enforces that every new request must include a title, validated at the controller level via `@Valid`

#### `RequestResponse.java`

**Path**: `backend/.../requests/dto/RequestResponse.java`

- Added `private String title;`

### Service Layer

#### `ServiceRequestService.java`

**Path**: `backend/.../requests/service/ServiceRequestService.java`

**Modified methods:**

- `createRequest()` — now sets `title` from the request DTO
- `updateRequest()` — now updates `title`
- `mapToResponse()` — now includes `title` in the response mapping

### Controller Layer

#### `ServiceRequestController.java`

**Path**: `backend/.../requests/controller/ServiceRequestController.java`

- No new endpoints added. Existing CRUD endpoints now handle the `title` field through the updated DTOs.

### Configuration

#### `CorsConfig.java`

**Path**: `backend/.../config/CorsConfig.java`

- CORS enabled for `/api/**` allowing React frontend (port 3000) to communicate with the backend (port 8081)

---

## Database Migration

#### `V1__init.sql`

**Path**: `backend/.../resources/db/migration/V1__init.sql`

**Changes to `service_requests` table:**

- Added `title VARCHAR(150)` column
- Added `budget DECIMAL(12, 2)` column (was missing from the original migration but worked due to `ddl-auto=update`)

**Updated seed data:**

- Added `title` column to the sample service request INSERT

> **Note**: Since `spring.jpa.hibernate.ddl-auto=update` is enabled and Flyway is disabled, Hibernate auto-creates these columns at startup. The migration file serves as documentation and for fresh database setups.

---

## Frontend Changes

### Create Request Page

#### `CreateRequestPage.jsx`

**Path**: `frontend/src/pages/seeker/CreateRequestPage.jsx`

**Step 1 changes (Title input):**

- Added a text input with pencil icon, character counter (x / 150), and validation
- Title is required and validated in `validateStep(1)`
- Placeholder: "E.g., Fix leaking kitchen tap"

**Step 3 changes (Review):**

- New "Title" review card at the top with edit button

**Submit flow:**

- `createRequest(payload)` and `updateRequest(id, payload)` now include `title` in the payload

### Request Details Page

#### `RequestDetailsPage.jsx`

**Path**: `frontend/src/pages/seeker/RequestDetailsPage.jsx`

- Title displayed as the main heading (`<h1>`) with category shown below as a subtitle
- Falls back to category name if title is not available

### My Requests Page

#### `MyRequestsPage.jsx`

**Path**: `frontend/src/pages/seeker/MyRequestsPage.jsx`

- Card heading now displays `request.title` when available, falling back to `formatCategory(request.category)` if title is null/empty
- Ensures backward compatibility with existing requests that don't have titles

### CSS Styles

#### `CreateRequestPage.css`

**Path**: `frontend/src/pages/seeker/CreateRequestPage.css`

**Title Input styles:**

- `.title-input-wrapper` — flex container with icon, matching the existing location input style
- Focus state with teal border and shadow
- Error state via `:has()` selector

---

## API Endpoints

### Modified

| Method | Endpoint | Change |
|--------|----------|--------|
| `POST` | `/api/requests` | Now accepts `title` in request body |
| `PUT` | `/api/requests/{id}` | Now accepts `title` in request body |
| `GET` | `/api/requests/{id}` | Response now includes `title` |
| `GET` | `/api/requests/open` | Response now includes `title` |
| `GET` | `/api/requests/my` | Response now includes `title` |

### Request Body Example

```json
{
  "title": "Fix leaking kitchen tap",
  "category": "PLUMBING",
  "locationArea": "Colombo 03",
  "description": "Kitchen tap is leaking heavily. Need urgent repair.",
  "urgency": "HIGH",
  "budget": 5000
}
```

---

## Files Changed

### Modified Files (8)

| File | Changes |
|------|---------|
| `backend/.../model/ServiceRequest.java` | Added `title` field |
| `backend/.../dto/RequestCreateRequest.java` | Added `title` validation |
| `backend/.../dto/RequestResponse.java` | Added `title` field |
| `backend/.../service/ServiceRequestService.java` | Title in create/update/map methods |
| `backend/.../resources/db/migration/V1__init.sql` | Added title and budget columns |
| `frontend/src/pages/seeker/CreateRequestPage.jsx` | Added title input in Step 1 |
| `frontend/src/pages/seeker/CreateRequestPage.css` | Added title input styles |
| `frontend/src/pages/seeker/MyRequestsPage.jsx` | Display title in card heading |

---

_Document generated for SCRUM-13 branch — February 2026_
