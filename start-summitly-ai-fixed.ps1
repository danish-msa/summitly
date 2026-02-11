#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Starts both the Summitly AI Python backend and Next.js frontend
.DESCRIPTION
    This script starts the Python Flask backend (voice_assistant_clean.py) and the Next.js development server concurrently.
.EXAMPLE
    .\start-summitly-ai-fixed.ps1
#>

Write-Host "Starting Summitly AI - Full Stack Real Estate Assistant" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not found. Please install Python 3.9+ first." -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

Write-Host "`nSetting up environment..." -ForegroundColor Yellow

# Navigate to Python backend directory
$backendPath = "C:\PropertyCH\Summitly v3\Summitly-AI-"
$frontendPath = $PSScriptRoot

if (-not (Test-Path $backendPath)) {
    Write-Host "Backend directory not found: $backendPath" -ForegroundColor Red
    exit 1
}

# Check if .env.local exists, if not create from example
$envPath = Join-Path $PSScriptRoot ".env.local"
$envExamplePath = Join-Path $PSScriptRoot ".env.local.example"

if (-not (Test-Path $envPath)) {
    if (Test-Path $envExamplePath) {
        Write-Host "Creating .env.local from example..." -ForegroundColor Yellow
        Copy-Item $envExamplePath $envPath
        Write-Host "Created .env.local - Please configure your API keys!" -ForegroundColor Green
    } else {
        Write-Host "No .env.local found. Please create one with required environment variables." -ForegroundColor Yellow
    }
}

Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
Set-Location $backendPath

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
if (Test-Path "venv\Scripts\Activate.ps1") {
    . .\venv\Scripts\Activate.ps1
    Write-Host "Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "Could not find venv activation script" -ForegroundColor Yellow
}

# Install requirements
if (Test-Path "requirements.txt") {
    Write-Host "Installing Python packages..." -ForegroundColor Yellow
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    Write-Host "Python dependencies installed" -ForegroundColor Green
} else {
    Write-Host "requirements.txt not found" -ForegroundColor Yellow
}

# Install Node.js dependencies
Set-Location $frontendPath
Write-Host "`nInstalling Node.js dependencies..." -ForegroundColor Cyan

if (Test-Path "package.json") {
    npm install
    Write-Host "Node.js dependencies installed" -ForegroundColor Green
} else {
    Write-Host "package.json not found" -ForegroundColor Red
    exit 1
}

Write-Host "`nStarting services..." -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

# Start Python backend in a new PowerShell window
Write-Host "Starting Python Backend (Flask on port 5050)..." -ForegroundColor Yellow
$backendScript = @"
Set-Location '$backendPath'
if (Test-Path 'venv\Scripts\Activate.ps1') {
    . .\venv\Scripts\Activate.ps1
}
Write-Host 'Python Backend Starting...' -ForegroundColor Green
Write-Host 'Backend URL: http://localhost:5050' -ForegroundColor Cyan
Write-Host 'Press Ctrl+C to stop the backend' -ForegroundColor Yellow
Write-Host ''
python app\voice_assistant_clean.py
"@

Start-Process powershell -ArgumentList "-NoExit","-Command",$backendScript

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Next.js frontend in a new PowerShell window
Write-Host "Starting Next.js Frontend (port 3000)..." -ForegroundColor Yellow
$frontendScript = @"
Set-Location '$frontendPath'
Write-Host 'Next.js Frontend Starting...' -ForegroundColor Green
Write-Host 'Frontend URL: http://localhost:3000' -ForegroundColor Cyan
Write-Host 'AI Chat: http://localhost:3000/ai' -ForegroundColor Cyan
Write-Host 'Press Ctrl+C to stop the frontend' -ForegroundColor Yellow
Write-Host ''
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit","-Command",$frontendScript

Write-Host "`nSummitly AI services are starting!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "AI Chat: http://localhost:3000/ai" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:5050" -ForegroundColor Cyan
Write-Host "Manager Dashboard: http://localhost:5050/manager" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "`nTip: Both services are running in separate windows. Close those windows to stop them." -ForegroundColor Yellow
Write-Host "Happy coding!" -ForegroundColor Green
