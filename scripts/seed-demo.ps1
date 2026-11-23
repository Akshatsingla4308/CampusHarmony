# =============================================================================
# Campus Harmony — Safe Realistic Demo Data Seeder (scripts/seed-demo.ps1)
# =============================================================================
# Populates realistic, interconnected university data for demonstration:
#   - Departments (Computer Science, Electronics)
#   - Academic Sections (Section A Sem 5, Section B Sem 3)
#   - Teachers & Faculty Accounts (prof_rao, prof_kapoor) [Password: Teacher@123456]
#   - Courses & Section Offerings (CS501, CS502, CS301)
#   - Students & Accounts (CS-2101, CS-2102) [Password: Student@123456]
#   - Course Enrollments
#   - Master Timetable entries
#   - Attendance sessions & records
#   - Continuous assessment & marks
#   - Sample student grievances
# Fully idempotent: Uses INSERT IGNORE / ON DUPLICATE KEY UPDATE.
# NEVER drops tables or overwrites existing production records.
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
$cmdObj = Get-Command mysql.exe -ErrorAction SilentlyContinue
$mysql = if ($cmdObj) { $cmdObj.Source } else { $null }
if (!$mysql) {
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

if (!$mysql) {
    [Console]::Error.WriteLine("[ERROR] mysql.exe was not found in PATH or Program Files.")
    exit 1
}

# Generate PBKDF2 standard password hashes
$saltTeacher = [byte[]](1..16 | ForEach-Object { 0x01 })
$keyTeacher = [System.Security.Cryptography.Rfc2898DeriveBytes]::new("Teacher@123456", $saltTeacher, 600000, [System.Security.Cryptography.HashAlgorithmName]::SHA256).GetBytes(32)
$teacherHash = "600000$" + [Convert]::ToBase64String($saltTeacher) + "$" + [Convert]::ToBase64String($keyTeacher)

$saltStudent = [byte[]](1..16 | ForEach-Object { 0x02 })
$keyStudent = [System.Security.Cryptography.Rfc2898DeriveBytes]::new("Student@123456", $saltStudent, 600000, [System.Security.Cryptography.HashAlgorithmName]::SHA256).GetBytes(32)
$studentHash = "600000$" + [Convert]::ToBase64String($saltStudent) + "$" + [Convert]::ToBase64String($keyStudent)

$env:MYSQL_PWD = $dbPass
$clientArgs = @('--no-defaults', '-h', '127.0.0.1', '-P', '3306', "-u$dbUser", 'campus_harmony')

Write-Host "[INFO] Seeding realistic demonstration data into campus_harmony database..."

$seedSql = @"
-- 1. Departments
INSERT INTO departments (id, name, code) VALUES
(1, 'Computer Science & Engineering', 'CSE'),
(2, 'Information Technology', 'IT'),
(3, 'Electronics & Communication', 'ECE')
ON DUPLICATE KEY UPDATE name=VALUES(name), code=VALUES(code);

-- 2. Academic Periods
INSERT INTO academic_periods (id, code, name, academic_year, semester_term, is_current) VALUES
(1, '2026-ODD', 'Autumn Semester 2026', '2026-2027', 'Odd', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name), is_current=VALUES(is_current);

-- 3. Curricular Subjects
INSERT INTO subjects (subject_key, label) VALUES
('computerScience', 'Computer Science'),
('mathematics', 'Mathematics'),
('physics', 'Physics')
ON DUPLICATE KEY UPDATE label=VALUES(label);

-- 4. Sections
INSERT INTO sections (id, name, department_id, academic_period_id, semester) VALUES
(1, 'Section A', 1, 1, 5),
(2, 'Section B', 1, 1, 3)
ON DUPLICATE KEY UPDATE name=VALUES(name), semester=VALUES(semester);

-- 5. Teachers & Accounts
INSERT INTO teachers (id, name, department_id, subject, workspace) VALUES
('prof_rao', 'Dr. Sudha Rao', 1, 'computerScience', 'own'),
('prof_kapoor', 'Prof. Anil Kapoor', 1, 'computerScience', 'own')
ON DUPLICATE KEY UPDATE name=VALUES(name), department_id=VALUES(department_id);

INSERT INTO accounts (login, display_name, role, password_hash, teacher_id) VALUES
('prof_rao', 'Dr. Sudha Rao', 'teacher', '$teacherHash', 'prof_rao'),
('prof_kapoor', 'Prof. Anil Kapoor', 'teacher', '$teacherHash', 'prof_kapoor')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), password_hash=VALUES(password_hash);

-- 6. Courses
INSERT INTO courses (code, name, department_id, subject_key, credits, semester, status, teacher_id, faculty) VALUES
('CS501', 'Operating Systems', 1, 'computerScience', 4, 5, 'Ongoing', 'prof_rao', 'Dr. Sudha Rao'),
('CS502', 'Computer Networks', 1, 'computerScience', 4, 5, 'Ongoing', 'prof_kapoor', 'Prof. Anil Kapoor'),
('CS301', 'Data Structures & Algorithms', 1, 'computerScience', 4, 3, 'Ongoing', 'prof_rao', 'Dr. Sudha Rao')
ON DUPLICATE KEY UPDATE name=VALUES(name), credits=VALUES(credits), faculty=VALUES(faculty);

-- 7. Course Offerings (Assign courses & teachers to sections)
INSERT INTO course_offerings (id, section_id, academic_period_id, course_code, teacher_id) VALUES
(1, 1, 1, 'CS501', 'prof_rao'),
(2, 1, 1, 'CS502', 'prof_kapoor'),
(3, 2, 1, 'CS301', 'prof_rao')
ON DUPLICATE KEY UPDATE teacher_id=VALUES(teacher_id);

-- 8. Students & Accounts
INSERT INTO students (id, roll, name, department_id, department, semester, email, phone, gender, status) VALUES
(101, 'CS-2101', 'Rahul Sharma', 1, 'Computer Science & Engineering', 5, 'rahul.sharma@campus.edu', '9876543210', 'Male', 'Active'),
(102, 'CS-2102', 'Ananya Iyer', 1, 'Computer Science & Engineering', 5, 'ananya.iyer@campus.edu', '9812345678', 'Female', 'Active')
ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), status=VALUES(status);

INSERT INTO section_members (student_id, academic_period_id, section_id) VALUES
(101, 1, 1),
(102, 1, 1)
ON DUPLICATE KEY UPDATE section_id=VALUES(section_id);

INSERT INTO accounts (login, display_name, role, password_hash, student_id) VALUES
('CS-2101', 'Rahul Sharma', 'student', '$studentHash', 101),
('CS-2102', 'Ananya Iyer', 'student', '$studentHash', 102)
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), password_hash=VALUES(password_hash);

-- 9. Course Enrollments
INSERT INTO course_enrollments (id, student_id, course_code, academic_period_id, offering_id, enrollment_date, status) VALUES
(1, 101, 'CS501', 1, 1, '2026-08-01', 'Enrolled'),
(2, 101, 'CS502', 1, 2, '2026-08-01', 'Enrolled'),
(3, 102, 'CS501', 1, 1, '2026-08-01', 'Enrolled'),
(4, 102, 'CS502', 1, 2, '2026-08-01', 'Enrolled')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 10. Weekly Timetable Entries
INSERT INTO timetable_entries (id, academic_period_id, section_id, offering_id, course_code, teacher_id, day_of_week, period_number, start_time, end_time, room) VALUES
(1, 1, 1, 1, 'CS501', 'prof_rao', 'Monday', 1, '09:00:00', '09:50:00', 'Room 301, Block A'),
(2, 1, 1, 2, 'CS502', 'prof_kapoor', 'Monday', 2, '10:00:00', '10:50:00', 'Room 302, Block A'),
(3, 1, 1, 1, 'CS501', 'prof_rao', 'Tuesday', 1, '09:00:00', '09:50:00', 'Room 301, Block A'),
(4, 1, 1, 2, 'CS502', 'prof_kapoor', 'Wednesday', 2, '10:00:00', '10:50:00', 'Room 302, Block A'),
(5, 1, 1, 1, 'CS501', 'prof_rao', 'Thursday', 3, '11:00:00', '11:50:00', 'Room 301, Block A'),
(6, 1, 1, 2, 'CS502', 'prof_kapoor', 'Friday', 4, '12:00:00', '12:50:00', 'Room 302, Block A')
ON DUPLICATE KEY UPDATE room=VALUES(room);

-- 11. Attendance Sessions & Records
INSERT INTO attendance_sessions (id, course_code, academic_period_id, teacher_id, offering_id, session_date, session_slot, session_type, status, submitted_at) VALUES
(1, 'CS501', 1, 'prof_rao', 1, CURRENT_DATE, 1, 'Lecture', 'Completed', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO attendance_records (id, session_id, enrollment_id, student_id, course_code, academic_period_id, offering_id, status) VALUES
(1, 1, 1, 101, 'CS501', 1, 1, 'Present'),
(2, 1, 3, 102, 'CS501', 1, 1, 'Present')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 12. Assessments & Marks
INSERT INTO assessments (id, offering_id, academic_period_id, course_code, teacher_id, title, assessment_type, max_marks, assessment_date) VALUES
(1, 1, 1, 'CS501', 'prof_rao', 'Mid-Semester Exam', 'Midterm', 50.00, '2026-10-15'),
(2, 1, 1, 'CS501', 'prof_rao', 'Continuous Assessment 1', 'CA-1', 25.00, '2026-09-10'),
(3, 2, 1, 'CS502', 'prof_kapoor', 'Mid-Semester Exam', 'Midterm', 50.00, '2026-10-18')
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO assessment_marks (id, assessment_id, enrollment_id, student_id, marks_obtained, max_marks, grade, remarks) VALUES
(1, 1, 1, 101, 44.00, 50.00, 'A', 'Excellent performance on CPU scheduling'),
(2, 1, 3, 102, 48.00, 50.00, 'A+', 'Top score in cohort'),
(3, 2, 1, 101, 23.50, 25.00, 'A+', 'Very good quiz result'),
(4, 2, 3, 102, 24.00, 25.00, 'A+', 'Excellent quiz result'),
(5, 3, 2, 101, 42.00, 50.00, 'A', 'Good networking fundamentals'),
(6, 3, 4, 102, 45.00, 50.00, 'A+', 'Strong routing algorithm analysis')
ON DUPLICATE KEY UPDATE marks_obtained=VALUES(marks_obtained);

-- 13. Student Grievances & Complaints
INSERT INTO complaints (id, reference_number, student_id, category, subject, description, related_offering_id, status, created_at) VALUES
(1, 'CMP-2026-0001', 101, 'Infrastructure', 'Classroom Projector Malfunction in Room 301', 'The digital HDMI projector in Room 301 flickers intermittently during lectures.', 1, 'In Progress', CURRENT_TIMESTAMP),
(2, 'CMP-2026-0002', 102, 'Academic', 'Library Access for Operating Systems Reference Material', 'Requesting additional printed reserve copies of Silberschatz Operating Systems textbook.', 1, 'Resolved', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO complaint_activity (id, complaint_id, actor_login, actor_name, actor_role, action, previous_status, new_status, response_text, created_at) VALUES
(1, 1, 'CS-2101', 'Rahul Sharma', 'student', 'SUBMITTED', NULL, 'Open', 'Grievance submitted for administrative review.', CURRENT_TIMESTAMP),
(2, 1, 'admin', 'System Administrator', 'admin', 'STATUS_CHANGE', 'Open', 'In Progress', 'Assigned to campus IT facility maintenance engineer.', CURRENT_TIMESTAMP),
(3, 2, 'CS-2102', 'Ananya Iyer', 'student', 'SUBMITTED', NULL, 'Open', 'Grievance submitted for library committee review.', CURRENT_TIMESTAMP),
(4, 2, 'admin', 'System Administrator', 'admin', 'RESOLVED', 'In Progress', 'Resolved', 'Two additional copies acquired and placed in general reserve section.', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE response_text=VALUES(response_text);
"@

$seedSql | & $mysql @clientArgs
if ($LASTEXITCODE -ne 0) {
    [Console]::Error.WriteLine("[ERROR] Failed to seed demonstration data.")
    exit 1
}

Write-Host "[OK] Realistic demonstration data successfully loaded!"
Write-Host "======================================================================"
Write-Host "  CAMPUS HARMONY DEMONSTRATION ACCOUNTS READY:"
Write-Host "  ------------------------------------------------------------------"
Write-Host "  1. Institutional Administrator:"
Write-Host "     Account ID: admin"
Write-Host "     Password:   (configured in your .env file)"
Write-Host ""
Write-Host "  2. Faculty Member (Teacher):"
Write-Host "     Account ID: prof_rao"
Write-Host "     Password:   Teacher@123456"
Write-Host ""
Write-Host "  3. Student Account:"
Write-Host "     Account ID: CS-2101"
Write-Host "     Password:   Student@123456"
Write-Host "======================================================================"
exit 0
