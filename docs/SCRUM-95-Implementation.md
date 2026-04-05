# SCRUM-95: Admin Restriction for Verification Approval & Dispute Resolution — Implementation

## Overview

This document describes the implementation of **SCRUM-95**:

**User Story:** As a platform owner, I want verification approval and dispute resolution to be restricted to admins, so that trust and enforcement decisions are controlled by authorized users only.

Scope for SCRUM-95:

- Restrict verification approval endpoint to **ADMIN** only
- Restrict dispute resolution endpoint to **ADMIN** only
- Enforce **server-side** status transitions (do not trust client payload)
- Preserve existing JWT authentication and SCRUM-93 security behavior

Out of scope:

- Changes to worker verification submission flow (`POST /api/verification`)
- Changes to unrelated business flows/endpoints

---

## Acceptance Criteria Coverage (Gherkin)

### AC1 — Reject standard users

**Given** a user is authenticated as `WORKER` or `SEEKER`  
**When** they call admin-only verification/dispute mutation endpoints  
**Then** the system rejects the request with **403 Forbidden**

Implemented by:

- Route-level RBAC in `SecurityConfig` for both admin PUT endpoints
- Controller-level admin role checks using `SecurityContextHolder`

### AC2 — Accept admin actions

**Given** a user is authenticated as `ADMIN`  
**When** they approve/reject verification or resolve a dispute  
**Then** the request is accepted and persisted successfully

Implemented by:

- `PUT /api/verification/{id}/status` in `VerificationController`
- `PUT /api/disputes/{id}/resolve` in `DisputeController`
- `resolveDispute(...)` service method in `DisputeService`

### AC3 — Protect against status forgery

**Given** a non-admin or forged client payload attempts to force protected status values  
**When** status-like fields are sent from the client body  
**Then** client-controlled status is ignored and server-side rules enforce valid transitions only

Implemented by:

- Verification status is assigned server-side from admin decision path (`APPROVED` or `REJECTED`)
- Dispute status is hard-set server-side to `RESOLVED` in service logic
- Non-admin access is blocked before mutation logic executes

---

## Backend

### Security Configuration (RBAC)

| Layer                  | Implementation                                | Purpose                                       |
| ---------------------- | --------------------------------------------- | --------------------------------------------- |
| Security filter chain  | `SecurityConfig` request matchers             | Restrict admin endpoints to `ROLE_ADMIN`      |
| JWT auth               | `JwtAuthenticationFilter` + stateless session | Ensure identity is validated before RBAC      |
| Access denied handling | `AccessDeniedHandler`                         | Return `403 Forbidden` for unauthorized roles |

Applied RBAC rules:

- `PUT /api/verification/*/status` -> `hasRole("ADMIN")`
- `PUT /api/disputes/*/resolve` -> `hasRole("ADMIN")`

Note:

- This implementation uses **SecurityConfig matcher-based RBAC** (no `@PreAuthorize` required for these routes).

### Controller-level Protection

- `VerificationController`:
  - Resolves authenticated user via `SecurityContextHolder`
  - Enforces `ADMIN` check before review operation
  - Ignores client-provided status and constructs trusted server payload

- `DisputeController`:
  - Resolves authenticated user via `SecurityContextHolder`
  - Enforces `ADMIN` check before resolution operation
  - Accepts only resolution notes from client input; does not accept dispute status from client

### Service-level Enforcement

- `DisputeService.resolveDispute(...)`:
  - Re-validates caller role is `ADMIN` (defense in depth)
  - Forces `DisputeStatus.RESOLVED` server-side
  - Prevents re-resolving already resolved disputes
  - Persists `resolution`, `resolvedBy`, and `resolvedAt`

### JWT Validation

- JWT token validation remains unchanged and active in the existing security chain.
- Requests without valid authentication are rejected before controller processing.
- SCRUM-93 protections remain intact.

---

## Endpoints

| Method | Endpoint                        | Access      | Purpose                                     |
| ------ | ------------------------------- | ----------- | ------------------------------------------- |
| `PUT`  | `/api/verification/{id}/status` | ADMIN (JWT) | Approve or reject a verification submission |
| `PUT`  | `/api/disputes/{id}/resolve`    | ADMIN (JWT) | Resolve an open dispute                     |

---

## Files Added / Updated

### Backend

- `backend/WedaLK/demo/src/main/java/lk/wedalk/config/SecurityConfig.java` (admin route restrictions)
- `backend/WedaLK/demo/src/main/java/lk/wedalk/verification/controller/VerificationController.java` (admin-only verification status update + forged status protection)
- `backend/WedaLK/demo/src/main/java/lk/wedalk/disputes/controller/DisputeController.java` (admin-only dispute resolve endpoint)
- `backend/WedaLK/demo/src/main/java/lk/wedalk/disputes/service/DisputeService.java` (server-side `RESOLVED` enforcement)

### Documentation

- `docs/SCRUM-95-Implementation.md` (this document)

---

## Manual Test Cases (aligned with ACs)

### AC1 — Worker/Seeker access blocked

1. Authenticate as `WORKER` (repeat with `SEEKER`).
2. Call `PUT /api/verification/{id}/status`.
3. Confirm response is **403 Forbidden**.
4. Call `PUT /api/disputes/{id}/resolve`.
5. Confirm response is **403 Forbidden**.

### AC2 — Admin verification approval/rejection succeeds

1. Authenticate as `ADMIN`.
2. Call `PUT /api/verification/{id}/status?approve=true` with optional `adminNotes` body.
3. Confirm response is success and verification is updated.
4. Repeat with `approve=false` and confirm rejection flow succeeds.

### AC3 — Forged verification status payload is ignored

1. Authenticate as non-admin (`WORKER` or `SEEKER`).
2. Send `PUT /api/verification/{id}/status` with forged payload such as `{ "status": "APPROVED" }`.
3. Confirm request is blocked (**403**) and no status change occurs.
4. Authenticate as `ADMIN` and send mismatched payload status value.
5. Confirm server-side decision path controls final state (not client `status` field).

### Dispute resolution success and strict status control

1. Authenticate as `ADMIN`.
2. Call `PUT /api/disputes/{id}/resolve` with `{ "resolution": "Resolved after review" }`.
3. Confirm dispute status becomes `RESOLVED`.
4. Verify client cannot set arbitrary dispute status values through payload.
