# Skill Exchange API Documentation

Base URL: `http://localhost:8081`

This documentation is generated from your implemented backend controllers and your completed task docs (SCRUM-87, 89, 92, 94, 96).

## Authentication

All secured endpoints require:

`Authorization: Bearer <jwt-token>`

### Login

**POST** `/api/auth/login`

Request:
```json
{
  "email": "seeker@test.com",
  "password": "seeker123"
}
```

Response (`200`):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token",
    "type": "Bearer",
    "userId": 16,
    "email": "seeker@test.com",
    "fullName": "Test Seeker",
    "role": "SEEKER"
  }
}
```

## Health

**GET** `/api/health` (Public)

## Auth Endpoints

1. **POST** `/api/auth/register` (Public)
2. **POST** `/api/auth/login` (Public)

Register body:
```json
{
  "fullName": "New User",
  "email": "newuser@test.com",
  "password": "password123",
  "phone": "0771234567",
  "district": "Colombo",
  "role": "SEEKER"
}
```

## User Endpoints

1. **GET** `/api/users/me` (Authenticated)
2. **PUT** `/api/users/me` (Authenticated)
3. **DELETE** `/api/users/me` (Authenticated)

Update body:
```json
{
  "fullName": "Updated Name",
  "email": "updated@test.com",
  "phoneNumber": "0770000000",
  "district": "Gampaha"
}
```

## Service Request Endpoints

1. **POST** `/api/requests` (SEEKER)
2. **GET** `/api/requests/my` (SEEKER)
3. **GET** `/api/requests/open` (Authenticated)
4. **GET** `/api/requests/browse` (Authenticated)  
   Query: `keyword`, `category`, `locationArea`, `page`, `size`, `sortBy`
5. **GET** `/api/requests/{id}` (Authenticated)
6. **GET** `/api/requests/worker/{workerId}` (Authenticated)
7. **GET** `/api/requests/worker/my` (WORKER)
8. **GET** `/api/requests/search` (Authenticated)  
   Query: `locationArea`, `category`
9. **PUT** `/api/requests/{id}` (SEEKER owner)
10. **PUT** `/api/requests/{requestId}/status` (SEEKER owner)
11. **DELETE** `/api/requests/{id}` (SEEKER owner)
12. **POST** `/api/requests/ai-description` (SEEKER)

Create/Update request body:
```json
{
  "title": "Fix kitchen sink",
  "description": "Water leak under sink",
  "category": "PLUMBING",
  "locationArea": "Colombo 05",
  "budget": 5000,
  "urgency": "HIGH"
}
```

Status update body:
```json
{
  "status": "COMPLETED"
}
```

Request status enum:
`OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, NOT_COMPLETED, CANCELLED`

Category enum:
`PLUMBING, ELECTRICAL, CARPENTRY, PAINTING, CLEANING, AC_REPAIR, APPLIANCE_REPAIR, GARDENING, MASONRY, ROOFING, PEST_CONTROL, OTHER`

Urgency enum:
`LOW, MEDIUM, HIGH, URGENT`

### AI Description Assist

**POST** `/api/requests/ai-description` (SEEKER)

Request:
```json
{
  "title": "Fix leaking kitchen tap",
  "category": "PLUMBING",
  "locationArea": "Colombo 05",
  "urgency": "MEDIUM",
  "existingDescription": ""
}
```

Response (`200`):
```json
{
  "success": true,
  "message": "AI description generated successfully",
  "data": {
    "draft": "I need help fixing a leaking kitchen tap..."
  }
}
```

Key rules implemented:
1. Only SEEKER users can request AI-assisted descriptions.
2. Generated drafts are truncated to the 2000-character request description limit before being returned.
3. Provider timeouts, connection errors, and API failures return `503 Service Unavailable`.

Backend config:
```properties
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
AI_TIMEOUT_MS=10000
```

## Quotation Endpoints

1. **POST** `/api/quotes` (WORKER)
2. **GET** `/api/quotes/my` (WORKER)
3. **DELETE** `/api/quotes/{quoteId}` (WORKER owner)
4. **GET** `/api/quotes/request/{requestId}` (SEEKER owner of request)
5. **POST** `/api/quotes/{quoteId}/accept` (SEEKER)
6. **PATCH** `/api/quotes/{quoteId}/accept` (SEEKER)
7. **PATCH** `/api/quotes/{quoteId}/reject` (SEEKER)

Create quote body:
```json
{
  "requestId": 1,
  "price": 3500,
  "estimatedDays": 2,
  "message": "Can complete quickly with quality materials."
}
```

## Review Endpoints (SCRUM-94, SCRUM-87)

1. **POST** `/api/reviews` (SEEKER owner, request must be `COMPLETED`)
2. **GET** `/api/reviews/worker/{workerId}` (Authenticated)
3. **GET** `/api/reviews/my` (SEEKER, ordered newest first)

Create review body:
```json
{
  "requestId": 7,
  "rating": 5,
  "comment": "Excellent work! Very professional."
}
```

Key rules implemented:
1. Only SEEKER can submit reviews.
2. Only request owner can review.
3. Duplicate review blocked.

## Dispute Endpoints (SCRUM-94, SCRUM-89, SCRUM-92)

1. **POST** `/api/disputes` (SEEKER owner; atomic NOT_COMPLETED + dispute create)
2. **GET** `/api/disputes/{id}` (Authenticated, access checked in service)
3. **GET** `/api/disputes/request/{requestId}` (ADMIN / involved SEEKER / involved WORKER)
4. **GET** `/api/disputes/open?page=0&size=10` (ADMIN)
5. **GET** `/api/disputes/my` (SEEKER)
6. **GET** `/api/disputes/worker` (WORKER) — added for SCRUM-92
7. **PUT** `/api/disputes/{id}/resolve` (ADMIN)

Create dispute body:
```json
{
  "requestId": 8,
  "reason": "Worker did not complete the agreed work."
}
```

Resolve dispute body:
```json
{
  "resolution": "Refund approved after review."
}
```

Key rules implemented:
1. Only SEEKER can initiate disputes.
2. Only request owner can dispute.
3. Allowed only when request is `ASSIGNED` or `NOT_COMPLETED`.
4. Duplicate dispute blocked.

## Worker Profile Endpoints

1. **GET** `/api/profiles` (Authenticated)
2. **POST** `/api/profiles` (Authenticated)
3. **GET** `/api/profiles/{id}` (Authenticated)
4. **GET** `/api/profiles/user/{userId}` (Authenticated)
5. **PUT** `/api/profiles/{id}` (Authenticated owner)
6. **DELETE** `/api/profiles/{id}` (Authenticated owner)

Create profile body:
```json
{
  "fullName": "Worker Name",
  "contactNumber": "0771234567",
  "bio": "Experienced electrician",
  "profilePictureUrl": "https://example.com/pic.jpg",
  "skills": ["Wiring", "Maintenance"],
  "district": "Colombo",
  "serviceAreas": ["Colombo 05", "Colombo 06"],
  "hourlyRate": 2500,
  "availability": "Weekdays"
}
```

## Verification Endpoints

1. **POST** `/api/verification` (WORKER)  
   `multipart/form-data` field: `document`
2. **GET** `/api/verification/my` (WORKER)
3. **GET** `/api/verification/pending` (ADMIN)
4. **GET** `/api/verification/{id}/document` (ADMIN)
5. **PUT** `/api/verification/{id}/status?approve=true|false` (ADMIN)  
   Optional JSON body:
```json
{
  "adminNotes": "Document accepted."
}
```

## Common Error Patterns

1. `401 Unauthorized` - missing/invalid token.
2. `403 Forbidden` - role/ownership restriction.
3. `400 Bad Request` - validation/business-rule error.
4. `404 Not Found` - resource not found.

SCRUM-96 adds clearer frontend handling for 401/403 trust-related actions (verification, reviews, disputes).
