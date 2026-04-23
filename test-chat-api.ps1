# Test Chat API - PowerShell Version
$BaseUrl = "http://localhost:8080"
$timestamp = Get-Date -UFormat %s
$TestEmail = "testuser$timestamp@test.com"
$TestAdminEmail = "testadmin$timestamp@test.com"

Write-Host "=== ARGATY CHAT API TEST ===" -ForegroundColor Green
Write-Host ""

# Helper function for API calls
function Invoke-Api {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body,
        [string]$Token
    )
    
    $url = "$BaseUrl$Endpoint"
    $params = @{
        Uri = $url
        Method = $Method
        ContentType = "application/json"
        ErrorAction = "Stop"
    }
    
    if ($Body) {
        $params.Body = $Body | ConvertTo-Json -Depth 10
    }
    
    if ($Token) {
        $params.Headers = @{ "Authorization" = "Bearer $Token" }
    }
    
    try {
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-Host "Error calling $Endpoint`: $_" -ForegroundColor Red
        return $null
    }
}

# 1. Register test user
Write-Host "1. Registering test user: $TestEmail" -ForegroundColor Cyan
$userReg = Invoke-Api -Method Post -Endpoint "/api/v1/auth/register" -Body @{
    email = $TestEmail
    password = "123123"
    confirmPassword = "123123"
    fullName = "Test User"
    agreeTerms = $true
}
Write-Host "Result: $($userReg.success)" -ForegroundColor Yellow

# 2. Login test user
Write-Host "2. Logging in test user" -ForegroundColor Cyan
$userLogin = Invoke-Api -Method Post -Endpoint "/api/v1/auth/login" -Body @{
    email = $TestEmail
    password = "123123"
}

$userToken = $userLogin.data.accessToken
if (-not $userToken) {
    Write-Host "Failed to get user token" -ForegroundColor Red
    exit 1
}
Write-Host "User Token: $($userToken.Substring(0, 20))..." -ForegroundColor Yellow

# 3. Start authenticated chat
Write-Host "3. Starting authenticated chat for user" -ForegroundColor Cyan
$chatStart = Invoke-Api -Method Post -Endpoint "/api/v1/chat/start-auth" -Token $userToken
$sessionId = $chatStart.data.sessionId
if (-not $sessionId) {
    Write-Host "Failed to get session ID" -ForegroundColor Red
    exit 1
}
Write-Host "Session ID: $sessionId" -ForegroundColor Yellow

# 4. User sends message
Write-Host "4. User sending message" -ForegroundColor Cyan
$userMsg = Invoke-Api -Method Post -Endpoint "/api/v1/chat/$sessionId/send" -Token $userToken -Body @{
    message = "Hello admin, can you help?"
    sender = "visitor"
}
Write-Host "Result: $($userMsg.success)" -ForegroundColor Yellow

# 5. Register admin user
Write-Host "5. Registering admin user: $TestAdminEmail" -ForegroundColor Cyan
$adminReg = Invoke-Api -Method Post -Endpoint "/api/v1/auth/register" -Body @{
    email = $TestAdminEmail
    password = "123123"
    confirmPassword = "123123"
    fullName = "Test Admin"
    agreeTerms = $true
}
Write-Host "Result: $($adminReg.success)" -ForegroundColor Yellow

# 6. Login admin user
Write-Host "6. Logging in admin user" -ForegroundColor Cyan
$adminLogin = Invoke-Api -Method Post -Endpoint "/api/v1/auth/login" -Body @{
    email = $TestAdminEmail
    password = "123123"
}

$adminToken = $adminLogin.data.accessToken
if (-not $adminToken) {
    Write-Host "Failed to get admin token" -ForegroundColor Red
    exit 1
}
Write-Host "Admin Token: $($adminToken.Substring(0, 20))..." -ForegroundColor Yellow

# 7. Admin gets list of chat sessions
Write-Host "7. Admin fetching chat sessions" -ForegroundColor Cyan
$sessions = Invoke-Api -Method Get -Endpoint "/api/v1/admin/chat/sessions" -Token $adminToken
Write-Host "Sessions count: $($sessions.data.Count)" -ForegroundColor Yellow
Write-Host "Sessions: $($sessions.data | ConvertTo-Json -Depth 3)" -ForegroundColor Yellow

# 8. Get messages for session
Write-Host "8. Getting messages for session: $sessionId" -ForegroundColor Cyan
$messages = Invoke-Api -Method Get -Endpoint "/api/v1/chat/$sessionId/messages" -Token $userToken
Write-Host "Messages count: $($messages.data.Count)" -ForegroundColor Yellow
Write-Host "Messages: $($messages.data | ConvertTo-Json -Depth 3)" -ForegroundColor Yellow

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Green
