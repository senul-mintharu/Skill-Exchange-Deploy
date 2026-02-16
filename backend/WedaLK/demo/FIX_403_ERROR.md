# Fixing 403 Forbidden Error

## Problem

Getting **403 Forbidden** when trying to create a service request.

## Root Cause

The `@PreAuthorize("hasRole('SEEKER')")` is failing because:

1. The user's role in the database/JWT doesn't match
2. Spring Security expects `ROLE_SEEKER` but the JWT might have just `SEEKER`

## Solution

### Step 1: Check Your JWT Token

Decode your JWT token at https://jwt.io and check the `role` claim.

**It should show:**

```json
{
  "sub": "1",
  "email": "test@example.com",
  "role": "SEEKER",  ← Should be exactly "SEEKER"
  "iat": 1708000000,
  "exp": 1708086400
}
```

### Step 2: Re-register with Correct Role

Delete the old user and register again with the correct role:

```json
POST http://localhost:8081/api/auth/register
Content-Type: application/json

{
  "fullName": "Test Seeker",
  "email": "newtest@example.com",
  "password": "password123",
  "phone": "0771234567",
  "district": "Colombo",
  "role": "SEEKER"
}
```

**IMPORTANT:** The `role` field must be exactly `"SEEKER"` (uppercase, no ROLE\_ prefix)

### Step 3: Login Again

```json
POST http://localhost:8081/api/auth/login

{
  "email": "newtest@example.com",
  "password": "password123"
}
```

### Step 4: Use the New Token

Copy the new JWT token and use it in the Authorization header:

```
Authorization: Bearer <new_token_here>
```

### Step 5: Test Service Request Creation

```json
POST http://localhost:8081/api/requests
Authorization: Bearer <new_token>
Content-Type: application/json

{
  "description": "Fix leaking tap",
  "category": "PLUMBING",
  "locationArea": "Colombo 07",
  "urgency": "HIGH"
}
```

## Quick Fix: Delete Old User from Database

If you want to use the same email, delete the old user first:

```sql
DELETE FROM users WHERE email = 'test@example.com';
```

Then register again with the correct role.

## Verify Role in Database

Check what role is actually stored:

```sql
SELECT id, email, role FROM users;
```

Should show:

```
id | email              | role
1  | test@example.com   | SEEKER
```

## How Spring Security Works

1. `CustomUserDetails.getAuthorities()` adds `ROLE_` prefix: `ROLE_SEEKER`
2. `@PreAuthorize("hasRole('SEEKER')")` expects the authority `ROLE_SEEKER`
3. Spring Security automatically matches them

If the JWT has `role: "WORKER"`, it becomes `ROLE_WORKER`, which doesn't match `ROLE_SEEKER`, hence 403.
