# SCRUM-83: Worker Verification Submission — Implementation

## Overview

This document describes the implementation of SCRUM-83:

User Story: As a Worker, I want to upload my verification document and track the verification status, so that my profile can be reviewed and trusted by seekers.

Scope for SCRUM-83:

- Allow workers to upload one verification document through a multipart request
- Validate uploaded document constraints before processing
- Save submission with authenticated worker identity only
- Set and return verification status as PENDING after successful submission
- Provide clear frontend status feedback and lock submission while pending

Out of scope:

- Admin verification decision workflow (approval/rejection), which remains under existing admin flow

---

## Acceptance Criteria Coverage (Gherkin)

### AC1 — Upload and pending state

Given a worker selects a valid document and submits it  
When the system receives the upload request  
Then the document is stored, verification status is set to PENDING, and the UI shows Verification Pending with a success notification

Implemented by:

- Frontend page: VerificationPage.jsx at /worker/verification
- Backend endpoint used: POST /api/verification (multipart/form-data)
- Response fields used by UI: verificationStatus, documentName

### AC2 — Form lock during pending

Given the worker verification status is PENDING  
When the worker opens the verification page  
Then the file input and submit button are disabled and the uploaded file name is shown

Implemented by:

- UI lock condition based on verification status === PENDING
- Disabled states applied to input and submit button
- Uploaded file name rendered in pending state section

### AC3 — File size validation

Given a worker selects a file larger than 5MB  
When file validation is executed before upload  
Then selection is blocked and the error File exceeds the 5MB maximum limit. is displayed

Implemented by:

- Frontend pre-submit validation in VerificationPage.jsx
- Backend defensive validation and multipart max size configuration
- Error mapping to HTTP 400 with File too large message

### AC4 — File type validation

Given a worker selects a file that is not JPG, PNG, or PDF  
When file validation is executed before upload  
Then selection is blocked and the error Only JPG, PNG, and PDF formats are supported. is displayed

Implemented by:

- Frontend extension and MIME validation
- Backend extension and content-type validation
- Error mapping to HTTP 400 with Unsupported format message

---

## Backend

### Endpoint implemented

| Method | Endpoint          | Purpose                                                                                     |
| ------ | ----------------- | ------------------------------------------------------------------------------------------- |
| POST   | /api/verification | Accept worker verification document upload and create/update submission with PENDING status |

### Security and identity handling

- Worker identity is derived from the authenticated JWT context
- Worker ID from client payload is not trusted or used
- Existing role protection for verification route remains intact

### Validation and persistence behavior

- Accepted content types: image/jpeg, image/png, application/pdf
- Accepted extensions: .jpg, .jpeg, .png, .pdf
- Maximum file size: 5MB
- On success:
  - Save document metadata/path and file details
  - Set status = PENDING
  - Return verificationStatus and documentName

---

## Frontend

### Verification page

Frontend page: frontend/src/pages/worker/VerificationPage.jsx

- Provides file input with accept=".jpg,.png,.pdf"
- Submits multipart request using verificationService.submitVerification(file)
- Updates local UI state to PENDING immediately after successful response
- Shows Verification Pending badge clearly
- Shows temporary success notification after upload

### File validation logic

- Validates size before upload and blocks files above 5MB
- Validates extension and MIME type before upload
- Clears invalid selection and shows inline error through ErrorBanner

### Error handling with ErrorBanner

- Uses existing ErrorBanner component for:
  - Client validation errors
  - API errors returned from backend
  - Temporary success feedback (success tone)

### Form lock and duplicate submission prevention

- If status is PENDING:
  - File input is disabled
  - Submit button is disabled
  - Uploaded file name is shown
- While request is in progress:
  - Submit action is blocked
  - Button remains disabled to prevent duplicate submissions

---

## Files Added / Updated

### Backend

- backend/WedaLK/demo/src/main/java/lk/wedalk/verification/controller/VerificationController.java (updated)
- backend/WedaLK/demo/src/main/java/lk/wedalk/verification/service/VerificationService.java (updated)
- backend/WedaLK/demo/src/main/java/lk/wedalk/verification/model/VerificationSubmission.java (updated)
- backend/WedaLK/demo/src/main/java/lk/wedalk/verification/repository/VerificationRepository.java (updated)
- backend/WedaLK/demo/src/main/java/lk/wedalk/common/enums/VerificationStatus.java (updated)
- backend/WedaLK/demo/src/main/java/lk/wedalk/common/GlobalExceptionHandler.java (updated)
- backend/WedaLK/demo/src/main/java/lk/wedalk/verification/dto/VerificationSubmitResponse.java (added)
- backend/WedaLK/demo/src/main/resources/application.properties (updated)

### Frontend

- frontend/src/pages/worker/VerificationPage.jsx (added)
- frontend/src/services/verificationService.js (updated)
- frontend/src/App.js (updated)

---

## Manual Test Cases (aligned with ACs)

### Valid upload → success + pending

1. Log in as a worker.
2. Open /worker/verification.
3. Select a valid file (JPG/PNG/PDF, <= 5MB).
4. Click Submit Verification.
5. Confirm:
   - Success notification appears
   - Status badge changes to Verification Pending
   - Uploaded file name is shown

### Pending → form disabled

1. Ensure worker has verification status PENDING.
2. Open /worker/verification.
3. Confirm file input is disabled.
4. Confirm submit button is disabled.
5. Confirm uploaded file name is visible.

### File >5MB → error

1. Open /worker/verification.
2. Select a file larger than 5MB.
3. Confirm selection is blocked.
4. Confirm ErrorBanner shows: File exceeds the 5MB maximum limit.

### Invalid type → error

1. Open /worker/verification.
2. Select an unsupported format (for example .txt).
3. Confirm selection is blocked.
4. Confirm ErrorBanner shows: Only JPG, PNG, and PDF formats are supported.

### API failure → ErrorBanner shown

1. Simulate backend/API failure (server down or forced 4xx/5xx response).
2. Attempt to submit a valid file.
3. Confirm ErrorBanner displays the API error message.
4. Confirm no false status transition to PENDING occurs.

---

## Post-Audit Fixes

- Replaced calling profile API with `getMyVerification()` to act as source of truth for the verification status on the frontend.
- Added locked state for `APPROVED` workers so already verified workers cannot see the form or submit it again.
- Context-aware button labels ("Pending Review", "Already Verified").
