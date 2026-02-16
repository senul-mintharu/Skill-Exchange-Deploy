# Simple JWT Authentication Test
Write-Host "=== JWT Authentication Test ===" -ForegroundColor Cyan

# Wait for server
Start-Sleep -Seconds 5

# Test 1: Register
Write-Host "`n[1] Testing Registration..." -ForegroundColor Green
$registerBody = '{"fullName":"Test Seeker","email":"test@example.com","password":"password123","phone":"0771234567","district":"Colombo","role":"SEEKER"}'

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method POST -ContentType "application/json" -Body $registerBody
    Write-Host "✓ Registration successful!" -ForegroundColor Green
    Write-Host "  User ID: $($response.data.userId)" -ForegroundColor Gray
    Write-Host "  Email: $($response.data.email)" -ForegroundColor Gray
    $token = $response.data.token
    Write-Host "  Token received: $($token.Substring(0,30))..." -ForegroundColor Gray
}
catch {
    Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Login
Write-Host "`n[2] Testing Login..." -ForegroundColor Green
$loginBody = '{"email":"test@example.com","password":"password123"}'

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    Write-Host "✓ Login successful!" -ForegroundColor Green
    $token = $response.data.token
    Write-Host "  Token: $($token.Substring(0,30))..." -ForegroundColor Gray
}
catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Create Service Request
Write-Host "`n[3] Testing Protected Endpoint (Create Request)..." -ForegroundColor Green
$requestBody = '{"description":"Fix leaking tap","category":"PLUMBING","locationArea":"Colombo 07","urgency":"HIGH"}'

try {
    $headers = @{ "Authorization" = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/requests" -Method POST -ContentType "application/json" -Headers $headers -Body $requestBody
    Write-Host "✓ Service request created!" -ForegroundColor Green
    Write-Host "  Request ID: $($response.data.id)" -ForegroundColor Gray
    Write-Host "  Status: $($response.data.status)" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Request creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get My Requests
Write-Host "`n[4] Testing Get My Requests..." -ForegroundColor Green
try {
    $headers = @{ "Authorization" = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/requests/my" -Method GET -Headers $headers
    Write-Host "✓ Retrieved requests!" -ForegroundColor Green
    Write-Host "  Total: $($response.data.Count)" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Unauthorized Access
Write-Host "`n[5] Testing Unauthorized Access (Should Fail)..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/requests/my" -Method GET
    Write-Host "✗ SECURITY ISSUE: Endpoint accessible without token!" -ForegroundColor Red
}
catch {
    Write-Host "✓ Correctly rejected unauthorized request" -ForegroundColor Green
}

Write-Host "`n=== All Tests Complete ===" -ForegroundColor Cyan
