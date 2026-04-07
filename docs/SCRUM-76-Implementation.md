# SCRUM-76: Restrict Quotation Acceptance to Seekers — Implementation

## Overview

This document captures the implementation status for **SCRUM-76**.

**User Story:** As a system, I want to restrict quotation acceptance to seekers, so that workers cannot assign jobs to themselves.

**Status:** Completed
**Date:** 2026-03-24

---

## Acceptance Criteria Coverage

- AC1: Only seekers can accept quotations — Completed
- AC2: Worker or non-seeker acceptance attempts are blocked — Completed
- AC3: Ownership checks applied for quotation visibility/acceptance context — Completed

---

## Implementation Summary

Quotation acceptance now binds requester identity from JWT (email -> user id) and removes caller-supplied seeker identity from APIs.

Security behavior:

- `401 Unauthorized` for unauthenticated requests
- `403 Forbidden` for authenticated non-seeker roles on accept endpoint

Data access behavior:

- Quotations for a request are returned only when the authenticated seeker owns that request.

---

## Backend Changes

### Files Modified

- `backend/WedaLK/demo/src/main/java/lk/wedalk/quotes/controller/QuotationController.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/quotes/service/QuotationService.java`

### Endpoints Added

- None

---

## Frontend Changes

### Components/Services Modified

- `frontend/src/services/quoteService.js`

### Routes Changed

- None

---

## Verification

- Acceptance path validated under seeker role.
- Impersonation risk reduced by removing seeker query parameters.
- Authorization checks enforced consistently across quote acceptance and retrieval.

---

## References

- Source tracking doc: `docs/sprints/LF-76.md`
