#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Smart startup script for Summitly AI - Full Stack Real Estate Assistant
.DESCRIPTION
    Starts Python backend and Next.js frontend with smart dependency management
.EXAMPLE
    .\start.ps1
#>

$ErrorActionPreference = "Continue"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  SUMMITLY AI - Starting Full Stack Real Estate Assistant" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# Set paths
$backendPath = "C:\PropertyCH\Summitly v3\Summitly-AI-"
$frontendPath = $PSScriptRoot

# ============================================================================
# STEP 1: Environment Check
# ============================================================================
Write-Host "`n[1/5] Checking environment..." -ForegroundColor Yellow

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Python not found. Install Python 3.9+ from python.org" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js not found. Install Node.js 18+ from nodejs.org" -ForegroundColor Red
    exit 1
}

# ============================================================================
# STEP 2: Environment Variables Setup
# ============================================================================
Write-Host "`n[2/5] Setting up environment variables..." -ForegroundColor Yellow

# Frontend .env.local
$envLocal = Join-Path $frontendPath ".env.local"
if (-not (Test-Path $envLocal)) {
    Write-Host "  Creating .env.local with default configuration..." -ForegroundColor Cyan
    $envContent = @"
# Database (sslmode=disable for local development)
DATABASE_URL="postgresql://user:password@localhost:5432/summitly?schema=public&sslmode=disable"

# Repliers API Keys
REPLIERS_API_KEY_SERVER=your_repliers_server_key_here
NEXT_PUBLIC_REPLIERS_API_KEY_CLIENT=your_repliers_client_key_here

# AI Backend
NEXT_PUBLIC_AI_BACKEND_URL=http://localhost:5050

# App URL
NEXT_PUBLIC_APP_BASE_URL=http://localhost:3000

# Optional: Google Maps (if using maps)
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
"@
    Set-Content -Path $envLocal -Value $envContent
    Write-Host "  IMPORTANT: Configure your API keys in .env.local" -ForegroundColor Yellow
} else {
    Write-Host "  .env.local already exists" -ForegroundColor Green
}

# Backend .env
$backendEnv = Join-Path $backendPath "config\.env"
if (-not (Test-Path $backendEnv)) {
    Write-Host "  Creating backend config/.env..." -ForegroundColor Cyan
    $backendEnvContent = @"
# Repliers MLS API
REPLIERS_API_KEY=your_repliers_key_here

# OpenAI GPT-4
OPENAI_API_KEY=your_openai_key_here

# Exa AI (Optional)
EXA_API_KEY=your_exa_key_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=1
"@
    New-Item -ItemType Directory -Path (Join-Path $backendPath "config") -Force | Out-Null
    Set-Content -Path $backendEnv -Value $backendEnvContent
    Write-Host "  IMPORTANT: Configure API keys in C:\PropertyCH\Summitly v3\Summitly-AI-\config\.env" -ForegroundColor Yellow
} else {
    Write-Host "  Backend .env already exists" -ForegroundColor Green
}

# ============================================================================
# STEP 3: Dependencies Installation (Smart - Only When Needed)
# ============================================================================
Write-Host "`n[3/5] Checking dependencies..." -ForegroundColor Yellow

# Python Backend Dependencies
Set-Location $backendPath
$venvPath = Join-Path $backendPath "venv"
$requirementsFile = Join-Path $backendPath "requirements.txt"

if (-not (Test-Path $venvPath)) {
    Write-Host "  Creating Python virtual environment..." -ForegroundColor Cyan
    python -m venv venv
    Write-Host "  Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "  Python venv exists" -ForegroundColor Green
}

# Check if requirements need installation
$needsInstall = $false
if (Test-Path $requirementsFile) {
    # Always check if key packages are installed
    $testPackage = & "$venvPath\Scripts\python.exe" -c "import pandas" 2>&1
    if ($LASTEXITCODE -ne 0) {
        $needsInstall = $true
    }
}

if ($needsInstall) {
    Write-Host "  Installing Python packages..." -ForegroundColor Cyan
    & "$venvPath\Scripts\python.exe" -m pip install --upgrade pip -q
    & "$venvPath\Scripts\pip.exe" install -r $requirementsFile
    Write-Host "  Python packages installed" -ForegroundColor Green
} else {
    Write-Host "  Python packages up to date" -ForegroundColor Green
}

# Frontend Dependencies
Set-Location $frontendPath
$nodeModules = Join-Path $frontendPath "node_modules"
$packageJson = Join-Path $frontendPath "package.json"

if (-not (Test-Path $nodeModules) -or -not (Test-Path (Join-Path $nodeModules ".package-lock.json"))) {
    Write-Host "  Installing Node.js packages (this may take a minute)..." -ForegroundColor Cyan
    npm install --silent
    Write-Host "  Node.js packages installed" -ForegroundColor Green
} else {
    Write-Host "  Node.js packages up to date" -ForegroundColor Green
}

# ============================================================================
# STEP 4: Generate Prisma Client
# ============================================================================
Write-Host "`n[4/5] Setting up Prisma..." -ForegroundColor Yellow

$prismaGenerated = Join-Path $frontendPath "node_modules\.prisma\client"
if (-not (Test-Path $prismaGenerated)) {
    Write-Host "  Generating Prisma Client..." -ForegroundColor Cyan
    # Set DATABASE_URL for Prisma generation with SSL disabled for local dev
    $env:DATABASE_URL = "postgresql://postgres:your_postgres_password@localhost:5432/summitly?schema=public&sslmode=disable"
    npx prisma generate 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Prisma Client generated" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Prisma generation had issues" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Prisma Client already generated" -ForegroundColor Green
}

# ============================================================================
# STEP 5: Start Services
# ============================================================================
Write-Host "`n[5/5] Starting services..." -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

# Start Python Backend
Write-Host "`nStarting Python Backend (Flask on port 5050)..." -ForegroundColor Cyan
$backendScript = @"
`$Host.UI.RawUI.WindowTitle = 'Summitly AI - Backend'
Set-Location '$backendPath'
& '.\venv\Scripts\Activate.ps1'
Write-Host '======================================================================' -ForegroundColor Green
Write-Host '  PYTHON BACKEND RUNNING' -ForegroundColor Green
Write-Host '======================================================================' -ForegroundColor Green
Write-Host 'Backend API: http://localhost:5050' -ForegroundColor Cyan
Write-Host 'Manager Dashboard: http://localhost:5050/manager' -ForegroundColor Cyan
Write-Host 'Press Ctrl+C to stop' -ForegroundColor Yellow
Write-Host '======================================================================' -ForegroundColor Green
Write-Host ''
python app\voice_assistant_clean.py
"@

Start-Process powershell -ArgumentList "-NoExit","-Command",$backendScript

# Wait for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Next.js Frontend
Write-Host "Starting Next.js Frontend (port 3000)..." -ForegroundColor Cyan
$frontendScript = @"
`$Host.UI.RawUI.WindowTitle = 'Summitly AI - Frontend'
Set-Location '$frontendPath'
Write-Host '======================================================================' -ForegroundColor Green
Write-Host '  NEXT.JS FRONTEND RUNNING' -ForegroundColor Green
Write-Host '======================================================================' -ForegroundColor Green
Write-Host 'Frontend: http://localhost:3000' -ForegroundColor Cyan
Write-Host 'AI Chatbot: http://localhost:3000/ai' -ForegroundColor Cyan
Write-Host 'Press Ctrl+C to stop' -ForegroundColor Yellow
Write-Host '======================================================================' -ForegroundColor Green
Write-Host ''
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit","-Command",$frontendScript

# ============================================================================
# Completion Message
# ============================================================================
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  SUMMITLY AI STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "FRONTEND:          http://localhost:3000" -ForegroundColor Cyan
Write-Host "AI CHATBOT:        http://localhost:3000/ai" -ForegroundColor Cyan
Write-Host "BACKEND API:       http://localhost:5050" -ForegroundColor Cyan
Write-Host "ADMIN DASHBOARD:   http://localhost:5050/manager" -ForegroundColor Cyan
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "TIP: Both services are running in separate windows" -ForegroundColor Yellow
Write-Host "     Close those windows to stop the services" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""
