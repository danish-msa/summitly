#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test the AI chatbot integration
.DESCRIPTION
    Tests if the backend is reachable and responding
#>

Write-Host "Testing Summitly AI Integration..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Test 1: Backend Health
Write-Host "`n[Test 1] Checking Backend Health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5050/health" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Backend is running on port 5050" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Backend not responding on port 5050" -ForegroundColor Red
    Write-Host "  Make sure backend is started" -ForegroundColor Yellow
    exit 1
}

# Test 2: Frontend Health
Write-Host "`n[Test 2] Checking Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Frontend is running on port 3000" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Frontend not responding on port 3000" -ForegroundColor Red
    Write-Host "  Make sure frontend is started" -ForegroundColor Yellow
    exit 1
}

# Test 3: AI Chat API Route
Write-Host "`n[Test 3] Testing AI Chat API Route..." -ForegroundColor Yellow
try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    $body = @{
        message = "test"
        history = @()
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/ai/chat" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -TimeoutSec 10 `
        -ErrorAction Stop

    if ($response.StatusCode -eq 200) {
        Write-Host "✓ AI Chat API is reachable" -ForegroundColor Green
        $content = $response.Content | ConvertFrom-Json
        Write-Host "  Response received: $($content.message.Substring(0, [Math]::Min(50, $content.message.Length)))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ AI Chat API failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*500*") {
        Write-Host "`n  Possible causes:" -ForegroundColor Yellow
        Write-Host "  1. Backend is not running or crashed" -ForegroundColor Yellow
        Write-Host "  2. API keys not configured in C:\PropertyCH\Summitly v3\Summitly-AI-\config\.env" -ForegroundColor Yellow
        Write-Host "  3. Backend dependencies missing" -ForegroundColor Yellow
    }
}

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "`nTo test the full UI:" -ForegroundColor Yellow
Write-Host "1. Open: http://localhost:3000/ai" -ForegroundColor Cyan
Write-Host "2. Type: 'Show me properties in Toronto'" -ForegroundColor Cyan
Write-Host "3. Press Enter" -ForegroundColor Cyan
Write-Host "`nNote: You need API keys configured for full functionality" -ForegroundColor Gray
