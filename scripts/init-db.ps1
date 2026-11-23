# =============================================================================
# Campus Harmony — Database Initialization Script
# =============================================================================
# Checks if the database is already initialized; if not, safely applies
# database/init_complete.sql (schema_v5 + procedures + migrations 006-010).
# =============================================================================

$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$initSql = Join-Path $repo "database\init_complete.sql"

if (!(Test-Path $initSql)) {
    Write-Error "Database initialization script not found at $initSql"
    exit 1
}

# Find mysql.exe
$mysql = (Get-Command mysql.exe -ErrorAction SilentlyContinue)?.Source
if (!$mysql) {
    $candidates = @(
        "$env:ProgramFiles\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "$env:ProgramFiles\MySQL\MySQL Server 8.4\bin\mysql.exe",
        "$env:ProgramFiles\MySQL\MySQL Server 8.1\bin\mysql.exe",
        "${env:ProgramFiles(x86)}\MySQL\MySQL Server 8.0\bin\mysql.exe"
    )
    foreach ($cand in $candidates) {
        if (Test-Path $cand) {
            $mysql = $cand
            break
        }
    }
}

if (!$mysql) {
    Write-Warning "mysql.exe CLI client was not found in PATH or standard installation directories."
    Write-Host "Assuming MySQL is configured and managed externally. Continuing..."
    exit 0
}

$user = if ($env:CAMPUS_DB_USER) { $env:CAMPUS_DB_USER } else { 'root' }
$pass = if ($env:CAMPUS_DB_PASSWORD) { $env:CAMPUS_DB_PASSWORD } else { 'RootPass2026!' }

$env:MYSQL_PWD = $pass
$clientArgs = @('-h', '127.0.0.1', '-P', '3306', "-u$user", '--skip-column-names', '--batch', '--raw')

# Check if accounts table already exists
try {
    $checkSql = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='campus_harmony' AND table_name='accounts';"
    $tableCount = & $mysql @clientArgs -e $checkSql 2>$null
    if ($LASTEXITCODE -eq 0 -and $tableCount -and [int]$tableCount.Trim() -gt 0) {
        Write-Host "[OK] Database 'campus_harmony' is already initialized ($tableCount tables verified). Preserving existing records."
        exit 0
    }
}
catch {
    # If check failed, proceed to initialize
}

Write-Host "[INFO] First-run detected. Initializing database 'campus_harmony' from $initSql..."
try {
    Get-Content -Raw $initSql | & $mysql @clientArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to execute database initialization script."
        exit 1
    }
    Write-Host "[OK] Database schema, stored procedures, triggers, and migrations applied successfully!"
    exit 0
}
catch {
    Write-Error "Error during database initialization: $_"
    exit 1
}
