# Export Supabase Database using Docker (No PostgreSQL installation needed!)
# This script uses Docker to run pg_dump without installing PostgreSQL

Write-Host "=== Exporting Supabase Database ===" -ForegroundColor Cyan
Write-Host ""

# Navigate to project folder
$projectPath = "C:\Users\Danish\Documents\GitHub\summitly"
Set-Location $projectPath

Write-Host "Current directory: $projectPath" -ForegroundColor Gray
Write-Host ""

# Database connection details
$dbHost = "db.omsefyactufffyqaxowx.supabase.co"
$dbUser = "postgres"
$dbName = "postgres"
$dbPassword = "summitly@123"

Write-Host "Step 1: Exporting schema..." -ForegroundColor Yellow
docker run --rm `
    -v "${PWD}:/backup" `
    -e PGPASSWORD=$dbPassword `
    --dns 8.8.8.8 `
    --dns 8.8.4.4 `
    postgres:16 `
    pg_dump -h $dbHost -U $dbUser -d $dbName --schema-only --no-owner --no-privileges -f /backup/schema.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema exported to: schema.sql" -ForegroundColor Green
} else {
    Write-Host "❌ Schema export failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Exporting data..." -ForegroundColor Yellow
docker run --rm `
    -v "${PWD}:/backup" `
    -e PGPASSWORD=$dbPassword `
    --dns 8.8.8.8 `
    --dns 8.8.4.4 `
    postgres:16 `
    pg_dump -h $dbHost -U $dbUser -d $dbName --data-only --no-owner --no-privileges -f /backup/data.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Data exported to: data.sql" -ForegroundColor Green
} else {
    Write-Host "❌ Data export failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Exporting full backup (alternative)..." -ForegroundColor Yellow
docker run --rm `
    -v "${PWD}:/backup" `
    -e PGPASSWORD=$dbPassword `
    --dns 8.8.8.8 `
    --dns 8.8.4.4 `
    postgres:16 `
    pg_dump -h $dbHost -U $dbUser -d $dbName --no-owner --no-privileges -f /backup/full_backup.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Full backup exported to: full_backup.sql" -ForegroundColor Green
} else {
    Write-Host "❌ Full backup export failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Export Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Files created:" -ForegroundColor Yellow
Write-Host "  - schema.sql (database structure)" -ForegroundColor White
Write-Host "  - data.sql (database data)" -ForegroundColor White
Write-Host "  - full_backup.sql (schema + data combined)" -ForegroundColor White
Write-Host ""
Write-Host "Next step: Import to AWS RDS (see AWS_MIGRATION_GUIDE.md)" -ForegroundColor Cyan

