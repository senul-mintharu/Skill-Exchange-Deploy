# SCRUM-77: Block Unauthorized Access to Protected Endpoints — Implementation

## Overview

This document captures the implementation status for **SCRUM-77**.

**User Story:** As a system, I want to block unauthorized access to protected endpoints, so that only permitted roles can perform actions.

**Status:** Completed
**Date:** 2026-03-24

---

## Acceptance Criteria Coverage

- AC1: Unauthorized requests are blocked — Completed
- AC2: Role-based restrictions are enforced — Completed
- AC3: Auth flow supports protected API access with JWT — Completed

---

## Implementation Summary

Implemented JWT authentication and role-based authorization in backend security layer.

Security behavior:

- `401 Unauthorized` for unauthenticated requests to protected endpoints
- `403 Forbidden` for authenticated users lacking required role

Authentication behavior:

- Login and registration endpoints issue/authenticate JWT credentials.
- Admin seed account is configured from environment settings.

---

## Backend Changes

### Files Modified

- `backend/WedaLK/demo/src/main/java/lk/wedalk/config/SecurityConfig.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/config/DataSeeder.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/auth/dto/RegisterRequest.java`
- `backend/WedaLK/demo/src/main/resources/application.properties`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/security/JwtService.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/security/JwtAuthenticationFilter.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/security/CustomUserDetailsService.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/auth/service/AuthService.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/auth/controller/AuthController.java`

### Endpoints Added

- `POST /api/auth/register`
- `POST /api/auth/login`

---

## Frontend Changes

### Components Modified

- None (frontend route-level guards are tracked in SCRUM-78)

### Routes Changed

- None

---

## Verification

- Protected endpoint behavior validated for authenticated and unauthenticated scenarios.
- Role enforcement confirmed via security configuration and JWT filter pipeline.

---

## References

- Source tracking doc: `docs/sprints/LF-77.md`
