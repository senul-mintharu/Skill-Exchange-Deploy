# SCRUM-75: Restrict Quotation Submission to Workers — Implementation

## Overview

This document captures the implementation status for **SCRUM-75**.

**User Story:** As a system, I want to restrict quotation submission to workers, so that seekers cannot submit invalid offers.

**Status:** Completed
**Date:** 2026-03-24

---

## Acceptance Criteria Coverage

- AC1: Only workers can submit quotations — Completed
- AC2: Non-worker authenticated users are blocked — Completed
- AC3: Unauthenticated users are blocked — Completed

---

## Implementation Summary

Role-based authorization is enforced for quotation submission endpoint:

- `POST /api/quotes`

Security behavior:

- `401 Unauthorized` for unauthenticated requests
- `403 Forbidden` for authenticated users without `WORKER` role

---

## Backend Changes

### Files Modified

- `backend/WedaLK/demo/src/main/java/lk/wedalk/config/SecurityConfig.java`

### Endpoints Added

- None

---

## Frontend Changes

### Components Modified

- None (existing worker-only UI and route guards remain compatible)

### Routes Changed

- None

---

## Verification

- Role-based rules validated against quote submission flow.
- Backend authorization behavior aligns with API security expectations.

---

## References

- Source tracking doc: `docs/sprints/LF-75.md`
