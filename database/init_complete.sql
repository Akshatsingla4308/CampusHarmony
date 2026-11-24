-- =============================================================================
-- CAMPUS HARMONY — COMPLETE UNIFIED DATABASE BOOTSTRAP SCRIPT
-- Target DBMS: MySQL Server 8.0+
-- Sequence: schema_v5 -> procedures_triggers -> migrations 006-010
-- =============================================================================

CREATE DATABASE IF NOT EXISTS campus_harmony
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE campus_harmony;


-- >>> START FILE: schema_v5.sql <<<
USE campus_harmony;

-- =============================================================================
-- CAMPUS HARMONY — ENTERPRISE RELATIONAL SCHEMA (VERSION 5.0)
-- Course: Database Management Systems (24CSE0209)
-- Target DBMS: MySQL Server 8.0+ (InnoDB Storage Engine)
-- Character Set: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

CREATE DATABASE IF NOT EXISTS campus_harmony
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE campus_harmony;

-- Safe teardown in reverse dependency order if rebuilding
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS archived_student_attendance;
DROP TABLE IF EXISTS defaulter_audit_log;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS marks;
DROP TABLE IF EXISTS student_marks;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS attendance_sessions;
DROP TABLE IF EXISTS course_enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS academic_periods;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS departments;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. MASTER LOOKUP & ACADEMIC CATALOGUE TABLES
-- =============================================================================

-- Table 1: departments (Master lookup for institute branches)
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 2: subjects (Master lookup for curricular discipline domains)
CREATE TABLE subjects (
    subject_key VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 3: academic_periods (Academic calendar session terms)
CREATE TABLE academic_periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester_term VARCHAR(10) NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_period_term CHECK (semester_term IN ('Odd', 'Even', 'Summer'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 4: teachers (Faculty profiles with department and subject specialization)
CREATE TABLE teachers (
    id VARCHAR(30) PRIMARY KEY, -- e.g., 'T-1001'
    name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    subject VARCHAR(50) NOT NULL,
    workspace VARCHAR(20) NOT NULL DEFAULT 'demo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_teachers_dept FOREIGN KEY (department_id) 
        REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_teachers_subject FOREIGN KEY (subject) 
        REFERENCES subjects(subject_key) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_teacher_workspace CHECK (workspace IN ('demo', 'own'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 2. STUDENT & COURSE CORE ENTITIES (WITH INTENTIONAL COMPATIBILITY MIRRORS)
-- =============================================================================

-- Table 5: students (Master student entity)
-- Authoritative department: department_id INT NOT NULL REFERENCES departments(id)
-- Compatibility mirror: department VARCHAR(100) synchronized via database trigger
CREATE TABLE students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    roll VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    department VARCHAR(100) NOT NULL,
    semester INT NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    gender VARCHAR(10) NOT NULL,
    address VARCHAR(255) NULL,
    teacher_id VARCHAR(30) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_dept FOREIGN KEY (department_id) 
        REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_students_teacher FOREIGN KEY (teacher_id) 
        REFERENCES teachers(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_student_semester CHECK (semester BETWEEN 1 AND 8),
    CONSTRAINT chk_student_status CHECK (status IN ('Active', 'Probation', 'Inactive', 'Archived')),
    CONSTRAINT chk_student_gender CHECK (gender IN ('Male', 'Female', 'Other'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 6: courses (Course offerings catalog)
-- Offering department: department_id; Curricular domain: subject_key
-- Compatibility mirror: faculty VARCHAR(100)
CREATE TABLE courses (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    department_id INT NOT NULL,
    subject_key VARCHAR(50) NOT NULL,
    credits INT NOT NULL,
    semester INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Upcoming',
    teacher_id VARCHAR(30) NULL,
    faculty VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_courses_dept FOREIGN KEY (department_id) 
        REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_courses_subject FOREIGN KEY (subject_key) 
        REFERENCES subjects(subject_key) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_courses_teacher FOREIGN KEY (teacher_id) 
        REFERENCES teachers(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_course_credits CHECK (credits BETWEEN 1 AND 10),
    CONSTRAINT chk_course_semester CHECK (semester BETWEEN 1 AND 8),
    CONSTRAINT chk_course_status CHECK (status IN ('Upcoming', 'Ongoing', 'Completed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 3. ENROLLMENTS & PERIOD-AWARE ATTENDANCE ARCHITECTURE
-- =============================================================================

-- Table 7: course_enrollments (Associative registration entity)
CREATE TABLE course_enrollments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    academic_period_id INT NOT NULL,
    enrollment_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    status VARCHAR(20) NOT NULL DEFAULT 'Enrolled',
    grade VARCHAR(5) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_enroll_student FOREIGN KEY (student_id) 
        REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_enroll_course FOREIGN KEY (course_code) 
        REFERENCES courses(code) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_enroll_period FOREIGN KEY (academic_period_id) 
        REFERENCES academic_periods(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_enroll_status CHECK (status IN ('Enrolled', 'Dropped', 'Completed', 'Withdrawn')),
    -- Candidate keys for enrollment uniqueness and composite foreign key reference
    CONSTRAINT uk_student_course_period UNIQUE (student_id, course_code, academic_period_id),
    CONSTRAINT uk_enrollment_composite UNIQUE (id, student_id, course_code, academic_period_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 8: attendance_sessions (Scheduled timetable slots)
CREATE TABLE attendance_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    academic_period_id INT NOT NULL,
    teacher_id VARCHAR(30) NULL,
    session_date DATE NOT NULL,
    session_slot INT NOT NULL DEFAULT 1,
    session_type VARCHAR(20) NOT NULL DEFAULT 'Lecture',
    session_topic VARCHAR(150) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_course FOREIGN KEY (course_code) 
        REFERENCES courses(code) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_session_period FOREIGN KEY (academic_period_id) 
        REFERENCES academic_periods(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_session_teacher FOREIGN KEY (teacher_id) 
        REFERENCES teachers(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_session_slot CHECK (session_slot BETWEEN 1 AND 10),
    CONSTRAINT chk_session_type CHECK (session_type IN ('Lecture', 'Lab', 'Tutorial')),
    -- Allows multiple daily sessions (e.g. Slot 1 Lecture, Slot 3 Lab) while preventing slot collision
    CONSTRAINT uk_course_period_session_slot UNIQUE (course_code, academic_period_id, session_date, session_slot),
    CONSTRAINT uk_session_composite UNIQUE (id, course_code, academic_period_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 9: attendance_records (Individual student dated attendance status)
-- Composite FKs guarantee mathematically that session, enrollment, and attendance share identical course & period
-- ON DELETE RESTRICT on students ensures student deletion cannot silently cascade away completed attendance history!
CREATE TABLE attendance_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    enrollment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    academic_period_id INT NOT NULL,
    status ENUM('Present', 'Absent') NOT NULL,
    remarks VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_session_student UNIQUE (session_id, student_id),
    CONSTRAINT fk_att_rec_student FOREIGN KEY (student_id) 
        REFERENCES students(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_att_rec_session_composite FOREIGN KEY (session_id, course_code, academic_period_id) 
        REFERENCES attendance_sessions(id, course_code, academic_period_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_att_rec_enrollment_composite FOREIGN KEY (enrollment_id, student_id, course_code, academic_period_id) 
        REFERENCES course_enrollments(id, student_id, course_code, academic_period_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 10: attendance (Physical O(1) summary cache table for dashboards)
CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL UNIQUE,
    total_days INT NOT NULL DEFAULT 0,
    present_days INT NOT NULL DEFAULT 0,
    absent_days INT NOT NULL DEFAULT 0,
    last_marked VARCHAR(20) DEFAULT '—',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_att_non_neg CHECK (total_days >= 0 AND present_days >= 0 AND absent_days >= 0),
    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) 
        REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 4. ACADEMIC MARKS & EVALUATIONS
-- =============================================================================

-- Table 11: student_marks (Normalized subject-exam evaluations)
CREATE TABLE student_marks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    subject_key VARCHAR(50) NOT NULL,
    academic_period_id INT NOT NULL,
    semester INT NOT NULL,
    exam_type VARCHAR(20) NOT NULL DEFAULT 'Endterm',
    marks_obtained DECIMAL(5,2) NOT NULL,
    max_marks DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    grade VARCHAR(5) NULL,
    remarks VARCHAR(100) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_smarks_student FOREIGN KEY (student_id) 
        REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_smarks_subject FOREIGN KEY (subject_key) 
        REFERENCES subjects(subject_key) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_smarks_period FOREIGN KEY (academic_period_id) 
        REFERENCES academic_periods(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_smarks_sem CHECK (semester BETWEEN 1 AND 8),
    CONSTRAINT chk_smarks_exam CHECK (exam_type IN ('Internal', 'Midterm', 'Endterm')),
    CONSTRAINT chk_smarks_range CHECK (marks_obtained >= 0 AND marks_obtained <= max_marks),
    CONSTRAINT chk_smarks_max CHECK (max_marks > 0),
    CONSTRAINT uk_student_subject_exam_period UNIQUE (student_id, subject_key, exam_type, academic_period_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 12: marks (Physical 5-subject legacy summary table for evaluated Spring Boot JPA)
CREATE TABLE marks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL UNIQUE,
    mathematics INT NULL,
    physics INT NULL,
    chemistry INT NULL,
    english INT NULL,
    computer_science INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_marks_student FOREIGN KEY (student_id) 
        REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_math_marks CHECK (mathematics IS NULL OR (mathematics BETWEEN 0 AND 100)),
    CONSTRAINT chk_phy_marks CHECK (physics IS NULL OR (physics BETWEEN 0 AND 100)),
    CONSTRAINT chk_chem_marks CHECK (chemistry IS NULL OR (chemistry BETWEEN 0 AND 100)),
    CONSTRAINT chk_eng_marks CHECK (english IS NULL OR (english BETWEEN 0 AND 100)),
    CONSTRAINT chk_cs_marks CHECK (computer_science IS NULL OR (computer_science BETWEEN 0 AND 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 5. AUDIT & ARCHIVAL LOGS
-- =============================================================================

-- Table 13: activities (System & faculty audit notice feed)
CREATE TABLE activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    text VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'notice',
    teacher_id VARCHAR(30) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activities_teacher FOREIGN KEY (teacher_id) 
        REFERENCES teachers(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_activity_type CHECK (type IN ('notice', 'attendance', 'grade', 'enroll', 'course', 'system', 'edit', 'marks'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 14: defaulter_audit_log (Immutable compliance snapshot log)
CREATE TABLE defaulter_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NULL,
    roll VARCHAR(30) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    attendance_percentage DECIMAL(5,2) NOT NULL,
    classes_needed INT NOT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_defaulter_student FOREIGN KEY (student_id) 
        REFERENCES students(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 15: archived_student_attendance (Archival storage for preserved historical attendance)
CREATE TABLE archived_student_attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    student_roll VARCHAR(30) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    academic_period_code VARCHAR(20) NOT NULL,
    session_date DATE NOT NULL,
    session_slot INT NOT NULL,
    status VARCHAR(10) NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_by VARCHAR(50) NOT NULL DEFAULT 'SYSTEM'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 6. PERFORMANCE & QUERY OPTIMIZATION INDEXES
-- =============================================================================

CREATE INDEX idx_students_dept_id ON students(department_id);
CREATE INDEX idx_students_sem ON students(semester);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_courses_dept ON courses(department_id);
CREATE INDEX idx_courses_sem ON courses(semester);
CREATE INDEX idx_courses_subject ON courses(subject_key);
CREATE INDEX idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_code);
CREATE INDEX idx_enrollments_period ON course_enrollments(academic_period_id);
CREATE INDEX idx_att_sessions_course_date ON attendance_sessions(course_code, session_date);
CREATE INDEX idx_att_sessions_period ON attendance_sessions(academic_period_id);
CREATE INDEX idx_att_records_session ON attendance_records(session_id);
CREATE INDEX idx_att_records_student ON attendance_records(student_id);
CREATE INDEX idx_att_records_status ON attendance_records(status);
CREATE INDEX idx_student_marks_student ON student_marks(student_id);
CREATE INDEX idx_student_marks_subject_period ON student_marks(subject_key, academic_period_id);
CREATE INDEX idx_activities_created ON activities(created_at DESC);
CREATE INDEX idx_defaulter_reported ON defaulter_audit_log(reported_at DESC);

-- =============================================================================
-- 7. ACADEMIC DATABASE VIEWS (DQL ABSTRACTION & REPORTING)
-- =============================================================================

-- View 1: v_student_attendance_summary (Real-time live calculated aggregates from atomic records)
CREATE OR REPLACE VIEW v_student_attendance_summary AS
SELECT 
    s.id AS student_id,
    s.roll,
    s.name AS student_name,
    d.name AS department,
    s.semester,
    COUNT(ar.id) AS total_sessions_conducted,
    SUM(CASE WHEN ar.status = 'Present' THEN 1 ELSE 0 END) AS attended_sessions,
    SUM(CASE WHEN ar.status = 'Absent' THEN 1 ELSE 0 END) AS missed_sessions,
    ROUND(
        CASE 
            WHEN COUNT(ar.id) > 0 THEN (SUM(CASE WHEN ar.status = 'Present' THEN 1 ELSE 0 END) * 100.0) / COUNT(ar.id) 
            ELSE 0.00 
        END, 2
    ) AS live_attendance_percentage
FROM students s
JOIN departments d ON s.department_id = d.id
LEFT JOIN attendance_records ar ON s.id = ar.student_id
GROUP BY s.id, s.roll, s.name, d.name, s.semester;

-- View 2: v_course_enrollment_roster (Comprehensive student enrollment roster with term and faculty)
CREATE OR REPLACE VIEW v_course_enrollment_roster AS
SELECT 
    ce.id AS enrollment_id,
    p.code AS period_code,
    p.name AS period_name,
    c.code AS course_code,
    c.name AS course_name,
    c.credits,
    s.id AS student_id,
    s.roll AS student_roll,
    s.name AS student_name,
    d.name AS student_department,
    ce.enrollment_date,
    ce.status AS enrollment_status,
    ce.grade AS course_grade,
    t.name AS faculty_instructor
FROM course_enrollments ce
JOIN academic_periods p ON ce.academic_period_id = p.id
JOIN courses c ON ce.course_code = c.code
JOIN students s ON ce.student_id = s.id
JOIN departments d ON s.department_id = d.id
LEFT JOIN teachers t ON c.teacher_id = t.id;

-- View 3: v_student_academic_transcript (Multi-term subject marks transcript with computed grades)
CREATE OR REPLACE VIEW v_student_academic_transcript AS
SELECT 
    sm.id AS evaluation_id,
    s.roll AS student_roll,
    s.name AS student_name,
    p.code AS academic_period,
    p.name AS period_name,
    sm.semester,
    sub.label AS subject_name,
    sm.exam_type,
    sm.marks_obtained,
    sm.max_marks,
    ROUND((sm.marks_obtained / sm.max_marks) * 100.0, 2) AS percentage,
    sm.grade,
    sm.remarks
FROM student_marks sm
JOIN students s ON sm.student_id = s.id
JOIN subjects sub ON sm.subject_key = sub.subject_key
JOIN academic_periods p ON sm.academic_period_id = p.id;

-- View 4: v_attendance_cache_discrepancy (Live discrepancy diagnostic monitor)
CREATE OR REPLACE VIEW v_attendance_cache_discrepancy AS
SELECT 
    a.student_id,
    s.roll,
    s.name AS student_name,
    a.total_days AS cached_total,
    COALESCE(sub.actual_total, 0) AS actual_total,
    a.present_days AS cached_present,
    COALESCE(sub.actual_present, 0) AS actual_present,
    a.absent_days AS cached_absent,
    COALESCE(sub.actual_absent, 0) AS actual_absent,
    CASE 
        WHEN a.total_days != (a.present_days + a.absent_days) THEN 'INTERNAL MATH INVALID'
        WHEN a.total_days != COALESCE(sub.actual_total, 0) THEN 'TOTAL MISMATCH'
        WHEN a.present_days != COALESCE(sub.actual_present, 0) THEN 'PRESENT MISMATCH'
        WHEN a.absent_days != COALESCE(sub.actual_absent, 0) THEN 'ABSENT MISMATCH'
        ELSE 'RECONCILED / IN SYNC'
    END AS integrity_status
FROM attendance a
JOIN students s ON a.student_id = s.id
LEFT JOIN (
    SELECT 
        student_id,
        COUNT(id) AS actual_total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS actual_present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS actual_absent
    FROM attendance_records
    GROUP BY student_id
) sub ON a.student_id = sub.student_id;

-- >>> END FILE: schema_v5.sql <<<


-- >>> START FILE: procedures_triggers.sql <<<
USE campus_harmony;

-- =============================================================================
-- CAMPUS HARMONY — PROCEDURAL SQL MODULE (VERSION 5.0)
-- Functions, Stored Procedures, and Row-Level Triggers
-- Target DBMS: MySQL Server 8.0+
-- =============================================================================

USE campus_harmony;

DELIMITER //

-- =============================================================================
-- 1. STORED FUNCTIONS
-- =============================================================================

-- Function 1: fn_calculate_grade (Converts percentage to letter grade)
DROP FUNCTION IF EXISTS fn_calculate_grade //
CREATE FUNCTION fn_calculate_grade(
    p_marks_obtained DECIMAL(5,2),
    p_max_marks DECIMAL(5,2)
)
RETURNS VARCHAR(5)
DETERMINISTIC
NO SQL
BEGIN
    DECLARE v_pct DECIMAL(5,2);
    DECLARE v_grade VARCHAR(5);

    IF p_max_marks IS NULL OR p_max_marks <= 0 THEN
        RETURN 'N/A';
    END IF;

    SET v_pct = (p_marks_obtained / p_max_marks) * 100.0;

    IF v_pct >= 90.0 THEN
        SET v_grade = 'A+';
    ELSEIF v_pct >= 80.0 THEN
        SET v_grade = 'A';
    ELSEIF v_pct >= 70.0 THEN
        SET v_grade = 'B';
    ELSEIF v_pct >= 60.0 THEN
        SET v_grade = 'C';
    ELSEIF v_pct >= 50.0 THEN
        SET v_grade = 'D';
    ELSE
        SET v_grade = 'F';
    END IF;

    RETURN v_grade;
END //

-- Function 2: fn_get_student_average (Calculates student aggregate average marks)
DROP FUNCTION IF EXISTS fn_get_student_average //
CREATE FUNCTION fn_get_student_average(
    p_student_id BIGINT
)
RETURNS DECIMAL(5,2)
READS SQL DATA
BEGIN
    DECLARE v_avg DECIMAL(5,2);

    SELECT ROUND(AVG((marks_obtained / max_marks) * 100.0), 2)
    INTO v_avg
    FROM student_marks
    WHERE student_id = p_student_id;

    RETURN COALESCE(v_avg, 0.00);
END //

-- Function 3: fn_get_attendance_percentage (Calculates attendance percentage from atomic records)
DROP FUNCTION IF EXISTS fn_get_attendance_percentage //
CREATE FUNCTION fn_get_attendance_percentage(
    p_student_id BIGINT
)
RETURNS DECIMAL(5,2)
READS SQL DATA
BEGIN
    DECLARE v_total INT;
    DECLARE v_present INT;

    SELECT 
        COUNT(id),
        COALESCE(SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END), 0)
    INTO v_total, v_present
    FROM attendance_records
    WHERE student_id = p_student_id;

    IF v_total = 0 THEN
        RETURN 0.00;
    END IF;

    RETURN ROUND((v_present * 100.0) / v_total, 2);
END //

-- =============================================================================
-- 2. STORED PROCEDURES
-- =============================================================================

-- Procedure 1: sp_generate_attendance_defaulter_report (Cursor procedure with shortfall calculation)
DROP PROCEDURE IF EXISTS sp_generate_attendance_defaulter_report //
CREATE PROCEDURE sp_generate_attendance_defaulter_report(
    IN p_threshold_pct DECIMAL(5,2)
)
BEGIN
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_student_id BIGINT;
    DECLARE v_roll VARCHAR(30);
    DECLARE v_name VARCHAR(100);
    DECLARE v_department VARCHAR(100);
    DECLARE v_present INT;
    DECLARE v_total INT;
    DECLARE v_percentage DECIMAL(5,2);
    DECLARE v_classes_needed INT;
    DECLARE v_count INT DEFAULT 0;

    -- Cursor iterating across students falling below attendance threshold
    DECLARE cur_defaulters CURSOR FOR
        SELECT 
            s.id,
            s.roll,
            s.name,
            s.department,
            a.present_days,
            a.total_days,
            ROUND((a.present_days / a.total_days) * 100, 2) AS att_pct
        FROM students s
        INNER JOIN attendance a ON s.id = a.student_id
        WHERE a.total_days > 0 
          AND ROUND((a.present_days / a.total_days) * 100, 2) < p_threshold_pct
        ORDER BY att_pct ASC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    -- Clean audit log using authorized session token
    SET @ALLOW_AUDIT_PURGE = TRUE;
    DELETE FROM defaulter_audit_log;
    SET @ALLOW_AUDIT_PURGE = FALSE;

    OPEN cur_defaulters;

    read_loop: LOOP
        FETCH cur_defaulters INTO 
            v_student_id, v_roll, v_name, v_department, v_present, v_total, v_percentage;

        IF v_done = 1 THEN
            LEAVE read_loop;
        END IF;

        -- Mathematical shortfall formula to reach 75%:
        -- (present + x) / (total + x) >= 0.75  =>  x >= (0.75*total - present) / 0.25
        SET v_classes_needed = GREATEST(0, CEIL((0.75 * v_total - v_present) / 0.25));

        INSERT INTO defaulter_audit_log (
            student_id, roll, student_name, department, attendance_percentage, classes_needed, reported_at
        ) VALUES (
            v_student_id, v_roll, v_name, v_department, v_percentage, v_classes_needed, NOW()
        );

        SET v_count = v_count + 1;
    END LOOP read_loop;

    CLOSE cur_defaulters;

    -- Return the generated audit report
    SELECT 
        roll AS 'Roll Number',
        student_name AS 'Student Name',
        department AS 'Department',
        CONCAT(attendance_percentage, '%') AS 'Current Attendance',
        classes_needed AS 'Consecutive Classes Needed for 75%'
    FROM defaulter_audit_log
    ORDER BY attendance_percentage ASC;

END //

-- Procedure 2: sp_batch_enroll_student_with_transaction (ACID transaction demonstration with rollback handler)
DROP PROCEDURE IF EXISTS sp_batch_enroll_student_with_transaction //
CREATE PROCEDURE sp_batch_enroll_student_with_transaction(
    IN p_roll VARCHAR(30),
    IN p_name VARCHAR(100),
    IN p_department_id INT,
    IN p_department VARCHAR(100),
    IN p_semester INT,
    IN p_email VARCHAR(120),
    IN p_phone VARCHAR(20),
    IN p_simulate_error BOOLEAN,
    OUT p_status_message VARCHAR(255)
)
BEGIN
    DECLARE v_new_student_id BIGINT;

    -- Exit handler catches SQLEXCEPTION and rolls back entire atomic transaction
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_message = 'TRANSACTION ROLLED BACK: Error occurred during multi-table enrollment.';
    END;

    START TRANSACTION;

    -- Step 1: Insert student master row
    INSERT INTO students (
        roll, name, department_id, department, semester, email, phone, status, gender, created_at
    ) VALUES (
        p_roll, p_name, p_department_id, p_department, p_semester, p_email, p_phone, 'Active', 'Other', NOW()
    );

    SET v_new_student_id = LAST_INSERT_ID();

    -- Step 2: Initialize attendance summary row
    INSERT INTO attendance (student_id, total_days, present_days, absent_days, last_marked)
    VALUES (v_new_student_id, 0, 0, 0, '—');

    -- Step 3: Initialize marks summary row
    INSERT INTO marks (student_id, mathematics, physics, chemistry, english, computer_science)
    VALUES (v_new_student_id, NULL, NULL, NULL, NULL, NULL);

    -- Step 4: Log audit activity
    INSERT INTO activities (text, type, teacher_id, created_at)
    VALUES (CONCAT('Enrolled new student: ', p_name, ' (', p_roll, ')'), 'enroll', NULL, NOW());

    -- Viva Demonstration Switch: Intentional constraint violation
    IF p_simulate_error = TRUE THEN
        INSERT INTO students (roll, name, department_id, department, semester, email, phone, status, gender)
        VALUES ('ERR-999', 'Ghost Student', p_department_id, 'CS', 99, 'ghost@campus.local', '0000000000', 'Active', 'Other');
    END IF;

    COMMIT;
    SET p_status_message = 'TRANSACTION COMMITTED: Student and all dependent records enrolled successfully.';

END //

-- Procedure 3: sp_reconcile_attendance_cache (Recalculates single student cache from atomic records)
DROP PROCEDURE IF EXISTS sp_reconcile_attendance_cache //
CREATE PROCEDURE sp_reconcile_attendance_cache(
    IN p_student_id BIGINT
)
BEGIN
    DECLARE v_actual_total INT;
    DECLARE v_actual_present INT;
    DECLARE v_actual_absent INT;
    DECLARE v_last_date VARCHAR(20);

    SELECT 
        COUNT(ar.id),
        COALESCE(SUM(CASE WHEN ar.status = 'Present' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN ar.status = 'Absent' THEN 1 ELSE 0 END), 0),
        COALESCE(DATE_FORMAT(MAX(s.session_date), '%Y-%m-%d'), '—')
    INTO 
        v_actual_total,
        v_actual_present,
        v_actual_absent,
        v_last_date
    FROM attendance_records ar
    JOIN attendance_sessions s ON ar.session_id = s.id
    WHERE ar.student_id = p_student_id;

    INSERT INTO attendance (
        student_id, total_days, present_days, absent_days, last_marked, updated_at
    ) VALUES (
        p_student_id, v_actual_total, v_actual_present, v_actual_absent, v_last_date, NOW()
    ) ON DUPLICATE KEY UPDATE
        total_days = v_actual_total,
        present_days = v_actual_present,
        absent_days = v_actual_absent,
        last_marked = v_last_date,
        updated_at = NOW();

    SELECT 
        p_student_id AS student_id,
        v_actual_total AS reconciled_total,
        v_actual_present AS reconciled_present,
        v_actual_absent AS reconciled_absent,
        v_last_date AS reconciled_last_marked,
        'SUCCESSFULLY RECONCILED' AS status;
END //

-- Procedure 4: sp_reconcile_all_attendance_caches (Batch cursor self-healing procedure)
DROP PROCEDURE IF EXISTS sp_reconcile_all_attendance_caches //
CREATE PROCEDURE sp_reconcile_all_attendance_caches()
BEGIN
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_sid BIGINT;
    DECLARE v_reconciled_count INT DEFAULT 0;

    DECLARE cur_all_students CURSOR FOR SELECT id FROM students;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    OPEN cur_all_students;

    reconcile_loop: LOOP
        FETCH cur_all_students INTO v_sid;
        IF v_done = 1 THEN
            LEAVE reconcile_loop;
        END IF;

        CALL sp_reconcile_attendance_cache(v_sid);
        SET v_reconciled_count = v_reconciled_count + 1;
    END LOOP reconcile_loop;

    CLOSE cur_all_students;

    SELECT CONCAT('Reconciliation Complete: Successfully verified ', v_reconciled_count, ' students.') AS summary;
END //

-- Procedure 5: sp_delete_attendance_session_controlled (Administrative controlled session cancellation)
DROP PROCEDURE IF EXISTS sp_delete_attendance_session_controlled //
CREATE PROCEDURE sp_delete_attendance_session_controlled(
    IN p_session_id BIGINT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    -- Explicitly delete child records (fires trg_after_attendance_record_delete)
    DELETE FROM attendance_records WHERE session_id = p_session_id;
    -- Delete the session
    DELETE FROM attendance_sessions WHERE id = p_session_id;
    COMMIT;

    SELECT CONCAT('Session ', p_session_id, ' and associated attendance records successfully revoked.') AS result;
END //

-- Procedure 6: sp_archive_and_delete_student (Historical retention archival before deletion)
DROP PROCEDURE IF EXISTS sp_archive_and_delete_student //
CREATE PROCEDURE sp_archive_and_delete_student(
    IN p_student_id BIGINT,
    IN p_archived_by VARCHAR(50),
    OUT p_status VARCHAR(255)
)
BEGIN
    DECLARE v_roll VARCHAR(30);
    DECLARE v_name VARCHAR(100);
    DECLARE v_dept VARCHAR(100);
    DECLARE v_record_count INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status = 'ARCHIVE FAILED: Database error encountered during student archival.';
    END;

    -- Validate student existence
    SELECT roll, name, department INTO v_roll, v_name, v_dept
    FROM students WHERE id = p_student_id;

    IF v_roll IS NULL THEN
        SET p_status = 'STUDENT NOT FOUND';
    ELSE
        START TRANSACTION;

        -- Step 1: Copy all historical attendance records to the archival table
        INSERT INTO archived_student_attendance (
            student_id, student_roll, student_name, department, course_code, 
            academic_period_code, session_date, session_slot, status, archived_at, archived_by
        )
        SELECT 
            ar.student_id, v_roll, v_name, v_dept, ar.course_code, 
            p.code, s.session_date, s.session_slot, ar.status, NOW(), p_archived_by
        FROM attendance_records ar
        JOIN attendance_sessions s ON ar.session_id = s.id
        JOIN academic_periods p ON ar.academic_period_id = p.id
        WHERE ar.student_id = p_student_id;

        SELECT ROW_COUNT() INTO v_record_count;

        -- Step 2: Now that history is archived, safely remove active attendance records
        -- Set session token to allow deletion
        SET @ALLOW_STUDENT_PURGE = TRUE;
        DELETE FROM attendance_records WHERE student_id = p_student_id;
        DELETE FROM attendance WHERE student_id = p_student_id;
        DELETE FROM marks WHERE student_id = p_student_id;
        DELETE FROM student_marks WHERE student_id = p_student_id;
        DELETE FROM course_enrollments WHERE student_id = p_student_id;
        DELETE FROM students WHERE id = p_student_id;
        SET @ALLOW_STUDENT_PURGE = FALSE;

        COMMIT;
        SET p_status = CONCAT('SUCCESS: Student ', v_roll, ' archived (', v_record_count, ' attendance records preserved).');
    END IF;
END //

-- =============================================================================
-- 3. ROW-LEVEL INTEGRITY TRIGGERS
-- =============================================================================

-- Trigger 1: trg_sync_student_department_insert (Syncs department name from department_id)
DROP TRIGGER IF EXISTS trg_sync_student_department_insert //
CREATE TRIGGER trg_sync_student_department_insert
BEFORE INSERT ON students
FOR EACH ROW
BEGIN
    DECLARE v_dept_name VARCHAR(100);

    SELECT name INTO v_dept_name
    FROM departments
    WHERE id = NEW.department_id;

    IF v_dept_name IS NOT NULL THEN
        SET NEW.department = v_dept_name;
    END IF;
END //

-- Trigger 2: trg_sync_student_department_update (Keeps department name synchronized on update)
DROP TRIGGER IF EXISTS trg_sync_student_department_update //
CREATE TRIGGER trg_sync_student_department_update
BEFORE UPDATE ON students
FOR EACH ROW
BEGIN
    DECLARE v_dept_name VARCHAR(100);

    IF NEW.department_id != OLD.department_id OR NEW.department != OLD.department THEN
        SELECT name INTO v_dept_name
        FROM departments
        WHERE id = NEW.department_id;

        IF v_dept_name IS NOT NULL THEN
            SET NEW.department = v_dept_name;
        END IF;
    END IF;
END //

-- Trigger 3: trg_validate_attendance_enrollment_insert (Validates active enrollment on insert)
DROP TRIGGER IF EXISTS trg_validate_attendance_enrollment_insert //
CREATE TRIGGER trg_validate_attendance_enrollment_insert
BEFORE INSERT ON attendance_records
FOR EACH ROW
BEGIN
    DECLARE v_status VARCHAR(20);

    -- Shared lock prevents concurrent enrollment status race conditions
    SELECT status INTO v_status
    FROM course_enrollments
    WHERE id = NEW.enrollment_id
    LOCK IN SHARE MODE;

    IF v_status IS NULL OR v_status != 'Enrolled' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Integrity Error: Attendance requires active Enrolled status; Dropped/Completed ineligible.';
    END IF;
END //

-- Trigger 4: trg_validate_attendance_enrollment_update (Validates active enrollment on update)
DROP TRIGGER IF EXISTS trg_validate_attendance_enrollment_update //
CREATE TRIGGER trg_validate_attendance_enrollment_update
BEFORE UPDATE ON attendance_records
FOR EACH ROW
BEGIN
    DECLARE v_status VARCHAR(20);

    SELECT status INTO v_status
    FROM course_enrollments
    WHERE id = NEW.enrollment_id
    LOCK IN SHARE MODE;

    IF v_status IS NULL OR v_status != 'Enrolled' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Integrity Error: Historical attendance records for Completed/Dropped courses are immutable.';
    END IF;
END //

-- Trigger 5: trg_validate_enrollment_status_transition (Prevents dropping courses with attendance history)
DROP TRIGGER IF EXISTS trg_validate_enrollment_status_transition //
CREATE TRIGGER trg_validate_enrollment_status_transition
BEFORE UPDATE ON course_enrollments
FOR EACH ROW
BEGIN
    -- Check 1: Enrolled -> Dropped is blocked if attendance records exist
    IF NEW.status = 'Dropped' AND OLD.status != 'Dropped' THEN
        IF EXISTS (SELECT 1 FROM attendance_records WHERE enrollment_id = OLD.id) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Integrity Error: Cannot drop course after attendance is logged; retain record or withdraw.';
        END IF;
    END IF;

    -- Check 2: Completed registrations cannot be reopened
    IF OLD.status = 'Completed' AND NEW.status != 'Completed' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Integrity Error: Completed course registrations are finalized and cannot be modified.';
    END IF;

    -- Check 3: Dropped registrations are terminal
    IF OLD.status = 'Dropped' AND NEW.status != 'Dropped' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Integrity Error: Dropped registrations are terminal; create a fresh registration instead.';
    END IF;
END //

-- Trigger 6: trg_prevent_student_delete_with_attendance (Enforces historical retention policy)
DROP TRIGGER IF EXISTS trg_prevent_student_delete_with_attendance //
CREATE TRIGGER trg_prevent_student_delete_with_attendance
BEFORE DELETE ON students
FOR EACH ROW
BEGIN
    IF (@ALLOW_STUDENT_PURGE IS NULL OR @ALLOW_STUDENT_PURGE != TRUE) THEN
        IF EXISTS (SELECT 1 FROM attendance_records WHERE student_id = OLD.id) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Audit Violation: Cannot delete student with attendance history. Use sp_archive_and_delete_student.';
        END IF;
    END IF;
END //

-- Trigger 7: trg_after_attendance_record_insert (Full DML synchronization on INSERT)
DROP TRIGGER IF EXISTS trg_after_attendance_record_insert //
CREATE TRIGGER trg_after_attendance_record_insert
AFTER INSERT ON attendance_records
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM attendance WHERE student_id = NEW.student_id) THEN
        UPDATE attendance
        SET 
            total_days   = total_days + 1,
            present_days = CASE WHEN NEW.status = 'Present' THEN present_days + 1 ELSE present_days END,
            absent_days  = CASE WHEN NEW.status = 'Absent'  THEN absent_days + 1  ELSE absent_days END,
            last_marked  = DATE_FORMAT(NEW.created_at, '%Y-%m-%d'),
            updated_at   = NOW()
        WHERE student_id = NEW.student_id;
    ELSE
        INSERT INTO attendance (
            student_id, total_days, present_days, absent_days, last_marked, updated_at
        ) VALUES (
            NEW.student_id,
            1,
            CASE WHEN NEW.status = 'Present' THEN 1 ELSE 0 END,
            CASE WHEN NEW.status = 'Absent'  THEN 1 ELSE 0 END,
            DATE_FORMAT(NEW.created_at, '%Y-%m-%d'),
            NOW()
        );
    END IF;
END //

-- Trigger 8: trg_after_attendance_record_update (Full DML synchronization on UPDATE)
DROP TRIGGER IF EXISTS trg_after_attendance_record_update //
CREATE TRIGGER trg_after_attendance_record_update
AFTER UPDATE ON attendance_records
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        UPDATE attendance
        SET 
            present_days = CASE 
                WHEN OLD.status = 'Absent' AND NEW.status = 'Present' THEN present_days + 1
                WHEN OLD.status = 'Present' AND NEW.status = 'Absent' THEN GREATEST(0, present_days - 1)
                ELSE present_days
            END,
            absent_days = CASE 
                WHEN OLD.status = 'Present' AND NEW.status = 'Absent' THEN absent_days + 1
                WHEN OLD.status = 'Absent' AND NEW.status = 'Present' THEN GREATEST(0, absent_days - 1)
                ELSE absent_days
            END,
            updated_at = NOW()
        WHERE student_id = NEW.student_id;
    END IF;
END //

-- Trigger 9: trg_after_attendance_record_delete (Full DML synchronization on DELETE)
DROP TRIGGER IF EXISTS trg_after_attendance_record_delete //
CREATE TRIGGER trg_after_attendance_record_delete
AFTER DELETE ON attendance_records
FOR EACH ROW
BEGIN
    UPDATE attendance
    SET 
        total_days   = GREATEST(0, total_days - 1),
        present_days = CASE WHEN OLD.status = 'Present' THEN GREATEST(0, present_days - 1) ELSE present_days END,
        absent_days  = CASE WHEN OLD.status = 'Absent'  THEN GREATEST(0, absent_days - 1)  ELSE absent_days END,
        last_marked  = CASE WHEN total_days <= 1 THEN '—' ELSE last_marked END,
        updated_at   = NOW()
    WHERE student_id = OLD.student_id;
END //

-- Trigger 10: trg_validate_and_grade_student_marks (Validation & auto-grading on INSERT)
DROP TRIGGER IF EXISTS trg_validate_and_grade_student_marks //
CREATE TRIGGER trg_validate_and_grade_student_marks
BEFORE INSERT ON student_marks
FOR EACH ROW
BEGIN
    IF NEW.marks_obtained < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Validation Error: marks_obtained cannot be negative.';
    END IF;

    IF NEW.marks_obtained > NEW.max_marks THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Validation Error: marks_obtained cannot exceed max_marks.';
    END IF;

    IF NEW.exam_type NOT IN ('Internal', 'Midterm', 'Endterm') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Validation Error: exam_type must be Internal, Midterm, or Endterm.';
    END IF;

    SET NEW.grade = fn_calculate_grade(NEW.marks_obtained, NEW.max_marks);
END //

-- Trigger 11: trg_validate_and_grade_student_marks_upd (Validation & auto-grading on UPDATE)
DROP TRIGGER IF EXISTS trg_validate_and_grade_student_marks_upd //
CREATE TRIGGER trg_validate_and_grade_student_marks_upd
BEFORE UPDATE ON student_marks
FOR EACH ROW
BEGIN
    IF NEW.marks_obtained < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Validation Error: marks_obtained cannot be negative.';
    END IF;

    IF NEW.marks_obtained > NEW.max_marks THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Validation Error: marks_obtained cannot exceed max_marks.';
    END IF;

    IF NEW.exam_type NOT IN ('Internal', 'Midterm', 'Endterm') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Validation Error: exam_type must be Internal, Midterm, or Endterm.';
    END IF;

    SET NEW.grade = fn_calculate_grade(NEW.marks_obtained, NEW.max_marks);
END //

-- Trigger 12: trg_sync_student_marks_to_legacy (Syncs normalized evaluations into physical marks table on INSERT)
DROP TRIGGER IF EXISTS trg_sync_student_marks_to_legacy //
CREATE TRIGGER trg_sync_student_marks_to_legacy
AFTER INSERT ON student_marks
FOR EACH ROW
BEGIN
    IF NOT EXISTS (SELECT 1 FROM marks WHERE student_id = NEW.student_id) THEN
        INSERT INTO marks (student_id) VALUES (NEW.student_id);
    END IF;

    IF NEW.subject_key = 'mathematics' THEN
        UPDATE marks SET mathematics = ROUND(NEW.marks_obtained), updated_at = NOW() WHERE student_id = NEW.student_id;
    ELSEIF NEW.subject_key = 'physics' THEN
        UPDATE marks SET physics = ROUND(NEW.marks_obtained), updated_at = NOW() WHERE student_id = NEW.student_id;
    ELSEIF NEW.subject_key = 'chemistry' THEN
        UPDATE marks SET chemistry = ROUND(NEW.marks_obtained), updated_at = NOW() WHERE student_id = NEW.student_id;
    ELSEIF NEW.subject_key = 'english' THEN
        UPDATE marks SET english = ROUND(NEW.marks_obtained), updated_at = NOW() WHERE student_id = NEW.student_id;
    ELSEIF NEW.subject_key = 'computerScience' THEN
        UPDATE marks SET computer_science = ROUND(NEW.marks_obtained), updated_at = NOW() WHERE student_id = NEW.student_id;
    END IF;
END //

-- Trigger 13: trg_sync_student_marks_to_legacy_upd (Syncs normalized evaluations into physical marks table on UPDATE)
DROP TRIGGER IF EXISTS trg_sync_student_marks_to_legacy_upd //
CREATE TRIGGER trg_sync_student_marks_to_legacy_upd
AFTER UPDATE ON student_marks
FOR EACH ROW
BEGIN
    IF NEW.subject_key = 'mathematics' THEN
        UPDATE marks SET mathematics = ROUND(NEW.marks_obtained), updated_at = NOW() WHERE student_id = NEW.student_id;
    ELSEIF NEW.subject_key = 'physics' THEN
        UPDATE marks SET physics = ROUND(NEW.marks_obtained), updated_at = NOW() WHERE student_id = NEW.student_id;
    ELSEIF NEW.subject_key = 'chemistry' THEN
        UPDATE marks SET chemistry = ROUND(NEW.marks_obtained), updated_at = NOW() WHERE student_id = NEW.student_id;
    ELSEIF NEW.subject_key = 'english' THEN
        UPDATE marks SET english = ROUND(NEW.marks_obtained), updated_at = NOW() WHERE student_id = NEW.student_id;
    ELSEIF NEW.subject_key = 'computerScience' THEN
        UPDATE marks SET computer_science = ROUND(NEW.marks_obtained), updated_at = NOW() WHERE student_id = NEW.student_id;
    END IF;
END //

-- Trigger 14: trg_prevent_defaulter_audit_update (Legal immutability of historical audit snapshots)
DROP TRIGGER IF EXISTS trg_prevent_defaulter_audit_update //
CREATE TRIGGER trg_prevent_defaulter_audit_update
BEFORE UPDATE ON defaulter_audit_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Security Violation: Historical audit snapshots are immutable and cannot be updated.';
END //

-- Trigger 15: trg_prevent_defaulter_audit_delete (Restricts audit log purge to authorized procedures)
DROP TRIGGER IF EXISTS trg_prevent_defaulter_audit_delete //
CREATE TRIGGER trg_prevent_defaulter_audit_delete
BEFORE DELETE ON defaulter_audit_log
FOR EACH ROW
BEGIN
    IF @ALLOW_AUDIT_PURGE IS NULL OR @ALLOW_AUDIT_PURGE != TRUE THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Security Violation: Direct deletion of audit records prohibited; batch procedure required.';
    END IF;
END //

DELIMITER ;

-- >>> END FILE: procedures_triggers.sql <<<


-- >>> START FILE: 006_academic_foundation.sql <<<
USE campus_harmony;

-- Apply once to an independently backed-up v5 schema. No inferred assignments.
CREATE TABLE sections (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 department_id INT NOT NULL,
 academic_period_id INT NOT NULL,
 semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
 name VARCHAR(60) NOT NULL,
 UNIQUE(department_id,academic_period_id,semester,name),
 FOREIGN KEY(department_id) REFERENCES departments(id),
 FOREIGN KEY(academic_period_id) REFERENCES academic_periods(id),
 UNIQUE(id,academic_period_id)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE section_members (
 student_id BIGINT NOT NULL, academic_period_id INT NOT NULL, section_id BIGINT NOT NULL,
 PRIMARY KEY(student_id,academic_period_id),
 FOREIGN KEY(student_id) REFERENCES students(id),
 FOREIGN KEY(section_id,academic_period_id) REFERENCES sections(id,academic_period_id)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE course_offerings (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, section_id BIGINT NOT NULL, academic_period_id INT NOT NULL,
 course_code VARCHAR(20) NOT NULL, teacher_id VARCHAR(30) NOT NULL,
 UNIQUE(section_id,course_code), UNIQUE(id,course_code,academic_period_id),
 FOREIGN KEY(section_id,academic_period_id) REFERENCES sections(id,academic_period_id),
 FOREIGN KEY(course_code) REFERENCES courses(code), FOREIGN KEY(teacher_id) REFERENCES teachers(id)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE course_enrollments ADD offering_id BIGINT NULL,
 ADD UNIQUE(id,offering_id),
 ADD FOREIGN KEY(offering_id,course_code,academic_period_id) REFERENCES course_offerings(id,course_code,academic_period_id);
ALTER TABLE attendance_sessions ADD offering_id BIGINT NULL, ADD submitted_at TIMESTAMP NULL,
 ADD UNIQUE(id,offering_id),
 ADD FOREIGN KEY(offering_id,course_code,academic_period_id) REFERENCES course_offerings(id,course_code,academic_period_id),
 ADD UNIQUE KEY uk_offering_lecture(course_code,academic_period_id,session_date,session_slot,(COALESCE(offering_id,0))),
 DROP INDEX uk_course_period_session_slot;
ALTER TABLE attendance_records ADD offering_id BIGINT NULL,
 ADD FOREIGN KEY(enrollment_id,offering_id) REFERENCES course_enrollments(id,offering_id),
 ADD FOREIGN KEY(session_id,offering_id) REFERENCES attendance_sessions(id,offering_id);
CREATE TABLE accounts (
 login VARCHAR(80) PRIMARY KEY, role ENUM('admin','teacher','student') NOT NULL,
 display_name VARCHAR(100) NOT NULL, password_hash VARCHAR(200) NOT NULL,
 teacher_id VARCHAR(30) UNIQUE, student_id BIGINT UNIQUE,
 FOREIGN KEY(teacher_id) REFERENCES teachers(id), FOREIGN KEY(student_id) REFERENCES students(id),
 CHECK ((role='admin' AND teacher_id IS NULL AND student_id IS NULL)
 OR (role='teacher' AND teacher_id IS NOT NULL AND student_id IS NULL)
 OR (role='student' AND student_id IS NOT NULL AND teacher_id IS NULL))
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- >>> END FILE: 006_academic_foundation.sql <<<


-- >>> START FILE: 007_evaluations_management.sql <<<
USE campus_harmony;

-- Migration 007: Dynamic Course-wise Assessments, Evaluations Management and Audit Trail
CREATE TABLE IF NOT EXISTS assessments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    offering_id BIGINT NOT NULL,
    academic_period_id INT NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    teacher_id VARCHAR(30) NOT NULL,
    title VARCHAR(100) NOT NULL,
    assessment_type VARCHAR(50) NOT NULL,
    max_marks DECIMAL(5,2) NOT NULL,
    assessment_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (offering_id) REFERENCES course_offerings(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_period_id) REFERENCES academic_periods(id),
    FOREIGN KEY (course_code) REFERENCES courses(code),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    UNIQUE KEY uk_offering_assessment_title (offering_id, title),
    CONSTRAINT chk_assessment_max_marks CHECK (max_marks > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assessment_marks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    assessment_id BIGINT NOT NULL,
    enrollment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    max_marks DECIMAL(5,2) NOT NULL,
    grade VARCHAR(5) NULL,
    remarks VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY uk_assessment_student (assessment_id, student_id),
    CONSTRAINT chk_obtained_marks_range CHECK (marks_obtained >= 0 AND marks_obtained <= max_marks),
    CONSTRAINT chk_assessment_marks_max CHECK (max_marks > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assessment_marks_audit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    mark_id BIGINT NOT NULL,
    assessment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    old_marks DECIMAL(5,2) NULL,
    new_marks DECIMAL(5,2) NOT NULL,
    changed_by VARCHAR(80) NOT NULL,
    action_type VARCHAR(20) NOT NULL,
    reason VARCHAR(255) NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DELIMITER //

DROP TRIGGER IF EXISTS trg_assessment_marks_grade_ins //
CREATE TRIGGER trg_assessment_marks_grade_ins
BEFORE INSERT ON assessment_marks
FOR EACH ROW
BEGIN
    SET NEW.grade = fn_calculate_grade(NEW.marks_obtained, NEW.max_marks);
END //

DROP TRIGGER IF EXISTS trg_assessment_marks_grade_upd //
CREATE TRIGGER trg_assessment_marks_grade_upd
BEFORE UPDATE ON assessment_marks
FOR EACH ROW
BEGIN
    SET NEW.grade = fn_calculate_grade(NEW.marks_obtained, NEW.max_marks);
END //

DELIMITER ;

CREATE OR REPLACE VIEW v_course_assessment_performance AS
SELECT 
    a.id AS assessment_id,
    a.title AS assessment_title,
    a.assessment_type,
    a.assessment_date,
    a.max_marks,
    o.id AS offering_id,
    c.code AS course_code,
    c.name AS course_name,
    s.id AS section_id,
    s.name AS section_name,
    t.id AS teacher_id,
    t.name AS teacher_name,
    p.code AS academic_period,
    COUNT(am.id) AS submissions_count,
    ROUND(AVG(am.marks_obtained), 2) AS avg_marks,
    ROUND(MIN(am.marks_obtained), 2) AS min_marks,
    ROUND(MAX(am.marks_obtained), 2) AS max_marks_obtained,
    ROUND(AVG(am.marks_obtained / a.max_marks * 100), 1) AS avg_percentage
FROM assessments a
JOIN course_offerings o ON a.offering_id = o.id
JOIN courses c ON a.course_code = c.code
JOIN sections s ON o.section_id = s.id
JOIN teachers t ON a.teacher_id = t.id
JOIN academic_periods p ON a.academic_period_id = p.id
LEFT JOIN assessment_marks am ON am.assessment_id = a.id
GROUP BY a.id, a.title, a.assessment_type, a.assessment_date, a.max_marks, 
         o.id, c.code, c.name, s.id, s.name, t.id, t.name, p.code;

-- >>> END FILE: 007_evaluations_management.sql <<<


-- >>> START FILE: 008_timetable_scheduling.sql <<<
USE campus_harmony;

-- Migration 008: Timetable & Lecture Scheduling Engine
-- Implements recurring weekly timetables, conflict prevention, and lecture conduction integration

CREATE TABLE IF NOT EXISTS timetable_entries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    academic_period_id INT NOT NULL,
    section_id BIGINT NOT NULL,
    offering_id BIGINT NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    teacher_id VARCHAR(30) NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
    period_number INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    active_status TINYINT GENERATED ALWAYS AS (IF(is_active = 1, 1, NULL)) STORED,
    active_room VARCHAR(80) GENERATED ALWAYS AS (IF(is_active = 1 AND room IS NOT NULL AND TRIM(room) != '', CONCAT(LOWER(TRIM(room)), ':', period_number, ':', day_of_week), NULL)) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_tt_period_number CHECK (period_number BETWEEN 1 AND 10),
    CONSTRAINT chk_tt_time_range CHECK (start_time < end_time),
    CONSTRAINT fk_tt_period FOREIGN KEY (academic_period_id) REFERENCES academic_periods(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tt_section FOREIGN KEY (section_id, academic_period_id) REFERENCES sections(id, academic_period_id) ON DELETE CASCADE,
    CONSTRAINT fk_tt_offering FOREIGN KEY (offering_id, course_code, academic_period_id) REFERENCES course_offerings(id, course_code, academic_period_id) ON DELETE CASCADE,
    CONSTRAINT fk_tt_course FOREIGN KEY (course_code) REFERENCES courses(code) ON DELETE RESTRICT,
    CONSTRAINT fk_tt_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
    -- Conflict prevention unique keys at database layer
    UNIQUE KEY uk_tt_section_slot (academic_period_id, section_id, day_of_week, period_number, active_status),
    UNIQUE KEY uk_tt_teacher_slot (academic_period_id, teacher_id, day_of_week, period_number, active_status),
    UNIQUE KEY uk_tt_room_slot (academic_period_id, active_room)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add optional status column to attendance_sessions for cancelled / conducted distinction
ALTER TABLE attendance_sessions 
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Scheduled';

CREATE OR REPLACE VIEW v_weekly_timetable AS
SELECT 
    te.id AS entry_id,
    te.academic_period_id,
    ap.code AS academic_period_code,
    ap.name AS academic_period_name,
    te.section_id,
    s.name AS section_name,
    s.semester,
    d.id AS department_id,
    d.code AS department_code,
    d.name AS department_name,
    te.offering_id,
    te.course_code,
    c.name AS course_name,
    c.credits,
    te.teacher_id,
    t.name AS teacher_name,
    te.day_of_week,
    te.period_number,
    te.start_time,
    te.end_time,
    te.room,
    te.is_active,
    te.created_at,
    te.updated_at
FROM timetable_entries te
JOIN academic_periods ap ON te.academic_period_id = ap.id
JOIN sections s ON te.section_id = s.id
JOIN departments d ON s.department_id = d.id
JOIN course_offerings co ON te.offering_id = co.id
JOIN courses c ON te.course_code = c.code
JOIN teachers t ON te.teacher_id = t.id;

-- >>> END FILE: 008_timetable_scheduling.sql <<<


-- >>> START FILE: 009_attendance_analytics.sql <<<
USE campus_harmony;

-- Migration 009: Attendance Analytics & Defaulter Management
-- Implements configurable academic settings, robust attendance aggregations, shortfall calculation, and reporting views

CREATE TABLE IF NOT EXISTS academic_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO academic_settings (setting_key, setting_value, description)
VALUES ('attendance_defaulter_threshold', '75.0', 'Minimum attendance percentage required to maintain good academic standing');

DELIMITER //

DROP FUNCTION IF EXISTS fn_calculate_attendance_shortfall //
CREATE FUNCTION fn_calculate_attendance_shortfall(
    p_attended INT,
    p_conducted INT,
    p_threshold DECIMAL(5,2)
) RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_shortfall INT;
    IF p_conducted <= 0 OR p_threshold <= 0 OR p_threshold >= 100 THEN
        RETURN 0;
    END IF;
    IF (p_attended / p_conducted) * 100.0 >= p_threshold THEN
        RETURN 0;
    END IF;
    -- Shortfall math: (attended + x) / (conducted + x) >= T / 100  =>  x >= (T*C - 100*P) / (100 - T)
    SET v_shortfall = CEIL((p_threshold * p_conducted - 100.0 * p_attended) / (100.0 - p_threshold));
    RETURN GREATEST(0, v_shortfall);
END //

DELIMITER ;

-- View 1: Student-wise Course Attendance Analytics
CREATE OR REPLACE VIEW v_student_course_attendance AS
SELECT 
    e.id AS enrollment_id,
    e.student_id,
    s.roll,
    s.name AS student_name,
    s.email AS student_email,
    s.gender,
    s.department_id,
    d.code AS department_code,
    d.name AS department_name,
    e.academic_period_id,
    ap.code AS academic_period_code,
    ap.name AS academic_period_name,
    o.section_id,
    sec.name AS section_name,
    sec.semester,
    e.offering_id,
    e.course_code,
    c.name AS course_name,
    c.credits,
    o.teacher_id,
    t.name AS teacher_name,
    e.enrollment_date,
    e.status AS enrollment_status,
    COUNT(DISTINCT CASE 
        WHEN ses.id IS NOT NULL 
         AND ses.submitted_at IS NOT NULL 
         AND ses.status != 'Cancelled' 
         AND ses.session_date >= e.enrollment_date 
        THEN ses.id 
    END) AS conducted_lectures,
    COUNT(DISTINCT CASE 
        WHEN ses.id IS NOT NULL 
         AND ses.submitted_at IS NOT NULL 
         AND ses.status != 'Cancelled' 
         AND ses.session_date >= e.enrollment_date 
         AND r.status = 'Present' 
        THEN r.id 
    END) AS attended_lectures,
    (COUNT(DISTINCT CASE 
        WHEN ses.id IS NOT NULL 
         AND ses.submitted_at IS NOT NULL 
         AND ses.status != 'Cancelled' 
         AND ses.session_date >= e.enrollment_date 
        THEN ses.id 
    END) - 
    COUNT(DISTINCT CASE 
        WHEN ses.id IS NOT NULL 
         AND ses.submitted_at IS NOT NULL 
         AND ses.status != 'Cancelled' 
         AND ses.session_date >= e.enrollment_date 
         AND r.status = 'Present' 
        THEN r.id 
    END)) AS missed_lectures,
    ROUND(
        100.0 * COUNT(DISTINCT CASE 
            WHEN ses.id IS NOT NULL 
             AND ses.submitted_at IS NOT NULL 
             AND ses.status != 'Cancelled' 
             AND ses.session_date >= e.enrollment_date 
             AND r.status = 'Present' 
            THEN r.id 
        END) / 
        NULLIF(COUNT(DISTINCT CASE 
            WHEN ses.id IS NOT NULL 
             AND ses.submitted_at IS NOT NULL 
             AND ses.status != 'Cancelled' 
             AND ses.session_date >= e.enrollment_date 
            THEN ses.id 
        END), 0),
        2
    ) AS attendance_percentage
FROM course_enrollments e
JOIN students s ON s.id = e.student_id
JOIN departments d ON d.id = s.department_id
JOIN academic_periods ap ON ap.id = e.academic_period_id
JOIN course_offerings o ON o.id = e.offering_id
JOIN sections sec ON sec.id = o.section_id
JOIN courses c ON c.code = e.course_code
JOIN teachers t ON t.id = o.teacher_id
LEFT JOIN attendance_sessions ses ON ses.offering_id = e.offering_id 
                                  AND ses.submitted_at IS NOT NULL 
                                  AND ses.status != 'Cancelled'
                                  AND ses.session_date >= e.enrollment_date
LEFT JOIN attendance_records r ON r.session_id = ses.id 
                               AND r.enrollment_id = e.id
GROUP BY 
    e.id, e.student_id, s.roll, s.name, s.email, s.gender, s.department_id,
    d.code, d.name, e.academic_period_id, ap.code, ap.name, o.section_id,
    sec.name, sec.semester, e.offering_id, e.course_code, c.name, c.credits,
    o.teacher_id, t.name, e.enrollment_date, e.status;

-- View 2: Course Offering Attendance Summary
CREATE OR REPLACE VIEW v_course_attendance_summary AS
SELECT 
    o.id AS offering_id,
    o.section_id,
    sec.name AS section_name,
    sec.semester,
    d.id AS department_id,
    d.code AS department_code,
    d.name AS department_name,
    o.academic_period_id,
    ap.code AS academic_period_code,
    o.course_code,
    c.name AS course_name,
    c.credits,
    o.teacher_id,
    t.name AS teacher_name,
    COUNT(DISTINCT e.id) AS total_enrolled,
    COUNT(DISTINCT CASE 
        WHEN ses.id IS NOT NULL 
         AND ses.submitted_at IS NOT NULL 
         AND ses.status != 'Cancelled' 
        THEN ses.id 
    END) AS conducted_lectures,
    ROUND(AVG(sa.attendance_percentage), 2) AS avg_attendance_percentage,
    COUNT(DISTINCT CASE 
        WHEN sa.conducted_lectures > 0 AND sa.attendance_percentage < 75.0 
        THEN sa.enrollment_id 
    END) AS defaulters_count
FROM course_offerings o
JOIN sections sec ON sec.id = o.section_id
JOIN departments d ON d.id = sec.department_id
JOIN academic_periods ap ON ap.id = o.academic_period_id
JOIN courses c ON c.code = o.course_code
JOIN teachers t ON t.id = o.teacher_id
LEFT JOIN course_enrollments e ON e.offering_id = o.id AND e.status = 'Enrolled'
LEFT JOIN attendance_sessions ses ON ses.offering_id = o.id 
                                  AND ses.submitted_at IS NOT NULL 
                                  AND ses.status != 'Cancelled'
LEFT JOIN v_student_course_attendance sa ON sa.enrollment_id = e.id
GROUP BY 
    o.id, o.section_id, sec.name, sec.semester, d.id, d.code, d.name,
    o.academic_period_id, ap.code, o.course_code, c.name, c.credits,
    o.teacher_id, t.name;

DELIMITER //

DROP PROCEDURE IF EXISTS sp_generate_course_defaulter_report //
CREATE PROCEDURE sp_generate_course_defaulter_report(
    IN p_offering_id BIGINT,
    IN p_threshold DECIMAL(5,2)
)
BEGIN
    SELECT 
        sa.enrollment_id,
        sa.student_id,
        sa.roll,
        sa.student_name,
        sa.department_name,
        sa.section_name,
        sa.course_code,
        sa.course_name,
        sa.teacher_name,
        sa.conducted_lectures,
        sa.attended_lectures,
        sa.missed_lectures,
        sa.attendance_percentage,
        fn_calculate_attendance_shortfall(sa.attended_lectures, sa.conducted_lectures, p_threshold) AS classes_needed_for_threshold
    FROM v_student_course_attendance sa
    WHERE (p_offering_id IS NULL OR sa.offering_id = p_offering_id)
      AND sa.conducted_lectures > 0
      AND sa.attendance_percentage < p_threshold
    ORDER BY sa.attendance_percentage ASC, sa.roll ASC;
END //

DELIMITER ;

-- >>> END FILE: 009_attendance_analytics.sql <<<


-- >>> START FILE: 010_student_complaints.sql <<<
USE campus_harmony;

-- Migration 010: Student Complaints & Grievance Management
-- Implements student grievance submission, status workflows, administrative audit responses, and attendance correction audit.

CREATE TABLE IF NOT EXISTS complaints (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reference_number VARCHAR(32) NOT NULL UNIQUE,
    student_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    related_offering_id BIGINT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    CONSTRAINT fk_complaints_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
    CONSTRAINT fk_complaints_offering FOREIGN KEY (related_offering_id) REFERENCES course_offerings(id) ON DELETE SET NULL,
    CONSTRAINT chk_complaint_status CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    CONSTRAINT chk_complaint_category CHECK (category IN (
        'Academic', 'Attendance', 'Examination / Marks', 'Faculty / Teaching', 'Infrastructure', 'Administrative', 'Other'
    ))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_complaints_student ON complaints(student_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_created ON complaints(created_at);

CREATE TABLE IF NOT EXISTS complaint_activity (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    complaint_id BIGINT NOT NULL,
    actor_login VARCHAR(80) NULL,
    actor_name VARCHAR(100) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(20) NULL,
    new_status VARCHAR(20) NULL,
    response_text TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_complaint_activity_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    CONSTRAINT fk_complaint_activity_account FOREIGN KEY (actor_login) REFERENCES accounts(login) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_complaint_activity_complaint ON complaint_activity(complaint_id);

-- Attendance Corrections Audit Table (Step 1 Verification & Remediation)
CREATE TABLE IF NOT EXISTS attendance_corrections_audit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    enrollment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    old_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    corrected_by VARCHAR(80) NOT NULL,
    reason VARCHAR(255) NULL,
    corrected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_att_corr_session FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_corr_enrollment FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_corr_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_att_corr_session ON attendance_corrections_audit(session_id);
CREATE INDEX idx_att_corr_student ON attendance_corrections_audit(student_id);

-- Reporting View: v_student_complaints
CREATE OR REPLACE VIEW v_student_complaints AS
SELECT 
    c.id,
    c.reference_number,
    c.student_id,
    s.roll AS student_roll,
    s.name AS student_name,
    s.email AS student_email,
    s.department_id,
    d.name AS department_name,
    c.category,
    c.subject,
    c.description,
    c.related_offering_id,
    co.course_code,
    crs.name AS course_name,
    c.status,
    c.created_at,
    c.updated_at,
    c.resolved_at,
    (SELECT COUNT(*) FROM complaint_activity ca WHERE ca.complaint_id = c.id) AS activity_count,
    (SELECT ca.response_text FROM complaint_activity ca 
     WHERE ca.complaint_id = c.id AND ca.response_text IS NOT NULL AND TRIM(ca.response_text) != '' 
     ORDER BY ca.id DESC LIMIT 1) AS latest_response,
    (SELECT ca.actor_name FROM complaint_activity ca 
     WHERE ca.complaint_id = c.id AND ca.response_text IS NOT NULL AND TRIM(ca.response_text) != '' 
     ORDER BY ca.id DESC LIMIT 1) AS latest_response_by,
    (SELECT ca.created_at FROM complaint_activity ca 
     WHERE ca.complaint_id = c.id AND ca.response_text IS NOT NULL AND TRIM(ca.response_text) != '' 
     ORDER BY ca.id DESC LIMIT 1) AS latest_response_at
FROM complaints c
JOIN students s ON s.id = c.student_id
JOIN departments d ON d.id = s.department_id
LEFT JOIN course_offerings co ON co.id = c.related_offering_id
LEFT JOIN courses crs ON crs.code = co.course_code;

-- Update stored function fn_calculate_attendance_shortfall to handle T = 100% edge case gracefully
DELIMITER //

DROP FUNCTION IF EXISTS fn_calculate_attendance_shortfall //
CREATE FUNCTION fn_calculate_attendance_shortfall(
    p_attended INT,
    p_conducted INT,
    p_threshold DECIMAL(5,2)
) RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_shortfall INT;
    IF p_conducted <= 0 OR p_threshold <= 0 THEN
        RETURN 0;
    END IF;
    IF (p_attended / p_conducted) * 100.0 >= p_threshold THEN
        RETURN 0;
    END IF;
    -- Edge case: If threshold is 100% and student missed any lecture, recovery to 100% is impossible
    IF p_threshold >= 100.0 THEN
        RETURN -1;
    END IF;
    -- Shortfall math: (attended + x) / (conducted + x) >= T / 100  =>  x >= (T*C - 100*P) / (100 - T)
    SET v_shortfall = CEIL((p_threshold * p_conducted - 100.0 * p_attended) / (100.0 - p_threshold));
    RETURN GREATEST(0, v_shortfall);
END //

DELIMITER ;

-- >>> END FILE: 010_student_complaints.sql <<<


-- >>> START FILE: 011_academic_programs_and_mentors.sql <<<
USE campus_harmony;

CREATE TABLE IF NOT EXISTS academic_programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    degree VARCHAR(20) NOT NULL DEFAULT 'B.Tech',
    duration_years INT NOT NULL DEFAULT 4,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_program_dept FOREIGN KEY (department_id)
        REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO academic_programs (id, department_id, code, name, degree, duration_years) VALUES
(1, 1, 'BTECH-CSE-CORE', 'CSE Core', 'B.Tech', 4),
(2, 1, 'BTECH-CSE-AIML', 'CSE AI & ML', 'B.Tech', 4),
(3, 1, 'BTECH-CSE-AIFT', 'CSE AI & FT', 'B.Tech', 4)
ON DUPLICATE KEY UPDATE name=VALUES(name), degree=VALUES(degree), duration_years=VALUES(duration_years);

-- Safe conditional column additions for sections and students
ALTER TABLE sections ADD COLUMN IF NOT EXISTS program_id INT NULL;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS mentor_teacher_id VARCHAR(30) NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS program_id INT NULL;

-- >>> END FILE: 011_academic_programs_and_mentors.sql <<<


