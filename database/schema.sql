-- =============================================================================
-- Database Schema for Campus Harmony / Sunrise Institute Student Management System
-- Technology Stack: MySQL 8.0+
-- Demonstrates: Normalization (1NF, 2NF, 3NF), Primary Keys, Foreign Keys,
-- Referential Integrity (CASCADE rules), Constraints (CHECK, UNIQUE, NOT NULL),
-- and Indexing for performance.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS campus_harmony;
USE campus_harmony;

-- Disable foreign key checks while dropping to avoid order dependency
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS marks;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS departments;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Departments Table (Normalized lookup table)
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 2. Subjects Table (Normalized lookup for subjects taught)
CREATE TABLE subjects (
    subject_key VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 3. Teachers Table (Stores teacher profiles and assigned subject)
CREATE TABLE teachers (
    id VARCHAR(30) PRIMARY KEY, -- e.g., 'T-1001'
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    workspace VARCHAR(20) NOT NULL DEFAULT 'demo', -- 'demo' (shared) or 'own' (isolated)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_teachers_subject FOREIGN KEY (subject) 
        REFERENCES subjects(subject_key) 
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 4. Students Table (Master entity for students)
CREATE TABLE students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    roll VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    semester INT NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    gender VARCHAR(10) NOT NULL,
    address VARCHAR(255),
    teacher_id VARCHAR(30) NULL, -- NULL means global college demo; non-null means teacher's own class
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_student_semester CHECK (semester BETWEEN 1 AND 8),
    CONSTRAINT chk_student_status CHECK (status IN ('Active', 'Probation', 'Inactive')),
    CONSTRAINT chk_student_gender CHECK (gender IN ('Male', 'Female', 'Other')),
    CONSTRAINT fk_students_teacher FOREIGN KEY (teacher_id) 
        REFERENCES teachers(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. Courses Table (Courses offered by the institute)
CREATE TABLE courses (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    faculty VARCHAR(100) NOT NULL,
    credits INT NOT NULL,
    semester INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Upcoming',
    teacher_id VARCHAR(30) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_course_credits CHECK (credits BETWEEN 1 AND 10),
    CONSTRAINT chk_course_semester CHECK (semester BETWEEN 1 AND 8),
    CONSTRAINT chk_course_status CHECK (status IN ('Ongoing', 'Completed', 'Upcoming')),
    CONSTRAINT fk_courses_teacher FOREIGN KEY (teacher_id) 
        REFERENCES teachers(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. Attendance Table (1:1 relationship with Student)
CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL UNIQUE,
    total_days INT NOT NULL DEFAULT 0,
    present_days INT NOT NULL DEFAULT 0,
    absent_days INT NOT NULL DEFAULT 0,
    last_marked VARCHAR(20) DEFAULT '—',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_attendance_non_negative CHECK (total_days >= 0 AND present_days >= 0 AND absent_days >= 0),
    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) 
        REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 7. Marks Table (1:1 relationship with Student; 5 subjects)
CREATE TABLE marks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL UNIQUE,
    mathematics INT NULL,
    physics INT NULL,
    chemistry INT NULL,
    english INT NULL,
    computer_science INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_math_marks CHECK (mathematics IS NULL OR (mathematics BETWEEN 0 AND 100)),
    CONSTRAINT chk_phy_marks CHECK (physics IS NULL OR (physics BETWEEN 0 AND 100)),
    CONSTRAINT chk_chem_marks CHECK (chemistry IS NULL OR (chemistry BETWEEN 0 AND 100)),
    CONSTRAINT chk_eng_marks CHECK (english IS NULL OR (english BETWEEN 0 AND 100)),
    CONSTRAINT chk_cs_marks CHECK (computer_science IS NULL OR (computer_science BETWEEN 0 AND 100)),
    CONSTRAINT fk_marks_student FOREIGN KEY (student_id) 
        REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 8. Activities Table (Audit log for recent college events)
CREATE TABLE activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    text VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'notice',
    teacher_id VARCHAR(30) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activities_teacher FOREIGN KEY (teacher_id) 
        REFERENCES teachers(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Indexes for performance optimization and frequent filter operations
CREATE INDEX idx_students_dept ON students(department);
CREATE INDEX idx_students_sem ON students(semester);
CREATE INDEX idx_courses_sem ON courses(semester);
CREATE INDEX idx_activities_time ON activities(created_at DESC);
