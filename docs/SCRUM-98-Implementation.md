# SCRUM-98 — AI-Assisted Job Description Drafting

## Overview

This document describes the implementation of **SCRUM-98**:

**User Story:** As a Service Seeker, I want AI assistance to help me draft a clear job description, so that workers can better understand my request.

The feature adds an AI Assist flow to the seeker request creation screen. It uses the job title and category as required context, generates a draft description through the backend, truncates the output to the 2000-character service request limit, and shows friendly error feedback when the provider is unavailable.

---

## Acceptance Criteria Coverage

### AC1 — Require Context Before Generation

**Given** a Seeker is filling out a new job request  
**When** they click the `AI Assist` button without entering a Job Title or Category  
**Then** generation is blocked  
**And** the system displays: `Please enter a Job Title and Category first so the AI understands your needs.`

Implemented by:

- Frontend validation in `CreateRequestPage.jsx`
- Button click guard before any backend request is made

### AC2 — Trigger Generation and UI Loading State

**Given** a Seeker has provided a Job Title and Category  
**When** they click `AI Assist`  
**Then** the button enters a loading state  
**And** the description textarea is disabled while the AI request is processing

Implemented by:

- `aiLoading` state in `CreateRequestPage.jsx`
- Disabled textarea during request in flight
- Loading label/spinner on the AI Assist button

### AC3 — Successful Generation and Population

**Given** the AI request succeeds  
**When** the backend returns generated text  
**Then** the description field is populated automatically  
**And** the output is truncated to 2000 characters if needed  
**And** the form becomes editable again

Implemented by:

- Backend AI service truncation before response
- Frontend population of the `description` field
- The textarea is re-enabled after the request completes

### AC4 — Handle Generation Failures Gracefully

**Given** the AI request fails due to timeout, connection issue, quota, or provider error  
**When** the failure occurs  
**Then** loading ends  
**And** the system shows a dismissible error banner with:
  `AI generation is currently unavailable. Please write your description manually or try again later.`

Implemented by:

- `AiGenerationException` mapped to `503 Service Unavailable`
- `ErrorBanner.jsx` on the frontend
- Safe backend logging for provider status and error details

---

## Backend

### AI Service

- Added `AiDescriptionService` to call Gemini `generateContent`
- Accepts title, category, location area, urgency, and optional existing draft notes
- Uses Gemini environment configuration:
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL`
  - `GEMINI_BASE_URL`
  - `AI_TIMEOUT_MS`
- Enforces a 2000-character limit before returning the draft
- Returns a controlled `503` when Gemini is unavailable

### API Endpoint

| Method | Endpoint | Access | Purpose |
| ------ | -------- | ------ | ------- |
| `POST` | `/api/requests/ai-description` | SEEKER | Generate an AI draft for a request description |

### Security

- Added role protection for `POST /api/requests/ai-description`
- Only `SEEKER` users can trigger the AI assist flow

### Error Handling

- Added `AiGenerationException` to the global exception handler
- The backend returns the same `ApiResponse` shape used across the app

---

## Frontend

### Request Form

- Added an `AI Assist` button next to the description textarea
- Prevents generation until title and category are filled
- Shows a loading state while the backend request runs
- Disables the description textarea during generation
- Inserts the returned draft into the textarea on success
- Displays a dismissible `ErrorBanner` on failure

### Service Layer

- Added `generateRequestDescription(...)` to `frontend/src/services/requestService.js`
- Reuses the existing `apiClient` and JWT auth flow

---

## Configuration

### Backend environment values

```properties
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/models
AI_TIMEOUT_MS=10000
```

Notes:

- Do not hardcode real API keys in `application.properties`
- Restart the backend after changing environment variables

---

## Files Changed

### Backend

- `backend/WedaLK/demo/src/main/java/lk/wedalk/requests/service/AiDescriptionService.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/requests/controller/ServiceRequestController.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/common/GlobalExceptionHandler.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/config/SecurityConfig.java`
- `backend/WedaLK/demo/src/main/resources/application.properties`
- `backend/WedaLK/demo/src/test/java/lk/wedalk/WedaLkApplicationTests.java`

### Frontend

- `frontend/src/pages/seeker/CreateRequestPage.jsx`
- `frontend/src/services/requestService.js`

### Documentation

- `docs/API-Documentation.md`
- `docs/SCRUM-98-Implementation.md`
- `AGENTS.md`

---

## Verification

The following checks passed after implementation:

- `mvn test`
- `npm run lint`
- `npm run build`
- `npm test -- --watchAll=false --runInBand`

---

## Notes

- The implementation was switched from OpenAI to Gemini because the project needed a free-key workflow for the sprint demo.
- Gemini provider errors are surfaced in backend logs, while the frontend keeps the user-facing message simple and consistent.
