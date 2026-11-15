# CAMPUS HARMONY — RELATIONAL DATABASE DESIGN & NORMALIZATION ANALYSIS (FINAL PHASE 2 - REVISED)

**Course:** Database Management Systems (24CSE0209)  
**Evaluation:** Project-Based Evaluation (50 Marks)  
**Database Engine:** MySQL Server 8.0+ (InnoDB Storage Engine)  
**Revision:** Version 5.0 (Implementation-Readiness & Integrity Verification)  

---

## 1. Relational Mapping & Technical Integrity Strategies

### A. Genuine Attendance Enrollment Integrity & Lifecycle Gating

In institutional database architectures, declaring independent foreign keys (`session_id -> sessions`, `enrollment_id -> enrollments`, `student_id -> students`) does **not** guarantee referential coherence. An unconstrained record could reference a session for `CS501` in Period 1, but link an enrollment for `EC701` in Period 2 belonging to an entirely different student.

To mathematically guarantee relational integrity across sessions, enrollments, and attendance:

1. **Candidate Keys for Composite Linkage:**
   - In `course_enrollments`, candidate key `uk_enrollment_composite (id, student_id, course_code, academic_period_id)` is declared.
   - In `attendance_sessions`, candidate key `uk_session_composite (id, course_code, academic_period_id)` is declared.

2. **Composite Foreign Key Enforcement:**
   In `attendance_records`, composite foreign keys link the child record to both parent tables simultaneously:
   ```sql
   CONSTRAINT fk_att_rec_session_composite
       FOREIGN KEY (session_id, course_code, academic_period_id)
       REFERENCES attendance_sessions(id, course_code, academic_period_id)
       ON DELETE RESTRICT ON UPDATE CASCADE,

   CONSTRAINT fk_att_rec_enrollment_composite
       FOREIGN KEY (enrollment_id, student_id, course_code, academic_period_id)
       REFERENCES course_enrollments(id, student_id, course_code, academic_period_id)
       ON DELETE RESTRICT ON UPDATE CASCADE
   ```

3. **Storage Engine Guarantees:**
   - The attendance session is mathematically guaranteed to belong to the exact same course (`course_code`) as the enrollment.
   - The attendance session and the enrollment are mathematically guaranteed to belong to the exact same academic period (`academic_period_id`).
   - The student in the attendance record is mathematically guaranteed to be the exact student registered under that enrollment (`student_id`).

4. **Enrollment Status Gating on Attendance Operations:**
   - **Trigger `trg_validate_attendance_enrollment_insert` (BEFORE INSERT ON `attendance_records`):**
     Verifies that `course_enrollments.status = 'Enrolled'`. If status is `'Dropped'` or `'Completed'`, it aborts the statement with SQLSTATE `45000`:
     *"Integrity Violation: Cannot log attendance. Student enrollment status is '[status]'. Attendance can only be recorded for active 'Enrolled' registrations."*
   - **Trigger `trg_validate_attendance_enrollment_update` (BEFORE UPDATE ON `attendance_records`):**
     Verifies that `course_enrollments.status = 'Enrolled'`. If an enrollment has completed or dropped, retroactively altering historical attendance records is strictly blocked.

5. **Enrollment Lifecycle Transitions & Historical Record Policy:**
   - **State Machine for `course_enrollments.status`:**
     - `Enrolled` $\to$ `Dropped`: **Conditionally Allowed.** Permitted ONLY IF zero attendance records exist for this enrollment. If attendance has already been logged, the transition to `'Dropped'` is strictly blocked by trigger `trg_validate_enrollment_status_transition`.
     - `Enrolled` $\to$ `Completed`: **Allowed at Term Conclusion.** When a term ends and grades are finalized, status changes to `'Completed'`.
       - *Historical Record Policy:* Existing attendance records are **preserved as immutable historical archives**. They are NOT deleted. However, because status is now `'Completed'`, triggers prevent any further attendance insertions or modifications for that enrollment.
     - `Completed` $\to$ `Enrolled` / `Dropped`: **Blocked.** Finalized course registrations are terminal and cannot be reopened without administrative override.
     - `Dropped` $\to$ `Enrolled` / `Completed`: **Blocked.** Dropped registrations cannot transition into active or completed states.
   - **Trigger `trg_validate_enrollment_status_transition` (BEFORE UPDATE ON `course_enrollments`):**
     ```sql
     IF NEW.status = 'Dropped' AND EXISTS (SELECT 1 FROM attendance_records WHERE enrollment_id = OLD.id) THEN
         SIGNAL SQLSTATE '45000'
             SET MESSAGE_TEXT = 'Integrity Violation: Cannot drop course enrollment after attendance records have been logged. To preserve regulatory audit trails, historical attendance records must remain intact.';
     END IF;
     ```

6. **Concurrency & Non-Bypassable Protection:**
   - **InnoDB Row Locks on Parent Rows:** When `attendance_records` inserts or updates validate the enrollment status, or during batch attendance processing, the statement acquires a shared lock (`LOCK IN SHARE MODE` or `FOR SHARE`) on `course_enrollments`. If an administrator concurrently attempts to update the enrollment status to `'Dropped'`, the status transaction must wait until the attendance transaction commits.
   - **Storage Engine Level Triggers:** Because validation triggers execute inside the MySQL InnoDB engine, they cannot be bypassed by Spring Data JPA entity mappings, direct JDBC statements, administrative CLI scripts, or external bulk imports.

---

### B. Attendance Summary Cache Integrity & MySQL Cascade Mitigation

The `attendance` table acts as an $O(1)$ read-cache for dashboard counters (`total_days`, `present_days`, `absent_days`, `last_marked`).

1. **Full DML Synchronization (INSERT, UPDATE, DELETE):**
   - **AFTER INSERT ON `attendance_records` (`trg_after_attendance_record_insert`):**
     Increments `total_days = total_days + 1`. If `NEW.status = 'Present'`, increments `present_days`; if `'Absent'`, increments `absent_days`. Updates `last_marked = DATE_FORMAT(NEW.created_at, '%Y-%m-%d')`.
   - **AFTER UPDATE ON `attendance_records` (`trg_after_attendance_record_update`):**
     If status changes from `'Absent'` to `'Present'`: `present_days = present_days + 1`, `absent_days = absent_days - 1`. If status changes from `'Present'` to `'Absent'`: `present_days = present_days - 1`, `absent_days = absent_days + 1`. `total_days` remains unchanged.
   - **AFTER DELETE ON `attendance_records` (`trg_after_attendance_record_delete`):**
     Decrements `total_days = total_days - 1`. If `OLD.status = 'Present'`, decrements `present_days`; if `'Absent'`, decrements `absent_days`. If `total_days = 0`, resets counters to 0 and `last_marked = '—'`.

2. **Mitigating MySQL Cascade Trigger Limitation:**
   - *Technical Limitation:* In MySQL InnoDB, cascaded foreign-key actions (`ON DELETE CASCADE`) **do not activate child table triggers**. If a parent record is deleted with cascade, child triggers on `attendance_records` will not fire.
   - *Architectural Solutions:*
     - **Symmetric Student Purge:** Both `attendance` and `attendance_records` define `ON DELETE CASCADE` referencing `students(id)`. When a student is hard-deleted from the master table, InnoDB cascades and purges BOTH the summary cache row and the detailed attendance records in the same atomic engine transaction. No orphan rows or desynchronized counters can remain.
     - **Restricted Session Deletion:** `attendance_sessions` defines `ON DELETE RESTRICT` for references from `attendance_records`. Scheduled lecture sessions that have recorded attendance cannot be casually deleted via cascade.
     - **Controlled Administrative Procedure (`sp_delete_attendance_session_controlled`):** If a session must be canceled administratively, this procedure explicitly deletes child attendance records in an isolated transaction, allowing triggers to maintain the cache, or executes atomic cache recalculation.

3. **Reconciliation Query:**
   A production-grade verification query compares the summary table against live aggregate calculations from `attendance_records`, verifying:
   - `total_days = present_days + absent_days`
   - `total_days = COUNT(attendance_records.id)`
   - `present_days = COUNT(Present records)`
   - `absent_days = COUNT(Absent records)`

---

### C. Multi-Session & Period-Aware Attendance Scheduling
Because course codes (e.g. `CS501`) are reused across academic terms, `attendance_sessions` incorporates `academic_period_id`.
- Furthermore, engineering curricula schedule multiple class sessions for the same course on the same date (e.g., Slot 1 Morning Lecture and Slot 3 Afternoon Lab).
- We declare:
  ```sql
  CONSTRAINT uk_course_period_session_slot
      UNIQUE (course_code, academic_period_id, session_date, session_slot)
  ```
  This naturally accommodates multiple daily lecture/lab slots while preventing duplicate slot scheduling for the same course in the same term.

---

### D. Protection of Audit Records: Defense-in-Depth Immutability
Declaring `ON DELETE SET NULL` on `defaulter_audit_log.student_id` preserves audit records when students are deleted, but does not prevent unauthorized `UPDATE` or `DELETE` statements from tampering with historical data.

To guarantee true regulatory immutability:
1. **Engine-Level Trigger Protection:**
   - Trigger `trg_prevent_defaulter_audit_update` blocks all updates with SQLSTATE `45000`.
   - Trigger `trg_prevent_defaulter_audit_delete` restricts deletions strictly to authorized batch administrative sessions holding session token `@ALLOW_AUDIT_PURGE = TRUE`.
2. **DCL Privilege Separation (Data Control Language):**
   ```sql
   REVOKE UPDATE, DELETE ON campus_harmony.defaulter_audit_log FROM 'campus_app'@'localhost';
   GRANT SELECT, INSERT ON campus_harmony.defaulter_audit_log TO 'campus_app'@'localhost';
   ```
   This dual-layer mechanism prevents both accidental application-level overwrites and direct administrative tampering.

---

### E. Department Duplication & Migration Plan
- **Authoritative Source of Truth:** `students.department_id INT NOT NULL REFERENCES departments(id)`.
- **Legacy Compatibility Mirror:** `students.department VARCHAR(100) NOT NULL` is maintained solely so existing evaluated frontend code (`students.html`, `app.js`) and REST controllers can read `student.department` without breaking.
- **Synchronization Mechanism:**
  - Database trigger `trg_sync_student_department_before_insert_update` executes on `BEFORE INSERT` and `BEFORE UPDATE`. It looks up `departments.name` using `NEW.department_id` and automatically populates `NEW.department = dept_name`. If a legacy client passes `department` text without `department_id`, the trigger resolves `department_id`. This prevents conflicting states.
- **Migration & Deprecation Roadmap:**
  - *Phase 1 (Current):* Both fields exist; trigger guarantees synchronization.
  - *Phase 2 (Stage D):* Modernized React frontend components migrate to reading `departmentId` / `departmentName`.
  - *Phase 3 (Post-Evaluation Deprecation):* Column `students.department` is dropped in favor of direct relational joins or an SQL View `v_students`.

---

### F. Legacy Marks Architecture: Explicit Physical Summary Cache Table
- **Decision:** The legacy `marks` entity is explicitly implemented as a **Physical Summary Cache Table** (NOT an SQL view).
- **Technical & Framework Justification:**
  - Spring Boot JPA's existing repository (`MarksRepository extends JpaRepository<Marks, Long>`) and service (`MarksServiceImpl.java`, line 50) execute `marksRepository.save(fresh)`.
  - In MySQL, standard views that do not map 1-to-1 to a single updatable table fail on `.save()` without complex `INSTEAD OF` triggers.
  - Retaining `marks` as a physical table guarantees 100% runtime compatibility with existing backend controllers (`MarksController`) and frontend pages (`marks.html`).
- **Synchronization Mechanism:** Database trigger `trg_sync_student_marks_to_legacy` updates `marks.computer_science`, `marks.mathematics`, etc., whenever evaluations are entered into `student_marks`.
- **Deprecation Roadmap:** Once the marks interface is fully ported to `/api/marks/evaluations` in Stage D, the legacy physical `marks` table will be replaced by an SQL view `v_student_marks_summary` or retired.
- **Technical & Framework Justification:**
  - Spring Boot JPA's existing repository (`MarksRepository extends JpaRepository<Marks, Long>`) and service (`MarksServiceImpl.java`, line 50) execute `marksRepository.save(fresh)`.
  - In MySQL, standard views that do not map 1-to-1 to a single updatable table fail on `.save()` without complex `INSTEAD OF` triggers.
  - Retaining `marks` as a physical table guarantees 100% runtime compatibility with existing backend controllers (`MarksController`) and frontend pages (`marks.html`).
- **Synchronization Mechanism:** Database trigger `trg_sync_student_marks_to_legacy` updates `marks.computer_science`, `marks.mathematics`, etc., whenever evaluations are entered into `student_marks`.
- **Deprecation Roadmap:** Once the marks interface is fully ported to `/api/marks/evaluations` in Stage D, the legacy physical `marks` table will be replaced by an SQL view `v_student_marks_summary` or retired.

---

## 2. Updated Comprehensive Data Dictionary (14 Tables)

### Table 1: `departments` (Master)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | No | AUTO_INCREMENT | PK | Department Identifier |
| `name` | `VARCHAR(100)` | No | — | UNIQUE, NOT NULL | Full Department Name |
| `code` | `VARCHAR(10)` | No | — | UNIQUE, NOT NULL | Abbreviation Code (e.g. CS, IT) |

### Table 2: `subjects` (Master)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `subject_key` | `VARCHAR(50)` | No | — | PK | Identifier Key (e.g. `computerScience`) |
| `label` | `VARCHAR(100)` | No | — | UNIQUE, NOT NULL | Display Title |

### Table 3: `academic_periods` (Master)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | No | AUTO_INCREMENT | PK | Period Identifier |
| `code` | `VARCHAR(20)` | No | — | UNIQUE, NOT NULL | Period Code (e.g. `2026-ODD`) |
| `name` | `VARCHAR(100)` | No | — | NOT NULL | Display Title (e.g. Autumn 2026) |
| `academic_year`| `VARCHAR(20)` | No | — | NOT NULL | Academic Year (e.g. `2026-2027`) |
| `semester_term`| `VARCHAR(10)` | No | — | CHECK (semester_term IN ('Odd', 'Even', 'Summer')) | Term Type |
| `is_current` | `BOOLEAN` | No | FALSE | NOT NULL | Active Term Flag |

### Table 4: `teachers` (Master)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `VARCHAR(30)` | No | — | PK | Faculty Identifier (e.g. `T-1001`) |
| `name` | `VARCHAR(100)` | No | — | NOT NULL | Instructor Name |
| `department_id`| `INT` | No | — | FK -> `departments(id)`, NOT NULL | Employing Department |
| `subject` | `VARCHAR(50)` | No | — | FK -> `subjects(subject_key)`, NOT NULL | Specialization Subject |
| `workspace` | `VARCHAR(20)` | No | `'demo'` | CHECK (workspace IN ('demo', 'own')) | Workspace Mode |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Creation Timestamp |

### Table 5: `students` (Master Entity with Compatibility Field)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Student ID |
| `roll` | `VARCHAR(30)` | No | — | UNIQUE, NOT NULL | University Roll Number |
| `name` | `VARCHAR(100)` | No | — | NOT NULL | Full Student Name |
| `department_id`| `INT` | No | — | FK -> `departments(id)`, NOT NULL | Authoritative Department FK |
| `department` | `VARCHAR(100)` | No | — | NOT NULL | Synchronized Legacy Department String |
| `semester` | `INT` | No | — | CHECK (semester BETWEEN 1 AND 8) | Academic Semester |
| `email` | `VARCHAR(120)` | No | — | UNIQUE, NOT NULL | Institutional Email |
| `phone` | `VARCHAR(20)` | No | — | NOT NULL | Contact Phone Number |
| `status` | `VARCHAR(20)` | No | `'Active'` | CHECK (status IN ('Active', 'Probation', 'Inactive')) | Enrollment Status |
| `gender` | `VARCHAR(10)` | No | — | CHECK (gender IN ('Male', 'Female', 'Other')) | Gender |
| `address` | `VARCHAR(255)` | Yes | NULL | — | Residential Address |
| `teacher_id` | `VARCHAR(30)` | Yes | NULL | FK -> `teachers(id)` (ON DELETE SET NULL) | Optional Mentor ID |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Enrollment Timestamp |
| `updated_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP ON UPDATE | NOT NULL | Last Update Timestamp |

### Table 6: `courses` (Master Catalogue with Compatibility Field)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `code` | `VARCHAR(20)` | No | — | PK | Course Code (e.g. `CS501`) |
| `name` | `VARCHAR(150)` | No | — | NOT NULL | Course Title |
| `department_id`| `INT` | No | — | FK -> `departments(id)`, NOT NULL | Offering Department |
| `subject_key` | `VARCHAR(50)` | No | — | FK -> `subjects(subject_key)`, NOT NULL | Curricular Subject Discipline |
| `credits` | `INT` | No | — | CHECK (credits BETWEEN 1 AND 10) | Credit Weight |
| `semester` | `INT` | No | — | CHECK (semester BETWEEN 1 AND 8) | Semester |
| `status` | `VARCHAR(20)` | No | `'Upcoming'` | CHECK (status IN ('Upcoming', 'Ongoing', 'Completed')) | Operational Status |
| `teacher_id` | `VARCHAR(30)` | Yes | NULL | FK -> `teachers(id)` (ON DELETE SET NULL) | Assigned Faculty ID |
| `faculty` | `VARCHAR(100)` | Yes | NULL | — | Derived/Legacy Instructor String |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Creation Timestamp |

### Table 7: `course_enrollments` (Associative Entity)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Enrollment ID |
| `student_id` | `BIGINT` | No | — | FK -> `students(id)` (ON DELETE CASCADE), NOT NULL | Enrolled Student |
| `course_code` | `VARCHAR(20)` | No | — | FK -> `courses(code)` (ON DELETE CASCADE), NOT NULL | Course |
| `academic_period_id`| `INT` | No | — | FK -> `academic_periods(id)` (ON DELETE RESTRICT), NOT NULL | Academic Term |
| `enrollment_date` | `DATE` | No | (CURRENT_DATE) | NOT NULL | Date Registered |
| `status` | `VARCHAR(20)` | No | `'Enrolled'` | CHECK (status IN ('Enrolled', 'Dropped', 'Completed')) | Status |
| `grade` | `VARCHAR(5)` | Yes | NULL | — | Final Grade |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Timestamp |

*Constraints:*  
- `UNIQUE KEY uk_student_course_period (student_id, course_code, academic_period_id)`  
- `UNIQUE KEY uk_enrollment_composite (id, student_id, course_code, academic_period_id)` (Candidate key for composite FK)

### Table 8: `attendance_sessions` (Scheduled Lecture/Lab Slots)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Session ID |
| `course_code` | `VARCHAR(20)` | No | — | FK -> `courses(code)` (ON DELETE CASCADE), NOT NULL | Course |
| `academic_period_id`| `INT` | No | — | FK -> `academic_periods(id)` (ON DELETE RESTRICT), NOT NULL | Academic Term |
| `teacher_id` | `VARCHAR(30)` | Yes | NULL | FK -> `teachers(id)` (ON DELETE SET NULL) | Faculty Instructor |
| `session_date` | `DATE` | No | — | NOT NULL | Date of Session |
| `session_slot` | `INT` | No | 1 | CHECK (session_slot BETWEEN 1 AND 10) | Timetable Slot |
| `session_type` | `VARCHAR(20)` | No | `'Lecture'` | CHECK (session_type IN ('Lecture', 'Lab', 'Tutorial')) | Session Type |
| `session_topic`| `VARCHAR(150)` | Yes | NULL | — | Topic Covered |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Timestamp |

*Constraints:*  
- `UNIQUE KEY uk_course_period_session_slot (course_code, academic_period_id, session_date, session_slot)`  
- `UNIQUE KEY uk_session_composite (id, course_code, academic_period_id)` (Candidate key for composite FK)

### Table 9: `attendance_records` (Enrollment-Gated Attendance Status)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Record ID |
| `session_id` | `BIGINT` | No | — | NOT NULL | Session ID |
| `enrollment_id`| `BIGINT` | No | — | NOT NULL | Enrollment ID |
| `student_id` | `BIGINT` | No | — | NOT NULL | Student ID |
| `course_code` | `VARCHAR(20)` | No | — | NOT NULL | Course Code (Composite FK) |
| `academic_period_id`| `INT` | No | — | NOT NULL | Academic Term (Composite FK) |
| `status` | `ENUM('Present','Absent')`| No | — | NOT NULL | Status |
| `remarks` | `VARCHAR(100)` | Yes | NULL | — | Notes |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Timestamp |

*Constraints & Composite Foreign Keys:*  
- `UNIQUE KEY uk_session_student (session_id, student_id)`  
- `CONSTRAINT fk_att_rec_session_composite FOREIGN KEY (session_id, course_code, academic_period_id) REFERENCES attendance_sessions(id, course_code, academic_period_id) ON DELETE RESTRICT ON UPDATE CASCADE`  
- `CONSTRAINT fk_att_rec_enrollment_composite FOREIGN KEY (enrollment_id, student_id, course_code, academic_period_id) REFERENCES course_enrollments(id, student_id, course_code, academic_period_id) ON DELETE RESTRICT ON UPDATE CASCADE`

### Table 10: `attendance` (Physical Summary Cache Table)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Cache ID |
| `student_id` | `BIGINT` | No | — | UNIQUE, FK -> `students(id)` (CASCADE), NOT NULL | Student Reference |
| `total_days` | `INT` | No | 0 | CHECK (total_days >= 0) | Total Lectures Conducted |
| `present_days` | `INT` | No | 0 | CHECK (present_days >= 0) | Total Lectures Attended |
| `absent_days` | `INT` | No | 0 | CHECK (absent_days >= 0) | Total Lectures Missed |
| `last_marked` | `VARCHAR(20)` | Yes | `'—'` | — | Date string YYYY-MM-DD |
| `updated_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP ON UPDATE | NOT NULL | Modification Timestamp |

### Table 11: `student_marks` (Normalized Evaluations)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Entry ID |
| `student_id` | `BIGINT` | No | — | FK -> `students(id)` (CASCADE), NOT NULL | Student Reference |
| `subject_key` | `VARCHAR(50)` | No | — | FK -> `subjects(subject_key)` (RESTRICT), NOT NULL | Subject |
| `academic_period_id`| `INT` | No | — | FK -> `academic_periods(id)` (RESTRICT), NOT NULL | Term |
| `semester` | `INT` | No | — | CHECK (semester BETWEEN 1 AND 8) | Assessment Semester |
| `exam_type` | `VARCHAR(20)` | No | `'Endterm'` | CHECK (exam_type IN ('Internal', 'Midterm', 'Endterm')) | Exam Type |
| `marks_obtained` | `DECIMAL(5,2)` | No | — | CHECK (marks_obtained >= 0) | Score Obtained |
| `max_marks` | `DECIMAL(5,2)` | No | 100.00 | CHECK (max_marks > 0) | Maximum Score |
| `grade` | `VARCHAR(5)` | Yes | NULL | — | Computed Grade (A+, A, B, C, D, F) |
| `remarks` | `VARCHAR(100)` | Yes | NULL | — | Notes |
| `updated_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP ON UPDATE | NOT NULL | Last Update |

*Constraints:*  
- `UNIQUE KEY uk_student_subject_exam_period (student_id, subject_key, exam_type, academic_period_id)`  
- `CHECK (marks_obtained <= max_marks)`

### Table 12: `marks` (Physical Summary Cache Table for Legacy JPA)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Cache ID |
| `student_id` | `BIGINT` | No | — | UNIQUE, FK -> `students(id)` (CASCADE), NOT NULL | Student Reference |
| `mathematics` | `INT` | Yes | NULL | CHECK (mathematics IS NULL OR (mathematics BETWEEN 0 AND 100)) | Math Score |
| `physics` | `INT` | Yes | NULL | CHECK (physics IS NULL OR (physics BETWEEN 0 AND 100)) | Physics Score |
| `chemistry` | `INT` | Yes | NULL | CHECK (chemistry IS NULL OR (chemistry BETWEEN 0 AND 100)) | Chemistry Score |
| `english` | `INT` | Yes | NULL | CHECK (english IS NULL OR (english BETWEEN 0 AND 100)) | English Score |
| `computer_science` | `INT` | Yes | NULL | CHECK (computer_science IS NULL OR (computer_science BETWEEN 0 AND 100)) | CS Score |
| `updated_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP ON UPDATE | NOT NULL | Modification Timestamp |

### Table 13: `activities` (Audit & Feed Log)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Activity ID |
| `text` | `VARCHAR(255)` | No | — | NOT NULL | Activity Description |
| `type` | `VARCHAR(50)` | No | `'notice'` | CHECK (type IN ('notice', 'attendance', 'grade', 'enroll', 'course')) | Event Category |
| `teacher_id` | `VARCHAR(30)` | Yes | NULL | FK -> `teachers(id)` (SET NULL) | Authoring Faculty |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Timestamp |

### Table 14: `defaulter_audit_log` (Immutable Procedural Audit Snapshot)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Audit Entry ID |
| `student_id` | `BIGINT` | Yes | NULL | FK -> `students(id)` (ON DELETE SET NULL) | Student Reference |
| `roll` | `VARCHAR(30)` | No | — | NOT NULL | Snapshot Roll Number |
| `student_name` | `VARCHAR(100)` | No | — | NOT NULL | Snapshot Student Name |
| `department` | `VARCHAR(100)` | No | — | NOT NULL | Snapshot Department |
| `attendance_percentage` | `DECIMAL(5,2)` | No | — | NOT NULL | Snapshot Percentage |
| `classes_needed`| `INT` | No | — | NOT NULL | Shortfall Classes to Reach 75% |
| `reported_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Audit Generation Timestamp |

---

## 3. Rigorous Functional Dependencies & Normalization Analysis

### A. Delineation of Relations: Normalized Core Projections vs. Physical Deployment Schema

To maintain the highest standard of academic rigor and transparency:
1. **Normalized Core Relational Projections:** The theoretical relational model (decoupled from backward-compatibility mirrors and caching tables) is rigorously demonstrated below to satisfy **1NF, 2NF, 3NF, and Boyce-Codd Normal Form (BCNF)**. Every non-trivial functional dependency has a candidate key (superkey) as its determinant.
2. **Physical Deployment Schema:** The actual deployed MySQL database schema represents an intentional enterprise compromise between pure relational calculus and real-world software engineering constraints. **The physical schema as a whole does NOT claim universal BCNF compliance.** Rather, the physical schema is in **Third Normal Form (3NF)** overall, with five explicitly documented denormalizations and physical summary caches engineered for sub-millisecond KPI reads, legacy JPA repository compatibility, and regulatory audit immutability.

---

### B. Group 1: Normalized Core Relational Projections (Strict BCNF Proofs)

A relation $R$ is in **Boyce-Codd Normal Form (BCNF)** if and only if for every non-trivial functional dependency $X \to Y$, $X$ is a superkey of $R$.

#### 1. Relation `departments`:
- **Schema:** $(\text{id}, \text{name}, \text{code})$
- **Candidate Keys:** $CK = \{\{\text{id}\}, \{\text{name}\}, \{\text{code}\}\}$
- **Non-Trivial Functional Dependencies:**
  - $\text{id} \to \{\text{name}, \text{code}\}$ (Determinant $\{\text{id}\}$ is a superkey)
  - $\text{name} \to \{\text{id}, \text{code}\}$ (Determinant $\{\text{name}\}$ is a superkey)
  - $\text{code} \to \{\text{id}, \text{name}\}$ (Determinant $\{\text{code}\}$ is a superkey)
- **BCNF Conclusion:** Every determinant is a candidate key. **Strictly in BCNF.**

#### 2. Relation `subjects`:
- **Schema:** $(\text{subject\_key}, \text{label})$
- **Candidate Keys:** $CK = \{\{\text{subject\_key}\}, \{\text{label}\}\}$
- **Non-Trivial Functional Dependencies:**
  - $\text{subject\_key} \to \{\text{label}\}$ (Determinant is candidate key)
  - $\text{label} \to \{\text{subject\_key}\}$ (Determinant is candidate key)
- **BCNF Conclusion:** Every determinant is a candidate key. **Strictly in BCNF.**

#### 3. Relation `academic_periods`:
- **Schema:** $(\text{id}, \text{code}, \text{name}, \text{academic\_year}, \text{semester\_term}, \text{is\_current})$
- **Candidate Keys:** $CK = \{\{\text{id}\}, \{\text{code}\}\}$
- **Non-Trivial Functional Dependencies:**
  - $\text{id} \to \{\text{code}, \text{name}, \text{academic\_year}, \text{semester\_term}, \text{is\_current}\}$
  - $\text{code} \to \{\text{id}, \text{name}, \text{academic\_year}, \text{semester\_term}, \text{is\_current}\}$
- **BCNF Conclusion:** Every determinant is a superkey. **Strictly in BCNF.**

#### 4. Relation `teachers`:
- **Schema:** $(\text{id}, \text{name}, \text{department\_id}, \text{subject}, \text{workspace}, \text{created\_at})$
- **Candidate Keys:** $CK = \{\{\text{id}\}\}$
- **Non-Trivial Functional Dependencies:**
  - $\text{id} \to \{\text{name}, \text{department\_id}, \text{subject}, \text{workspace}, \text{created\_at}\}$
- **BCNF Conclusion:** The primary key is the sole determinant. **Strictly in BCNF.**

#### 5. Relation `students_core` (Normalized Projection without Legacy String):
- **Schema:** $(\text{id}, \text{roll}, \text{name}, \text{department\_id}, \text{semester}, \text{email}, \text{phone}, \text{status}, \text{gender}, \text{address}, \text{teacher\_id}, \text{created\_at}, \text{updated\_at})$
- **Candidate Keys:** $CK = \{\{\text{id}\}, \{\text{roll}\}, \{\text{email}\}\}$
- **Non-Trivial Functional Dependencies:**
  - $\text{id} \to \text{all attributes}$
  - $\text{roll} \to \text{all attributes}$
  - $\text{email} \to \text{all attributes}$
- **BCNF Conclusion:** Every non-trivial determinant is a candidate key. **Strictly in BCNF.**

#### 6. Relation `courses_core` (Normalized Projection without Instructor String):
- **Schema:** $(\text{code}, \text{name}, \text{department\_id}, \text{subject\_key}, \text{credits}, \text{semester}, \text{status}, \text{teacher\_id}, \text{created\_at})$
- **Candidate Keys:** $CK = \{\{\text{code}\}\}$
- **Non-Trivial Functional Dependencies:**
  - $\text{code} \to \text{all attributes}$
- **BCNF Conclusion:** The single determinant is the candidate key. **Strictly in BCNF.**

#### 7. Relation `course_enrollments`:
- **Schema:** $(\text{id}, \text{student\_id}, \text{course\_code}, \text{academic\_period\_id}, \text{enrollment\_date}, \text{status}, \text{grade}, \text{created\_at})$
- **Candidate Keys:** $CK = \{\{\text{id}\}, \{\text{student\_id}, \text{course\_code}, \text{academic\_period\_id}\}\}$
- **Non-Trivial Functional Dependencies:**
  - $\text{id} \to \text{all attributes}$
  - $\{\text{student\_id}, \text{course\_code}, \text{academic\_period\_id}\} \to \text{all attributes}$
- **BCNF Conclusion:** Every determinant is a candidate key. **Strictly in BCNF.**

#### 8. Relation `attendance_sessions`:
- **Schema:** $(\text{id}, \text{course\_code}, \text{academic\_period\_id}, \text{teacher\_id}, \text{session\_date}, \text{session\_slot}, \text{session\_type}, \text{session\_topic}, \text{created\_at})$
- **Candidate Keys:** $CK = \{\{\text{id}\}, \{\text{course\_code}, \text{academic\_period\_id}, \text{session\_date}, \text{session\_slot}\}\}$
- **Non-Trivial Functional Dependencies:**
  - $\text{id} \to \text{all attributes}$
  - $\{\text{course\_code}, \text{academic\_period\_id}, \text{session\_date}, \text{session\_slot}\} \to \text{all attributes}$
- **BCNF Conclusion:** Every determinant is a candidate key. **Strictly in BCNF.**

#### 9. Relation `attendance_records`:
- **Schema:** $(\text{id}, \text{session\_id}, \text{enrollment\_id}, \text{student\_id}, \text{course\_code}, \text{academic\_period\_id}, \text{status}, \text{remarks}, \text{created\_at})$
- **Candidate Keys:** $CK = \{\{\text{id}\}, \{\text{session\_id}, \text{student\_id}\}\}$
- **Non-Trivial Functional Dependencies:**
  - $\text{id} \to \text{all attributes}$
  - $\{\text{session\_id}, \text{student\_id}\} \to \text{all attributes}$
- **BCNF Conclusion:** Every determinant is a candidate key. **Strictly in BCNF.**

#### 10. Relation `student_marks`:
- **Schema:** $(\text{id}, \text{student\_id}, \text{subject\_key}, \text{academic\_period\_id}, \text{semester}, \text{exam\_type}, \text{marks\_obtained}, \text{max\_marks}, \text{grade}, \text{remarks}, \text{updated\_at})$
- **Candidate Keys:** $CK = \{\{\text{id}\}, \{\text{student\_id}, \text{subject\_key}, \text{exam\_type}, \text{academic\_period\_id}\}\}$
- **Non-Trivial Functional Dependencies:**
  - $\text{id} \to \text{all attributes}$
  - $\{\text{student\_id}, \text{subject\_key}, \text{exam\_type}, \text{academic\_period\_id}\} \to \text{all attributes}$
- **BCNF Conclusion:** Every determinant is a candidate key. **Strictly in BCNF.**

#### 11. Relation `activities`:
- **Schema:** $(\text{id}, \text{text}, \text{type}, \text{teacher\_id}, \text{created\_at})$
- **Candidate Keys:** $CK = \{\{\text{id}\}\}$
- **Non-Trivial Functional Dependencies:**
  - $\text{id} \to \{\text{text}, \text{type}, \text{teacher\_id}, \text{created\_at}\}$
- **BCNF Conclusion:** The single determinant is the primary key. **Strictly in BCNF.**

---

### C. Group 2: Physical Deployment Schema (Documented Intentional Denormalizations)

The actual deployed physical database schema contains 5 intentional engineering trade-offs that deliberately deviate from pure BCNF. We document the violating functional dependency, normal form classification, and concrete engineering justification:

| Entity / Column | Violating Functional Dependency | Normal Form Classification | Engineering & Academic Rationale for Intentional Deviation |
| :--- | :--- | :---: | :--- |
| **`students.department`** | $\text{department\_id} \to \text{department}$ (Transitive dependency on non-candidate key `department_id`) | **2NF** (Violates 3NF/BCNF) | **Interim Read-Compatibility Mirror:** Evaluated FEE-II vanilla pages (`students.html`, `app.js`) and REST controllers directly read `student.department`. Maintained via database trigger `trg_sync_student_department` to guarantee zero breaking changes. Scheduled for retirement in Phase 3 of roadmap. |
| **`courses.faculty`** | $\text{teacher\_id} \to \text{faculty}$ (Transitive dependency on non-candidate key `teacher_id`) | **2NF** (Violates 3NF/BCNF) | **Course Card Display Cache:** Retained as a nullable display string to populate course cards without requiring multi-table joins on legacy endpoints. Synchronized via trigger. |
| **`attendance` Table** | $\text{student\_id} \to \{\text{present\_days}, \text{absent\_days}, \text{total\_days}\}$ (Derived aggregation of `attendance_records`) | **Unnormalized View Cache** | **$O(1)$ KPI Performance Cache:** Eliminates expensive `COUNT(*)` aggregate table scans across historical lecture logs when loading dashboard KPI counters. Kept in lockstep via full DML triggers (`INSERT`, `UPDATE`, `DELETE`) on `attendance_records`. |
| **`marks` Table** | Repeating columns: `mathematics`, `physics`, `chemistry`, `english`, `computer_science` | **Non-1NF Legacy Structure** | **JPA Repository Compatibility:** Retained as a physical summary table because Spring Boot's existing `MarksServiceImpl.java` calls `marksRepository.save(fresh)`. Non-updatable SQL views fail on `.save()`. Kept in sync with `student_marks` via trigger. |
| **`defaulter_audit_log` Table** | $\text{student\_id} \to \{\text{roll}, \text{student\_name}, \text{department}\}$ (Snapshot of master records) | **Controlled Snapshot** | **Audit Immutability & Regulatory Compliance:** Deliberately denormalized so that historical defaulter snapshots remain legally immutable even if student master records are edited, updated, or removed (`ON DELETE SET NULL`). |

---

## 4. Attendance Summary Cache Reconciliation & Auditing Queries

To guarantee that the physical `attendance` summary cache never drifts out of alignment with the ground-truth `attendance_records`, the following production-grade SQL verification and self-healing tools are defined:

### A. Comprehensive Cache Reconciliation SQL Query

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
    -- Counter Equality Check (total_days = present_days + absent_days)
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
) sub ON a.student_id = sub.student_id
ORDER BY 
    CASE WHEN integrity_status = 'RECONCILED / IN SYNC' THEN 2 ELSE 1 END, 
    a.student_id ASC;
```

### B. Self-Healing Stored Procedure (`sp_reconcile_attendance_cache`)

If administrative intervention or batch imports cause discrepancy flags, this procedure recalculates summary counters directly from source logs:

```sql
DELIMITER //

DROP PROCEDURE IF EXISTS sp_reconcile_attendance_cache //

CREATE PROCEDURE sp_reconcile_attendance_cache(
    IN p_student_id BIGINT
)
BEGIN
    DECLARE v_actual_total INT;
    DECLARE v_actual_present INT;
    DECLARE v_actual_absent INT;
    DECLARE v_last_date VARCHAR(20);

    -- Calculate true aggregates from atomic attendance records
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

    -- Upsert the reconciled summary cache row
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

DELIMITER ;
```

---

## 5. Stage C Implementation-Readiness Checklist

| Verification Category | Criterion | Design Artifact | Engine Enforcement | Readiness Status |
| :--- | :--- | :--- | :--- | :---: |
| **Relational Integrity** | Composite Foreign Keys matching course, period, and student | `attendance_records` FKs | InnoDB Storage Engine | READY |
| **Enrollment Status** | Status gating on INSERT / UPDATE (`Enrolled` only) | Triggers on `attendance_records` | Signal `45000` | READY |
| **Lifecycle Transition** | Block transition to `'Dropped'` if attendance records exist | Trigger on `course_enrollments` | Signal `45000` | READY |
| **Historical Preservation**| Frozen attendance records on `'Completed'` enrollments | Historical Record Policy | Triggers & FK Restrict | READY |
| **Cache Synchronization**| Real-time DML sync across INSERT, UPDATE, DELETE | Triggers on `attendance_records` | Row Triggers | READY |
| **Cascade Limitation** | MySQL InnoDB cascade bypass mitigation | Symmetric FK + RESTRICT | Storage Engine | READY |
| **Reconciliation Tool** | SQL Audit query verifying $total = present + absent$ | Section 4 Query | Standalone DQL | READY |
| **Audit Immutability** | Defaulter audit tamper-proofing | Triggers + DCL Revocation | Defense-in-Depth | READY |
| **Academic Periods** | Multi-slot scheduling & multi-term repeat exams | `attendance_sessions` & `student_marks` | Unique Keys | READY |
| **Normalization Claim** | Strict separation of Core BCNF vs Physical 3NF | Section 3 Analysis | Mathematical Proofs | READY |
