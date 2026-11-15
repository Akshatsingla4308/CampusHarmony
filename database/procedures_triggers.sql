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
