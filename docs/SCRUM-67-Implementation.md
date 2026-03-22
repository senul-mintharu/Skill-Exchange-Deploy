# SCRUM-67: Seeker Accept Quotation — Implementation

## Overview

This document describes the implementation of **SCRUM-67**:

**User Story:** As a Service Seeker, I want to accept one quotation from received quotations, so that I can assign the most suitable worker to my request.

Scope for SCRUM-67:

- Seeker can accept one quotation from the compare list
- Accepted quotation status becomes `ACCEPTED`
- All other quotations for the same request become `NOT_ACCEPTED`
- Service request is updated to `ASSIGNED`
- Accepted quote's worker is assigned to the service request
- User is prompted with a confirmation modal before the acceptance action

Out of scope:

- Changes to SCRUM-65 quotation viewing/comparison behavior

---

## Acceptance Criteria Coverage (Gherkin)

### AC1 — Accept quotation

**Given** a seeker is viewing quotations  
**When** they click **Accept** and confirm  
**Then** the selected quotation is marked as `ACCEPTED`  
**And** the selected worker is assigned to the request

Implemented by:

- Frontend action button + confirmation modal on `CompareQuotesPage.jsx`
- Backend endpoint: `POST /api/quotes/{quoteId}/accept?seekerId=...`
- Backend service: `QuotationService.acceptQuote(...)` sets selected quote to `ACCEPTED` and assigns worker to request

### AC2 — Update request status

**Given** a quotation is accepted  
**Then** request status is updated to `ASSIGNED`

Implemented by:

- `QuotationService.acceptQuote(...)` updates `ServiceRequest.status = ASSIGNED`

### AC3 — Close other quotations

**Given** one quotation is accepted  
**Then** all other quotations become `NOT_ACCEPTED`

Implemented by:

- `QuotationService.acceptQuote(...)` iterates all quotes in the same request and sets non-selected ones to `NOT_ACCEPTED`

### AC4 — Confirmation dialog

**Given** user clicks **Accept**  
**Then** a confirmation modal is shown before proceeding

Implemented by:

- Compare page modal with **Cancel** and **Confirm Accept** actions
- API call is executed only after confirmation

---

## Backend

### New endpoint

| Method | Endpoint                       | Purpose                                                              |
| ------ | ------------------------------ | -------------------------------------------------------------------- |
| `POST` | `/api/quotes/{quoteId}/accept` | Accept a quote, close others, assign worker, set request as assigned |

Compatibility note:

- Existing `PATCH /api/quotes/{quoteId}/accept` remains available to avoid breaking older callers.

### Service logic

`QuotationService.acceptQuote(quoteId, seekerId)` now enforces:

- Request ownership validation: only the seeker who owns the request can accept
- Request state validation: only `OPEN` requests can be decided
- Quote state validation: only `PENDING` quote can be accepted
- Atomic update (single transaction):
  - Selected quote -> `ACCEPTED`
  - Other quotes on same request -> `NOT_ACCEPTED`
  - Request `assignedWorker` -> selected quote worker
  - Request status -> `ASSIGNED`

### Repository updates

- No repository interface changes required.
- Existing `findByRequestIdOrderByPriceAsc(...)` is reused for bulk status updates.

---

## Frontend Changes

### Updated Compare Quotations page

`frontend/src/pages/seeker/CompareQuotesPage.jsx`

- Added **Status** and **Action** columns to each quotation row
- Added **Accept** button per quotation
- Added confirmation modal before accepting
- Calls `acceptQuote(quoteId)` API only after confirmation
- Reloads quotations after successful acceptance to reflect final statuses
- Disables button when quotation is already `ACCEPTED` or request is in progress
- Preserves existing sorting, loading, error, and empty-state behavior from SCRUM-65

### API service update

`frontend/src/services/quoteService.js`

- `acceptQuote(...)` now uses `POST /quotes/{quoteId}/accept`

### Styling update

`frontend/src/pages/seeker/CompareQuotesPage.css`

- Added scoped styles for status pills, accept button, and confirmation modal

### Related compatibility update

`frontend/src/pages/worker/MyQuotationsPage.jsx`

- Added `NOT_ACCEPTED` status mapping so workers see a proper rejected-style badge/count after seeker acceptance flow

---

## Files Updated

### Backend

- `backend/WedaLK/demo/src/main/java/lk/wedalk/common/enums/QuoteStatus.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/quotes/controller/QuotationController.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/quotes/service/QuotationService.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/requests/model/ServiceRequest.java`

### Frontend

- `frontend/src/pages/seeker/CompareQuotesPage.jsx`
- `frontend/src/pages/seeker/CompareQuotesPage.css`
- `frontend/src/services/quoteService.js`
- `frontend/src/pages/worker/MyQuotationsPage.jsx`

### Documentation

- `docs/SCRUM-67-Implementation.md`

---

## Database Changes

Because Hibernate is configured with `ddl-auto=update`, schema updates are automatic on backend startup.

Expected DB impact:

- `service_requests` table: new nullable FK column `assigned_worker_id` (to users table)
- `quotations.status`: new enum/string value in use: `NOT_ACCEPTED`

No manual migration script was required in this implementation.

---

## Manual Test Cases (aligned with AC1-AC4)

### AC1 — Accept quotation

1. Create a request as seeker.
2. Submit at least two quotations from different workers.
3. Open `My Requests` -> request details -> `View Quotations`.
4. Click **Accept** for one quote and confirm.
5. Verify selected quote status is `ACCEPTED`.
6. Verify request has `assignedWorker` set to selected worker in DB/response checks.

### AC2 — Request status becomes ASSIGNED

1. Complete AC1 flow.
2. Fetch request details (`GET /api/requests/{id}` or DB check).
3. Verify `status = ASSIGNED`.

### AC3 — Other quotations become NOT_ACCEPTED

1. Complete AC1 flow where multiple quotes exist.
2. Reload compare page.
3. Verify all non-selected quotes show `NOT ACCEPTED` status.

### AC4 — Confirmation modal appears

1. On compare page, click **Accept** on any pending quote.
2. Verify confirmation modal appears.
3. Click **Cancel** and verify no status changes occur.
4. Click **Confirm Accept** and verify action proceeds.
