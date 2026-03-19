# SCRUM-63: Worker Submit Quotation — Implementation

## Overview

This document describes the full-stack implementation of the **"As a Skilled Worker, I want to submit a quotation with price and ETA"** user story (SCRUM-63).

The implementation enables workers to bid on open service requests with a specific price, estimated time of arrival (ETA), and an optional proposal message. It includes robust backend validation, duplicate prevention, and a polished frontend experience with real-time feedback and success confirmation.

---

## Table of Contents

- [User Story & Acceptance Criteria](#user-story--acceptance-criteria)
- [Architecture Decisions](#architecture-decisions)
- [Database Changes](#database-changes)
- [Backend Changes](#backend-changes)
- [Frontend Changes](#frontend-changes)
- [API Endpoints](#api-endpoints)
- [Files Changed](#files-changed)
- [Verification](#verification)

---

## User Story & Acceptance Criteria

**User Story:** As a Skilled Worker, I want to submit a quotation with price and ETA, so that the seeker can evaluate my offer.

### Task 1 — Backend: Quotation Module
| Acceptance Criteria | Status |
| ------------------- | ------ |
| Valid quote submission | Done — `POST /api/quotes` creates a `Quotation` linked to a request & worker |
| One quote per request | Done — Unique constraint on `(request_id, worker_id)` and service-layer check |
| Request must be OPEN | Done — Service rejects quotes if request status is not `OPEN` |
| Field validation | Done — `@Valid` on DTO ensures price > 0 and ETA >= 1 day |

### Task 2 — Frontend: Quotation Form UI
| Acceptance Criteria | Status |
| ------------------- | ------ |
| Access from details page | Done — "Send Quote" button on `WorkerRequestDetailsPage` navigates to `/requests/:id/quote` |
| Form with price & ETA | Done — `SubmitQuotePage` with inline validation and character counter |
| Success confirmation | Done — Modern success card with quote summary and navigation actions |
| Handle duplicates | Done — Informative blue banner shown if a quote was already submitted |

---

## Architecture Decisions

| Decision | Choice | Rationale |
| -------- | ------ | --------- |
| **V2 Migration** | `V2__add_quotations.sql` | First formal schema update for Sprint 2; ensures consistency across dev environments. |
| **Unique Constraint** | `uq_quotation_request_worker` | Hard-enforcement in DB prevents race conditions where a worker might double-click submit. |
| **Quote Statuses** | `PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN` | Pre-wired all states needed for the entire sprint (Story 1, 2, and 3) in a single Enum. |
| **Validation Handler** | `MethodArgumentNotValidException` | Added to `GlobalExceptionHandler` to return a clean JSON message instead of a raw 400 error. |
| **CSS Prefix** | `sq-` (Submit Quote) | Follows the established project pattern (`rd-`, `br-`, `wrd-`) to avoid style leaking. |
| **HCI Feedback** | Loading Spinner + Disabling UI | Prevents duplicate requests and gives clear feedback during the API round-trip. |

---

## Database Changes

### New Table: `quotations`
**Migration:** `V2__add_quotations.sql`

```sql
CREATE TABLE quotations (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    worker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    price DECIMAL(12, 2) NOT NULL,
    estimated_days INTEGER NOT NULL,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_quotation_request_worker UNIQUE (request_id, worker_id)
);
```

---

## Backend Changes

### Domain Model & DTOs
- **`Quotation.java`**: New JPA entity with many-to-one relationships to `ServiceRequest` and `User`.
- **`QuoteStatus.java`**: Enum defining the lifecycle of a quotation.
- **`QuoteCreateRequest.java`**: DTO with `@NotNull` and `@Positive` annotations for backend validation.
- **`QuoteResponse.java`**: Consolidated response DTO used by both seeker and worker views.

### Service Layer (`QuotationService.java`)
Implemented `createQuote()` with four-stage validation:
1. Verify request exists.
2. Verify request is `OPEN`.
3. Verify worker exists.
4. Verify no existing quote from this worker for this request (Duplicate Prevention).

### Global Exception Handling
Updated `GlobalExceptionHandler.java` to handle `@Valid` failures:
```java
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
    String message = ex.getBindingResult().getFieldErrors().get(0).getDefaultMessage();
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(message));
}
```

---

## Frontend Changes

### `quoteService.js`
Centralized service for quote-related API calls. Uses `apiClient` to communicate with the backend.

### `SubmitQuotePage.jsx`
- **Request Summary**: Fetches request details on load to show context to the worker.
- **Form States**: Manages loading, errors, and submission status.
- **Success View**: Replaces form with a confirmation card once the API returns 201.

### Navigation Fixes
- Added `/requests/:requestId/quote` route to `App.js`.
- **Bug Fix**: Fixed the "Find Work" button on the `LandingPage.jsx` hero section which was incorrectly pointing to `/create-profile` instead of `/browse-requests`.

---

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/api/quotes` | Submit a new quotation |
| `GET` | `/api/quotes/my` | Worker views their own quotes (Pre-wired for Story 2) |
| `GET` | `/api/quotes/request/{id}` | Seeker views all quotes for a request (Pre-wired for Story 3) |
| `DELETE` | `/api/quotes/{id}` | Worker withdraws a quote (Pre-wired for Story 2) |

---

## Files Changed

### Backend
- `.../common/enums/QuoteStatus.java`
- `.../common/GlobalExceptionHandler.java`
- `.../quotes/model/Quotation.java`
- `.../quotes/dto/QuoteCreateRequest.java`
- `.../quotes/dto/QuoteResponse.java`
- `.../quotes/repository/QuotationRepository.java`
- `.../quotes/service/QuotationService.java`
- `.../quotes/controller/QuotationController.java`
- `.../db/migration/V2__add_quotations.sql`
- `.../users/model/User.java` (fixed property name mismatch)
- `.../requests/service/ServiceRequestService.java` (fixed getter call)

### Frontend
- `src/services/quoteService.js`
- `src/pages/worker/SubmitQuotePage.jsx`
- `src/pages/worker/SubmitQuotePage.css`
- `src/pages/public/LandingPage.jsx` (Link fix)
- `src/App.js` (Route wiring)

---

## Verification

### Automated Verification
Run the backend and check logs for successful Flyway migration of `V2__add_quotations.sql`.

### Manual Testing (UI)
1. **Access**: Navigate to **Browse Requests** → **View Details** → **Send Quote**.
2. **Validation**: Click submit with empty fields; check for red error messages.
3. **Success**: Fill valid data and submit; verify the Success Card appears.
4. **Duplicate**: Navigate back and try to quote again; verify the "Already Submitted" banner.
