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
