# Clean schema.sql to remove Supabase-specific extensions that don't exist on AWS RDS
# This script removes pg_graphql and supabase_vault extensions and related code

Write-Host "=== Cleaning schema.sql for AWS RDS ===" -ForegroundColor Cyan
Write-Host ""

$schemaFile = "schema.sql"
$cleanedFile = "schema_cleaned.sql"

if (-not (Test-Path $schemaFile)) {
    Write-Host "❌ Error: $schemaFile not found!" -ForegroundColor Red
    Write-Host "Please make sure you're in the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "Reading $schemaFile..." -ForegroundColor Yellow
$content = Get-Content $schemaFile -Raw

Write-Host "Removing Supabase-specific extensions and code..." -ForegroundColor Yellow

# Remove pg_graphql extension
$content = $content -replace '(?s)-- Name: pg_graphql.*?COMMENT ON EXTENSION pg_graphql.*?\r?\n', ''

# Remove supabase_vault extension
$content = $content -replace '(?s)-- Name: supabase_vault.*?COMMENT ON EXTENSION supabase_vault.*?\r?\n', ''

# Remove graphql schema creation
$content = $content -replace '(?s)-- Name: graphql; Type: SCHEMA.*?CREATE SCHEMA graphql;.*?\r?\n', ''
$content = $content -replace '(?s)-- Name: graphql_public; Type: SCHEMA.*?CREATE SCHEMA graphql_public;.*?\r?\n', ''

# Remove vault schema creation (if not used)
# We'll keep the schema but remove the extension dependency
# $content = $content -replace '(?s)-- Name: vault; Type: SCHEMA.*?CREATE SCHEMA vault;.*?\r?\n', ''

# Remove functions related to pg_graphql
$content = $content -replace '(?s)-- Name: grant_pg_graphql_access.*?COMMENT ON FUNCTION extensions\.grant_pg_graphql_access.*?\r?\n', ''
$content = $content -replace '(?s)-- Name: set_graphql_placeholder.*?COMMENT ON FUNCTION extensions\.set_graphql_placeholder.*?\r?\n', ''

# Remove event triggers related to graphql
$content = $content -replace '(?s)-- Name: issue_graphql_placeholder.*?CREATE EVENT TRIGGER issue_graphql_placeholder.*?\r?\n', ''
$content = $content -replace '(?s)-- Name: issue_pg_graphql_access.*?CREATE EVENT TRIGGER issue_pg_graphql_access.*?\r?\n', ''

# Remove vault.secrets table creation (if exists)
$content = $content -replace '(?s)-- Name: secrets; Type: TABLE; Schema: vault.*?ALTER TABLE ONLY vault\.secrets.*?\r?\n', ''

# Clean up multiple blank lines
$content = $content -replace '(\r?\n){3,}', "`r`n`r`n"

Write-Host "Writing cleaned schema to $cleanedFile..." -ForegroundColor Yellow
$content | Set-Content $cleanedFile -NoNewline

Write-Host ""
Write-Host "✅ Cleaned schema saved to: $cleanedFile" -ForegroundColor Green
Write-Host ""
Write-Host "Removed:" -ForegroundColor Yellow
Write-Host "  - pg_graphql extension" -ForegroundColor White
Write-Host "  - supabase_vault extension" -ForegroundColor White
Write-Host "  - graphql and graphql_public schemas" -ForegroundColor White
Write-Host "  - Related functions and event triggers" -ForegroundColor White
Write-Host ""
Write-Host "Next step: Import cleaned schema to RDS" -ForegroundColor Cyan

