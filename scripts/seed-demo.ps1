# =============================================================================
# Campus Harmony — Safe Realistic Demo Data Seeder (scripts/seed-demo.ps1)
# =============================================================================
# Populates realistic, interconnected university data for demonstration:
#   - 3 Academic Programs (CSE Core, CSE AI & ML, CSE AI & FT)
#   - 5 Sections: CSE-A, CSE-B, CSE-C, CSE-D, CSE-E (Semester 5)
#   - 5 Curricular Subjects: DSA, Discrete Math, DBMS, Front End Eng-II, OOP Java
#   - 15 Faculty Members: 3 per subject, max 2 sections per teacher [Teacher@123456]
#   - 5 Section Mentors assigned from the 15 faculty members
#   - Exactly 300 Students: 60 per section with unique records & accounts [Student@123456]
#   - 25 Course Offerings & 1,500 Enrollments
#   - Full Weekly Timetable (Mon-Sat) with verified 0 conflicts
#   - Multi-week Attendance History (High, Normal, <75% Defaulter profiles)
#   - 75 Assessments & 4,500 Marks records (within max marks limits)
#   - 12 Realistic Student Grievances with resolution audit timelines
# =============================================================================

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
            [Environment]::SetEnvironmentVariable($varName, $varVal, "Process")
        }
    }
}

$dbPass = $env:CAMPUS_DB_PASSWORD
$dbUser = if ($env:CAMPUS_DB_USER) { $env:CAMPUS_DB_USER } else { 'root' }

if ([string]::IsNullOrWhiteSpace($dbPass)) {
    [Console]::Error.WriteLine("[ERROR] CAMPUS_DB_PASSWORD is not set in .env!")
    exit 1
}

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
    [Console]::Error.WriteLine("[ERROR] mysql.exe was not found in PATH or Program Files.")
    exit 1
}

$env:MYSQL_PWD = $dbPass
$clientArgs = @('--no-defaults', '-h', '127.0.0.1', '-P', '3306', "-u$dbUser", 'campus_harmony')

Write-Host "[INFO] Applying forward migrations (011_academic_programs_and_mentors.sql)..."
$migFile = Join-Path $repo "database\migrations\011_academic_programs_and_mentors.sql"
if (Test-Path -LiteralPath $migFile) {
    $migPath = $migFile.Replace('\', '/')
    & $mysql @clientArgs -e "source $migPath;"
}

$seedFile = Join-Path $repo "database\demo\seed.sql"
if (!(Test-Path -LiteralPath $seedFile)) {
    Write-Host "[INFO] Generating fresh seed SQL from dataset generator..."
    $genScript = Join-Path $repo "scripts\generate_demo_dataset.py"
    & python $genScript
}

Write-Host "[INFO] Seeding 300 students, 15 faculty members, 25 offerings and complete demo dataset into MySQL..."
$seedPath = $seedFile.Replace('\', '/')
& $mysql @clientArgs -e "source $seedPath;"
if ($LASTEXITCODE -ne 0) {
    [Console]::Error.WriteLine("[ERROR] Failed to seed demonstration data into campus_harmony.")
    exit 1
}

Write-Host "[OK] Realistic academic demonstration dataset successfully imported!"
Write-Host "======================================================================"
Write-Host "  CAMPUS HARMONY — DEMONSTRATION ACCOUNTS QUICK REFERENCE:"
Write-Host "  ------------------------------------------------------------------"
Write-Host "  1. Institutional Administrator:"
Write-Host "     Account ID: admin"
Write-Host "     Password:   (configured in your .env file)"
Write-Host ""
Write-Host "  2. Faculty Members (15 Total — 3 per subject, 5 Section Mentors):"
Write-Host "     - Dr. Rajesh Rao     (DSA, Mentor CSE-A)       : prof_rao      [Teacher@123456]"
Write-Host "     - Dr. Priya Sharma   (DBMS, Mentor CSE-B)      : prof_sharma   [Teacher@123456]"
Write-Host "     - Dr. Amit Kapoor    (OOP Java, Mentor CSE-C)  : prof_kapoor   [Teacher@123456]"
Write-Host "     - Dr. Sunita Mehra   (FEE-II, Mentor CSE-D)    : prof_mehra    [Teacher@123456]"
Write-Host "     - Dr. Vikram Joshi   (Discrete, Mentor CSE-E)  : prof_joshi    [Teacher@123456]"
Write-Host ""
Write-Host "  3. Students (300 Total — 60 per section in CSE-A through CSE-E):"
Write-Host "     - High Attendance   (Section CSE-A, 100%)      : 24CSE001      [Student@123456]"
Write-Host "     - Normal Attendance (Section CSE-A, 80%)       : 24CSE046      [Student@123456]"
Write-Host "     - Attendance Defaulter (< 75% warning badge)   : 24CSE058      [Student@123456]"
Write-Host "     - Grievance Filer   (Resolved ticket trail)    : 24CSE005      [Student@123456]"
Write-Host "  ------------------------------------------------------------------"
Write-Host "  Private Excel Credentials Workbook:"
Write-Host "  C:\Users\aksha\Documents\CampusHarmony_Private\CampusHarmony_Demo_Credentials.xlsx"
Write-Host "======================================================================"
exit 0
