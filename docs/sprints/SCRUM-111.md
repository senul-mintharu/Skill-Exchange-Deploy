# SCRUM-111 — Admin status updates (verification, disputes, payment proofs)

**Status:** Completed  
**Date:** 2026-04-24

## User Story

As an Administrator, I want to update the status of verification, disputes, and payment proofs, so that outcomes are recorded in the system.

## Acceptance Criteria

- [x] **AC1 — Update Verification Status:** Unified trust workflow supports **Approve**, **Reject** (with reason), and **View doc** for pending worker verifications; list updates after each action.
- [x] **AC2 — Update Dispute Status:** Each dispute row shows current **status** and links to **Resolve / update status** (`/admin/disputes/:id`) where resolution is recorded.
- [x] **AC3 — Update Payment Proof Status:** Pending payment slips (`PAYMENT_UNDER_REVIEW`) appear in the same queue with **Approve**, **Reject** (with reason), and **View slip**; list updates after each action.
- [x] **AC4 — Reflect Latest Status:** **Status** column shows workflow state (e.g. pending review, payment under review, dispute status). After admin actions, items are removed from the queue and a success banner confirms the outcome; **Refresh** reloads all sections from the API.

## Definition of Done

- [x] Code implemented
- [x] Role-based access unchanged (admin-only routes + existing backend enforcement)
- [x] Frontend integrated on `/admin/trust-workflow`
- [x] Empty / partial-error states handled

## Backend Changes

**None.** Reuses:

- `PUT /api/verification/{id}/status` (approve/reject)
- `PUT /api/disputes/{id}/resolve` (via dispute detail page)
- `POST /api/admin/requests/{id}/payment-approve` and `payment-reject`

## Frontend Changes

**Files modified:**

- `frontend/src/pages/admin/TrustWorkflowPage.jsx` — extended SCRUM-110 queue with payment slips, **Status** column, inline verification and payment actions, dispute status display + resolve link.
- `frontend/src/services/disputeService.js` — `getOpenDisputes()` unwraps paged `content` so callers receive a plain array (matches `GET /api/disputes/open` response shape).
- `frontend/src/pages/admin/DisputeReviewPage.jsx` — removed redundant initial `useEffect` that duplicated loading; single source via `getOpenDisputesPaged`.

## Notes

- Open disputes are loaded with `size: 200` on the unified page; very large backlogs should use `/admin/disputes` pagination.
- Dedicated pages (`/admin/verification`, `/admin/disputes`, `/admin/payment-slips`) remain available for full workflows.
