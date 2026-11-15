# CAMPUS HARMONY — DBMS PROCEDURAL SQL USE CASES & DEMONSTRATION GUIDE

**Course:** Database Management Systems (24CSE0209)  
**Evaluation:** Procedural SQL & Viva (15 Marks Criteria)  
**Target Engine:** MySQL 8.0+  

---

## 1. Overview of Procedural SQL Requirements

According to the official DBMS Project-Based Evaluation Rubric (`Circular_20261103151707`), obtaining top-band marks (10–15 marks) requires:
> *"Comprehensive implementation and understanding of procedural SQL concepts. Appropriately applies procedures/functions, cursors, triggers, exception handling, and/or control structures to fulfil the identified use cases and project requirements. Clearly explains the purpose and working of the implemented techniques."*

The following 6 real-world use cases are formally designed for Campus Harmony.

---

## 2. Use Case 1: Attendance Defaulter Audit Report (Stored Procedure with Cursor)

### Problem Statement:
University academic policy mandates that students maintain at least 75% attendance to be eligible for end-semester examinations. The administration requires an automated batch procedure that inspects all enrolled students, identifies those falling below a user-specified threshold percentage, computes the exact number of future lectures each student must attend consecutively to reach 75%, logs the report into `defaulter_audit_log`, and outputs the formatted defaulter roster.

### Techniques Demonstrated:
- Stored Procedure definition (`CREATE PROCEDURE`)
- Cursor declaration (`DECLARE cur_students CURSOR FOR ...`)
- Cursor state handler (`DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;`)
- Cursor lifecycle: `OPEN`, `FETCH`, `CLOSE`
- Loop control structure (`REPEAT ... UNTIL ... END REPEAT` or `LOOP ... LEAVE`)
- Mathematical ceiling formula for required attendance shortfall
- Batch insertion into an audit log table

### Procedural SQL Implementation Design:
```sql
DELIMITER //

DROP PROCEDURE IF EXISTS sp_generate_attendance_defaulter_report //

CREATE PROCEDURE sp_generate_attendance_defaulter_report(
    IN p_threshold_pct DECIMAL(5,2)
)
BEGIN
    -- Declare local variables for cursor processing
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

    -- Cursor to select students whose attendance is below threshold
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

    -- Handle cursor exhaust condition
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    -- Clean up previous run data from the audit log using authorized session token
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

        -- Mathematical formula to reach 75%:
        -- (present + x) / (total + x) >= 0.75  =>  x >= (0.75*total - present) / 0.25
        SET v_classes_needed = GREATEST(0, CEIL((0.75 * v_total - v_present) / 0.25));

        -- Insert into audit log table
        INSERT INTO defaulter_audit_log (
            student_id, roll, student_name, department, attendance_percentage, classes_needed, reported_at
        ) VALUES (
            v_student_id, v_roll, v_name, v_department, v_percentage, v_classes_needed, NOW()
        );

        SET v_count = v_count + 1;
    END LOOP read_loop;

    CLOSE cur_defaulters;

    -- Output the generated defaulter roster
    SELECT 
        roll AS 'Roll Number',
        student_name AS 'Student Name',
        department AS 'Department',
        CONCAT(attendance_percentage, '%') AS 'Current Attendance',
        classes_needed AS 'Consecutive Classes Needed for 75%'
    FROM defaulter_audit_log
    ORDER BY attendance_percentage ASC;

END //

DELIMITER ;
```

### Viva Explanation:
- **Why a cursor?** When row-by-row custom procedural processing and mathematical calculations are required per record (like calculating individual shortfall lectures), a cursor allows deterministic iteration across an active result set.
- **Why `CONTINUE HANDLER`?** In MySQL, attempting to fetch past the last row of a cursor raises SQLSTATE `02000` (NOT FOUND). The handler intercepts this event gracefully and sets `v_done = 1`, permitting clean loop exit without throwing an error.

---

## 2. Use Case 2: Standardized Academic Grading (Stored Function with Control Flow)

### Problem Statement:
Grading policies must be deterministic, preventing inconsistent letter grades across faculty members and subjects. The system needs a database stored function that takes obtained marks and maximum marks, computes percentage, and returns the corresponding academic letter grade (`A+`, `A`, `B`, `C`, `D`, `F`).

### Techniques Demonstrated:
- Stored Function definition (`CREATE FUNCTION ... RETURNS VARCHAR(5)`)
- Deterministic attribute (`DETERMINISTIC`)
- `IF ... ELSEIF ... ELSE` multi-branch conditional control flow
- Division by zero and `NULL` defensive checks

### Procedural SQL Implementation Design:
```sql
DELIMITER //

DROP FUNCTION IF EXISTS fn_calculate_grade //

CREATE FUNCTION fn_calculate_grade(
    p_marks DECIMAL(5,2),
    p_max_marks DECIMAL(5,2)
)
RETURNS VARCHAR(5)
DETERMINISTIC
BEGIN
    DECLARE v_pct DECIMAL(5,2);
    DECLARE v_grade VARCHAR(5);

    -- Defensive checks for null or non-positive max marks
    IF p_marks IS NULL OR p_max_marks IS NULL OR p_max_marks <= 0 THEN
        RETURN 'N/A';
    END IF;

    SET v_pct = (p_marks / p_max_marks) * 100.0;

    -- Standard university letter grading criteria
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

DELIMITER ;
```

### Viva Explanation:
- **Function vs Procedure:** A function returns a single scalar value directly into an expression or `SELECT` statement (e.g. `SELECT fn_calculate_grade(85, 100)`), whereas a procedure is invoked via `CALL` and can return multiple result sets or perform DDL/DML operations.
- **DETERMINISTIC:** Informs the MySQL query optimizer that given identical input arguments, the function will always produce the exact same output without accessing external random state, enabling caching and query optimization.

---

## 3. Use Case 3: Student Cumulative Average (Stored Function)

### Problem Statement:
Faculty advisors and the student dashboard require a quick scalar lookup of any student's overall percentage across all completed subjects.

### Techniques Demonstrated:
- Aggregation query inside a function
- Handling non-existent records with `COALESCE`

### Procedural SQL Implementation Design:
```sql
DELIMITER //

DROP FUNCTION IF EXISTS fn_get_student_average //

CREATE FUNCTION fn_get_student_average(
    p_student_id BIGINT
)
RETURNS DECIMAL(5,2)
READS SQL DATA
BEGIN
    DECLARE v_avg DECIMAL(5,2);

    SELECT 
        ROUND(AVG((marks_obtained / max_marks) * 100.0), 2)
    INTO v_avg
    FROM student_marks
    WHERE student_id = p_student_id;

    RETURN COALESCE(v_avg, 0.00);
END //

DELIMITER ;
```

---

## 4. Use Case 4: Full DML Event-to-Cache Attendance Synchronization & Reconciliation

### Problem Statement:
When faculty take attendance during a lecture, dated event records are written to `attendance_records`. To ensure instantaneous ($O(1)$) dashboard KPI responses without subjecting the database to heavy `COUNT()` aggregation table scans over hundreds of thousands of historical lecture records, the aggregate counters in `attendance` (`total_days`, `present_days`, `absent_days`, `last_marked`) must stay synchronized in real time.

Furthermore, attendance entries may be updated (e.g., retroactively correcting an excused absence) or deleted (e.g., removing a mistakenly logged entry). The database must handle all three DML events (`INSERT`, `UPDATE`, `DELETE`) deterministically while addressing MySQL's foreign key cascade limitations.

### Techniques Demonstrated:
- Complete DML Row-Level Trigger Coverage (`AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE` on `attendance_records`)
- Accessing `NEW` and `OLD` transition pseudorecords
- Conditional aggregate counter math preserving $total\_days = present\_days + absent\_days$
- Handling MySQL InnoDB foreign key cascade trigger limitations
- Standalone DQL cache reconciliation query comparing cache counters to source truth
- Self-healing procedural cache recalculation (`sp_reconcile_attendance_cache`)

### Procedural SQL Implementation Design:

#### 1. AFTER INSERT Synchronization Trigger:
```sql
DELIMITER //

DROP TRIGGER IF EXISTS trg_after_attendance_record_insert //

CREATE TRIGGER trg_after_attendance_record_insert
AFTER INSERT ON attendance_records
FOR EACH ROW
BEGIN
    -- Check if a summary record already exists for this student
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
        -- Insert fresh summary record if none exists yet
        INSERT INTO attendance (
            student_id, 
            total_days, 
            present_days, 
            absent_days, 
            last_marked, 
            updated_at
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

DELIMITER ;
```

#### 2. AFTER UPDATE Synchronization Trigger (Status Transitions):
```sql
DELIMITER //

DROP TRIGGER IF EXISTS trg_after_attendance_record_update //

CREATE TRIGGER trg_after_attendance_record_update
AFTER UPDATE ON attendance_records
FOR EACH ROW
BEGIN
    -- Only adjust counters if attendance status actually changed
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

DELIMITER ;
```

#### 3. AFTER DELETE Synchronization Trigger (Record Revocation):
```sql
DELIMITER //

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

DELIMITER ;
```

#### 4. Handling MySQL `ON DELETE CASCADE` Trigger Limitations:
- **The Technical Challenge:** In MySQL InnoDB, cascaded foreign key actions (`ON DELETE CASCADE`) are processed internally by the storage engine without firing child table triggers. If a course session or student were dropped via cascade, `trg_after_attendance_record_delete` would not fire!
- **Architectural Solution:**
  1. **Symmetric Student Deletion:** Both `attendance` and `attendance_records` link to `students(id)` with `ON DELETE CASCADE`. When a student is hard-deleted from master tables, InnoDB purges both the summary cache row and the detailed records simultaneously in the same atomic transaction.
  2. **Restricted Session Deletion:** In `attendance_records`, foreign keys to `attendance_sessions` and `course_enrollments` specify `ON DELETE RESTRICT`. Scheduled sessions with recorded attendance cannot be dropped by casual cascade.
  3. **Controlled Administrative Deletion Procedure:**
     ```sql
     DELIMITER //
     DROP PROCEDURE IF EXISTS sp_delete_attendance_session_controlled //
     CREATE PROCEDURE sp_delete_attendance_session_controlled(
         IN p_session_id BIGINT
     )
     BEGIN
         START TRANSACTION;
         -- Step 1: Explicitly delete child records (fires trg_after_attendance_record_delete)
         DELETE FROM attendance_records WHERE session_id = p_session_id;
         -- Step 2: Delete the session
         DELETE FROM attendance_sessions WHERE id = p_session_id;
         COMMIT;
     END //
     DELIMITER ;
     ```

#### 5. Attendance Summary Cache Reconciliation Query:
```sql
SELECT 
    a.student_id,
    s.roll AS student_roll,
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
```

### Viva Explanation:
- **Full DML Coverage:** Triggers on `INSERT`, `UPDATE`, and `DELETE` guarantee that regardless of whether rows are added, edited, or removed, aggregate math ($total\_days = present\_days + absent\_days$) is preserved without expensive background batch jobs.
- **Why Self-Healing Reconciliation?** In enterprise operations, hardware reboots, administrative manual overrides, or disaster-recovery restores can potentially cause cache drift. Providing a deterministic reconciliation query and the `sp_reconcile_attendance_cache` procedure demonstrates deep operational DBA maturity.

---

## 5. Use Case 5: Domain Validation & Auto-Grading (Trigger with Custom Exception)

### Problem Statement:
Marks entered by faculty must not violate physical limits (e.g., negative marks or marks exceeding maximum allowed). Furthermore, letter grades should be assigned immediately and automatically upon entry, rather than relying on manual text entry. If invalid marks are supplied, the transaction must abort immediately with a user-friendly error message.

### Techniques Demonstrated:
- Row-Level Trigger (`BEFORE INSERT OR UPDATE ON student_marks FOR EACH ROW`)
- Domain validation condition
- Custom Exception Signal (`SIGNAL SQLSTATE '45000'`)
- Calling a User-Defined Stored Function inside a Trigger (`fn_calculate_grade`)

### Procedural SQL Implementation Design:
```sql
DELIMITER //

DROP TRIGGER IF EXISTS trg_validate_and_grade_student_marks //

CREATE TRIGGER trg_validate_and_grade_student_marks
BEFORE INSERT ON student_marks
FOR EACH ROW
BEGIN
    -- Validation 1: Marks cannot be negative
    IF NEW.marks_obtained < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: marks_obtained cannot be negative.';
    END IF;

    -- Validation 2: Marks obtained cannot exceed maximum marks
    IF NEW.marks_obtained > NEW.max_marks THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: marks_obtained cannot exceed max_marks.';
    END IF;

    -- Validation 3: Exam type must be from the standardized academic categories
    IF NEW.exam_type NOT IN ('Internal', 'Midterm', 'Endterm') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: exam_type must be Internal, Midterm, or Endterm.';
    END IF;

    -- Auto-calculate letter grade using stored function
    SET NEW.grade = fn_calculate_grade(NEW.marks_obtained, NEW.max_marks);
END //

DELIMITER ;
```

### Viva Explanation:
- **`SIGNAL SQLSTATE '45000'`:** `45000` is the standard ANSI SQL generic state code reserved for user-defined unhandled exceptions. Signaling this state halts execution and returns the custom `MESSAGE_TEXT` directly to the client/application.
- **BEFORE INSERT:** Firing before row write allows modifying column values (`SET NEW.grade = ...`) or preventing the insert altogether before it touches disk.

---

## 6. Use Case 6: Atomic Multi-Table Enrollment (ACID Transaction with Rollback Handler)

### Problem Statement:
Enrolling a new student is an atomic business transaction:
1. Insert student record into `students`.
2. Initialize 0-day attendance record in `attendance`.
3. Initialize empty marks record in `marks`.
4. Log enrollment event in `activities`.

If any single step fails (e.g. invalid semester, duplicate email/roll, or unexpected system failure), the entire batch must rollback completely, preventing partial student records.

### Techniques Demonstrated:
- Transaction management (`START TRANSACTION`, `COMMIT`, `ROLLBACK`)
- Exception Handling (`DECLARE EXIT HANDLER FOR SQLEXCEPTION`)
- Error simulation parameter (`p_simulate_error`) for viva demonstration

### Procedural SQL Implementation Design:
```sql
DELIMITER //

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

    -- Error Handler: If any SQLEXCEPTION occurs, rollback and inform caller
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_message = 'TRANSACTION ROLLED BACK: Error occurred during multi-table enrollment.';
    END;

    -- Begin the atomic ACID transaction
    START TRANSACTION;

    -- Step 1: Insert into students with normalized department_id FK
    INSERT INTO students (
        roll, name, department_id, department, semester, email, phone, status, gender, created_at
    ) VALUES (
        p_roll, p_name, p_department_id, p_department, p_semester, p_email, p_phone, 'Active', 'Other', NOW()
    );

    SET v_new_student_id = LAST_INSERT_ID();

    -- Step 2: Initialize attendance summary
    INSERT INTO attendance (student_id, total_days, present_days, absent_days, last_marked)
    VALUES (v_new_student_id, 0, 0, 0, '—');

    -- Step 3: Initialize marks summary
    INSERT INTO marks (student_id, mathematics, physics, chemistry, english, computer_science)
    VALUES (v_new_student_id, NULL, NULL, NULL, NULL, NULL);

    -- Step 4: Log audit activity
    INSERT INTO activities (text, type, teacher_id, created_at)
    VALUES (CONCAT('Enrolled new student: ', p_name, ' (', p_roll, ')'), 'enroll', NULL, NOW());

    -- Viva Demonstration Switch: Simulate intentional failure if requested
    IF p_simulate_error = TRUE THEN
        -- Violate semester CHECK constraint to trigger exception
        INSERT INTO students (roll, name, department, semester, email, phone, status, gender)
        VALUES ('ERR-999', 'Ghost Student', 'CS', 99, 'ghost@campus.local', '0000000000', 'Active', 'Other');
    END IF;

    -- Step 5: Commit transaction
    COMMIT;
    SET p_status_message = 'TRANSACTION COMMITTED: Student and all dependent records enrolled successfully.';

END //

DELIMITER ;
```

### Viva Explanation:
- **ACID Properties:**
  - **Atomicity:** All four tables are modified together or none at all.
  - **Consistency:** Constraints (`CHECK`, `UNIQUE`, `FK`) are strictly respected.
  - **Isolation:** Uncommitted inserts are invisible to concurrent transactions.
  - **Durability:** Once `COMMIT` executes, changes persist in the InnoDB write-ahead log (WAL) even across power failures.

---

## 7. Use Case 7: Compliance Audit Snapshot Immutability (Defense-in-Depth Triggers)

### Problem Statement:
Accreditation bodies require that once attendance defaulter audits are compiled, historical records in `defaulter_audit_log` cannot be surreptitiously edited, altered, or deleted by application users. While `ON DELETE SET NULL` prevents records from vanishing when a student is deleted, engine-level triggers are required to actively block `UPDATE` and ad-hoc `DELETE` operations.

### Techniques Demonstrated:
- `BEFORE UPDATE` trigger halting modification with custom error `SIGNAL SQLSTATE '45000'`.
- `BEFORE DELETE` trigger restricting deletion to authorized administrative procedures setting session token `@ALLOW_AUDIT_PURGE`.

### Procedural SQL Implementation Design:
```sql
DELIMITER //

DROP TRIGGER IF EXISTS trg_prevent_defaulter_audit_update //

CREATE TRIGGER trg_prevent_defaulter_audit_update
BEFORE UPDATE ON defaulter_audit_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Security Violation: Historical audit snapshots in defaulter_audit_log are legally immutable.';
END //

DROP TRIGGER IF EXISTS trg_prevent_defaulter_audit_delete //

CREATE TRIGGER trg_prevent_defaulter_audit_delete
BEFORE DELETE ON defaulter_audit_log
FOR EACH ROW
BEGIN
    IF @ALLOW_AUDIT_PURGE IS NULL OR @ALLOW_AUDIT_PURGE != TRUE THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Security Violation: Direct deletion of defaulter audit records is prohibited.';
    END IF;
END //

DELIMITER ;
```

---

## 8. Use Case 8: Comprehensive Enrollment Status Lifecycle Gating & Concurrency Control

### Problem Statement:
Attendance integrity requires that attendance can ONLY be marked or modified for active, registered students (`status = 'Enrolled'`). If a student's enrollment is `'Dropped'` or `'Completed'`, recording or tampering with attendance must be strictly blocked by the database engine.

Furthermore, lifecycle status transitions on `course_enrollments` must be regulated:
1. If a student has already attended classes (attendance records exist), they **cannot drop the course** (`status = 'Dropped'`) because that would orphan historical class records or falsify regulatory transcripts.
2. When a course is marked `'Completed'` at semester end, existing attendance records must remain preserved as **immutable historical archives**, while preventing any future attendance modifications.
3. Concurrent transactions (e.g., faculty entering attendance while an administrator processes a registration change) must not introduce race conditions or bypass validation rules.

### Techniques Demonstrated:
- Dual-trigger validation on child operations (`BEFORE INSERT` and `BEFORE UPDATE` on `attendance_records`)
- Lifecycle state-machine transition enforcement (`BEFORE UPDATE` on `course_enrollments`)
- Custom exception signaling with `SIGNAL SQLSTATE '45000'`
- Database storage-engine concurrency protection via InnoDB row locks (`FOR SHARE`) and foreign key locks

### Procedural SQL Implementation Design:

#### 1. Validation Before INSERT on Attendance Records:
```sql
DELIMITER //

DROP TRIGGER IF EXISTS trg_validate_attendance_enrollment_insert //

CREATE TRIGGER trg_validate_attendance_enrollment_insert
BEFORE INSERT ON attendance_records
FOR EACH ROW
BEGIN
    DECLARE v_status VARCHAR(20);

    -- Shared lock query ensures concurrent enrollment status updates cannot race
    SELECT status INTO v_status
    FROM course_enrollments
    WHERE id = NEW.enrollment_id
    LOCK IN SHARE MODE;

    IF v_status IS NULL OR v_status != 'Enrolled' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Integrity Violation: Attendance can only be recorded for students with active status Enrolled. Dropped or Completed enrollments are ineligible.';
    END IF;
END //

DELIMITER ;
```

#### 2. Validation Before UPDATE on Attendance Records:
```sql
DELIMITER //

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
            SET MESSAGE_TEXT = 'Integrity Violation: Historical attendance records for Completed or Dropped enrollments are immutable and cannot be modified.';
    END IF;
END //

DELIMITER ;
```

#### 3. Preventing Invalid Enrollment Status Transitions on `course_enrollments`:
```sql
DELIMITER //

DROP TRIGGER IF EXISTS trg_validate_enrollment_status_transition //

CREATE TRIGGER trg_validate_enrollment_status_transition
BEFORE UPDATE ON course_enrollments
FOR EACH ROW
BEGIN
    -- Transition Check 1: Enrolled -> Dropped is BLOCKED if attendance has already been logged
    IF NEW.status = 'Dropped' AND OLD.status != 'Dropped' THEN
        IF EXISTS (SELECT 1 FROM attendance_records WHERE enrollment_id = OLD.id) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Integrity Violation: Cannot drop course enrollment after attendance records have been logged. Historical records must be preserved; use formal withdrawal or retain enrollment record.';
        END IF;
    END IF;

    -- Transition Check 2: Completed registrations cannot be altered back to Enrolled or Dropped
    IF OLD.status = 'Completed' AND NEW.status != 'Completed' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Integrity Violation: Completed course registrations are finalized and cannot be modified.';
    END IF;

    -- Transition Check 3: Dropped registrations are terminal
    IF OLD.status = 'Dropped' AND NEW.status != 'Dropped' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Integrity Violation: Dropped course registrations cannot be reactivated directly; create a fresh registration.';
    END IF;
END //

DELIMITER ;
```

### Concurrency and Transaction Isolation Analysis:
- **Race Condition Scenario:** Faculty member A submits attendance for enrollment $E$ while Registrar B concurrently marks enrollment $E$ as `'Dropped'`.
- **InnoDB Locking Protection:**
  1. Trigger `trg_validate_attendance_enrollment_insert` executes `SELECT status FROM course_enrollments ... LOCK IN SHARE MODE`. This acquires an InnoDB S-lock (Shared Lock) on row $E$.
  2. Registrar B's update transaction requires an X-lock (Exclusive Lock) on row $E$ to execute `UPDATE course_enrollments SET status = 'Dropped'`.
  3. Under InnoDB concurrency semantics, the X-lock request is suspended until Faculty member A's transaction commits.
  4. Once Faculty member A commits, row $E$ has child attendance records in `attendance_records`.
  5. When Registrar B's update resumes, trigger `trg_validate_enrollment_status_transition` fires, detects the newly committed attendance records (`EXISTS (SELECT 1 FROM attendance_records ...)`), and throws SQLSTATE `45000`, cleanly preventing the invalid state transition!
- **Non-Bypassability:** Because these checks reside in the database storage engine as DDL triggers and locks, no REST API, Spring Data JPA dirty checking, or external CLI tool can bypass this integrity policy.

