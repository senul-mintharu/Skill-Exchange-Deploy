# SCRUM-99 — Edit AI-Generated Job Descriptions

## Overview

This document describes the implementation of **SCRUM-99**:

**User Story:** As a Service Seeker, I want to edit the AI-generated description before submitting, so that the final request reflects my real needs.

SCRUM-99 builds on SCRUM-98. After the AI assistant fills the request description, the seeker can still click into the textarea, type, delete, paste, and refine the generated draft before posting the job. The existing 2000-character description limit remains enforced during all manual edits.

---

## Acceptance Criteria Coverage

### AC1 — Allow Manual Edits to AI Text

**Given** the AI has populated the description text box  
**When** the Seeker clicks into the text box  
**Then** they can freely type, delete, or modify the generated text

Implemented by:

- Keeping the description textarea bound to normal editable React state
- Disabling the textarea only while `aiLoading` is active
- Re-enabling the textarea immediately after AI generation completes

### AC2 — Enforce Limits on Edited Text

**Given** a Seeker is manually editing the AI-generated description  
**When** typing or pasting text would push the total length above 2000 characters  
**Then** the system prevents the extra characters from being added  
**And** displays a warning about the character limit

Implemented by:

- `handleDescriptionChange(...)` to cap any over-limit value at 2000 characters
- `handleDescriptionBeforeInput(...)` to block extra typed characters before insertion
- `handleDescriptionPaste(...)` to insert only the allowed portion of pasted text
- A warning `ErrorBanner` stating `Description cannot exceed 2000 characters.`

---

## Frontend

### Request Creation Form

Updated `frontend/src/pages/seeker/CreateRequestPage.jsx`:

- Added `descriptionLimitWarning` state
- Added a dedicated description edit handler
- Added before-input protection for over-limit typing
- Added paste protection for over-limit pasted content
- Added warning feedback using the existing `ErrorBanner.jsx`
- Preserved the existing character counter and `maxLength={2000}`

### Behavior

- AI-generated text remains editable after generation
- Manual edits continue to update the live preview and review step
- The character counter never exceeds `2000 / 2000`
- Pasted content is truncated to fit the remaining available characters

---

## Backend

No backend changes were required for SCRUM-99.

Existing backend protections remain active:

- `RequestCreateRequest.description` uses `@Size(max = 2000)`
- `ServiceRequest.description` is stored with `@Column(length = 2000)`
- SCRUM-98 AI output is truncated before it is returned to the frontend

---

## Manual Test Cases

1. Generate an AI description, click into the textarea, type extra text, and confirm the text updates normally.
2. Generate an AI description, delete part of the generated text, and confirm the field remains editable.
3. Paste text that keeps the description under 2000 characters and confirm it is accepted.
4. Paste text that would exceed 2000 characters and confirm only the allowed portion is inserted.
5. Type while the description is already at 2000 characters and confirm extra characters are blocked.
6. Confirm the warning `Description cannot exceed 2000 characters.` appears when the limit is exceeded.
7. Submit an edited AI-generated description and confirm the request creation flow still works.

---

## Files Changed

### Frontend

- `frontend/src/pages/seeker/CreateRequestPage.jsx`

### Documentation

- `docs/SCRUM-99-Implementation.md`

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

- This story does not change the AI provider integration.
- This story does not change the backend request creation API.
- SCRUM-99 focuses on preserving user control after AI generation and keeping the existing validation behavior intact.
