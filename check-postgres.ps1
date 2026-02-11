# PostgreSQL Installation Checker for Windows
# Run this script to check if PostgreSQL is installed and help you use it

Write-Host "=== PostgreSQL Client Tools Checker ===" -ForegroundColor Cyan
Write-Host ""

# Check if pg_dump is in PATH
$pgDumpInPath = Get-Command pg_dump -ErrorAction SilentlyContinue

if ($pgDumpInPath) {
    Write-Host "✅ pg_dump is available in PATH!" -ForegroundColor Green
    Write-Host "Location: $($pgDumpInPath.Source)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You can now run:" -ForegroundColor Yellow
    Write-Host "  pg_dump --version" -ForegroundColor White
    Write-Host ""
    exit 0
}

Write-Host "❌ pg_dump not found in PATH" -ForegroundColor Red
Write-Host ""

# Check common installation paths
Write-Host "Searching for PostgreSQL installation..." -ForegroundColor Yellow
Write-Host ""

$commonPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\13\bin\pg_dump.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\pg_dump.exe",
    "C:\Program Files (x86)\PostgreSQL\15\bin\pg_dump.exe"
)

$foundPath = $null
foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        $foundPath = $path
        Write-Host "✅ Found PostgreSQL at: $path" -ForegroundColor Green
        break
    }
}

if ($foundPath) {
    $binPath = Split-Path $foundPath
    Write-Host ""
    Write-Host "=== SOLUTION ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 1: Add to PATH for this session (temporary):" -ForegroundColor Yellow
    Write-Host "  `$env:Path += `";$binPath`"" -ForegroundColor White
    Write-Host "  pg_dump --version" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Use full path directly:" -ForegroundColor Yellow
    Write-Host "  & `"$foundPath`" --version" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 3: Add to PATH permanently:" -ForegroundColor Yellow
    Write-Host "  1. Open System Properties → Environment Variables" -ForegroundColor White
    Write-Host "  2. Edit 'Path' under System variables" -ForegroundColor White
    Write-Host "  3. Add: $binPath" -ForegroundColor White
    Write-Host "  4. Restart PowerShell" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ PostgreSQL not found in common locations" -ForegroundColor Red
    Write-Host ""
    Write-Host "=== INSTALLATION REQUIRED ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Download PostgreSQL from:" -ForegroundColor Yellow
    Write-Host "  https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host ""
    Write-Host "Or direct link:" -ForegroundColor Yellow
    Write-Host "  https://www.enterprisedb.com/downloads/postgres-postgresql-downloads" -ForegroundColor White
    Write-Host ""
    Write-Host "During installation, make sure to check:" -ForegroundColor Yellow
    Write-Host "  ✅ Command Line Tools (includes pg_dump, psql)" -ForegroundColor White
    Write-Host ""
    Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Yellow
    Write-Host ""
}

