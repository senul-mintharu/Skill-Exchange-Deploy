# SCRUM-115 — Improved form validation messages

**Jira:** [SCRUM-115](https://vimukthiherath123.atlassian.net/browse/SCRUM-115)  
**Status:** Implemented (code)  
**Sprint 4 (usability):** Pairs with SCRUM-113–114 (other UX stories).

## User story

As a user, I want improved form validation messages, so that I can correct input errors easily.

## What was implemented

1. **`frontend/src/utils/formValidationMessages.js`**
   - `getApiErrorMessage(err, fallback)` — network failures, 401 session hint, and friendly mappings for common API messages (duplicate email, file size, required document, login failure wording).
   - `validateEmailFormat` / `validatePasswordLength` — reusable client checks with clear, short copy.

2. **Register (`RegisterPage.jsx`)**
   - Inline field errors under Full name, Email, Password, Confirm password (not only a single top banner).
   - `noValidate` to allow custom messages instead of browser defaults.
   - Duplicate-email API errors are shown on the **email** field.

3. **Login (`LoginPage.jsx`)**
   - Email format validation with message under the email field; password required message; API errors run through `getApiErrorMessage`.

4. **Create request (`CreateRequestPage.jsx`)**
   - Edit and create+payment flows use `getApiErrorMessage` for consistent, actionable copy when the API rejects input.

5. **Submit quote (`SubmitQuotePage.jsx`)**
   - Non-duplicate failures use `getApiErrorMessage` with a clear fallback.

6. **Worker verification (`VerificationPage.jsx`)**
   - Clearer client messages for file size / type / missing file; upload errors use `getApiErrorMessage` with `resolveHttpError` as secondary fallback for RBAC-style responses.

## Files touched

- `frontend/src/utils/formValidationMessages.js` (new)
- `frontend/src/pages/auth/RegisterPage.jsx`
- `frontend/src/pages/auth/LoginPage.jsx`
- `frontend/src/pages/seeker/CreateRequestPage.jsx`
- `frontend/src/pages/worker/SubmitQuotePage.jsx`
- `frontend/src/pages/worker/VerificationPage.jsx`
- `docs/sprints/SCRUM-115.md` (this file)

## Verification

- Open Register / Login and trigger empty fields, bad email, short password, mismatch, and duplicate email (if available).
- Create request (edit + new with slip) and force an API error (e.g. invalid session) to see mapped messages.
- Submit quote with server error (e.g. closed request) to see updated banner text.
