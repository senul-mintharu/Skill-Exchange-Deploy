# SCRUM-65: Seeker View & Compare Quotations — Implementation

## Overview

This document describes the implementation of **SCRUM-65**:

**User Story:** As a Service Seeker, I want to view and compare all quotations for my service request, so that I can compare available offers.

Scope for SCRUM-65:
- Display all quotations submitted for a **specific** service request
- Show comparison fields: **worker name**, **price**, **ETA**
- Handle empty state: **"No quotations received yet"**
- Allow navigation to the worker’s **public profile**

Out of scope:
- Quote acceptance/assignment (handled in **SCRUM-67**)

---

## Acceptance Criteria Coverage (Gherkin)

### AC1 — View quotations for a request
**Given** a seeker has an open request with submitted quotations  
**When** the seeker navigates to the quotations view for that request  
**Then** the system displays all submitted quotations for that request  

Implemented by:
- Frontend page: `CompareQuotesPage.jsx` at `"/my-requests/:requestId/quotations"`
- Backend endpoint used: `GET /api/quotes/request/{requestId}`

### AC2 — Show comparison details
**Given** quotations are displayed  
**Then** each quotation shows worker name, quoted price, and ETA  

Implemented by:
- Table columns: Worker, Price, ETA
- Default ordering: **lowest price first**, then **fastest ETA**

### AC3 — Empty state
**Given** no workers have submitted quotations yet  
**When** the seeker views the quotations page  
**Then** the system displays **"No quotations received yet"**  

Implemented by:
- Empty-state card when the API returns an empty array

### AC4 — Navigate to worker profile
**Given** a quotation is displayed  
**When** the seeker clicks the worker’s name  
**Then** the system navigates to the worker’s public profile page  

Implemented by:
- Worker name links to `"/workers/:id"` (existing public profile route)

---

## Backend

### Endpoint used

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| `GET` | `/api/quotes/request/{requestId}` | Returns all quotes for a request (price ascending from backend) |

Notes:
- SCRUM-65 is read-only; no backend changes were required for acceptance/assignment actions.

---

## Frontend

### New/Completed Page
**`frontend/src/pages/seeker/CompareQuotesPage.jsx`**
- Fetches quotations via `quoteService.getQuotesByRequest(requestId)`
- Displays a clean comparison table (mobile responsive)
- Shows the required empty state text
- Links worker names to the public worker profile page

**Styling:** `frontend/src/pages/seeker/CompareQuotesPage.css`

### Navigation entry point
**`frontend/src/pages/seeker/RequestDetailsPage.jsx`**
- Added a **View Quotations** button in the seeker quotes section that navigates to:
  - `"/my-requests/:requestId/quotations"`

### Routing
**`frontend/src/App.js`**
- Added route:
  - `"/my-requests/:requestId/quotations"` → `CompareQuotesPage`

### Breadcrumb label
**`frontend/src/components/common/Breadcrumb.jsx`**
- Added label for `quotations`

---

## Files Added / Updated

### Frontend
- `frontend/src/pages/seeker/CompareQuotesPage.jsx` (implemented)
- `frontend/src/pages/seeker/CompareQuotesPage.css` (new)
- `frontend/src/pages/seeker/RequestDetailsPage.jsx` (navigation button)
- `frontend/src/App.js` (route wiring)
- `frontend/src/components/common/Breadcrumb.jsx` (label)

---

## Manual Test Cases (aligned with ACs)

### AC1 + AC2 — View and compare
1. Ensure a request has at least one quote submitted.
2. Navigate to `My Requests` → open a request → click **View Quotations**.
3. Confirm each row shows **worker name**, **price**, **ETA**.

### AC3 — Empty state
1. Use a request with no quotations.
2. Open `"/my-requests/:id/quotations"`.
3. Confirm the message **"No quotations received yet"** is shown.

### AC4 — Worker profile navigation
1. On the quotations page, click the worker name.
2. Confirm it navigates to the public profile route: `"/workers/:workerId"`.

