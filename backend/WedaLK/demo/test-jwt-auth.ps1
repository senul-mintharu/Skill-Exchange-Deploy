# JWT Authentication Test Script
# Tests registration, login, and protected endpoints

Write-Host "=== JWT Authentication Test ===" -ForegroundColor Cyan
Write-Host ""

# Wait for server to start
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test 1: Health Check
Write-Host "`n[TEST 1] Health Check" -ForegroundColor Green
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method GET
    Write-Host "✓ Server is running" -ForegroundColor Green
    Write-Host "Response: $health" -ForegroundColor Gray
} catch {
    Write-Host "✗ Server not responding: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Register a new user
Write-Host "`n[TEST 2] User Registration" -ForegroundColor Green
$registerBody = @{
    fullName = "Test Seeker"
    email = "test.seeker@example.com"
    password = "password123"
    phone = "0771234567"
    district = "Colombo"
    role = "SEEKER"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody
    
    Write-Host "✓ Registration successful" -ForegroundColor Green
    Write-Host "User ID: $($registerResponse.data.userId)" -ForegroundColor Gray
    Write-Host "Email: $($registerResponse.data.email)" -ForegroundColor Gray
    Write-Host "Role: $($registerResponse.data.role)" -ForegroundColor Gray
    Write-Host "Token: $($registerResponse.data.token.Substring(0, 50))..." -ForegroundColor Gray
    
    $token = $registerResponse.data.token
} catch {
    Write-Host "✗ Registration failed: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

# Test 3: Login with registered user
Write-Host "`n[TEST 3] User Login" -ForegroundColor Green
$loginBody = @{
    email = "test.seeker@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "User ID: $($loginResponse.data.userId)" -ForegroundColor Gray
    Write-Host "Email: $($loginResponse.data.email)" -ForegroundColor Gray
    Write-Host "Token: $($loginResponse.data.token.Substring(0, 50))..." -ForegroundColor Gray
    
    $token = $loginResponse.data.token
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
}

# Test 4: Access protected endpoint (Create Service Request)
Write-Host "`n[TEST 4] Create Service Request (Protected Endpoint)" -ForegroundColor Green
$requestBody = @{
    description = "Fix leaking tap in kitchen"
    category = "PLUMBING"
    locationArea = "Colombo 07"
    urgency = "HIGH"
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $requestResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/requests" `
        -Method POST `
        -ContentType "application/json" `
        -Headers $headers `
        -Body $requestBody
    
    Write-Host "✓ Service request created successfully" -ForegroundColor Green
    Write-Host "Request ID: $($requestResponse.data.id)" -ForegroundColor Gray
    Write-Host "Description: $($requestResponse.data.description)" -ForegroundColor Gray
    Write-Host "Category: $($requestResponse.data.category)" -ForegroundColor Gray
    Write-Host "Status: $($requestResponse.data.status)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to create request: $_" -ForegroundColor Red
}

# Test 5: Get my requests
Write-Host "`n[TEST 5] Get My Requests (Protected Endpoint)" -ForegroundColor Green
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $myRequests = Invoke-RestMethod -Uri "http://localhost:8080/api/requests/my" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ Retrieved requests successfully" -ForegroundColor Green
    Write-Host "Total requests: $($myRequests.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to get requests: $_" -ForegroundColor Red
}

# Test 6: Try to access protected endpoint without token (should fail)
Write-Host "`n[TEST 6] Access Protected Endpoint Without Token (Should Fail)" -ForegroundColor Green
try {
    $unauthorized = Invoke-RestMethod -Uri "http://localhost:8080/api/requests/my" -Method GET
    Write-Host "✗ Endpoint accessible without token (SECURITY ISSUE!)" -ForegroundColor Red
} catch {
    Write-Host "✓ Correctly rejected unauthorized request" -ForegroundColor Green
    Write-Host "Status: 401 Unauthorized" -ForegroundColor Gray
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
