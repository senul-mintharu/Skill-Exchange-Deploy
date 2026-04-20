# API report — SCRUM-83 through SCRUM-96 (trust, reviews, disputes)

**Scope:** Backend under `backend/WedaLK/demo`, Spring Boot.  
**Auth:** Stateless JWT — send `Authorization: Bearer <token>` unless noted as public.  
**Common success envelope:** Most endpoints return JSON shaped as:

```json
{ "success": true, "message": "…", "data": … }
```

Errors from `GlobalExceptionHandler` use `success: false`, `message` with details, `data: null`, and HTTP **400** (bad request / validation), **403** (`UnauthorizedException` in services — naming is historical), **404** (not found).

**Spring Security vs service layer:** Missing/invalid JWT typically yields **401** with plain servlet message (`Unauthorized`). Role or business-rule denials often yield **403** with `ApiResponse` body (`Forbidden` from filter, or `UnauthorizedException` → **403**).

---

## Quick map: Jira story → primary APIs

| Story | Theme | Primary endpoints |
|-------|--------|-------------------|
| **SCRUM-83** | Worker: submit verification, see status | `POST /api/verification`, `GET /api/verification/my` |
| **SCRUM-84** | Admin: review submissions | `GET /api/verification/pending`, `GET /api/verification/{id}/document`, `PUT /api/verification/{id}/status` |
| **SCRUM-85** | Seeker: verified badge on profile | `GET /api/profiles/{id}`, `GET /api/profiles/user/{userId}` (`verificationStatus` on `WorkerProfileResponse`) |
| **SCRUM-86** | Seeker: review after completion | `POST /api/reviews` |
| **SCRUM-87** | Seeker: my reviews | `GET /api/reviews/my` |
| **SCRUM-88** | Seeker: reviews on worker profile | `GET /api/reviews/worker/{workerId}` (+ profile/average if composed in UI) |
| **SCRUM-89** | Seeker: job not completed (+ reason via dispute) | `PUT /api/requests/{requestId}/status`, `POST /api/disputes` |
| **SCRUM-90** | Admin: open disputes list | `GET /api/disputes/open` |
| **SCRUM-91** | Admin: resolve dispute | `PUT /api/disputes/{id}/resolve` |
| **SCRUM-92** | Worker: my disputes | `GET /api/disputes/worker` |
| **SCRUM-93** | RBAC: verification submit | `POST /api/verification` (WORKER); see SecurityConfig |
| **SCRUM-94** | RBAC: review/dispute ownership | `POST /api/reviews`, `POST /api/disputes` |
| **SCRUM-95** | RBAC: admin verification & dispute resolution | `PUT /api/verification/{id}/status`, document fetch, `GET /api/disputes/open`, `PUT /api/disputes/{id}/resolve` |
| **SCRUM-96** | UX: clear errors for trust actions | No new routes — consume **401/403** and `ApiResponse` messages; see §Error behaviour |

---

## Authentication

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| POST | `/api/auth/register` | Public | Creates user |
| POST | `/api/auth/login` | Public | Returns JWT for subsequent calls |
| GET | `/api/health` | Public | Health check |

---

## Verification (SCRUM-83, 84, 85, 93, 95)

| Method | Path | Roles (config + controller) | Request | Response data |
|--------|------|------------------------------|---------|---------------|
| POST | `/api/verification` | **WORKER** | `multipart/form-data`: field `document` (`MultipartFile`) | `VerificationSubmitResponse`: `verificationStatus`, `documentName` |
| GET | `/api/verification/my` | **WORKER** | — | `VerificationStatusResponse` (status, document metadata, timestamps, optional admin notes) |
| GET | `/api/verification/pending` | **ADMIN** | — | `List<VerificationStatusResponse>` (includes worker id/name/email for queue) |
| GET | `/api/verification/{id}/document` | **ADMIN** | — | Raw file stream (`Content-Disposition` inline; content-type from stored file) |
| PUT | `/api/verification/{id}/status` | **ADMIN** | Query: `approve` (boolean). Body (optional JSON map): `adminNotes` (string). **Server ignores any client “status” field** — decision is only from `approve`. | `data` null on success |

**Typical errors**

- Missing file: **400** — `"Document file is required"`.
- Non-worker submit: **403** — `"Only workers can submit verification"` (controller) or Spring **403** if role wrong.
- Oversized upload: **400** — `"File too large"` (`MaxUploadSizeExceededException`).

---

## Worker profiles — verification flag (SCRUM-85)

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/profiles` | Authenticated (`anyRequest`) | `ApiResponse<List<WorkerProfileResponse>>` |
| GET | `/api/profiles/{id}` | Authenticated | `WorkerProfileResponse` (**not** wrapped in `ApiResponse` in current controller) |
| GET | `/api/profiles/user/{userId}` | Authenticated | `WorkerProfileResponse` |

**`WorkerProfileResponse` fields relevant to SCRUM-85:** `verificationStatus` (e.g. `APPROVED`, `PENDING`, `REJECTED`, or null/NONE semantics from service).

---

## Reviews (SCRUM-86, 87, 88, 94)

| Method | Path | Auth | Request body | Response data |
|--------|------|------|--------------|---------------|
| POST | `/api/reviews` | Authenticated seeker (service enforces **SEEKER** + ownership) | `ReviewCreateRequest`: `requestId` (long), `rating` (1–5), `comment` (optional string) | `ReviewResponse` |
| GET | `/api/reviews/worker/{workerId}` | Authenticated | — | `List<ReviewResponse>` |
| GET | `/api/reviews/my` | Authenticated | — | `List<ReviewResponse>` (seeker’s reviews; repository orders by `createdAt` **desc**) |

**Service rules (SCRUM-86 / 94)**

- Only **SEEKER** can create a review; workers get **403** with message like `"Only seekers can submit reviews"`.
- Seeker must own the **ServiceRequest**; otherwise **403** — permission message on that job.
- Request must be **COMPLETED**; else **400**.
- Duplicate review for same request: **400**.

**SCRUM-88 note:** `GET /api/reviews/worker/{workerId}` uses `findByWorkerId` without an explicit `OrderBy` in the repository — sort order for “newest first” should be verified in data or UI if required by AC.

---

## Service requests — completion / not completed (SCRUM-89)

| Method | Path | Auth | Request body | Notes |
|--------|------|------|--------------|--------|
| PUT | `/api/requests/{requestId}/status` | **SEEKER** (Spring) | `RequestStatusUpdateRequest`: `{ "status": "COMPLETED" \| "NOT_COMPLETED" }` | Only from **ASSIGNED**; seeker must own the request. |

**Dispute + reason (SCRUM-89 /90 / 94):** A structured **reason** is submitted via **dispute** creation, not the status DTO.

| Method | Path | Auth | Request body |
|--------|------|------|--------------|
| POST | `/api/disputes` | Authenticated (**SEEKER** enforced in service) | `DisputeCreateRequest`: `requestId`, `reason` (required) |

**`DisputeService.createDispute` behaviour**

- Sets request to **NOT_COMPLETED** if it was **ASSIGNED** (and creates **OPEN** dispute).
- Validates seeker ownership; workers blocked with **403**.
- **400** if dispute already exists, no assigned worker, or invalid status for dispute.

---

## Disputes — read & resolve (SCRUM-90, 91, 92, 95)

| Method | Path | Roles | Response data |
|--------|------|--------|----------------|
| GET | `/api/disputes/{id}` | Authenticated | `DisputeResponse` |
| GET | `/api/disputes/request/{requestId}` | Authenticated (seeker, assigned worker, or admin per service) | `DisputeResponse` |
| GET | `/api/disputes/open` | **ADMIN** | `PagedResponse<DisputeResponse>` — query: `page` (default 0), `size` (default 10) |
| GET | `/api/disputes/my` | Authenticated (seeker) | `List<DisputeResponse>` |
| GET | `/api/disputes/worker` | **WORKER** | `List<DisputeResponse>` (SCRUM-92 — open + resolved for assigned jobs) |
| PUT | `/api/disputes/{id}/resolve` | **ADMIN** | Body JSON map: `resolution` (string, **required** non-blank) → `DisputeResponse` |

**`DisputeResponse` fields (subset):** `id`, `requestId`, `requestTitle`, `seekerId`, `seekerName`, `workerId`, `workerName`, `seekerReason`, `status`, `resolution`, `resolvedAt`, `createdAt`, etc.

**SCRUM-91:** Empty `resolution` → **400** `"resolution is required"` from controller.

---

## Error behaviour (SCRUM-96)

| Situation | Typical HTTP | Body |
|-----------|--------------|------|
| No / bad JWT on protected route | **401** | Servlet default (`Unauthorized`) |
| Wrong Spring Security role | **403** | Often plain `Forbidden` |
| Business rule / ownership (`UnauthorizedException`) | **403** | `ApiResponse.error(message)` with specific text (e.g. only seekers, wrong job owner) |
| Validation (`@Valid`) | **400** | First field error message in `ApiResponse` |
| Not found | **404** | `ApiResponse.error` |

Frontend stories (SCRUM-96) map these to `ErrorBanner` or similar; exact copy is a UI concern.

---

## Related core APIs (hiring flow, for test setup)

| Method | Path | Role (Spring) | Purpose |
|--------|------|---------------|---------|
| POST | `/api/requests` | SEEKER | Create request |
| POST | `/api/quotes` | WORKER | Submit quotation |
| PATCH | `/api/quotes/{quoteId}/accept` | SEEKER | Accept → **ASSIGNED** |
| GET | `/api/requests/my` | SEEKER | Seeker’s requests |

---

## File references (implementation)

- Verification: `lk.wedalk.verification.controller.VerificationController`
- Reviews: `lk.wedalk.reviews.controller.ReviewController`
- Disputes: `lk.wedalk.disputes.controller.DisputeController`
- Requests: `lk.wedalk.requests.controller.ServiceRequestController`
- Profiles: `lk.wedalk.profiles.controller.WorkerProfileController`
- Security: `lk.wedalk.config.SecurityConfig`
- Errors: `lk.wedalk.common.GlobalExceptionHandler`

---

*Generated from codebase review; run integration tests or Postman against a live instance to confirm runtime behaviour and response bodies.*
