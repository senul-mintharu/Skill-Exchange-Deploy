# SCRUM-85: Worker Verified Badge — Implementation

## Overview

This document describes the implementation of **SCRUM-85**:

**User Story:** As a Service Seeker (and platform user), I want to see a verified badge on worker profiles when identity verification is approved, so that I can trust verified workers.

Purpose of the verified badge:

- Clearly indicate identity-verified workers at profile level
- Improve trust signals without adding UI clutter
- Use backend verification status as the single source of truth for badge visibility

Scope for SCRUM-85:

- Extend worker profile response to expose `verificationStatus`
- Render a verified icon next to worker name only when status is `APPROVED`
- Show explanatory tooltip on hover

Out of scope:

- Verification submission workflow changes
- Admin verification review flow changes
- Any new profile endpoint creation

---

## Acceptance Criteria Coverage (Gherkin)

### AC1 — Show badge for approved workers

**Given** a worker profile has `verificationStatus = "APPROVED"`  
**When** the worker profile page is rendered  
**Then** a verified badge icon is displayed next to the worker name

Implemented by:

- Frontend icon rendering using `FaCheckCircle` from `react-icons/fa`
- Conditional check: `profile.verificationStatus === 'APPROVED'`

### AC2 — Hide badge for unverified workers

**Given** a worker profile has `verificationStatus` as `PENDING`, `REJECTED`, or `null`  
**When** the worker profile page is rendered  
**Then** the verified badge is not rendered

Implemented by:

- Badge is wrapped in approved-only conditional rendering
- No fallback icon is rendered for non-approved states

### AC3 — Tooltip explanation

**Given** the verified badge is visible  
**When** the user hovers over the badge  
**Then** the tooltip text shown is: **"Identity verified by platform administrators."**

Implemented by:

- `title` attribute on the badge icon
- Matching `aria-label` for accessibility clarity

---

## Backend

### Worker Profile API Extension

| Method | Endpoint                      | Purpose                                                                      |
| ------ | ----------------------------- | ---------------------------------------------------------------------------- |
| `GET`  | `/api/profiles/{id}`          | Returns worker profile including verification status for UI trust indicators |
| `GET`  | `/api/profiles/user/{userId}` | Returns worker profile by user id including verification status              |

Implementation notes:

- Existing endpoint(s) were reused. No new endpoint was introduced.
- Response DTO includes `verificationStatus` (string) for frontend consumption.
- Service mapping resolves verification from verification data source first, then falls back to user profile status, then `NONE` for backward compatibility.

### Data Flow

1. Controller receives profile request.
2. Service loads worker profile.
3. Service resolves `verificationStatus` from verification submission data (fallbacks applied).
4. DTO is returned with existing fields unchanged and `verificationStatus` included.

---

## Frontend

### WorkerProfile component update

Primary UI implementation is in the shared worker profile panel used by profile pages:

- Added verified badge icon beside worker name
- Kept layout intact (name row only)
- Implemented small, visible icon style

### Conditional Rendering

- Computed flag: `isVerified = profile.verificationStatus === 'APPROVED'`
- Badge renders only when `isVerified` is true
- Hidden for `PENDING`, `REJECTED`, and null/undefined values

### Tooltip

- Added simple hover tooltip using `title` attribute:
  - `Identity verified by platform administrators.`

### Icon Usage

- Library: `react-icons`
- Icon: `FaCheckCircle`
- Placement: inline next to worker name

---

## Files Updated

### Backend

- `backend/WedaLK/demo/src/main/java/lk/wedalk/profiles/service/WorkerProfileService.java` (verification status resolution and DTO mapping)

### Frontend

- `frontend/src/components/ui/WorkerProfilePanel.jsx` (verified badge icon, approved-only conditional rendering, tooltip)

---

## Manual Test Cases

### Test 1 — Approved worker shows badge (AC1)

1. Prepare a worker profile with `verificationStatus = "APPROVED"`.
2. Open worker profile page.
3. Confirm badge icon appears next to worker name.

Expected:

- Badge is visible and aligned beside the worker name.

### Test 2 — Pending/Rejected/Null hides badge (AC2)

1. Open profile with `verificationStatus = "PENDING"`.
2. Open profile with `verificationStatus = "REJECTED"`.
3. Open profile with `verificationStatus = null` (or missing).

Expected:

- Badge is not shown in all three cases.

### Test 3 — Tooltip appears on hover (AC3)

1. Use a profile where badge is visible (`APPROVED`).
2. Hover over the badge icon.

Expected:

- Tooltip text displays: **"Identity verified by platform administrators."**

---

## Summary

SCRUM-85 is implemented as a focused enhancement to worker profile trust UI and profile response data flow:

- Backend exposes reliable `verificationStatus` in profile responses
- Frontend renders a clean verified badge only for approved workers
- Tooltip explains verification meaning without adding complexity
- Existing endpoints and profile layout remain backward compatible
