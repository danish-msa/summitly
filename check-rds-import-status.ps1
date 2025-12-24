# Check what was successfully imported to RDS
# This helps decide whether to drop/recreate or fix incrementally

param(
    [Parameter(Mandatory=$true)]
    [string]$RdsEndpoint,
    
    [Parameter(Mandatory=$true)]
    [string]$DatabaseName = "summitly",
    
    [Parameter(Mandatory=$true)]
    [string]$Username = "postgres"
)

Write-Host "=== Checking RDS Import Status ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "RDS Endpoint: $RdsEndpoint" -ForegroundColor Gray
Write-Host "Database: $DatabaseName" -ForegroundColor Gray
Write-Host ""

# Check table counts
Write-Host "Checking table counts..." -ForegroundColor Yellow
$query = @"
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename;
"@

psql -h $RdsEndpoint -U $Username -d $DatabaseName -c $query

Write-Host ""
Write-Host "Checking for problematic tables..." -ForegroundColor Yellow

# Check prefixes table
$prefixesCheck = psql -h $RdsEndpoint -U $Username -d $DatabaseName -t -c "SELECT COUNT(*) FROM storage.prefixes;" 2>&1
if ($prefixesCheck -match '\d+') {
    Write-Host "  storage.prefixes: $prefixesCheck rows" -ForegroundColor $(if ([int]$prefixesCheck -gt 0) { "Yellow" } else { "Green" })
} else {
    Write-Host "  storage.prefixes: Table may not exist or has errors" -ForegroundColor Red
}

# Check for vault.secrets
$vaultCheck = psql -h $RdsEndpoint -U $Username -d $DatabaseName -t -c "SELECT COUNT(*) FROM vault.secrets;" 2>&1
if ($vaultCheck -match '\d+') {
    Write-Host "  vault.secrets: $vaultCheck rows (will be removed)" -ForegroundColor Yellow
} else {
    Write-Host "  vault.secrets: Table doesn't exist (expected)" -ForegroundColor Green
}

# Check for extension errors
Write-Host ""
Write-Host "Checking installed extensions..." -ForegroundColor Yellow
psql -h $RdsEndpoint -U $Username -d $DatabaseName -c "SELECT extname, extversion FROM pg_extension ORDER BY extname;"

Write-Host ""
Write-Host "=== Recommendation ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Based on the results above:" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ DROP & RECREATE if:" -ForegroundColor Green
Write-Host "  - Most tables show 0 rows" -ForegroundColor White
Write-Host "  - You see extension errors" -ForegroundColor White
Write-Host "  - You want a clean, guaranteed-correct import" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  KEEP & FIX if:" -ForegroundColor Yellow
Write-Host "  - Most tables have data and look correct" -ForegroundColor White
Write-Host "  - Only a few tables have issues" -ForegroundColor White
Write-Host "  - You want to preserve what's already imported" -ForegroundColor White
Write-Host ""

