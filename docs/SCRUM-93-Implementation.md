# SCRUM-93: Restrict Verification Submission to Authenticated Workers — Implementation

## Overview

This document describes the implementation of **SCRUM-93**:

**User Story:** As a platform owner, I want verification submission to be restricted to authenticated workers, so that only valid worker identities can submit verification documents.

Security purpose of SCRUM-93:

- Enforce **RBAC (Role-Based Access Control)** for verification submission
- Ensure only authenticated users can access verification endpoints
- Ensure only users with role **WORKER** can submit verification
- Prevent identity spoofing by deriving worker identity from the authenticated JWT context
- Reject malformed request payloads before any persistence logic executes

Out of scope:

- Changes to login/authentication flow
- Changes to non-verification endpoints

---

## Acceptance Criteria Coverage (Gherkin)

### AC1 — Reject unauthenticated requests (401)

**Given** a client calls `POST /api/verification` without a valid Bearer token  
**When** Spring Security processes the request  
**Then** the request is rejected with **401 Unauthorized**

Implemented by:

- JWT auth filter in the security chain (`JwtAuthenticationFilter`)
- Security entry point configured to return 401 for unauthenticated access
- Verification endpoints require authentication in `SecurityConfig`

### AC2 — Reject unauthorized roles (403)

**Given** an authenticated user with role other than `WORKER` (e.g., `SEEKER` or `ADMIN`)  
**When** the user calls `POST /api/verification`  
**Then** the request is rejected with **403 Forbidden**

Implemented by:

- Route-level RBAC in `SecurityConfig`: `POST /api/verification` requires role `WORKER`
- Defense-in-depth role check in `VerificationController` using `SecurityContextHolder`

### AC3 — Accept valid worker submissions

**Given** an authenticated user with role `WORKER` and a valid payload  
**When** the worker calls `POST /api/verification`  
**Then** the submission is accepted and success is returned

Implemented by:

- Controller extracts authenticated user from security context
- Worker `userId` is resolved server-side from authenticated identity (not from client input)
- Submission call passes authenticated `workerId` into verification service invocation
- Response returns `201 Created` with success message

### AC4 — Handle malformed requests (400)

**Given** a worker sends an invalid payload (missing document file or required metadata)  
**When** request body validation runs  
**Then** the request is rejected with **400 Bad Request** and a clear validation message

Implemented by:

- `@Valid` request body on verification submit endpoint
- DTO constraints in `VerificationSubmitRequest`
- Global exception handler for `MethodArgumentNotValidException` returning standard `ApiResponse.error(...)`
- Validation failure occurs before service invocation, so no database save path is executed

---

## Backend

### SecurityConfig updates

`SecurityConfig` enforces verification endpoint security:

- `POST /api/verification` (and trailing slash variant) requires `ROLE_WORKER`
- `/api/verification/**` requires authentication

This ensures authentication + authorization are enforced at the security layer before controller/service execution.

### JWT validation

`JwtAuthenticationFilter`:

- Reads `Authorization` header
- Validates `Bearer` token
- Extracts username and loads user details
- Sets authenticated principal and authorities in `SecurityContextHolder`

This enables downstream role and identity checks in both Spring Security and controller logic.

### Role-based restriction

Role restriction is enforced in two layers:

- Primary: route-level RBAC in `SecurityConfig`
- Secondary: controller-level role check (`WORKER` only) in verification submission endpoint

This defense-in-depth approach prevents unauthorized role access even if endpoint wiring changes later.

### Controller validation

`VerificationController`:

- Uses `@Valid` on `VerificationSubmitRequest`
- Uses authenticated principal from `SecurityContextHolder`
- Resolves authenticated user ID from `UserRepository`
- Forwards only server-derived `workerId` in submission call

This prevents spoofing of `workerId` from client payload.

---

## Endpoint

| Method | Endpoint            | Access Rule                   | Purpose                                     |
| ------ | ------------------- | ----------------------------- | ------------------------------------------- |
| `POST` | `/api/verification` | Authenticated + `ROLE_WORKER` | Submit worker verification payload securely |

---

## Files Updated

### Backend

- `backend/WedaLK/demo/src/main/java/lk/wedalk/config/SecurityConfig.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/security/JwtAuthenticationFilter.java` (used in security flow)
- `backend/WedaLK/demo/src/main/java/lk/wedalk/verification/controller/VerificationController.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/verification/dto/VerificationSubmitRequest.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/common/GlobalExceptionHandler.java` (validation error response handling)

---

## Error Response Format

Validation and security errors are returned in the standard API wrapper:

```json
{
  "success": false,
  "message": "<clear error message>",
  "data": null
}
```

Typical messages:

- `Unauthorized` for missing/invalid authentication context (401)
- `Forbidden` / role restriction messages for unauthorized roles (403)
- `Document file is required` or `Metadata is required` for validation failures (400)

---

## Manual Test Cases

### 1. No token -> 401

1. Call `POST /api/verification` without `Authorization` header.
2. Verify response status is **401**.
3. Verify error message indicates unauthorized access.

### 2. Invalid token -> 401

1. Call `POST /api/verification` with malformed or expired Bearer token.
2. Verify response status is **401**.
3. Verify request is not processed as authenticated.

### 3. Seeker/Admin token -> 403

1. Call `POST /api/verification` with valid token for `SEEKER` or `ADMIN`.
2. Verify response status is **403**.
3. Verify submission is blocked.

### 4. Worker valid payload -> success

1. Call `POST /api/verification` with valid `WORKER` token and valid payload.
2. Verify response status is **201** (or configured success status).
3. Verify success response body is returned.

### 5. Worker invalid payload -> 400

1. Call `POST /api/verification` with valid `WORKER` token but missing `documentFile` or `metadata`.
2. Verify response status is **400**.
4. Verify no persistence path is executed for invalid request.

---

## Post-Audit Fixes

- Added defensive audit logging (`log.warn`) in `VerificationController` to capture and record unauthorized verification submission attempts.
- Augmented the `VerificationController`'s internal identity resolution method to correctly cascade verification status assignments upon successful profile update.
- Updated `WorkerProfileResponse` to include the canonical `verificationStatus` directly from the base `User` entity to maintain single source of truth.
