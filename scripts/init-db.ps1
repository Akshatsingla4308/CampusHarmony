# =============================================================================
# Campus Harmony — Database Initialization Script
# =============================================================================
# Fully compatible with Windows PowerShell 5.1 and PowerShell 7+
# Checks if the database is already initialized; if not, safely applies
# database/init_complete.sql (schema_v5 + procedures + migrations 006-010).
# =============================================================================

# Requires Windows PowerShell 5.1 or later
# PowerShell version guard
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Error "[ERROR] Windows PowerShell 5.1 or higher is required."
    exit 1
}

$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$initSql = Join-Path $repo "database\init_complete.sql"

if (!(Test-Path $initSql)) {
    Write-Error "[ERROR] Database initialization script not found at $initSql"
    exit 1
}

# Require credentials — no insecure defaults
$pass = $env:CAMPUS_DB_PASSWORD
if ([string]::IsNullOrWhiteSpace($pass)) {
    Write-Error "[SECURITY ERROR] CAMPUS_DB_PASSWORD environment variable is not set!`nPlease define your secure MySQL password in your .env file before launching."
    exit 1
}

$user = if ($env:CAMPUS_DB_USER) { $env:CAMPUS_DB_USER } else { 'root' }

# Find mysql.exe (compatible with PowerShell 5.1 without null-conditional operator)
$cmdObj = Get-Command mysql.exe -ErrorAction SilentlyContinue
$mysql = if ($cmdObj) { $cmdObj.Source } else { $null }

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
    # If check failed (e.g. database does not exist yet), proceed to initialize
}

Write-Host "[INFO] First-run detected. Initializing database 'campus_harmony' from $initSql..."
try {
    Get-Content -Raw $initSql | & $mysql @clientArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] Failed to execute database initialization script."
        exit 1
    }
    Write-Host "[OK] Database schema, stored procedures, triggers, and migrations applied successfully!"
    exit 0
}
catch {
    Write-Error "[ERROR] Error during database initialization: $_"
    exit 1
}
