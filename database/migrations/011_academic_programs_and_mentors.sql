-- Migration 011: Academic Programs and Section Mentors
USE campus_harmony;

-- 1. Academic Programs (Degree branches under departments)
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

-- Seed the 3 B.Tech Programs
INSERT INTO academic_programs (id, department_id, code, name, degree, duration_years) VALUES
(1, 1, 'BTECH-CSE-CORE', 'CSE Core', 'B.Tech', 4),
(2, 1, 'BTECH-CSE-AIML', 'CSE AI & ML', 'B.Tech', 4),
(3, 1, 'BTECH-CSE-AIFT', 'CSE AI & FT', 'B.Tech', 4)
ON DUPLICATE KEY UPDATE name=VALUES(name), degree=VALUES(degree), duration_years=VALUES(duration_years);

-- 2. Add program_id and mentor_teacher_id to sections if they do not exist
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sections' AND COLUMN_NAME = 'program_id'
);
SET @sql_stmt = IF(@col_exists = 0, 'ALTER TABLE sections ADD COLUMN program_id INT NULL, ADD CONSTRAINT fk_sections_program FOREIGN KEY (program_id) REFERENCES academic_programs(id) ON DELETE SET NULL;', 'SELECT 1;');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sections' AND COLUMN_NAME = 'mentor_teacher_id'
);
SET @sql_stmt = IF(@col_exists = 0, 'ALTER TABLE sections ADD COLUMN mentor_teacher_id VARCHAR(30) NULL, ADD CONSTRAINT fk_sections_mentor FOREIGN KEY (mentor_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;', 'SELECT 1;');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add program_id to students if it does not exist
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'program_id'
);
SET @sql_stmt = IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN program_id INT NULL, ADD CONSTRAINT fk_students_program FOREIGN KEY (program_id) REFERENCES academic_programs(id) ON DELETE SET NULL;', 'SELECT 1;');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
