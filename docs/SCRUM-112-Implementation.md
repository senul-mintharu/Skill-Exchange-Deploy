# SCRUM-112 — Admin Account Deactivation / Reactivation

## Overview

This document describes the implementation of **SCRUM-112**:

**User Story:** As an Administrator, I want to deactivate or reactivate user accounts, so that I can handle misuse or abuse.

This feature adds a moderation capability to the Admin portal, allowing platform administrators to immediately suspend (deactivate) or reactivate user accounts. The feature is exposed via a new column in the `User Management` table.

---

## Acceptance Criteria Coverage

### AC1 — Deactivate Account

**Given** the Admin is on the User Management page  
**And** an account is currently `Active`  
**When** the Admin clicks **Deactivate**  
**Then** the account status is updated to `Suspended`  
**And** the UI immediately reflects the new status without a full reload  

Implemented by:
- Adding the `toggleUserStatus` function to flip the `isSuspended` flag via `PATCH /api/admin/users/{id}/status`.
- Adding a "Deactivate" action button for active rows.

### AC2 — Reactivate Account

**Given** the Admin is on the User Management page  
**And** an account is currently `Suspended`  
**When** the Admin clicks **Reactivate**  
**Then** the account status is updated to `Active`  
**And** the UI immediately reflects the new status without a full reload  

Implemented by:
- Reusing the `toggleUserStatus` function to flip the flag back.
- Adding a "Reactivate" action button for suspended rows.

### AC3 — Show Account Status

**Given** the Admin is on the User Management page  
**When** viewing the users table  
**Then** the status pill clearly displays either `Active` or `Suspended`  

Implemented by:
- Retaining and utilizing the existing `StatusPill` logic in `UserManagementPage.jsx`.

---

## Security & Architecture Guards

### Backend Protection
- **Role Check:** The new endpoint `PATCH /api/admin/users/{id}/status` is covered by the existing `/api/admin/**` rule requiring `ROLE_ADMIN` in `SecurityConfig.java`.
- **Anti-Escalation:** An explicit guard was added to `AdminService.java` to prevent the suspension of `ADMIN` accounts. A `BadRequestException` is thrown if an admin account is targeted.

### Frontend Protection
- **Self-lockout Prevention:** The UI dynamically disables the action button if the row being rendered belongs to the currently logged-in Admin, preventing accidental self-suspension.
- **Visual Cues:** Admin accounts display a "Protected" badge instead of a toggle button.

---

## Technical Details

### Backend Changes
- **`AdminController.java`**: Added the `PATCH` endpoint, returning the updated `UserDto` wrapped in an `ApiResponse`. Needs no request body since it purely flips the server-side state.
- **`AdminService.java`**: Added `toggleUserStatus` method, annotated with `@Transactional`. It looks up the user, applies the anti-escalation guard, flips `isSuspended`, and persists to the database.

### Frontend Changes
- **`adminService.js`**: Exported the `toggleUserStatus` function invoking `apiClient.patch`.
- **`UserManagementPage.jsx`**: 
  - Added an `actionLoading` `Set` to handle per-row loading states individually.
  - Implemented an optimistic-like in-place UI update on success.
  - Handled errors gracefully using the existing `ErrorBanner` component.

---

## Manual Test Cases

1. Log in as an Administrator.
2. Navigate to `User Management` via the dashboard.
3. Locate an `Active` Seeker or Worker account. Confirm the **Deactivate** button is red and active.
4. Click **Deactivate**.
   - **Expected:** Button shows a spinner, then turns into a green **Reactivate** button. Status pill turns yellow (`Suspended`).
5. Refresh the page.
   - **Expected:** Status remains `Suspended`.
6. Click **Reactivate** on the suspended account.
   - **Expected:** Button shows a spinner, then turns into a red **Deactivate** button. Status pill turns green (`Active`).
7. Locate an `ADMIN` account.
   - **Expected:** Action column shows "Protected" in italic text. No button is available.

---

## Verification Run
- `mvnw clean package -DskipTests` -> **BUILD SUCCESS**
- `npm run build` -> **Compiled successfully**
