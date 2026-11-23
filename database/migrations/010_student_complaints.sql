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
