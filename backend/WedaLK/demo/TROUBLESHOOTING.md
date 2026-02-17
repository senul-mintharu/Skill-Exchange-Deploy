# Test Service Request Creation

## Issue

Registration and login work, but service request creation fails.

## What to Check

### 1. Check IntelliJ Console for Full Error

Look for error messages after the Hibernate SQL statements. Common errors:

- `Table 'service_requests' doesn't exist`
- `Column not found`
- `Foreign key constraint fails`
- `NullPointerException`

### 2. Verify Hibernate Created the Table

Check your PostgreSQL database:

```sql
\dt
SELECT * FROM service_requests;
```

### 3. Common Issues & Solutions

#### Issue: Table Not Created

**Symptom:** `Table 'service_requests' doesn't exist`

**Solution:** Check `application.properties`:

```properties
spring.jpa.hibernate.ddl-auto=update
```

#### Issue: Foreign Key Constraint

**Symptom:** `Cannot add or update a child row: a foreign key constraint fails`

**Solution:** Make sure the user exists before creating request. The JWT token should contain a valid user ID.

#### Issue: Null Values

**Symptom:** `Column 'status' cannot be null` or `Column 'created_at' cannot be null`

**Solution:** The `@PrePersist` method should set these. Check if it's being called.

### 4. Test Request Body

Make sure your request body is correct:

```json
{
  "description": "Fix leaking tap in kitchen",
  "category": "PLUMBING",
  "locationArea": "Colombo 07",
  "urgency": "HIGH"
}
```

### 5. Check Authorization Header

```
Authorization: Bearer <your_jwt_token>
```

## Debug Steps

1. **Enable SQL Logging** (already enabled in application.properties)
2. **Check what Hibernate is trying to do** - Look at the SQL in console
3. **Look for the actual error** after the SQL statements
4. **Check if service_requests table exists** in PostgreSQL

## Quick Fix: Restart Application

Sometimes Hibernate doesn't create tables on first run. Try:

1. Stop the application
2. Start it again
3. Check if `service_requests` table is created

## Need More Info

Please share:

1. The **full error message** from IntelliJ console
2. What happens when you send the POST request
3. The HTTP status code you receive (401, 403, 500, etc.)
