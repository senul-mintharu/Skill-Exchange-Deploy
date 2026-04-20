# SCRUM-107 — Admin Review and Approve / Reject Payment Proofs

**Status:** Completed  
**Date:** 2026-04-21

## User Story

As an Administrator, I want to review and approve or reject payment proofs, so that only paid requests are published.

## Acceptance Criteria

- [x] **AC1 — View Pending Proofs:** Admin can see all requests with `PAYMENT_UNDER_REVIEW` status in a clean queue page, with seeker name, request title, category, location, budget, and submission time.
- [x] **AC2 — Approve Valid Proofs:** Admin can open the actual slip file in a new tab and click Approve — request transitions to `OPEN` and is immediately visible to workers.
- [x] **AC3 — Reject Invalid Proofs:** Admin clicks Reject, enters a mandatory reason, and confirms — request returns to `PENDING_PAYMENT`, slip is cleared, and the seeker sees the rejection reason on their request details page.

## Definition of Done

- [x] Code implemented
- [x] Role-based access enforced (ADMIN only for all review endpoints)
- [x] API tested
- [x] Frontend integrated

## Backend Changes

**Files modified:**
- `requests/model/ServiceRequest.java` — added `paymentRejectionNote` field (length 1000)
- `requests/dto/RequestResponse.java` — added `paymentRejectionNote` String field
- `requests/service/ServiceRequestService.java`:
  - `rejectPaymentSlip()` — now accepts `String reason`; stores it in `paymentRejectionNote`, clears slip path
  - `mapToResponse()` — now includes `paymentRejectionNote` in response
  - Added `getRequestPaymentSlipFile(requestId)` — resolves the stored slip path, validates file exists/readable, returns `StoredSlipFile` record with path, filename, and content type
  - Added `StoredSlipFile` inner record
- `payment/PaymentController.java`:
  - `rejectPaymentSlip()` — reads `reason` from request body and passes to service
  - Added `GET /api/requests/{requestId}/payment-slip/view` — streams the actual file as a typed `Resource` response (inline disposition so browser opens it directly)
- `config/SecurityConfig.java` — added `ADMIN` rule for `GET /api/requests/*/payment-slip/view`

**Endpoints added:**
- `GET /api/requests/{requestId}/payment-slip/view` — ADMIN only; streams slip file (image or PDF) directly to browser

## Frontend Changes

**Files modified:**
- `services/requestService.js`:
  - `adminRejectPaymentSlip(requestId, reason)` — now sends `{ reason }` in body
  - Added `getAdminPaymentSlipBlob(requestId)` — fetches slip as Blob for `URL.createObjectURL()` (same pattern as `verificationService.getSubmissionDocumentBlob`)
- `pages/admin/AdminPaymentSlipsPage.jsx` — fully rewritten to match `VerificationReviewPage` quality:
  - `SectionCard` + `PageIntro` layout matching the rest of admin pages
  - Per-card: seeker name, phone, location, budget, submission timestamp, slip-uploaded badge
  - **"View Slip"** button — opens real file in a new tab via blob URL
  - **"Approve"** button — one-click, removes from queue on success
  - **"Reject"** button → inline reject panel with mandatory reason textarea + Confirm / Cancel (same UX as `VerificationReviewPage`)
  - Sorted oldest-first (process in order of arrival)
  - `ErrorBanner` for errors and success messages with dismiss
  - Proper empty state, loading state, and per-button loading spinners
- `pages/seeker/RequestDetailsPage.jsx` — added rejection note banner shown when `status === 'PENDING_PAYMENT' && paymentRejectionNote` is present; displays admin note in red with instructions to re-upload

## Notes

- SCRUM-105 and SCRUM-106 branches were merged into `SCRUM-107-review-and-approve-or-reject-payment` as the foundation before adding SCRUM-107-specific changes.
- File streaming uses `FileSystemResource` + `ContentDisposition.inline()` — same approach as `VerificationController.getVerificationDocument()`.
- Rejection reason is mandatory in the UI (validated before the API call), ensuring seekers always receive actionable feedback.
- The `paymentRejectionNote` is cleared on each new upload attempt (via `uploadRequestPaymentSlip`) so stale rejection notes don't persist after a successful re-upload.
