# =============================================================================
# Campus Harmony — Safe Database Initialization & Inspection Script
# =============================================================================
# Fully compatible with Windows PowerShell 5.1 and PowerShell 7+
# Strictly validates credentials, connection, and database state.
# NEVER re-initializes or drops existing populated or partially initialized databases.
# =============================================================================

param(
    [string]$Database = $null
)

# Windows PowerShell 5.1+ compatibility check
if ($PSVersionTable.PSVersion.Major -lt 5) {
    [Console]::Error.WriteLine("[ERROR] Windows PowerShell 5.1 or higher is required.")
    exit 1
}

$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envFile = Join-Path $repo ".env"

if (Test-Path -LiteralPath $envFile) {
    Get-Content -LiteralPath $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and !$line.StartsWith("#") -and ($line -match "^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$")) {
            $varName = $matches[1]
            $varVal = $matches[2]
            if (($varVal.StartsWith('"') -and $varVal.EndsWith('"')) -or ($varVal.StartsWith("'") -and $varVal.EndsWith("'"))) {
                $varVal = $varVal.Substring(1, $varVal.Length - 2)
            }
            if (![Environment]::GetEnvironmentVariable($varName, "Process")) {
                [Environment]::SetEnvironmentVariable($varName, $varVal, "Process")
            }
        }
    }
}

if ([string]::IsNullOrWhiteSpace($Database)) {
    if ($env:CAMPUS_DB_NAME) {
        $targetDb = $env:CAMPUS_DB_NAME
    } elseif ($env:SPRING_DATASOURCE_URL -and ($env:SPRING_DATASOURCE_URL -match "3306/([A-Za-z0-9_]+)")) {
        $targetDb = $matches[1]
    } else {
        $targetDb = 'campus_harmony'
    }
} else {
    $targetDb = $Database
}

$initSql = Join-Path $repo "database\init_complete.sql"

if (!(Test-Path -LiteralPath $initSql)) {
    [Console]::Error.WriteLine("[ERROR] Database initialization script not found at $initSql")
    exit 1
}

# 1. Require credentials — strictly no empty or placeholder passwords
$pass = $env:CAMPUS_DB_PASSWORD
if ([string]::IsNullOrWhiteSpace($pass)) {
    [Console]::Error.WriteLine("[SECURITY ERROR] CAMPUS_DB_PASSWORD environment variable is not set!")
    [Console]::Error.WriteLine("Please define your secure MySQL password in your .env file before launching.")
    exit 1
}

if ($pass -eq 'your_secure_mysql_password_here') {
    [Console]::Error.WriteLine("[SECURITY ERROR] CAMPUS_DB_PASSWORD is still set to the placeholder text!")
    [Console]::Error.WriteLine("Please edit .env and configure your actual MySQL password.")
    exit 1
}

$user = if ($env:CAMPUS_DB_USER) { $env:CAMPUS_DB_USER } else { 'root' }

# 2. Find mysql.exe — must exist or immediately abort
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
        if (Test-Path -LiteralPath $cand) {
            $mysql = $cand
            break
        }
    }
}

if (!$mysql) {
    [Console]::Error.WriteLine("[ERROR] mysql.exe CLI client was not found in PATH or standard installation directories.")
    [Console]::Error.WriteLine("Native Windows launch requires the MySQL client. Please add MySQL bin to PATH.")
    exit 1
}

$env:MYSQL_PWD = $pass
$clientArgs = @('--no-defaults', '-h', '127.0.0.1', '-P', '3306', "-u$user", '--skip-column-names', '--batch', '--raw')

# 3. Verify MySQL server connection and authentication explicitly
$testOutput = & $mysql @clientArgs -e "SELECT 1;" 2>&1
$testExit = $LASTEXITCODE

if ($testExit -ne 0) {
    $errText = $testOutput | Out-String
    if ($errText -match "Access denied|ERROR 1045") {
        [Console]::Error.WriteLine("[DATABASE ERROR] MySQL authentication failed: Access denied for user '$user'.")
        [Console]::Error.WriteLine("Please ensure that CAMPUS_DB_PASSWORD in .env matches your local MySQL server password.")
    } elseif ($errText -match "Can't connect|ERROR 2003") {
        [Console]::Error.WriteLine("[DATABASE ERROR] Could not connect to MySQL Server on 127.0.0.1:3306.")
        [Console]::Error.WriteLine("Please ensure MySQL Server 8.0 service is running and listening on port 3306.")
    } else {
        [Console]::Error.WriteLine("[DATABASE ERROR] Failed to connect to MySQL: $errText")
    }
    exit 1
}

# 4. Check existing database state and table count in target database
$tableCountRaw = & $mysql @clientArgs -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$targetDb';" 2>&1
if ($LASTEXITCODE -ne 0) {
    [Console]::Error.WriteLine("[DATABASE ERROR] Failed to inspect information_schema tables: $tableCountRaw")
    exit 1
}

$tableCount = 0
if (![int]::TryParse($tableCountRaw.ToString().Trim(), [ref]$tableCount)) {
    $tableCount = 0
}

# 5. Evaluate target database safety
if ($tableCount -gt 0) {
    # Check core foundational academic tables
    $coreSql = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$targetDb' AND table_name IN ('departments','students','teachers','courses','course_offerings','sections','attendance_records','accounts','assessments','timetable_entries');"
    $coreCountRaw = & $mysql @clientArgs -e $coreSql 2>&1
    $coreCount = 0
    if ([int]::TryParse($coreCountRaw.ToString().Trim(), [ref]$coreCount) -and $coreCount -ge 8) {
        Write-Host "[OK] Existing populated database '$targetDb' verified ($tableCount tables, $coreCount/10 core structures intact)."
        Write-Host "[OK] Preserving all existing academic data, attendance, and marks. Skipping destructive initialization."
        exit 0
    } else {
        [Console]::Error.WriteLine("[DATABASE SAFETY ERROR] Database '$targetDb' already exists with $tableCount tables, but only $coreCount core tables were found.")
        [Console]::Error.WriteLine("Because init_complete.sql contains destructive DROP TABLE statements, CampusHarmony will NOT overwrite an existing database.")
        [Console]::Error.WriteLine("If you wish to re-initialize from scratch, please manually backup and drop the database '$targetDb'.")
        exit 1
    }
}

# 6. Verified clean/empty target: proceed with initialization
Write-Host "[INFO] Verified clean target database. Initializing '$targetDb' schema, procedures, triggers, and migrations..."
try {
    if ($targetDb -ne 'campus_harmony') {
        (Get-Content -LiteralPath $initSql -Raw).Replace('campus_harmony', $targetDb) | & $mysql @clientArgs
    } else {
        Get-Content -LiteralPath $initSql -Raw | & $mysql @clientArgs
    }
    if ($LASTEXITCODE -ne 0) {
        [Console]::Error.WriteLine("[ERROR] Failed to execute database initialization script.")
        exit 1
    }

    # Verify tables were successfully created
    $postCheckRaw = & $mysql @clientArgs -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$targetDb';" 2>&1
    $postCount = 0
    if ([int]::TryParse($postCheckRaw.ToString().Trim(), [ref]$postCount) -and $postCount -ge 30) {
        Write-Host "[OK] Database successfully initialized with $postCount tables, views, triggers, and stored routines!"
        exit 0
    } else {
        [Console]::Error.WriteLine("[ERROR] Initialization completed with unexpected table count: $postCount (expected >= 30).")
        exit 1
    }
}
catch {
    [Console]::Error.WriteLine("[ERROR] Exception occurred during database initialization: $_")
    exit 1
}
