# SCRUM-109 — Admin User List

## Overview

This document describes the implementation of **SCRUM-109**:

**User Story:** As an Administrator, I want to view a list of users, so that I can monitor platform usage.

The feature adds an admin-only user management screen that lists registered platform users, supports searching and filtering, and displays an empty state when no matching users are found.

---

## Acceptance Criteria Coverage

### AC1 — View User List

**Given** an authenticated administrator is using the platform  
**When** they open User Management  
**Then** all registered users are displayed with key details

Implemented by:

- `GET /api/admin/users`
- `AdminService.getAllUsers(...)`
- `UserManagementPage.jsx` table with name, email, phone, role, district, status, and joined date

### AC2 — Search and Filter Users

**Given** an authenticated administrator is viewing users  
**When** they enter search text or select filters  
**Then** the user records are filtered accordingly

Implemented by:

- Backend query parameters: `search`, `role`, and `status`
- Search matches name, email, district, or phone number
- Role filters support `SEEKER`, `WORKER`, and `ADMIN`
- Status filters support `ACTIVE` and `SUSPENDED`

### AC3 — Empty User State

**Given** there are no users or no matching filtered results  
**When** the user list is rendered  
**Then** an empty state message is shown

Implemented by:

- `EmptyState` in `UserManagementPage.jsx`
- Message: `No users found.`

---

## Backend

### Endpoint

| Method | Endpoint | Access | Purpose |
| ------ | -------- | ------ | ------- |
| `GET` | `/api/admin/users?search=&role=&status=` | ADMIN | List and filter registered users |

### Response

The endpoint returns the standard `ApiResponse` wrapper:

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": 1,
      "fullName": "Test Seeker",
      "email": "seeker@test.com",
      "phoneNumber": "0771234567",
      "district": "Colombo",
      "role": "SEEKER",
      "isSuspended": false,
      "createdAt": "2026-04-22T10:00:00"
    }
  ]
}
```

### Security

- The endpoint is protected by the existing `/api/admin/**` rule in `SecurityConfig`
- Only `ADMIN` users can access it

---

## Frontend

### Admin User Management Page

Implemented `frontend/src/pages/admin/UserManagementPage.jsx`:

- Search input
- Role filter
- Status filter
- Loading state
- Error state
- Empty state
- Responsive table for user records

### Routing

Added protected admin route:

```jsx
<Route path="/admin/users" element={<UserManagementPage />} />
```

### Dashboard Access

Updated `AdminDashboard.jsx`:

- Added user monitoring stat card
- Added `User Management` quick action link

---

## Files Changed

### Backend

- `backend/WedaLK/demo/src/main/java/lk/wedalk/admin/controller/AdminController.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/admin/service/AdminService.java`

### Frontend

- `frontend/src/services/adminService.js`
- `frontend/src/pages/admin/UserManagementPage.jsx`
- `frontend/src/pages/admin/AdminDashboard.jsx`
- `frontend/src/App.js`

### Documentation

- `docs/SCRUM-109-Implementation.md`

---

## Manual Test Cases

1. Log in as `ADMIN` and open `/admin/users`.
2. Confirm registered users are displayed.
3. Search by user name and confirm matching results are shown.
4. Search by email and confirm matching results are shown.
5. Filter by `SEEKER`, `WORKER`, and `ADMIN`.
6. Filter by `ACTIVE` and `SUSPENDED`.
7. Use a search/filter combination with no matches and confirm `No users found.` appears.
8. Log in as a non-admin and confirm admin route access is blocked.

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
