# Complete fix script for AWS RDS import issues
# This script helps you fix and re-import your database

param(
    [Parameter(Mandatory=$true)]
    [string]$RdsEndpoint,
    
    [Parameter(Mandatory=$true)]
    [string]$DatabaseName = "summitly",
    
    [Parameter(Mandatory=$true)]
    [string]$Username = "postgres"
)

Write-Host "=== AWS RDS Import Fix Script ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "RDS Endpoint: $RdsEndpoint" -ForegroundColor Gray
Write-Host "Database: $DatabaseName" -ForegroundColor Gray
Write-Host "Username: $Username" -ForegroundColor Gray
Write-Host ""

# Step 1: Clean schema
Write-Host "Step 1: Cleaning schema.sql..." -ForegroundColor Yellow
& ".\clean-schema-for-rds.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to clean schema!" -ForegroundColor Red
    exit 1
}

# Step 2: Clean data
Write-Host ""
Write-Host "Step 2: Cleaning data.sql..." -ForegroundColor Yellow
& ".\clean-data-for-rds.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to clean data!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Drop and recreate database (optional - removes existing data)..." -ForegroundColor Yellow
Write-Host "Do you want to drop and recreate the database? (y/N)" -ForegroundColor Yellow
$recreate = Read-Host

if ($recreate -eq 'y' -or $recreate -eq 'Y') {
    Write-Host "Dropping database..." -ForegroundColor Yellow
    psql -h $RdsEndpoint -U $Username -d postgres -c "DROP DATABASE IF EXISTS $DatabaseName;"
    psql -h $RdsEndpoint -U $Username -d postgres -c "CREATE DATABASE $DatabaseName;"
    Write-Host "✅ Database recreated" -ForegroundColor Green
} else {
    Write-Host "Skipping database recreation. Make sure to truncate problematic tables:" -ForegroundColor Yellow
    Write-Host "  TRUNCATE TABLE storage.prefixes;" -ForegroundColor White
}

Write-Host ""
Write-Host "Step 4: Import cleaned schema..." -ForegroundColor Yellow
Write-Host "Press Enter to continue (you'll be prompted for password)..." -ForegroundColor Yellow
Read-Host

psql -h $RdsEndpoint -U $Username -d $DatabaseName -f schema_cleaned.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema imported successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Schema import had errors. Check the output above." -ForegroundColor Red
    Write-Host "You can continue with data import, but some tables may fail." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 5: Fix prefixes table duplicate key issue..." -ForegroundColor Yellow
Write-Host "Truncating storage.prefixes table to avoid duplicate key errors..." -ForegroundColor Yellow
psql -h $RdsEndpoint -U $Username -d $DatabaseName -c "TRUNCATE TABLE storage.prefixes CASCADE;" 2>&1 | Out-Null

Write-Host ""
Write-Host "Step 6: Import cleaned data..." -ForegroundColor Yellow
Write-Host "Press Enter to continue (you'll be prompted for password)..." -ForegroundColor Yellow
Read-Host

psql -h $RdsEndpoint -U $Username -d $DatabaseName -f data_cleaned.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Data imported successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Data import completed with some errors. Check the output above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 7: Verify import..." -ForegroundColor Yellow
Write-Host "Checking table counts..." -ForegroundColor Yellow
psql -h $RdsEndpoint -U $Username -d $DatabaseName -c "
SELECT 
    schemaname,
    relname as tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY schemaname, relname
LIMIT 20;
"

Write-Host ""
Write-Host "=== Import Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify your application connects correctly" -ForegroundColor White
Write-Host "2. Test key functionality" -ForegroundColor White
Write-Host "3. Update DATABASE_URL in your environment variables" -ForegroundColor White

