# SCRUM-78: Frontend Role-Based Route Guards — Implementation

## Overview

This document captures the implementation status for **SCRUM-78**.

**User Story:** As a developer, I want role-based route guards in the frontend, so that users only see pages relevant to their role.

**Status:** Completed
**Date:** 2026-03-24

---

## Acceptance Criteria Coverage

- AC1: Unauthenticated users are redirected to login — Completed
- AC2: Users with wrong role are redirected to their own allowed area — Completed
- AC3: Role-grouped routes are protected — Completed
- AC4: Missing routes are handled by catch-all not-found behavior — Completed

---

## Implementation Summary

Frontend route guards enforce access by auth state and role across seeker, worker, and admin route groups.

Routing behavior:

- Unauthenticated access to protected routes redirects to `/login`.
- Wrong-role access redirects users to their role-appropriate dashboard/entry route.
- Catch-all route (`*`) resolves unmatched paths to not-found handling.

Authentication behavior:

- JWT bearer token from local storage is attached to API requests via shared client config.

---

## Frontend Changes

### Components/Files Modified

- `frontend/src/App.js`
- `frontend/src/components/common/ProtectedRoute.jsx`
- `frontend/src/components/common/Navbar.jsx`
- `frontend/src/pages/auth/LoginPage.jsx`
- `frontend/src/pages/admin/AdminDashboard.jsx`
- `frontend/src/services/authService.js`
- `frontend/src/services/apiClient.js`

### Routes Changed

- Added protected route groups:
  - `/seeker/*`
  - `/worker/*`
  - `/admin/*`
- Added unauthenticated entry route: `/login`
- Added catch-all route: `*`

---

## Backend Changes

### Files Modified

- None

### Endpoints Added

- None

---

## Verification

- Route guard behavior validated through role-based navigation.
- Tokenized API calls verified through shared API client configuration.

---

## References

- Source tracking doc: `docs/sprints/LF-78.md`
