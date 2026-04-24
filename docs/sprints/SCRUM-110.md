# SCRUM-110 — Admin Trust Workflow (Unified Queue)

**Status:** Completed  
**Date:** 2026-04-24

## User Story

As an Administrator, I want to review verification submissions and disputes in one place, so that I can manage trust workflows efficiently.

## Acceptance Criteria

- [x] **AC1 — Unified Dashboard View:** One admin page lists both pending worker verifications and open disputes.
- [x] **AC2 — Prioritize Pending Cases:** Queue is sorted oldest-first (longest-waiting items at the top).
- [x] **AC3 — Open Item Details:** Each row links to the appropriate workflow — **Review** → full verification queue (`/admin/verification`); **Open details** → dispute detail (`/admin/disputes/:id`).

## Definition of Done

- [x] Code implemented
- [x] Role-based access enforced (page under existing `ADMIN` route guard)
- [x] Reuses existing APIs (`GET /api/verification/pending`, `GET /api/disputes/open`)
- [x] Frontend integrated
- [x] Empty and partial-failure states handled

## Backend Changes

**None.** Existing admin endpoints already expose the required data.

## Frontend Changes

**Files added:**

- `frontend/src/pages/admin/TrustWorkflowPage.jsx` — unified queue with summary cards, combined table, refresh, resilient loading (`Promise.allSettled`).

**Files modified:**

- `frontend/src/App.js` — route `GET /admin/trust-workflow` → `TrustWorkflowPage` (inside `ProtectedRoute` for `ADMIN`).
- `frontend/src/pages/admin/AdminDashboard.jsx` — stat card + primary quick action **Trust workflow (unified)**.

## Notes

- Full approve/reject for verifications remains on `/admin/verification` where the existing UI lives; the unified page is the single entry point and triage list per SCRUM-110.
- Disputes use `/admin/disputes/:disputeId` for the detail + resolution flow.
