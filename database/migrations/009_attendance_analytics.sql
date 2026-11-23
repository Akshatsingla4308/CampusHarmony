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
