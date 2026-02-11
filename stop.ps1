#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Stops all Summitly AI services
.DESCRIPTION
    Kills processes running on ports 3000, 3001, and 5050
#>

Write-Host "Stopping Summitly AI services..." -ForegroundColor Yellow

# Kill port 3000
try {
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($port3000) {
        Get-Process -Id $port3000.OwningProcess | Stop-Process -Force
        Write-Host "Stopped service on port 3000" -ForegroundColor Green
    }
} catch {
    Write-Host "No service on port 3000" -ForegroundColor Gray
}

# Kill port 3001
try {
    $port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
    if ($port3001) {
        Get-Process -Id $port3001.OwningProcess | Stop-Process -Force
        Write-Host "Stopped service on port 3001" -ForegroundColor Green
    }
} catch {
    Write-Host "No service on port 3001" -ForegroundColor Gray
}

# Kill port 5050
try {
    $port5050 = Get-NetTCPConnection -LocalPort 5050 -ErrorAction SilentlyContinue
    if ($port5050) {
        Get-Process -Id $port5050.OwningProcess | Stop-Process -Force
        Write-Host "Stopped service on port 5050" -ForegroundColor Green
    }
} catch {
    Write-Host "No service on port 5050" -ForegroundColor Gray
}

Write-Host ""
Write-Host "All services stopped!" -ForegroundColor Green
Write-Host "You can now run: .\start.ps1" -ForegroundColor Cyan
