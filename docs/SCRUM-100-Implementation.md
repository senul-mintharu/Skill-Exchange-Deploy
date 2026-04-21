# SCRUM-100 — Regenerate or Refine AI Suggestions

## Overview

This document describes the implementation of **SCRUM-100**:

**User Story:** As a Service Seeker, I want to regenerate or refine the AI suggestion, so that I can improve the description if the first result is not good enough.

SCRUM-100 builds on the AI Assist flow from SCRUM-98 and the editable AI text behavior from SCRUM-99. Seekers can now click the AI generation button multiple times. Each click starts a new backend AI request, returns the normal loading state, and replaces the current description with a fresh generated draft.

---

## Acceptance Criteria Coverage

### AC1 — Re-trigger Generation

**Given** the description box already contains AI-generated text  
**When** the Seeker clicks the AI generation button again  
**Then** the button returns to a loading state  
**And** the system requests a brand new description draft from the AI

Implemented by:

- Allowing the AI button to be clicked again after `aiLoading` returns to false
- Tracking whether an AI draft has been generated with `hasAiDraft`
- Updating the button label from `AI Assist` to `Regenerate Draft`
- Clearing stale AI and character-limit warnings before each generation request

### AC2 — Replace Existing Text

**Given** a new AI draft has been successfully generated  
**When** the text is returned to the frontend  
**Then** the new text completely overwrites the old AI draft in the description box

Implemented by:

- Reusing the existing `handleChange('description', generatedDraft)` path
- Sending the current description as `existingDescription` context to the backend
- Updating the Gemini prompt so existing notes are rewritten as a fresh complete description instead of appended

---

## Frontend

Updated `frontend/src/pages/seeker/CreateRequestPage.jsx`:

- Added `hasAiDraft` state
- Changed the AI button label to `Regenerate Draft` after the first successful generation
- Cleared stale warning banners before each new AI request
- Preserved the existing loading state and textarea disabling while generation is in progress
- Continued replacing the whole description field with the newest generated draft

---

## Backend

Updated `backend/WedaLK/demo/src/main/java/lk/wedalk/requests/service/AiDescriptionService.java`:

- Refined the Gemini system instruction so repeated generations rewrite existing notes as a fresh full description
- Kept the existing Gemini API integration, timeout handling, provider error handling, and 2000-character truncation

---

## Manual Test Cases

1. Enter title and category, click `AI Assist`, and confirm the button enters the loading state.
2. Confirm the first generated draft appears in the description textarea.
3. Click `Regenerate Draft` and confirm the button enters the loading state again.
4. Confirm the second generated draft replaces the first draft completely.
5. Manually edit the draft, click `Regenerate Draft`, and confirm the edited text is replaced by the new generated draft.
6. Confirm the textarea is disabled only while generation is in progress.
7. Confirm the character counter and 2000-character protections remain active.

---

## Files Changed

### Backend

- `backend/WedaLK/demo/src/main/java/lk/wedalk/requests/service/AiDescriptionService.java`

### Frontend

- `frontend/src/pages/seeker/CreateRequestPage.jsx`

### Documentation

- `docs/SCRUM-100-Implementation.md`

---

## Verification

Run these checks before merging:

```powershell
cd F:\Projects\Skill-Exchange\backend\WedaLK\demo
mvn test
```

```powershell
cd F:\Projects\Skill-Exchange\frontend
npm run lint
npm run build
npm test -- --watchAll=false --runInBand
```

---

## Notes

- This story does not add a new endpoint.
- Each regeneration call uses the existing `POST /api/requests/ai-description` endpoint.
- The backend receives the current textarea content as context, but the frontend always replaces the textarea with the newly returned draft.
