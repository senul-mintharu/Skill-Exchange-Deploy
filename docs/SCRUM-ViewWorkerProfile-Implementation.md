# SCRUM – View Worker's Public Profile

## User Story
As a Service Seeker, I want to view a worker's public profile so that I can decide who to invite or hire.

## API Endpoint

### GET /api/profiles/{id}

Retrieves a worker's public profile by profile ID.

**URL**: `http://localhost:8081/api/profiles/{id}`  
**Method**: `GET`  
**Auth Required**: No (public endpoint)

#### Path Parameters
| Parameter | Type | Description |
|---|---|---|
| `id` | Long | Worker profile ID |

#### Success Response (200 OK)
```json
{
    "id": 1,
    "userId": 4,
    "fullName": "Worker Name",
    "bio": "Experienced plumber with 10 years...",
    "skills": ["Plumbing", "Electrical"],
    "district": "Colombo",
    "serviceAreas": ["Colombo 01", "Dehiwala"],
    "hourlyRate": 1500.00,
    "availability": "Full Time"
}
```

#### Response Fields
| Field | Type | Description |
|---|---|---|
| `id` | Long | Profile ID |
| `userId` | Long | Associated user ID |
| `fullName` | String | Worker's full name |
| `bio` | String | Short biography |
| `skills` | String[] | List of skills |
| `district` | String | Worker's district |
| `serviceAreas` | String[] | Areas the worker serves |
| `hourlyRate` | double | Hourly rate in LKR |
| `availability` | String | e.g. "Full Time", "Part Time", "Weekends Only" |

#### Error Response (404 Not Found)
When the profile ID does not exist:
- HTTP Status: `404`
- Backend throws `NotFoundException("Profile not found")`

#### Frontend Integration
- **Service**: `src/services/profileService.js` → `getProfileById(id)`
- **Page**: `src/pages/public/PublicWorkerProfilePage.jsx`
- **Route**: `/workers/:id`

## UI Screenshots

### Public Profile View (`/workers/1`)
![Worker Profile Page](worker_profile.png)

### Profile Not Found (`/workers/9999`)
![Profile Not Found](profile_not_found.png)

## Acceptance Criteria Verification
| AC | Description | Status |
|---|---|---|
| AC1 | Display skills, service areas, availability | ✅ Verified |
| AC2 | "Profile not found" for non-existing | ✅ Verified |
| AC3 | Read-only (no edit buttons) | ✅ Verified |
