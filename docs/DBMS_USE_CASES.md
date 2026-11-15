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

    -- Clean up previous run data from the audit log
    DELETE FROM defaulter_audit_log;

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

## 4. Use Case 4: Event-to-Cache Attendance Synchronization (Row-Level Trigger)

### Problem Statement:
When faculty take attendance during a lecture, a dated event record is inserted into `attendance_records`. To ensure instant dashboard KPI queries without executing heavy `COUNT()` aggregation queries across hundreds of thousands of historical lecture logs, the aggregate counters in `attendance` (`total_days`, `present_days`, `absent_days`, `last_marked`) must update automatically in real-time.

### Techniques Demonstrated:
- Row-Level Trigger (`AFTER INSERT ON attendance_records FOR EACH ROW`)
- `NEW` pseudorecord variable access
- `IF-ELSE` condition logic
- Atomic synchronization between event store and read model

### Procedural SQL Implementation Design:
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
            total_days = total_days + 1,
            present_days = CASE WHEN NEW.status = 'Present' THEN present_days + 1 ELSE present_days END,
            absent_days  = CASE WHEN NEW.status = 'Absent'  THEN absent_days + 1  ELSE absent_days END,
            last_marked  = DATE_FORMAT(NEW.session_date, '%Y-%m-%d'),
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
            DATE_FORMAT(NEW.session_date, '%Y-%m-%d'),
            NOW()
        );
    END IF;
END //

DELIMITER ;
```

### Viva Explanation:
- **AFTER INSERT vs BEFORE INSERT:** `AFTER INSERT` guarantees that the trigger fires only after the new session row has successfully passed all primary key, foreign key, and unique checks. If the insert fails, the summary table is never modified.
- **Data Integrity:** Because the update is handled entirely within MySQL's transactional engine, there is zero risk of application-level race conditions or discrepancies between logs and dashboard summaries.

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

    -- Step 1: Insert into students
    INSERT INTO students (
        roll, name, department, semester, email, phone, status, gender, created_at
    ) VALUES (
        p_roll, p_name, p_department, p_semester, p_email, p_phone, 'Active', 'Other', NOW()
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
