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
    CONSTRAINT chk_activity_type CHECK (type IN ('notice', 'attendance', 'grade', 'enroll', 'course', 'system'))
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
