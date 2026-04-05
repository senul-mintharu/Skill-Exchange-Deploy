# SCRUM-89 — Mark Job as Not Completed

**Sprint:** 3  
**Story:** As a Service Seeker, I want to mark a job as "Not Completed" with a reason, so that a dispute is automatically raised for admin review.

---

## Implementation Summary

### Approach

SCRUM-89 replaces the previous 2-step flow (update status → separately raise dispute) with a **single atomic operation**:

1. Seeker clicks **"Mark as Not Completed"** on an ASSIGNED job
2. A **confirmation modal** appears with a required reason textarea
3. On submit, `POST /api/disputes` is called — this **atomically**:
   - Sets request status to `NOT_COMPLETED`
   - Creates a dispute record with `OPEN` status
4. Page refreshes, showing the admin review banner and locking further actions

No backend changes were required — `DisputeService.createDispute()` (implemented in SCRUM-94) already handles the atomic operation.

---

## Acceptance Criteria Coverage

| AC | Description | Implementation |
|----|-------------|----------------|
| AC1 | ASSIGNED job → "Mark as Not Completed" → modal with reason form | Button opens `showNotCompletedModal` state; modal renders with textarea |
| AC2 | Empty reason → validation error, status not updated | `handleNotCompletedSubmit` checks `!notCompletedReason.trim()` → sets `notCompletedReasonError` inline |
| AC3 | Submit reason → status = NOT_COMPLETED + dispute created | Calls `submitDispute()` → `POST /api/disputes` (atomic in `DisputeService`) |
| AC4 | Confirmation dialog before proceeding | Modal has Cancel + "Confirm & Raise Dispute" buttons + amber warning banner |
| AC5 | Updated status + reason visible on page | `fetchRequestDetails(false)` refreshes after success; status pill updates |
| AC6 | Restrict further status changes | Action buttons only shown for `ASSIGNED` status; admin review banner shown for `NOT_COMPLETED` |

---

## Files Changed

### Frontend Only

**`frontend/src/pages/seeker/RequestDetailsPage.jsx`**

- **Removed:** Old 2-step dispute flow (separate `disputeReason`, `disputeSubmitting`, `disputeMessage`, `disputeSubmitted` state + `handleSubmitDispute` + "Raise a Dispute" section card)
- **Added:** Modal state: `showNotCompletedModal`, `notCompletedReason`, `notCompletedReasonError`, `notCompletedSubmitting`, `notCompletedSuccess`
- **Added:** `handleNotCompletedSubmit()` — validates reason, calls `submitDispute()`, refreshes page
- **Changed:** "Mark as Not Completed" button now opens modal instead of calling `handleUpdateJobOutcome`
- **Added:** Admin review banner (AC6) shown when `request.status === 'NOT_COMPLETED'`
- **Added:** Success banner (`notCompletedSuccess`) shown after modal submission
- **Added:** Full modal overlay with: header, amber warning notice, reason textarea with inline validation, Cancel + Confirm buttons

### Backend (No Changes)

`DisputeService.createDispute()` already:
- Validates seeker role (SCRUM-94 AC3)
- Validates seeker ownership (SCRUM-94 AC1/AC2)
- Validates request is ASSIGNED or NOT_COMPLETED
- Blocks duplicate disputes
- Atomically sets status to NOT_COMPLETED + creates OPEN dispute

---

## API Used

```
POST /api/disputes
Authorization: Bearer <seeker-jwt>
Content-Type: application/json

{
  "requestId": 42,
  "reason": "Worker did not show up at all."
}

→ 201 Created
{
  "success": true,
  "message": "Dispute created successfully",
  "data": {
    "id": 7,
    "requestId": 42,
    "status": "OPEN",
    "seekerReason": "Worker did not show up at all.",
    ...
  }
}
```

---

## UI Flow

```
[ASSIGNED Job Page]
  ├── "Mark as Completed"     → window.confirm → PATCH /api/requests/{id}/status
  └── "Mark as Not Completed" → Opens modal
                                  ├── Amber warning: "This action cannot be undone"
                                  ├── Reason textarea (required)
                                  ├── [Cancel]  → closes modal
                                  └── [Confirm & Raise Dispute]
                                        ├── Empty reason → inline error (AC2)
                                        └── Valid → POST /api/disputes (AC3)
                                              └── Success → modal closes
                                                         → page refreshes
                                                         → status = NOT_COMPLETED
                                                         → admin review banner (AC6)
```

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Empty reason | Inline error below textarea, no API call |
| Backend 400 (duplicate dispute) | Error shown inside modal textarea area |
| Backend 403 (wrong seeker / worker) | Error shown inside modal textarea area |
| Network error | Generic error shown inside modal |

---

## Test Script

Run `test-scrum89.ps1` with backend running on port 8081:

```powershell
.\test-scrum89.ps1
```

**Test cases covered:**
1. Empty reason → 400 rejected
2. Valid submission → dispute OPEN + request NOT_COMPLETED (atomic)
3. Further status change blocked after NOT_COMPLETED
4. Duplicate dispute blocked
5. Unrelated seeker blocked (SCRUM-94 AC1)
6. Worker blocked from disputing (SCRUM-94 AC3)
7. GET /api/disputes/my returns seeker's disputes
