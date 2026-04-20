# Job Lifecycle Flow — Gap Fixes

**Status:** Completed  
**Date:** 2026-04-21  
**Covers:** Worker-driven completion model, My Jobs data fix, full payment gate status chain

---

## What Changed and Why

An audit of the full job lifecycle revealed three categories of gaps vs the intended flow:
1. Payment gate statuses (SCRUM-105/106/107) not fully wired on this branch
2. Worker unable to mark jobs as done (seeker was incorrectly doing this)
3. My Jobs page missing data (budget, location, phone were blank)

---

## New Status Lifecycle

```
PENDING_PAYMENT → PAYMENT_UNDER_REVIEW → OPEN → ASSIGNED → WORKER_COMPLETED → COMPLETED
                                                                              → NOT_COMPLETED (dispute)
```

---

## Backend Changes

### `RequestStatus.java`
Complete rewrite. Added: `PENDING_PAYMENT`, `PAYMENT_UNDER_REVIEW`, `WORKER_COMPLETED`. Removed: `IN_PROGRESS` (was in enum but never used by any service method).

### `ServiceRequest.java`
- Added `paymentSlipPath` (varchar 500)
- Added `paymentRejectionNote` (varchar 1000)
- Increased `status` column length from 20 → 25 (to fit `PAYMENT_UNDER_REVIEW`)
- Default `@PrePersist` status: `OPEN` → `PENDING_PAYMENT`

### `WorkerAssignedJobResponse.java`
Added: `seekerPhone`, `locationArea`, `budget` — these were referenced in `MyJobsPage` but missing from the API response, causing blank cards.

### `ServiceRequestService.java`
Full rewrite. Key changes:
- `createRequest()` → sets `PENDING_PAYMENT` (not `OPEN`)
- Added full payment slip methods: `uploadRequestPaymentSlip`, `approvePaymentSlip`, `rejectPaymentSlip`, `getPendingPaymentSlips`, `getRequestPaymentSlipFile`
- **New:** `workerMarkJobDone(requestId, workerId)` — validates worker is the assigned worker, transitions `ASSIGNED → WORKER_COMPLETED`
- **Changed:** `updateRequestStatus()` — seeker can now only confirm from `WORKER_COMPLETED → COMPLETED` (removed seeker-driven completion from `ASSIGNED`)
- `mapToWorkerAssignedJobResponse()` — now populates `seekerPhone`, `locationArea`, `budget`
- `mapToResponse()` — now populates `paymentSlipUploaded`, `paymentRejectionNote`

### `ServiceRequestController.java`
Added: `PATCH /api/requests/{requestId}/worker-complete` — WORKER only

### `SecurityConfig.java`
Added rules for all new endpoints:
- `POST /api/requests/*/payment-slip` → SEEKER
- `PATCH /api/requests/*/worker-complete` → WORKER
- `POST /api/profiles/*/payment-slip` → WORKER
- Admin payment review endpoints → ADMIN
- `GET /api/requests/*/payment-slip/view` → ADMIN

### `DisputeService.java`
Updated status validation: disputes can now be raised from `ASSIGNED`, `WORKER_COMPLETED`, or `NOT_COMPLETED` (previously only `ASSIGNED` / `NOT_COMPLETED`).

---

## Frontend Changes

### `requestService.js`
- Removed unused `getUser` import
- `updateRequestStatus()` — simplified (no longer sends redundant seekerId param)
- **New:** `workerMarkJobDone(requestId)` → `PATCH /requests/{requestId}/worker-complete`
- Payment admin helpers: `getAdminPendingPaymentSlips`, `adminApprovePaymentSlip`, `adminRejectPaymentSlip`, `getAdminPaymentSlipBlob`, `uploadRequestPaymentSlip`

### `MyJobsPage.jsx`
- Now shows seeker phone, location, and budget on every job card (data was there in API, just not in DTO before)
- New **"Mark as Done"** button on `ASSIGNED` jobs with confirmation dialog
- New `WORKER_COMPLETED` card shows "Waiting for seeker to confirm" banner
- Updated status labels for all new statuses

### `WorkerRequestDetailsPage.jsx`
- Fixed status pill to use proper labels (`getStatusLabel` / `getStatusTone`)
- Aside action panel is now context-aware:
  - `OPEN` → Send Quote
  - `ASSIGNED` (and you are the assigned worker) → Mark as Done
  - `WORKER_COMPLETED` → "Awaiting seeker confirmation" info panel
  - `COMPLETED` → "Completed" success panel

### `RequestDetailsPage.jsx` (seeker side)
- **Removed** seeker "Mark as Completed" button from `ASSIGNED` status
- `WORKER_COMPLETED` now shows a prominent amber banner: *"Worker has marked this job as done"* with two actions: **"Confirm Job Complete"** and **"Raise a Dispute"**
- `canRaiseDispute` now includes `ASSIGNED` and `WORKER_COMPLETED` (seeker can dispute while job is active too)
- Status descriptions updated for accuracy

### `MyRequestsPage.jsx`
- All new status labels: Awaiting Payment, Under Review, Confirm Completion
- `WORKER_COMPLETED` → "Confirm Completion" action label
- `PENDING_PAYMENT`, `PAYMENT_UNDER_REVIEW`, `WORKER_COMPLETED` counted as active in summary stats

---

## Complete Flow (end-to-end)

| Step | Actor | Action | Status |
|------|-------|--------|--------|
| 1 | SEEKER | Post request | `PENDING_PAYMENT` |
| 2 | SEEKER | Upload bank slip | `PAYMENT_UNDER_REVIEW` |
| 3 | ADMIN | Approve payment | `OPEN` |
| 4 | WORKER | Browse & submit quote | — |
| 5 | SEEKER | Accept a quote | `ASSIGNED` |
| 6 | WORKER | Do the job, receive cash, click Mark as Done | `WORKER_COMPLETED` |
| 7 | SEEKER | Sees "Worker marked done" prompt | — |
| 7a | SEEKER | Clicks "Confirm Job Complete" | `COMPLETED` |
| 7b | SEEKER | Clicks "Raise a Dispute" | `NOT_COMPLETED` + dispute |
| 8 | ADMIN | Reviews dispute, issues resolution | dispute `RESOLVED` |
