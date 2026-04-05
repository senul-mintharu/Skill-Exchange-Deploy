# SCRUM-74: View Worker Public Profile from Browse List

## Overview

**User Story:** As a Service Seeker, I want to view a worker's public profile from the list, so that I can evaluate their suitability.

**Implementation Date:** 2026-03-22  
**Status:** ✅ Complete

---

## Acceptance Criteria

### AC1 — Navigate to worker profile ✅

**Given** a worker is displayed in the Browse Workers list  
**When** the seeker clicks on the worker's name or "View Profile"  
**Then** the system shall navigate to that worker's public profile page

**Implementation:**

- Updated worker cards on the Browse Workers page so the worker name links to `/workers/:id`
- Kept the existing `View Profile` CTA and made it an explicit route link to the same public profile page
- Navigation is handled with `react-router-dom` `Link` components

### AC2 — Display profile details ✅

**Given** the seeker is on a worker's public profile page  
**Then** the system shall display the worker's name, profile picture, skills, service area, and bio

**Implementation:**

- Public profile page loads worker data with `getProfileById(id)`
- Page displays:
  - Worker's full name
  - Profile image if available
  - Skills section
  - Service Areas section
  - Bio/About section
- Existing public profile UI was preserved; only missing functionality was added

### AC3 — Missing profile picture fallback ✅

**Given** a worker has not uploaded a profile picture  
**Then** the system shall display a default avatar placeholder

**Implementation:**

- Added optional `profilePictureUrl` support to the worker profile backend model and DTOs
- Public profile avatar now shows:
  - Uploaded image when `profilePictureUrl` exists
  - Existing initial-based avatar fallback when no image is available
- Browse Workers cards also support the same fallback behavior

### AC4 — Back navigation ✅

**Given** the seeker is viewing a worker profile  
**When** the seeker clicks "Back"  
**Then** the system shall return to the Browse Workers list

**Implementation:**

- Reused the existing public profile action area and changed the secondary button to `Back`
- `Back` uses `navigate(-1)` when browser history exists
- Falls back to `/browse-workers` when direct navigation/history is unavailable

---

## Technical Implementation

### Files Modified

#### 1. `frontend/src/pages/seeker/BrowseWorkersPage.jsx`

**Changes:**

- Updated worker card navigation so the profile can be opened from:
  - Worker name
  - `View Profile` link
- Added support for showing uploaded worker avatar images on cards
- Preserved the existing card layout and visual styling

**Key additions:**

```jsx
<h3 className="bw-card-name">
  <Link to={`/workers/${worker.id}`} className="bw-card-name-link">
    {worker.fullName || "Worker"}
  </Link>
</h3>
```

```jsx
<Link to={`/workers/${worker.id}`} className="bw-view-profile">
  View Profile
  <span className="material-icons">arrow_forward</span>
</Link>
```

#### 2. `frontend/src/pages/seeker/BrowseWorkersPage.css`

**Changes:**

- Added `.bw-card-name-link` styles for clickable worker names
- Added `.bw-avatar-image` styles so profile images fit existing card avatars
- Added `text-decoration: none` for the `View Profile` link
- Kept the existing Browse Workers UI intact

#### 3. `frontend/src/pages/public/PublicWorkerProfilePage.jsx`

**Changes:**

- Preserved the previous public profile page UI
- Added `useNavigate()` support for Back navigation
- Updated avatar rendering to use uploaded profile image when available
- Changed the secondary action button from `Message` to `Back`

**Key additions:**

```jsx
const handleBack = () => {
  if (window.history.length > 1) {
    navigate(-1);
    return;
  }

  navigate("/browse-workers");
};
```

```jsx
{profile.profilePictureUrl ? (
  <img
    src={profile.profilePictureUrl}
    alt={`${profile.fullName || "Worker"} profile`}
    className="wpp-avatar-photo"
  />
) : (
  profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "W"
)}
```

#### 4. `frontend/src/pages/worker/WorkerProfile.css`

**Changes:**

- Added `.wpp-avatar-photo` so uploaded worker images render correctly inside the existing avatar shape

```css
.wpp-avatar-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

#### 5. `frontend/src/pages/worker/EditWorkerProfilePage.jsx`

**Changes:**

- Updated photo handling so selected profile images are stored as `profilePictureUrl`
- Added `contactNumber` and `profilePictureUrl` to the payload sent to the backend
- Existing worker edit page UI was preserved

**Key behavior:**

- Selected image file is read using `FileReader`
- Image is stored as a data URL string in form state
- Saved image can then be shown on public profile and worker list

#### 6. `backend/WedaLK/demo/src/main/java/lk/wedalk/profiles/model/WorkerProfile.java`

**Changes:**

- Added `profilePictureUrl` field to the `WorkerProfile` entity

```java
@Column(columnDefinition = "TEXT")
private String profilePictureUrl;
```

#### 7. `backend/WedaLK/demo/src/main/java/lk/wedalk/profiles/dto/WorkerProfileCreateRequest.java`

**Changes:**

- Added:
  - `fullName`
  - `contactNumber`
  - `profilePictureUrl`

#### 8. `backend/WedaLK/demo/src/main/java/lk/wedalk/profiles/dto/WorkerProfileUpdateRequest.java`

**Changes:**

- Added:
  - `fullName`
  - `contactNumber`
  - `profilePictureUrl`

#### 9. `backend/WedaLK/demo/src/main/java/lk/wedalk/profiles/dto/WorkerProfileResponse.java`

**Changes:**

- Extended worker profile response to include:
  - `contactNumber`
  - `profilePictureUrl`

This allows the public profile page and browse list to consume the uploaded profile image from the API.

#### 10. `backend/WedaLK/demo/src/main/java/lk/wedalk/profiles/service/WorkerProfileService.java`

**Changes:**

- On create:
  - Uses submitted `fullName` when available
  - Saves `contactNumber` to the linked `User`
  - Saves `profilePictureUrl` to `WorkerProfile`
- On update:
  - Updates `User.fullName`
  - Updates `User.phone`
  - Updates `WorkerProfile.profilePictureUrl`
- On response mapping:
  - Returns `contactNumber`
  - Returns `profilePictureUrl`

#### 11. `backend/WedaLK/demo/src/main/resources/db/migration/V1__init.sql`

**Changes:**

- Added `profile_picture_url TEXT` to the `worker_profiles` table definition

---

## Data Flow

### Public Profile Navigation Flow

1. Seeker opens `/browse-workers`
2. Worker cards are loaded from `GET /api/profiles`
3. Seeker clicks worker name or `View Profile`
4. Frontend navigates to `/workers/:id`
5. `PublicWorkerProfilePage.jsx` calls `getProfileById(id)`
6. Frontend sends `GET /api/profiles/{id}`
7. Backend returns `WorkerProfileResponse`
8. Public profile page renders name, avatar/photo, skills, service area, and bio

### Worker Profile Response Structure

```json
{
  "id": 1,
  "userId": 12,
  "fullName": "Nimal Perera",
  "contactNumber": "+94 77 123 4567",
  "bio": "Experienced electrician with residential and commercial expertise.",
  "profilePictureUrl": "data:image/png;base64,...",
  "skills": ["Electrical", "Wiring", "Switchboard"],
  "district": "Colombo",
  "serviceAreas": ["Colombo 03", "Dehiwala", "Maharagama"],
  "hourlyRate": 1800.0,
  "availability": "Weekends Only"
}
```

### Fallback Avatar Example

**Scenario:** Worker has no uploaded photo

- `profile.profilePictureUrl === null`
- Public profile page shows the existing initial avatar
- Browse Workers card also falls back to the worker's first initial

---

## User Experience

### Browse to Profile Flow

1. **Browse Workers page loads**
   - Worker cards display name, primary skill, district, bio, and `View Profile`

2. **Seeker clicks worker name**
   - Navigates directly to `/workers/:id`

3. **Public profile page opens**
   - Shows full public profile details using the existing design
   - If profile photo exists, avatar shows photo
   - If no profile photo exists, avatar falls back to initial placeholder

4. **Seeker clicks Back**
   - Returns to previous page or `/browse-workers`

### Empty / Missing Data Handling

- **Missing profile picture:** fallback avatar shown
- **Missing bio:** page still loads without runtime error
- **Missing skills:** `getPrimarySkill()` falls back to `Professional`
- **Missing serviceAreas:** service area section falls back to district/local area labels

---

## Testing Checklist

### Manual Testing

- [ ] Navigate to `/browse-workers`
- [ ] Verify worker name is clickable
- [ ] Verify `View Profile` navigates to `/workers/:id`
- [ ] Verify worker public profile loads without console errors
- [ ] Verify name, skills, service area, and bio display correctly
- [ ] Verify uploaded profile image displays when available
- [ ] Verify fallback avatar appears when no image exists
- [ ] Verify `Back` button returns to Browse Workers list
- [ ] Verify layout remains unchanged on desktop, tablet, and mobile

### Verification Notes

- [x] Frontend production build completed successfully with `npm run build`
- [x] Existing public profile UI preserved
- [x] Browse Workers routing updated for profile access
- [x] Backend DTO/entity mapping updated for profile picture support
- [ ] Backend Maven compile not re-verified in the sandboxed environment

---

## Known Limitations & Future Enhancements

### Current Limitations

1. **Profile image storage uses data URLs**
   - Images are currently stored as `profilePictureUrl` string data
   - Suitable for demo/prototype use, but not ideal for production-scale storage

2. **Public profile still contains placeholder/demo content**
   - Existing stats such as rating, jobs done, and years of experience are still static UI content

3. **No dedicated backend file upload service**
   - Profile images are not yet uploaded to cloud/object storage

### Future Enhancements

**Phase 2 — Real Media Uploads**

```text
Upload image -> media service/storage -> save hosted URL in profilePictureUrl
```

**Benefits:**

- Smaller request payloads
- Better performance
- Production-ready image handling

**Phase 3 — Public Profile Enrichment**

- Real ratings
- Real completed jobs count
- Verification status from backend
- Portfolio images from persisted records

**Phase 4 — Contact / Engage Actions**

- Replace placeholder header actions with real features:
  - Message worker
  - Invite to request
  - Save/favorite worker

---

## Business Impact

### Expected Benefits

1. **Improved decision-making:** Seekers can inspect worker details before engaging
2. **Higher trust:** Public photo, skills, and bio help establish credibility
3. **Better discovery flow:** Browse list now connects cleanly to full profile view
4. **Foundation for future hiring actions:** Public profile becomes the next step before quotation acceptance or worker engagement

### Success Criteria

- ✅ Worker cards provide direct access to public profiles
- ✅ Public profile displays required details
- ✅ Missing images do not break the UI
- ✅ Back navigation returns seeker to discovery flow

---

## Related Stories

- **SCRUM-71:** Browse Workers page implementation
- **SCRUM-72:** Skill filter on Browse Workers
- **SCRUM-73:** Service area filter on Browse Workers
- **SCRUM-75:** Future enhancements for richer profile engagement

---

## Definition of Done

- [x] Feature implemented according to acceptance criteria
- [x] UI preserved without redesign
- [x] Direct navigation from Browse Workers to public profile added
- [x] Missing profile picture handled with fallback avatar
- [x] Back navigation implemented
- [x] Backend API updated to return required image/profile fields
- [x] Frontend build completed successfully
- [x] Documentation created
- [x] Ready for code review

---

## Demonstration Script

**Sprint Review Demo (2 minutes):**

1. **Open Browse Workers page**
   - Show worker cards
   - Point out clickable worker names and `View Profile`

2. **Open a worker profile**
   - Click worker name
   - Show navigation to `/workers/:id`

3. **Review the public profile**
   - Highlight name
   - Highlight skills
   - Highlight service areas
   - Highlight bio

4. **Demo avatar fallback**
   - Open a worker without a profile image
   - Show default initial-based avatar

5. **Demo Back navigation**
   - Click `Back`
   - Return to Browse Workers list

**Key talking points:**

- ✅ "Seekers can now move directly from worker discovery to worker evaluation"
- ✅ "The public profile UI stays consistent with the existing design"
- ✅ "Missing profile images are handled safely"
- ✅ "This story strengthens trust and match quality before engagement"

---

**Implementation completed:** 2026-03-22  
**Story Points:** 3  
**Developer:** Codex  
**Reviewer:** [Pending]  
**Status:** ✅ Ready for Review

---

## Post-Audit Fixes

- Enriched `WorkerProfileResponse` with `averageRating` and `totalJobsCompleted` initialized automatically from the database queries mapping directly to `ReviewRepository` counts.
- `WorkerProfilePanel` component was updated to fetch and parse a new `reviews` prop, building out Phase 3 (Public Profile Enrichment) milestones.
- Disconnected fabricated UI data (hardcoded 4.9 ratings and 186 job counts) and replaced with realistic logic with empty-state fallbacks for when no metrics currently exist.
