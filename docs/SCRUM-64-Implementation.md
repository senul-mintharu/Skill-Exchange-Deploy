# SCRUM-64: Worker View & Withdraw Quotations — Implementation

## Overview

This document describes the implementation of the **"As a Skilled Worker, I want to view and manage my submitted quotations"** story (SCRUM-64).

Scope for SCRUM-64:
- **View** all quotations submitted by the worker (request title, price, ETA, status)
- **Withdraw** a quotation **only if** it is still **PENDING**

Out of scope:
- Acceptance/assignment actions (remain with the seeker)

---

## Acceptance Criteria Coverage (Gherkin)

### AC1 — View submitted quotations
**Given** a worker has submitted one or more quotations  
**When** the worker opens the **My Quotations** page  
**Then** the system displays all their quotations  
**And** each shows request title, price, ETA, and status  

Implemented by:
- Backend: `GET /api/quotes/my?workerId=...`
- Frontend: `MyQuotationsPage.jsx` renders a responsive list of quote cards

### AC2 — Empty state
**Given** the worker has not submitted any quotations  
**When** the worker opens **My Quotations**  
**Then** the system shows **"No quotations submitted yet"**

Implemented by:
- Frontend empty-state card when the API returns an empty array

### AC3 — Withdraw a quotation
**Given** a worker views a quotation with status **PENDING**  
**When** the worker clicks **Withdraw**  
**Then** the system cancels the quotation  
**And** confirms with a success message

Implemented by:
- Backend: `DELETE /api/quotes/{quoteId}?workerId=...` sets status to `WITHDRAWN`
- Frontend: calls `withdrawQuote()` and shows success banner, updating the list in-place

### AC4 — Cannot withdraw accepted quotation
**Given** a quotation has already been accepted  
**When** the worker attempts to withdraw it  
**Then** the system prevents the action  
**And** displays a restriction message

Implemented by:
- Frontend: clicking **Withdraw** on non-`PENDING` shows a restriction banner and does not call the API
- Backend: also enforces the rule and returns `400` if a non-`PENDING` withdrawal is attempted (defense-in-depth)

---

## Backend

### Existing Endpoints Used (already present)

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| `GET` | `/api/quotes/my?workerId=2` | List worker’s submitted quotations (newest first) |
| `DELETE` | `/api/quotes/{quoteId}?workerId=2` | Withdraw a quote (only if `PENDING`) |

### Business Rules (Service Layer)
`QuotationService.withdrawQuote(quoteId, workerId)` enforces:
- Worker can only withdraw **their own** quotation
- Only `PENDING` quotations can be withdrawn
- Withdrawal is implemented by setting status to `WITHDRAWN` (record remains for audit/history)

---

## Frontend

### New Page
**`src/pages/worker/MyQuotationsPage.jsx`**
- Fetches quotations via `quoteService.getMyQuotes()`
- Shows:
  - Request title
  - Price (LKR)
  - ETA (days)
  - Status badge
- Withdraw UX:
  - For `PENDING` quotes: calls `quoteService.withdrawQuote()` and updates the card status
  - For non-`PENDING` quotes: prevents the action and shows a restriction banner
- Empty state:
  - Displays **"No quotations submitted yet"** with a CTA to **Find Work**

### Styling
**`src/pages/worker/MyQuotationsPage.css`**
- Uses `mq-` prefixed classes to avoid style leakage
- Responsive layout (2-column cards on desktop, 1-column on smaller widths)

### Routing + Navigation
- `src/App.js`: added route `"/my-quotations"` → `MyQuotationsPage`
- `src/components/common/Navbar.jsx`: added **My Quotations** link (desktop + mobile drawer)
- `src/components/common/Breadcrumb.jsx`: added label for `my-quotations`

### Test Fix (kept suite green)
**`src/App.test.js`**: updated the `react-router-dom` mock to include `useLocation` and `NavLink` so the app renders in tests without crashing.

---

## Files Added / Updated

### Frontend
- `frontend/src/pages/worker/MyQuotationsPage.jsx` (new)
- `frontend/src/pages/worker/MyQuotationsPage.css` (new)
- `frontend/src/App.js` (route wiring)
- `frontend/src/components/common/Navbar.jsx` (nav link)
- `frontend/src/components/common/Breadcrumb.jsx` (breadcrumb label)
- `frontend/src/App.test.js` (router mock fix)

---

## Manual Test Cases (aligned with ACs)

### AC1 — View list
1. Submit 1+ quotations from a request details page (`/requests/:id/quote`).
2. Open `"/my-quotations"`.
3. Confirm each entry shows **request title**, **price**, **ETA**, **status**.

### AC2 — Empty state
1. Ensure the worker has no quotes (fresh DB / different workerId).
2. Open `"/my-quotations"`.
3. Confirm message **"No quotations submitted yet"** is displayed.

### AC3 — Withdraw pending
1. Ensure a quote is in **PENDING** status.
2. Click **Withdraw**.
3. Confirm:
   - Success banner is shown
   - Quote status updates to **WITHDRAWN**
   - Backend record reflects `WITHDRAWN`

### AC4 — Cannot withdraw accepted
1. Ensure a quote is **ACCEPTED** (seeker accepted it).
2. Open `"/my-quotations"` and click **Withdraw** on that quote.
3. Confirm:
   - Action is prevented
   - Restriction banner is shown

