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
