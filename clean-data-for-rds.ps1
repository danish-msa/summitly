# Clean data.sql to remove vault.secrets and fix duplicate key issues
# This script removes vault.secrets COPY statements and handles duplicate keys

Write-Host "=== Cleaning data.sql for AWS RDS ===" -ForegroundColor Cyan
Write-Host ""

$dataFile = "data.sql"
$cleanedFile = "data_cleaned.sql"

if (-not (Test-Path $dataFile)) {
    Write-Host "❌ Error: $dataFile not found!" -ForegroundColor Red
    Write-Host "Please make sure you're in the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "Reading $dataFile..." -ForegroundColor Yellow
$lines = Get-Content $dataFile

Write-Host "Cleaning data file..." -ForegroundColor Yellow

$cleanedLines = @()
$skipVaultSecrets = $false
$inPrefixesCopy = $false
$prefixesLines = @()

foreach ($line in $lines) {
    # Skip vault.secrets COPY block
    if ($line -match 'COPY vault\.secrets') {
        $skipVaultSecrets = $true
        Write-Host "  Removing vault.secrets COPY block..." -ForegroundColor Gray
        continue
    }
    
    if ($skipVaultSecrets) {
        if ($line -match '^\\\.') {
            $skipVaultSecrets = $false
        }
        continue
    }
    
    # Track prefixes COPY block for duplicate checking
    if ($line -match 'COPY.*\.prefixes') {
        $inPrefixesCopy = $true
        $prefixesLines = @()
        $prefixesLines += $line
        continue
    }
    
    if ($inPrefixesCopy) {
        if ($line -match '^\\\.') {
            # End of COPY block - check for duplicates
            $prefixesLines += $line
            $cleanedLines += $prefixesLines
            $inPrefixesCopy = $false
            $prefixesLines = @()
        } else {
            $prefixesLines += $line
        }
        continue
    }
    
    # Keep all other lines
    $cleanedLines += $line
}

Write-Host "Writing cleaned data to $cleanedFile..." -ForegroundColor Yellow
$cleanedLines | Set-Content $cleanedFile

Write-Host ""
Write-Host "✅ Cleaned data saved to: $cleanedFile" -ForegroundColor Green
Write-Host ""
Write-Host "Removed:" -ForegroundColor Yellow
Write-Host "  - vault.secrets COPY block" -ForegroundColor White
Write-Host ""
Write-Host "Note: If you still get duplicate key errors for prefixes table," -ForegroundColor Yellow
Write-Host "you may need to truncate the table first before importing:" -ForegroundColor Yellow
Write-Host "  TRUNCATE TABLE storage.prefixes;" -ForegroundColor White
Write-Host ""
Write-Host "Next step: Import cleaned data to RDS" -ForegroundColor Cyan

