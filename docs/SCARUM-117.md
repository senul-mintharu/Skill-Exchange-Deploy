# SCARUM-117 — Page Load Performance Improvements

## Overview

This document summarizes the implementation completed for **SCARUM-117**:

**User Story:** As a user, I want pages to load quickly under normal usage, so that the system feels responsive.

The work focused on reducing initial frontend payload, lowering unnecessary API traffic during search, and moving admin user filtering/search logic to database-side execution for better backend performance.

---

## What Was Implemented

### 1. Frontend Route-Level Code Splitting

Updated `frontend/src/App.js` to use:
- `React.lazy(...)` for page components
- `Suspense` fallback while route bundles load

**Impact:** Reduced initial JS bundle size and improved first-load responsiveness by loading page code on demand.

### 2. Debounced Admin User Search

Updated `frontend/src/pages/admin/UserManagementPage.jsx`:
- Added `debouncedSearch` state
- Added a `300ms` debounce before triggering user-list API requests

**Impact:** Prevented API calls on every keystroke and reduced request volume under normal typing.

### 3. Database-Side Admin User Filtering/Search

Updated backend user listing flow:
- `backend/WedaLK/demo/src/main/java/lk/wedalk/admin/service/AdminService.java`
  - Replaced in-memory `findAll().stream().filter(...)` logic
  - Delegated filtering/search/sort to repository query
- `backend/WedaLK/demo/src/main/java/lk/wedalk/users/repository/UserRepository.java`
  - Added `findAdminUsers(...)` JPQL query
  - Supports `search`, `role`, and `status` with `ORDER BY createdAt DESC`

**Impact:** Reduced memory usage and improved scalability of admin user listing.

### 4. DB Index Improvements for Users Table

Updated `backend/WedaLK/demo/src/main/java/lk/wedalk/users/model/User.java`:
- Added indexes for:
  - `role`
  - `is_suspended`
  - `created_at`
- Explicitly mapped:
  - `isSuspended -> is_suspended`
  - `createdAt -> created_at`

**Impact:** Faster filtering/sorting on common admin query paths.

### 5. HTTP Response Compression

Updated `backend/WedaLK/demo/src/main/resources/application.properties`:
- Enabled server compression
- Configured minimum response size and common compressible MIME types

**Impact:** Reduced response payload size over the network, improving perceived page/API responsiveness.

---

## Files Changed

- `frontend/src/App.js`
- `frontend/src/pages/admin/UserManagementPage.jsx`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/admin/service/AdminService.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/users/repository/UserRepository.java`
- `backend/WedaLK/demo/src/main/java/lk/wedalk/users/model/User.java`
- `backend/WedaLK/demo/src/main/resources/application.properties`
- `docs/SCARUM-117.md`

---

## Verification

After implementation, the following checks completed successfully:

- Backend: `mvn test`
- Frontend: `npm run lint`
- Frontend: `npm run build`
- Frontend: `npm test -- --watchAll=false --runInBand`

