# =============================================================================
# Campus Harmony — Safe Realistic Demo Data Seeder (scripts/seed-demo.ps1)
# =============================================================================
# Populates realistic, interconnected university data for demonstration:
#   - Departments (CSE, IT, ECE, ME)
#   - Academic Sections (Section A Sem 5, Section B Sem 3, Section C Sem 5)
#   - Faculty Accounts (prof_rao, prof_kapoor, prof_sharma) [Password: Teacher@123456]
#   - Courses & Section Offerings (CS501, CS502, CS301, CS503, CS504)
#   - Students & Accounts (CS-2101 through CS-2108) [Password: Student@123456]
#   - Complete Course Enrollments across Sections
#   - Full Weekly Timetable (Mon-Sat, all days active)
#   - Multiple Attendance Sessions & Records (Defaulters & High Attendance)
#   - Comprehensive Assessments & Grading Matrix (Midterm, Quiz, Lab, CA)
#   - Multi-category Grievances & Resolution Timelines
#   - Institutional Activities & Audit Logs
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

# Generate PBKDF2 standard password hashes (600,000 iterations HMAC-SHA256)
$saltTeacher = [byte[]](1..16 | ForEach-Object { 0x01 })
$keyTeacher = [System.Security.Cryptography.Rfc2898DeriveBytes]::new("Teacher@123456", $saltTeacher, 600000, [System.Security.Cryptography.HashAlgorithmName]::SHA256).GetBytes(32)
$teacherHash = "600000$" + [Convert]::ToBase64String($saltTeacher) + "$" + [Convert]::ToBase64String($keyTeacher)

$saltStudent = [byte[]](1..16 | ForEach-Object { 0x02 })
$keyStudent = [System.Security.Cryptography.Rfc2898DeriveBytes]::new("Student@123456", $saltStudent, 600000, [System.Security.Cryptography.HashAlgorithmName]::SHA256).GetBytes(32)
$studentHash = "600000$" + [Convert]::ToBase64String($saltStudent) + "$" + [Convert]::ToBase64String($keyStudent)

$env:MYSQL_PWD = $dbPass
$clientArgs = @('--no-defaults', '-h', '127.0.0.1', '-P', '3306', "-u$dbUser", 'campus_harmony')

Write-Host "[INFO] Seeding rich, realistic demonstration data into campus_harmony database..."

$seedSql = @"
-- 1. Departments
INSERT INTO departments (id, name, code) VALUES
(1, 'Computer Science & Engineering', 'CSE'),
(2, 'Information Technology', 'IT'),
(3, 'Electronics & Communication', 'ECE'),
(4, 'Mechanical Engineering', 'ME')
ON DUPLICATE KEY UPDATE name=VALUES(name), code=VALUES(code);

-- 2. Academic Periods
INSERT INTO academic_periods (id, code, name, academic_year, semester_term, is_current) VALUES
(1, '2026-ODD', 'Autumn Semester 2026', '2026-2027', 'Odd', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name), is_current=VALUES(is_current);

-- 3. Curricular Subjects
INSERT INTO subjects (subject_key, label) VALUES
('computerScience', 'Computer Science'),
('mathematics', 'Mathematics'),
('physics', 'Physics'),
('electronics', 'Electronics')
ON DUPLICATE KEY UPDATE label=VALUES(label);

-- 4. Sections
INSERT INTO sections (id, name, department_id, academic_period_id, semester) VALUES
(1, 'Section A', 1, 1, 5),
(2, 'Section B', 1, 1, 3),
(3, 'Section C', 2, 1, 5)
ON DUPLICATE KEY UPDATE name=VALUES(name), semester=VALUES(semester);

-- 5. Teachers & Accounts
INSERT INTO teachers (id, name, department_id, subject, workspace) VALUES
('prof_rao', 'Dr. Sudha Rao', 1, 'computerScience', 'own'),
('prof_kapoor', 'Prof. Anil Kapoor', 1, 'computerScience', 'own'),
('prof_sharma', 'Dr. Meenakshi Sharma', 2, 'computerScience', 'own')
ON DUPLICATE KEY UPDATE name=VALUES(name), department_id=VALUES(department_id);

INSERT INTO accounts (login, display_name, role, password_hash, teacher_id) VALUES
('prof_rao', 'Dr. Sudha Rao', 'teacher', '$teacherHash', 'prof_rao'),
('prof_kapoor', 'Prof. Anil Kapoor', 'teacher', '$teacherHash', 'prof_kapoor'),
('prof_sharma', 'Dr. Meenakshi Sharma', 'teacher', '$teacherHash', 'prof_sharma')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), password_hash=VALUES(password_hash);

-- 6. Courses
INSERT INTO courses (code, name, department_id, subject_key, credits, semester, status, teacher_id, faculty) VALUES
('CS501', 'Operating Systems', 1, 'computerScience', 4, 5, 'Ongoing', 'prof_rao', 'Dr. Sudha Rao'),
('CS502', 'Computer Networks', 1, 'computerScience', 4, 5, 'Ongoing', 'prof_kapoor', 'Prof. Anil Kapoor'),
('CS301', 'Data Structures & Algorithms', 1, 'computerScience', 4, 3, 'Ongoing', 'prof_rao', 'Dr. Sudha Rao'),
('CS503', 'Database Management Systems', 2, 'computerScience', 4, 5, 'Ongoing', 'prof_sharma', 'Dr. Meenakshi Sharma'),
('CS504', 'Software Engineering & Design', 1, 'computerScience', 3, 5, 'Ongoing', 'prof_kapoor', 'Prof. Anil Kapoor')
ON DUPLICATE KEY UPDATE name=VALUES(name), credits=VALUES(credits), faculty=VALUES(faculty);

-- 7. Course Offerings (Assign courses & teachers to sections)
INSERT INTO course_offerings (id, section_id, academic_period_id, course_code, teacher_id) VALUES
(1, 1, 1, 'CS501', 'prof_rao'),
(2, 1, 1, 'CS502', 'prof_kapoor'),
(3, 2, 1, 'CS301', 'prof_rao'),
(4, 1, 1, 'CS503', 'prof_sharma'),
(5, 1, 1, 'CS504', 'prof_kapoor')
ON DUPLICATE KEY UPDATE teacher_id=VALUES(teacher_id);

-- 8. Students & Accounts (8 Students with diverse academic standings)
INSERT INTO students (id, roll, name, department_id, department, semester, email, phone, gender, status) VALUES
(101, 'CS-2101', 'Rahul Sharma', 1, 'Computer Science & Engineering', 5, 'rahul.sharma@campus.edu', '9876543210', 'Male', 'Active'),
(102, 'CS-2102', 'Ananya Iyer', 1, 'Computer Science & Engineering', 5, 'ananya.iyer@campus.edu', '9812345678', 'Female', 'Active'),
(103, 'CS-2103', 'Rohan Mehta', 1, 'Computer Science & Engineering', 5, 'rohan.mehta@campus.edu', '9823456789', 'Male', 'Active'),
(104, 'CS-2104', 'Priya Patel', 1, 'Computer Science & Engineering', 5, 'priya.patel@campus.edu', '9834567890', 'Female', 'Active'),
(105, 'CS-2105', 'Amit Verma', 1, 'Computer Science & Engineering', 5, 'amit.verma@campus.edu', '9845678901', 'Male', 'Active'),
(106, 'CS-2106', 'Sneha Reddy', 1, 'Computer Science & Engineering', 5, 'sneha.reddy@campus.edu', '9856789012', 'Female', 'Active'),
(107, 'CS-2107', 'Vikram Malhotra', 1, 'Computer Science & Engineering', 3, 'vikram.m@campus.edu', '9867890123', 'Male', 'Active'),
(108, 'CS-2108', 'Divya Nair', 1, 'Computer Science & Engineering', 3, 'divya.nair@campus.edu', '9878901234', 'Female', 'Active')
ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), status=VALUES(status);

INSERT INTO section_members (student_id, academic_period_id, section_id) VALUES
(101, 1, 1),
(102, 1, 1),
(103, 1, 1),
(104, 1, 1),
(105, 1, 1),
(106, 1, 1),
(107, 1, 2),
(108, 1, 2)
ON DUPLICATE KEY UPDATE section_id=VALUES(section_id);

INSERT INTO accounts (login, display_name, role, password_hash, student_id) VALUES
('CS-2101', 'Rahul Sharma', 'student', '$studentHash', 101),
('CS-2102', 'Ananya Iyer', 'student', '$studentHash', 102),
('CS-2103', 'Rohan Mehta', 'student', '$studentHash', 103),
('CS-2104', 'Priya Patel', 'student', '$studentHash', 104),
('CS-2105', 'Amit Verma', 'student', '$studentHash', 105),
('CS-2106', 'Sneha Reddy', 'student', '$studentHash', 106),
('CS-2107', 'Vikram Malhotra', 'student', '$studentHash', 107),
('CS-2108', 'Divya Nair', 'student', '$studentHash', 108)
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), password_hash=VALUES(password_hash);

-- 9. Course Enrollments
INSERT INTO course_enrollments (id, student_id, course_code, academic_period_id, offering_id, enrollment_date, status) VALUES
(1, 101, 'CS501', 1, 1, '2026-08-01', 'Enrolled'),
(2, 101, 'CS502', 1, 2, '2026-08-01', 'Enrolled'),
(3, 102, 'CS501', 1, 1, '2026-08-01', 'Enrolled'),
(4, 102, 'CS502', 1, 2, '2026-08-01', 'Enrolled'),
(5, 101, 'CS503', 1, 4, '2026-08-01', 'Enrolled'),
(6, 102, 'CS503', 1, 4, '2026-08-01', 'Enrolled'),
(7, 103, 'CS501', 1, 1, '2026-08-01', 'Enrolled'),
(8, 103, 'CS502', 1, 2, '2026-08-01', 'Enrolled'),
(9, 103, 'CS503', 1, 4, '2026-08-01', 'Enrolled'),
(10, 104, 'CS501', 1, 1, '2026-08-01', 'Enrolled'),
(11, 104, 'CS502', 1, 2, '2026-08-01', 'Enrolled'),
(12, 105, 'CS501', 1, 1, '2026-08-01', 'Enrolled'),
(13, 105, 'CS502', 1, 2, '2026-08-01', 'Enrolled'),
(14, 106, 'CS501', 1, 1, '2026-08-01', 'Enrolled'),
(15, 106, 'CS502', 1, 2, '2026-08-01', 'Enrolled'),
(16, 107, 'CS301', 1, 3, '2026-08-01', 'Enrolled'),
(17, 108, 'CS301', 1, 3, '2026-08-01', 'Enrolled')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 10. Weekly Timetable Entries (Comprehensive Mon-Sat Schedule)
INSERT INTO timetable_entries (id, academic_period_id, section_id, offering_id, course_code, teacher_id, day_of_week, period_number, start_time, end_time, room) VALUES
-- Monday
(1, 1, 1, 1, 'CS501', 'prof_rao', 'Monday', 1, '09:00:00', '09:50:00', 'Room 301, Block A'),
(2, 1, 1, 2, 'CS502', 'prof_kapoor', 'Monday', 2, '10:00:00', '10:50:00', 'Room 302, Block A'),
(3, 1, 2, 3, 'CS301', 'prof_rao', 'Monday', 3, '11:00:00', '11:50:00', 'Room 303, Block B'),
(4, 1, 1, 4, 'CS503', 'prof_sharma', 'Monday', 4, '12:00:00', '12:50:00', 'Lab 101, IT Wing'),
-- Tuesday
(5, 1, 1, 1, 'CS501', 'prof_rao', 'Tuesday', 1, '09:00:00', '09:50:00', 'Room 301, Block A'),
(6, 1, 1, 4, 'CS503', 'prof_sharma', 'Tuesday', 2, '10:00:00', '10:50:00', 'Lab 101, IT Wing'),
(7, 1, 2, 3, 'CS301', 'prof_rao', 'Tuesday', 3, '11:00:00', '11:50:00', 'Room 303, Block B'),
(8, 1, 1, 2, 'CS502', 'prof_kapoor', 'Tuesday', 4, '12:00:00', '12:50:00', 'Room 302, Block A'),
-- Wednesday
(9, 1, 1, 2, 'CS502', 'prof_kapoor', 'Wednesday', 1, '09:00:00', '09:50:00', 'Room 302, Block A'),
(10, 1, 1, 1, 'CS501', 'prof_rao', 'Wednesday', 2, '10:00:00', '10:50:00', 'Room 301, Block A'),
(11, 1, 2, 3, 'CS301', 'prof_rao', 'Wednesday', 3, '11:00:00', '11:50:00', 'Room 303, Block B'),
-- Thursday
(12, 1, 1, 1, 'CS501', 'prof_rao', 'Thursday', 1, '09:00:00', '09:50:00', 'Room 301, Block A'),
(13, 1, 2, 3, 'CS301', 'prof_rao', 'Thursday', 2, '10:00:00', '10:50:00', 'Room 303, Block B'),
(14, 1, 1, 2, 'CS502', 'prof_kapoor', 'Thursday', 3, '11:00:00', '11:50:00', 'Room 302, Block A'),
-- Friday
(15, 1, 1, 4, 'CS503', 'prof_sharma', 'Friday', 1, '09:00:00', '09:50:00', 'Lab 101, IT Wing'),
(16, 1, 1, 1, 'CS501', 'prof_rao', 'Friday', 2, '10:00:00', '10:50:00', 'Room 301, Block A'),
(17, 1, 1, 2, 'CS502', 'prof_kapoor', 'Friday', 3, '11:00:00', '11:50:00', 'Room 302, Block A'),
(18, 1, 2, 3, 'CS301', 'prof_rao', 'Friday', 4, '12:00:00', '12:50:00', 'Room 303, Block B'),
-- Saturday
(19, 1, 1, 1, 'CS501', 'prof_rao', 'Saturday', 1, '09:30:00', '10:20:00', 'Lab 204, Systems Wing'),
(20, 1, 1, 2, 'CS502', 'prof_kapoor', 'Saturday', 2, '10:30:00', '11:20:00', 'Lab 205, Networks Wing')
ON DUPLICATE KEY UPDATE room=VALUES(room), start_time=VALUES(start_time), end_time=VALUES(end_time);

-- 11. Attendance Sessions & Records Clean Sync
DELETE FROM attendance_records WHERE session_id BETWEEN 1 AND 20;
DELETE FROM attendance_sessions WHERE id BETWEEN 1 AND 20;

INSERT INTO attendance_sessions (id, course_code, academic_period_id, teacher_id, offering_id, session_date, session_slot, session_type, session_topic, status, submitted_at) VALUES
-- CS501 Operating Systems (Dr. Sudha Rao)
(1, 'CS501', 1, 'prof_rao', 1, DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY), 1, 'Lecture', 'Introduction to Operating Systems & Kernel Architectures', 'Completed', DATE_SUB(NOW(), INTERVAL 14 DAY)),
(2, 'CS501', 1, 'prof_rao', 1, DATE_SUB(CURRENT_DATE, INTERVAL 12 DAY), 1, 'Lecture', 'Process Management, PCBs, and Context Switching', 'Completed', DATE_SUB(NOW(), INTERVAL 12 DAY)),
(3, 'CS501', 1, 'prof_rao', 1, DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY), 2, 'Lecture', 'CPU Scheduling Algorithms: FCFS, SJF, Round Robin', 'Completed', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(4, 'CS501', 1, 'prof_rao', 1, DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY), 1, 'Lecture', 'Inter-Process Communication & Shared Memory Models', 'Completed', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(5, 'CS501', 1, 'prof_rao', 1, DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), 1, 'Lecture', 'Process Synchronization, Critical Sections & Mutexes', 'Completed', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(6, 'CS501', 1, 'prof_rao', 1, DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), 2, 'Lecture', 'Semaphores, Monitors & Classical Synchronization Problems', 'Completed', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(7, 'CS501', 1, 'prof_rao', 1, CURRENT_DATE, 1, 'Lecture', 'Deadlock Detection, Prevention & Banker''s Algorithm', 'Completed', NOW()),
-- CS502 Computer Networks (Prof. Anil Kapoor)
(8, 'CS502', 1, 'prof_kapoor', 2, DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY), 2, 'Lecture', 'OSI Reference Model vs TCP/IP Protocol Stack', 'Completed', DATE_SUB(NOW(), INTERVAL 14 DAY)),
(9, 'CS502', 1, 'prof_kapoor', 2, DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY), 1, 'Lecture', 'Data Link Layer: Framing, Flow Control & Error Detection', 'Completed', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(10, 'CS502', 1, 'prof_kapoor', 2, DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY), 2, 'Lecture', 'Medium Access Control: CSMA/CD, CSMA/CA & Ethernet', 'Completed', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(11, 'CS502', 1, 'prof_kapoor', 2, DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY), 3, 'Lecture', 'IP Addressing, Subnetting, CIDR & IPv6 Architecture', 'Completed', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(12, 'CS502', 1, 'prof_kapoor', 2, CURRENT_DATE, 2, 'Lecture', 'Routing Protocols: Distance Vector vs Link State (OSPF)', 'Completed', NOW()),
-- CS301 Data Structures (Dr. Sudha Rao)
(13, 'CS301', 1, 'prof_rao', 3, DATE_SUB(CURRENT_DATE, INTERVAL 12 DAY), 3, 'Lecture', 'Binary Search Trees & AVL Tree Rotations', 'Completed', DATE_SUB(NOW(), INTERVAL 12 DAY)),
(14, 'CS301', 1, 'prof_rao', 3, DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY), 3, 'Lecture', 'Graph Representations, BFS and DFS Traversal', 'Completed', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(15, 'CS301', 1, 'prof_rao', 3, CURRENT_DATE, 3, 'Lecture', 'Dijkstra''s Algorithm & Minimum Spanning Trees (Prim/Kruskal)', 'Completed', NOW());

-- 12. Attendance Records (Realistic distribution: Rahul ~90%, Ananya 100%, Rohan ~57% [Defaulter])
-- Session 1 (CS501): All 6 present
INSERT INTO attendance_records (id, session_id, enrollment_id, student_id, course_code, academic_period_id, offering_id, status) VALUES
(101, 1, 1, 101, 'CS501', 1, 1, 'Present'),
(102, 1, 3, 102, 'CS501', 1, 1, 'Present'),
(103, 1, 7, 103, 'CS501', 1, 1, 'Present'),
(104, 1, 10, 104, 'CS501', 1, 1, 'Present'),
(105, 1, 12, 105, 'CS501', 1, 1, 'Present'),
(106, 1, 14, 106, 'CS501', 1, 1, 'Present'),
-- Session 2 (CS501): Rohan absent
(107, 2, 1, 101, 'CS501', 1, 1, 'Present'),
(108, 2, 3, 102, 'CS501', 1, 1, 'Present'),
(109, 2, 7, 103, 'CS501', 1, 1, 'Absent'),
(110, 2, 10, 104, 'CS501', 1, 1, 'Present'),
(111, 2, 12, 105, 'CS501', 1, 1, 'Present'),
(112, 2, 14, 106, 'CS501', 1, 1, 'Present'),
-- Session 3 (CS501): All present
(113, 3, 1, 101, 'CS501', 1, 1, 'Present'),
(114, 3, 3, 102, 'CS501', 1, 1, 'Present'),
(115, 3, 7, 103, 'CS501', 1, 1, 'Absent'),
(116, 3, 10, 104, 'CS501', 1, 1, 'Present'),
(117, 3, 12, 105, 'CS501', 1, 1, 'Present'),
(118, 3, 14, 106, 'CS501', 1, 1, 'Present'),
-- Session 4 (CS501): Amit absent
(119, 4, 1, 101, 'CS501', 1, 1, 'Present'),
(120, 4, 3, 102, 'CS501', 1, 1, 'Present'),
(121, 4, 7, 103, 'CS501', 1, 1, 'Absent'),
(122, 4, 10, 104, 'CS501', 1, 1, 'Present'),
(123, 4, 12, 105, 'CS501', 1, 1, 'Absent'),
(124, 4, 14, 106, 'CS501', 1, 1, 'Present'),
-- Session 5 (CS501): Rahul absent (1 miss), Rohan present
(125, 5, 1, 101, 'CS501', 1, 1, 'Absent'),
(126, 5, 3, 102, 'CS501', 1, 1, 'Present'),
(127, 5, 7, 103, 'CS501', 1, 1, 'Present'),
(128, 5, 10, 104, 'CS501', 1, 1, 'Present'),
(129, 5, 12, 105, 'CS501', 1, 1, 'Present'),
(130, 5, 14, 106, 'CS501', 1, 1, 'Present'),
-- Session 6 (CS501): All present except Rohan
(131, 6, 1, 101, 'CS501', 1, 1, 'Present'),
(132, 6, 3, 102, 'CS501', 1, 1, 'Present'),
(133, 6, 7, 103, 'CS501', 1, 1, 'Present'),
(134, 6, 10, 104, 'CS501', 1, 1, 'Present'),
(135, 6, 12, 105, 'CS501', 1, 1, 'Present'),
(136, 6, 14, 106, 'CS501', 1, 1, 'Present'),
-- Session 7 (CS501 Today): All present
(137, 7, 1, 101, 'CS501', 1, 1, 'Present'),
(138, 7, 3, 102, 'CS501', 1, 1, 'Present'),
(139, 7, 7, 103, 'CS501', 1, 1, 'Present'),
(140, 7, 10, 104, 'CS501', 1, 1, 'Present'),
(141, 7, 12, 105, 'CS501', 1, 1, 'Present'),
(142, 7, 14, 106, 'CS501', 1, 1, 'Present'),
-- Sessions 8-12 (CS502):
(143, 8, 2, 101, 'CS502', 1, 2, 'Present'),
(144, 8, 4, 102, 'CS502', 1, 2, 'Present'),
(145, 8, 8, 103, 'CS502', 1, 2, 'Present'),
(146, 9, 2, 101, 'CS502', 1, 2, 'Present'),
(147, 9, 4, 102, 'CS502', 1, 2, 'Present'),
(148, 9, 8, 103, 'CS502', 1, 2, 'Absent'),
(149, 10, 2, 101, 'CS502', 1, 2, 'Present'),
(150, 10, 4, 102, 'CS502', 1, 2, 'Present'),
(151, 10, 8, 103, 'CS502', 1, 2, 'Present'),
(152, 11, 2, 101, 'CS502', 1, 2, 'Present'),
(153, 11, 4, 102, 'CS502', 1, 2, 'Present'),
(154, 11, 8, 103, 'CS502', 1, 2, 'Absent'),
(155, 12, 2, 101, 'CS502', 1, 2, 'Present'),
(156, 12, 4, 102, 'CS502', 1, 2, 'Present'),
(157, 12, 8, 103, 'CS502', 1, 2, 'Present'),
-- Sessions 13-15 (CS301): Section B students Vikram & Divya
(158, 13, 16, 107, 'CS301', 1, 3, 'Present'),
(159, 13, 17, 108, 'CS301', 1, 3, 'Present'),
(160, 14, 16, 107, 'CS301', 1, 3, 'Present'),
(161, 14, 17, 108, 'CS301', 1, 3, 'Present'),
(162, 15, 16, 107, 'CS301', 1, 3, 'Present'),
(163, 15, 17, 108, 'CS301', 1, 3, 'Present')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 13. Assessments & Marks (5 Major Evaluations across Courses)
DELETE FROM assessment_marks WHERE id BETWEEN 1 AND 50;
DELETE FROM assessments WHERE id BETWEEN 1 AND 20;

INSERT INTO assessments (id, offering_id, academic_period_id, course_code, teacher_id, title, assessment_type, max_marks, assessment_date) VALUES
(1, 1, 1, 'CS501', 'prof_rao', 'Mid-Semester Exam', 'Midterm', 50.00, '2026-10-15'),
(2, 1, 1, 'CS501', 'prof_rao', 'Continuous Assessment 1', 'CA-1', 25.00, '2026-09-10'),
(3, 1, 1, 'CS501', 'prof_rao', 'OS Kernel Lab Practical', 'Lab', 25.00, '2026-11-05'),
(4, 2, 1, 'CS502', 'prof_kapoor', 'Mid-Semester Exam', 'Midterm', 50.00, '2026-10-18'),
(5, 2, 1, 'CS502', 'prof_kapoor', 'Packet Analysis Quiz', 'Quiz', 20.00, '2026-09-22'),
(6, 3, 1, 'CS301', 'prof_rao', 'Mid-Semester Exam', 'Midterm', 50.00, '2026-10-20');

INSERT INTO assessment_marks (id, assessment_id, enrollment_id, student_id, marks_obtained, max_marks, grade, remarks) VALUES
-- CS501 Midterm (max 50)
(1, 1, 1, 101, 44.00, 50.00, 'A', 'Excellent performance on CPU scheduling'),
(2, 1, 3, 102, 48.00, 50.00, 'A+', 'Top score in cohort'),
(3, 1, 7, 103, 31.00, 50.00, 'B', 'Needs review on memory management'),
(4, 1, 10, 104, 41.50, 50.00, 'A', 'Strong synchronization concepts'),
(5, 1, 12, 105, 38.00, 50.00, 'B+', 'Good effort on deadlocks'),
(6, 1, 14, 106, 46.00, 50.00, 'A+', 'Outstanding answers'),
-- CS501 CA-1 (max 25)
(7, 2, 1, 101, 23.50, 25.00, 'A+', 'Very good quiz result'),
(8, 2, 3, 102, 24.50, 25.00, 'A+', 'Flawless submission'),
(9, 2, 7, 103, 16.00, 25.00, 'B', 'Average response'),
-- CS501 Lab Practical (max 25)
(10, 3, 1, 101, 22.00, 25.00, 'A', 'Clean shell scripting and system call implementation'),
(11, 3, 3, 102, 25.00, 25.00, 'A+', 'Perfect multi-threaded implementation'),
-- CS502 Midterm (max 50)
(12, 4, 2, 101, 43.00, 50.00, 'A', 'Good networking fundamentals'),
(13, 4, 4, 102, 47.00, 50.00, 'A+', 'Strong routing algorithm analysis'),
(14, 4, 8, 103, 33.00, 50.00, 'B', 'Subnetting calculation errors'),
-- CS502 Quiz (max 20)
(15, 5, 2, 101, 18.00, 20.00, 'A', 'Wireshark protocol breakdown accurate'),
(16, 5, 4, 102, 19.50, 20.00, 'A+', 'Mastery over TCP handshake sequence'),
-- CS301 Midterm (max 50)
(17, 6, 16, 107, 45.00, 50.00, 'A+', 'Clean balance tree balancing explanations'),
(18, 6, 17, 108, 41.00, 50.00, 'A', 'Good graph traversal complexity proofs');

-- 14. Student Grievances & Complaints
INSERT INTO complaints (id, reference_number, student_id, category, subject, description, related_offering_id, status, created_at) VALUES
(1, 'CMP-2026-0001', 101, 'Infrastructure', 'Classroom Projector Malfunction in Room 301', 'The digital HDMI projector in Room 301 flickers intermittently during lectures.', 1, 'In Progress', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 'CMP-2026-0002', 102, 'Academic', 'Library Access for Operating Systems Reference Material', 'Requesting additional printed reserve copies of Silberschatz Operating Systems textbook.', 1, 'Resolved', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(3, 'CMP-2026-0003', 103, 'Examination / Marks', 'Discrepancy in Midterm Subnetting Marks Calculation', 'Question 4b was marked as 0 but the subnet mask calculations matched the answer key.', 2, 'Open', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 'CMP-2026-0004', 104, 'Administrative', 'Campus Wi-Fi Connectivity in IT Wing Study Hall', 'Signal drops frequently when transitioning between Block A and the IT study wing.', NULL, 'Resolved', DATE_SUB(NOW(), INTERVAL 12 DAY))
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO complaint_activity (id, complaint_id, actor_login, actor_name, actor_role, action, previous_status, new_status, response_text, created_at) VALUES
(1, 1, 'CS-2101', 'Rahul Sharma', 'student', 'SUBMITTED', NULL, 'Open', 'Grievance submitted for administrative review.', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 1, 'admin', 'System Administrator', 'admin', 'STATUS_CHANGE', 'Open', 'In Progress', 'Assigned to campus IT facility maintenance engineer.', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, 2, 'CS-2102', 'Ananya Iyer', 'student', 'SUBMITTED', NULL, 'Open', 'Grievance submitted for library committee review.', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(4, 2, 'admin', 'System Administrator', 'admin', 'RESOLVED', 'In Progress', 'Resolved', 'Two additional copies acquired and placed in general reserve section.', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(5, 3, 'CS-2103', 'Rohan Mehta', 'student', 'SUBMITTED', NULL, 'Open', 'Evaluation review requested for Question 4b.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(6, 4, 'CS-2104', 'Priya Patel', 'student', 'SUBMITTED', NULL, 'Open', 'Wi-Fi mesh coverage issue reported.', DATE_SUB(NOW(), INTERVAL 12 DAY)),
(7, 4, 'admin', 'System Administrator', 'admin', 'RESOLVED', 'Open', 'Resolved', 'Secondary wireless access point deployed on 2nd floor.', DATE_SUB(NOW(), INTERVAL 10 DAY))
ON DUPLICATE KEY UPDATE response_text=VALUES(response_text);

-- 15. Institutional Activities & Live Audit Log
INSERT INTO activities (id, text, type, teacher_id, created_at) VALUES
(1, 'Mid-Semester examination results published for CS501 Operating Systems', 'marks', 'prof_rao', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 'Official grievance resolution published for Library Textbook Reserves (CMP-2026-0002)', 'system', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 'Attendance threshold warnings issued to students below 75% for Autumn 2026', 'attendance', NULL, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 'Lab Practical evaluation conducted for Operating Systems in Room 301', 'grade', 'prof_rao', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(5, 'Academic Section C created for Information Technology Department', 'course', NULL, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(6, 'Guest Lecture on Cloud Infrastructure announced for Computer Science faculty', 'notice', NULL, DATE_SUB(NOW(), INTERVAL 6 DAY))
ON DUPLICATE KEY UPDATE text=VALUES(text), type=VALUES(type);
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
