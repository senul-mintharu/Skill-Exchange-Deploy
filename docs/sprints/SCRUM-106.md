# SCRUM-106 — Upload Bank Transfer Proof for Admin Verification

**Status:** Completed  
**Date:** 2026-04-21

## User Story

As a Service Seeker, I want to upload bank transfer proof, so that my manual payment can be verified by an admin.

## Acceptance Criteria

- [x] **AC1 — Upload Valid Proof:** `POST /api/requests/{requestId}/payment-slip` accepts JPG, PNG, and PDF files (max 5 MB) and stores the slip to disk.
- [x] **AC2 — Invalid File Validation:** Unsupported file types and oversized files are rejected with a clear error message before saving.
- [x] **AC3 — Proof Review Status:** After uploading the slip, the request transitions to `PAYMENT_UNDER_REVIEW` and displays "Under Review" to the seeker — not published until admin approves.

## Definition of Done

- [x] Code implemented
- [x] Role-based access enforced (SEEKER uploads; ADMIN approves/rejects)
- [x] API tested
- [x] Frontend integrated

## Backend Changes

**Files modified:**
- `common/enums/RequestStatus.java` — added `PAYMENT_UNDER_REVIEW` between `PENDING_PAYMENT` and `OPEN`
- `requests/service/ServiceRequestService.java`:
  - `uploadRequestPaymentSlip()` — changed transition from `PENDING_PAYMENT → OPEN` to `PENDING_PAYMENT → PAYMENT_UNDER_REVIEW`
  - Added `getPendingPaymentSlips()` — returns all `PAYMENT_UNDER_REVIEW` requests
  - Added `approvePaymentSlip(requestId, adminId)` — transitions `PAYMENT_UNDER_REVIEW → OPEN`
  - Added `rejectPaymentSlip(requestId, adminId)` — transitions back to `PENDING_PAYMENT`, clears `paymentSlipPath`
- `requests/dto/RequestResponse.java` — added `paymentSlipUploaded` boolean field
- `payment/PaymentController.java` — added three admin endpoints:
  - `GET /api/admin/payment-slips/pending`
  - `POST /api/admin/requests/{requestId}/payment-approve`
  - `POST /api/admin/requests/{requestId}/payment-reject`
- `config/SecurityConfig.java` — locked all three admin payment endpoints to `ADMIN` role

**Endpoints added:**
- `GET /api/admin/payment-slips/pending` — list all requests with `PAYMENT_UNDER_REVIEW` status
- `POST /api/admin/requests/{requestId}/payment-approve` — approve slip, request goes OPEN
- `POST /api/admin/requests/{requestId}/payment-reject` — reject slip, request returns to PENDING_PAYMENT

## Frontend Changes

**Files created:**
- `pages/admin/AdminPaymentSlipsPage.jsx` — admin list view with approve/reject per slip; shows seeker name, request title, category, location, budget, submission time; inline loading states per action

**Files modified:**
- `services/requestService.js` — added `getAdminPendingPaymentSlips()`, `adminApprovePaymentSlip()`, `adminRejectPaymentSlip()`
- `pages/seeker/CreateRequestPage.jsx` — updated Step 4 messaging: button label "Submit Payment Slip", success message "Payment slip submitted. Your request is under review."
- `pages/seeker/MyRequestsPage.jsx` — `PAYMENT_UNDER_REVIEW` → "Under Review" label + `hourglass_top` icon; counted as active
- `pages/seeker/RequestDetailsPage.jsx` — `PAYMENT_UNDER_REVIEW` → "Under Review" in status label and tone
- `pages/admin/AdminDashboard.jsx` — added "Payment Slip Review" stat card and quick-action link
- `App.js` — added `/admin/payment-slips` route under ADMIN guard

**Routes changed:**
- `/admin/payment-slips` → `AdminPaymentSlipsPage` (ADMIN only)

## Notes

- SCRUM-105 base was merged into this branch (`SCRUM-106-upload-bank-transfer`) before implementing, as 105 provided the slip upload scaffolding.
- The status flow is now: `PENDING_PAYMENT → PAYMENT_UNDER_REVIEW → OPEN` (with `PENDING_PAYMENT` as the rejection fallback).
- Rejection clears `paymentSlipPath` so the seeker must upload a fresh slip on their next attempt.
- No separate `PaymentReviewService` class was created — review methods were added directly to `ServiceRequestService` to keep the payment lifecycle logic in one place.
