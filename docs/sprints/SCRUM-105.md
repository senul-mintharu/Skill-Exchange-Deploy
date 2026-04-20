# SCRUM-105 — Payment Step Before Posting a Service Request

**Status:** Completed  
**Date:** 2026-04-21

## User Story

As a Service Seeker, I want to complete a payment step before posting a service request, so that my request can be published on the platform.

## Acceptance Criteria

- [x] **AC1 — Payment Required Before Publish:** Request is created with `PENDING_PAYMENT` status and is not visible to workers until a payment slip is uploaded.
- [x] **AC2 — Successful Payment Submission:** After the SEEKER uploads a valid bank transfer slip, the request transitions to `OPEN` and becomes visible to workers.
- [x] **AC3 — Pending Payment Status:** The request shows "Awaiting Payment" status in My Requests and Request Details until the slip is uploaded.

## Definition of Done

- [x] Code implemented
- [x] Role-based access enforced (SEEKER-only for request payment slip, WORKER-only for profile payment slip)
- [x] API tested
- [x] Frontend integrated

## Backend Changes

**Files modified:**
- `common/enums/RequestStatus.java` — added `PENDING_PAYMENT` as first value
- `requests/model/ServiceRequest.java` — added `paymentSlipPath` field; default status set to `PENDING_PAYMENT`
- `requests/service/ServiceRequestService.java` — changed initial status from `OPEN` → `PENDING_PAYMENT`; added `uploadRequestPaymentSlip()` method (validates file, stores to `uploads/payment-slips/`, transitions to `OPEN`)
- `profiles/model/WorkerProfile.java` — added `paymentSlipPath` field
- `profiles/service/WorkerProfileService.java` — added `uploadProfilePaymentSlip()` method (validates file, stores to `uploads/payment-slips/`)
- `config/SecurityConfig.java` — added SEEKER rule for `POST /api/requests/*/payment-slip`; added WORKER rule for `POST /api/profiles/*/payment-slip`

**Files created:**
- `payment/PaymentController.java` — exposes two endpoints:
  - `POST /api/requests/{requestId}/payment-slip` (SEEKER)
  - `POST /api/profiles/{profileId}/payment-slip` (WORKER)

**Endpoints added:**
- `POST /api/requests/{requestId}/payment-slip` — multipart slip upload; transitions `PENDING_PAYMENT` → `OPEN`
- `POST /api/profiles/{profileId}/payment-slip` — multipart slip upload; saves path to worker profile

## Frontend Changes

**Files modified:**
- `services/requestService.js` — added `uploadRequestPaymentSlip(requestId, slipFile)`
- `services/profileService.js` — added `uploadProfilePaymentSlip(profileId, slipFile)`
- `pages/seeker/CreateRequestPage.jsx` — added Step 4 (Payment) to the wizard; shows bank transfer details (Rs. 500, Bank of Ceylon, account 76221736, Colombo Fort branch); file upload for slip; on submit: creates request then uploads slip
- `pages/worker/EditWorkerProfilePage.jsx` — added payment section at the bottom of the create-profile form (create mode only); same bank details panel; slip upload required before submission
- `pages/seeker/MyRequestsPage.jsx` — added `statusLabel()` helper mapping `PENDING_PAYMENT` → "Awaiting Payment"; updated `actionLabel` and `requestMetaBadge` for new status; `PENDING_PAYMENT` counted as active
- `pages/seeker/RequestDetailsPage.jsx` — updated `getJobStatusLabel` and `statusTone` to handle `PENDING_PAYMENT`

## Notes

- Bank transfer details are hardcoded as constants (`PAYMENT_DETAILS`) in both page components for easy future configuration.
- Payment slip files are stored in `uploads/payment-slips/` using the same multipart pattern as `VerificationService`.
- File validation: JPG, PNG, or PDF only; max 5 MB — consistent with the existing verification document rules.
- Requests transition directly from `PENDING_PAYMENT` → `OPEN` upon slip upload (no admin verification step required at this stage).
- Worker profile payment slip is stored on the profile entity; no separate status transition — the profile is active immediately after creation, the slip serves as a payment record.
