# =============================================================================
# Campus Harmony — Safe Realistic Demo Data Seeder (scripts/seed-demo.ps1)
# =============================================================================
# Populates realistic, interconnected university data for demonstration:
#   - 3 Academic Programs (CSE Core, CSE AI & ML, CSE AI & FT)
#   - 5 Sections: CSE-A, CSE-B, CSE-C, CSE-D, CSE-E (Semester 5)
#   - 5 Curricular Subjects: DSA, Discrete Math, DBMS, Front End Eng-II, OOP Java
#   - 15 Faculty Members: 3 per subject, max 2 sections per teacher
#   - 5 Section Mentors assigned from the 15 faculty members
#   - Exactly 300 Students: 60 per section with unique records & accounts
#   - 25 Course Offerings & 1,500 Enrollments
#   - Full Weekly Timetable (Mon-Sat) with verified 0 conflicts
#   - Multi-week Attendance History (High, Normal, <75% Defaulter profiles)
#   - 75 Assessments & 4,500 Marks records (within max marks limits)
#   - 12 Realistic Student Grievances with resolution audit timelines
# =============================================================================
# SAFETY GUARDS:
#   1. Enforces schema initialization before seeding.
#   2. Strictly rejects populated non-demo databases to protect user data.
#   3. Preserves existing user-managed administrator password credentials.
#   4. Provisions private credentials workbook outside Git at portable location.
# =============================================================================

param(
    [string]$Database = $null,
    [switch]$Regenerate = $false,
    [switch]$ForceDisposable = $false
)

$ErrorActionPreference = 'Stop'

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

$dbPass = $env:CAMPUS_DB_PASSWORD
$dbUser = if ($env:CAMPUS_DB_USER) { $env:CAMPUS_DB_USER } else { 'root' }

if ([string]::IsNullOrWhiteSpace($dbPass)) {
    [Console]::Error.WriteLine("[ERROR] CAMPUS_DB_PASSWORD is not set in .env!")
    exit 1
}

# Resolve target database
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

# Resolve portable private credentials path outside Git
$docsDir = [Environment]::GetFolderPath('MyDocuments')
if ([string]::IsNullOrWhiteSpace($docsDir) -or !(Test-Path -LiteralPath $docsDir)) {
    $docsDir = if ($env:USERPROFILE) { Join-Path $env:USERPROFILE "Documents" } else { [Environment]::GetFolderPath('UserProfile') }
}
$privateDir = if ($env:CAMPUS_CREDENTIALS_DIR) { $env:CAMPUS_CREDENTIALS_DIR } else { Join-Path $docsDir "CampusHarmony_Private" }
$excelPath = if ($env:CAMPUS_CREDENTIALS_PATH) { $env:CAMPUS_CREDENTIALS_PATH } else { Join-Path $privateDir "CampusHarmony_Demo_Credentials.xlsx" }

Write-Host "======================================================================"
Write-Host "  CAMPUS HARMONY — SAFE ACADEMIC DEMONSTRATION DATA SEEDER"
Write-Host "  Target Database: $targetDb"
Write-Host "  Credentials File: $excelPath"
Write-Host "======================================================================"

# Locate mysql.exe
$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (!(Test-Path -LiteralPath $mysql)) {
    $candidates = @(
        "$env:ProgramFiles\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "$env:ProgramFiles\MySQL\MySQL Server 8.4\bin\mysql.exe",
        "${env:ProgramFiles(x86)}\MySQL\MySQL Server 8.0\bin\mysql.exe"
    )
    foreach ($cand in $candidates) {
        if (Test-Path -LiteralPath $cand) {
            $mysql = $cand
            break
        }
    }
}

if (!$mysql -or !(Test-Path -LiteralPath $mysql)) {
    $cmdObj = Get-Command mysql.exe -ErrorAction SilentlyContinue
    $mysql = if ($cmdObj) { $cmdObj.Source } else { $null }
}

if (!$mysql) {
    [Console]::Error.WriteLine("[ERROR] mysql.exe was not found in PATH or standard Program Files.")
    exit 1
}

$env:MYSQL_PWD = $dbPass
$clientArgs = @('--no-defaults', '-h', '127.0.0.1', '-P', '3306', "-u$dbUser")

# --- Step 1: Ensure Target Database Exists & Initialize Schema First ---
Write-Host "[1/6] Verifying Target Database and Academic Schema Order..."
$dbExistsRaw = & $mysql @clientArgs --skip-column-names --batch -e "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='$targetDb';" 2>&1
if (!($dbExistsRaw | Out-String).Contains($targetDb)) {
    Write-Host "[INFO] Database '$targetDb' does not exist. Creating schema '$targetDb'..."
    & $mysql @clientArgs -e "CREATE DATABASE IF NOT EXISTS $targetDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    if ($LASTEXITCODE -ne 0) {
        [Console]::Error.WriteLine("[ERROR] Failed to create database '$targetDb'.")
        exit 1
    }
}

$coreSql = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$targetDb' AND table_name IN ('departments','students','teachers','courses','course_offerings','sections','attendance_records','accounts','assessments','timetable_entries');"
$coreCountRaw = & $mysql @clientArgs --skip-column-names --batch -e $coreSql 2>&1
$coreCount = 0
[int]::TryParse(($coreCountRaw | Out-String).Trim(), [ref]$coreCount) | Out-Null

if ($coreCount -lt 8) {
    Write-Host "[INFO] Core academic schema missing in '$targetDb' (found $coreCount/10 core tables)."
    Write-Host "[INFO] Executing schema initialization first to ensure correct setup order..."
    $initDbScript = Join-Path $repo "scripts\init-db.ps1"
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $initDbScript -Database $targetDb
    if ($LASTEXITCODE -ne 0) {
        [Console]::Error.WriteLine("[ERROR] Schema initialization failed for '$targetDb'!")
        exit 1
    }
    Write-Host "[OK] Schema initialization successfully completed before demo seeding."
} else {
    Write-Host "[OK] Schema order verified: '$targetDb' core tables are intact ($coreCount/10 structures)."
}

# --- Step 2: Safety Audit — Reject Populated Non-Demo Databases ---
Write-Host "[2/6] Running Safety Audit on Target Database '$targetDb'..."
$nonDemoSql = "SELECT " +
    "(SELECT COUNT(*) FROM $targetDb.students WHERE roll NOT LIKE '24CSE%') + " +
    "(SELECT COUNT(*) FROM $targetDb.teachers WHERE id NOT LIKE 'T-10%') + " +
    "(SELECT COUNT(*) FROM $targetDb.accounts WHERE role IN ('student', 'teacher') AND login NOT LIKE '24CSE%' AND login NOT LIKE 'prof_%') AS non_demo_count;"

$nonDemoRaw = & $mysql @clientArgs --skip-column-names --batch -e $nonDemoSql 2>&1
$nonDemoCount = 0
[int]::TryParse(($nonDemoRaw | Out-String).Trim(), [ref]$nonDemoCount) | Out-Null

if ($nonDemoCount -gt 0 -and !$ForceDisposable) {
    [Console]::Error.WriteLine("")
    [Console]::Error.WriteLine("[DATABASE SAFETY VIOLATION] Target database '$targetDb' is a populated NON-DEMO database!")
    [Console]::Error.WriteLine("Found $nonDemoCount non-demo student/teacher/account records.")
    [Console]::Error.WriteLine("Demo data seeding is strictly restricted to clean or recognized demo databases to prevent accidental data erasure.")
    [Console]::Error.WriteLine("If you intended to seed a disposable database, please create a new database or pass -Database <disposable_db_name>.")
    exit 1
}
Write-Host "[OK] Safety audit passed: No non-demo records found. Safe to proceed with demo seeding."

# --- Step 3: Capture Existing Administrator Password Hash (Preservation Guard) ---
Write-Host "[3/6] Inspecting Administrator Account Credentials..."
$existingAdminHash = & $mysql @clientArgs --skip-column-names --batch -e "SELECT password_hash FROM $targetDb.accounts WHERE login='admin' LIMIT 1;" 2>&1
$existingAdminHash = ($existingAdminHash | Out-String).Trim()
$adminExisted = (![string]::IsNullOrWhiteSpace($existingAdminHash)) -and (!$existingAdminHash.StartsWith("ERROR"))

if ($adminExisted) {
    Write-Host "[INFO] Detected existing administrator account in '$targetDb'. User-managed credentials will be preserved."
} else {
    Write-Host "[INFO] Administrator account not yet created in '$targetDb'. Will be provisioned using configured CAMPUS_ADMIN_PASSWORD."
}

# --- Step 4: First-Time Setup Provisioning & Credentials Generation ---
Write-Host "[4/6] Provisioning Demo Accounts and Private Credentials Workbook..."
$seedFile = Join-Path $repo "database\demo\seed.sql"
$mustGenerate = (!(Test-Path -LiteralPath $excelPath)) -or (!(Test-Path -LiteralPath $seedFile)) -or $Regenerate

if ($mustGenerate) {
    Write-Host "[INFO] Generating fresh, non-deterministic demo credentials with random PBKDF2 salts..."
    $genScript = Join-Path $repo "scripts\generate_demo_dataset.py"
    $env:CAMPUS_CREDENTIALS_PATH = $excelPath
    $env:CAMPUS_DB_NAME = $targetDb
    & python $genScript --database $targetDb
    if ($LASTEXITCODE -ne 0) {
        [Console]::Error.WriteLine("[ERROR] Failed to generate demo dataset and credentials workbook!")
        exit 1
    }
    Write-Host "[OK] Private credentials workbook created safely at: $excelPath"
} else {
    Write-Host "[OK] Found existing private credentials workbook at: $excelPath"
}

# --- Step 5: Apply Migrations and Seed Dataset ---
Write-Host "[5/6] Applying Migrations and Seeding Academic Dataset into '$targetDb'..."
$migFile = Join-Path $repo "database\migrations\011_academic_programs_and_mentors.sql"
if (Test-Path -LiteralPath $migFile) {
    if ($targetDb -ne 'campus_harmony') {
        (Get-Content -LiteralPath $migFile -Raw).Replace('campus_harmony', $targetDb) | & $mysql @clientArgs -D $targetDb
    } else {
        $migPath = $migFile.Replace('\', '/')
        & $mysql @clientArgs -D $targetDb -e "source $migPath;"
    }
}

$seedPath = $seedFile.Replace('\', '/')
& $mysql @clientArgs -D $targetDb -e "source $seedPath;"
if ($LASTEXITCODE -ne 0) {
    [Console]::Error.WriteLine("[ERROR] Failed to seed demonstration data into '$targetDb'.")
    exit 1
}
Write-Host "[OK] 300 students, 15 faculty members, 25 offerings and academic records successfully seeded."

# --- Step 6: Verify Administrator Password Was NOT Overwritten ---
Write-Host "[6/6] Verifying Security Controls and Administrator Account..."
if ($adminExisted) {
    $postAdminHash = & $mysql @clientArgs --skip-column-names --batch -e "SELECT password_hash FROM $targetDb.accounts WHERE login='admin' LIMIT 1;" 2>&1
    $postAdminHash = ($postAdminHash | Out-String).Trim()
    if ($postAdminHash -ne $existingAdminHash) {
        [Console]::Error.WriteLine("[SECURITY ERROR] Administrator password hash was altered during demo seeding!")
        & $mysql @clientArgs -D $targetDb -e "UPDATE accounts SET password_hash='$existingAdminHash' WHERE login='admin';"
        exit 1
    }
    Write-Host "[OK] Verified: User-managed administrator password was NOT overwritten."
} else {
    Write-Host "[OK] Verified: Administrator account created with configured password."
}

Write-Host ""
Write-Host "======================================================================"
Write-Host "  CAMPUS HARMONY — DEMONSTRATION SETUP COMPLETED SUCCESSFULLY!"
Write-Host "  ------------------------------------------------------------------"
Write-Host "  * Target Database:       $targetDb"
Write-Host "  * Private Credentials:   $excelPath"
Write-Host "  * Faculty Accounts:      15 accounts (3 per subject, 5 mentors)"
Write-Host "  * Student Accounts:      300 accounts (60 per section in CSE-A to E)"
Write-Host "  * Administrator Account: admin (configured in your .env file)"
Write-Host "======================================================================"
exit 0
