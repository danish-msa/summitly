# Fix the duplicate key issue in storage.prefixes table
# This handles the duplicate key error that occurred during import

param(
    [Parameter(Mandatory=$true)]
    [string]$RdsEndpoint,
    
    [Parameter(Mandatory=$true)]
    [string]$DatabaseName = "summitly",
    
    [Parameter(Mandatory=$true)]
    [string]$Username = "postgres"
)

Write-Host "=== Fixing Prefixes Table Duplicate Key ===" -ForegroundColor Cyan
Write-Host ""

# Check current state
Write-Host "Checking current prefixes table..." -ForegroundColor Yellow
$checkQuery = "SELECT bucket_id, level, name, created_at FROM storage.prefixes ORDER BY bucket_id, level, name;"
psql -h $RdsEndpoint -U $Username -d $DatabaseName -c $checkQuery

Write-Host ""
Write-Host "Fixing duplicate key issue..." -ForegroundColor Yellow
Write-Host "Option 1: Delete the duplicate row" -ForegroundColor Cyan
Write-Host "Option 2: Truncate and re-import prefixes data" -ForegroundColor Cyan
Write-Host ""
Write-Host "Which option? (1/2)" -ForegroundColor Yellow
$option = Read-Host

if ($option -eq "1") {
    Write-Host "Deleting duplicate row..." -ForegroundColor Yellow
    $deleteQuery = @"
DELETE FROM storage.prefixes 
WHERE bucket_id = 'images' AND level = 1 AND name = 'pre-con'
AND ctid NOT IN (
    SELECT MIN(ctid) 
    FROM storage.prefixes 
    WHERE bucket_id = 'images' AND level = 1 AND name = 'pre-con'
);
"@
    psql -h $RdsEndpoint -U $Username -d $DatabaseName -c $deleteQuery
    Write-Host "✅ Duplicate row removed" -ForegroundColor Green
} else {
    Write-Host "Truncating prefixes table..." -ForegroundColor Yellow
    psql -h $RdsEndpoint -U $Username -d $DatabaseName -c "TRUNCATE TABLE storage.prefixes CASCADE;"
    
    Write-Host "Re-importing prefixes data..." -ForegroundColor Yellow
    Write-Host "Extracting prefixes COPY block from data_cleaned.sql..." -ForegroundColor Gray
    
    # Extract prefixes COPY block
    $dataContent = Get-Content "data_cleaned.sql" -Raw
    if ($dataContent -match '(?s)COPY storage\.prefixes.*?\\\.') {
        $prefixesBlock = $matches[0]
        $prefixesBlock | Set-Content "prefixes_data.sql"
        
        Write-Host "Importing prefixes data..." -ForegroundColor Yellow
        psql -h $RdsEndpoint -U $Username -d $DatabaseName -f prefixes_data.sql
        
        Write-Host "✅ Prefixes data re-imported" -ForegroundColor Green
        Remove-Item "prefixes_data.sql" -ErrorAction SilentlyContinue
    } else {
        Write-Host "⚠️  Could not extract prefixes data from data_cleaned.sql" -ForegroundColor Yellow
        Write-Host "You may need to manually insert the prefixes data" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Verifying fix..." -ForegroundColor Yellow
$verifyQuery = "SELECT COUNT(*) as total_rows, COUNT(DISTINCT (bucket_id, level, name)) as unique_rows FROM storage.prefixes;"
psql -h $RdsEndpoint -U $Username -d $DatabaseName -c $verifyQuery

Write-Host ""
Write-Host "✅ Prefixes table fixed!" -ForegroundColor Green

