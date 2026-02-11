#!/usr/bin/env pwsh
# ============================================================================
# Set PostgreSQL Database Password
# ============================================================================
# This script updates your DATABASE_URL with the correct PostgreSQL password

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "  POSTGRESQL PASSWORD SETUP" -ForegroundColor Cyan
Write-Host "======================================================================`n" -ForegroundColor Cyan

Write-Host "Current DATABASE_URL uses placeholder: postgres:your_postgres_password" -ForegroundColor Yellow
Write-Host "`nPlease enter your PostgreSQL password:" -ForegroundColor Green
Write-Host "(This is the password you set when installing PostgreSQL)" -ForegroundColor Gray

$password = Read-Host -AsSecureString "PostgreSQL Password"
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

# URL encode the password
Add-Type -AssemblyName System.Web
$encodedPassword = [System.Web.HttpUtility]::UrlEncode($plainPassword)

# Create the new DATABASE_URL
$newDatabaseUrl = "DATABASE_URL=`"postgresql://postgres:$encodedPassword@localhost:5432/summitly?schema=public&sslmode=disable`""

# Update .env.local
$envPath = Join-Path $PSScriptRoot ".env.local"
if (Test-Path $envPath) {
    $content = Get-Content $envPath -Raw
    $content = $content -replace 'DATABASE_URL="postgresql://postgres:[^@]+@localhost:5432/summitly\?schema=public&sslmode=disable"', $newDatabaseUrl
    Set-Content -Path $envPath -Value $content -NoNewline
    
    Write-Host "`n✅ Successfully updated DATABASE_URL in .env.local" -ForegroundColor Green
} else {
    Write-Host "`n❌ .env.local file not found!" -ForegroundColor Red
    exit 1
}

# Test the connection
Write-Host "`nTesting database connection..." -ForegroundColor Cyan
$env:PGPASSWORD = $plainPassword
$testResult = & psql -U postgres -d summitly -c "\dt" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection successful!" -ForegroundColor Green
    Write-Host "`nYou can now run: .\start.ps1" -ForegroundColor Yellow
} else {
    Write-Host "❌ Database connection failed!" -ForegroundColor Red
    Write-Host "`nError: $testResult" -ForegroundColor Red
    Write-Host "`nPlease check:" -ForegroundColor Yellow
    Write-Host "1. PostgreSQL is running" -ForegroundColor Gray
    Write-Host "2. Database 'summitly' exists" -ForegroundColor Gray
    Write-Host "3. Password is correct" -ForegroundColor Gray
}

Write-Host "`n======================================================================`n" -ForegroundColor Cyan
