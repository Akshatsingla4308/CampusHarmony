# CAMPUS HARMONY — RELATIONAL DATABASE DESIGN & NORMALIZATION ANALYSIS (FINAL PHASE 2 - REVISED)

**Course:** Database Management Systems (24CSE0209)  
**Evaluation:** Project-Based Evaluation (50 Marks)  
**Database Engine:** MySQL Server 8.0+ (InnoDB Storage Engine)  
**Revision:** Version 4.0 (Final Technical Corrections)  

---

## 1. Relational Mapping & Technical Integrity Strategies

### A. Genuine Attendance Enrollment Integrity (Composite Foreign Keys)
In institutional database architectures, declaring independent foreign keys (`session_id -> sessions`, `enrollment_id -> enrollments`, `student_id -> students`) does **not** guarantee referential coherence. An unconstrained record could reference a session for `CS501` in Period 1, but link an enrollment for `EC701` in Period 2 belonging to an entirely different student!

To mathematically guarantee relational integrity across sessions, enrollments, and attendance:
1. In `course_enrollments`, candidate key `uk_enrollment_composite (id, student_id, course_code, academic_period_id)` is declared.
2. In `attendance_sessions`, candidate key `uk_session_composite (id, course_code, academic_period_id)` is declared.
3. In `attendance_records`, composite foreign keys link the child record to both parent tables simultaneously:
   ```sql
   CONSTRAINT fk_att_rec_session_composite
       FOREIGN KEY (session_id, course_code, academic_period_id)
       REFERENCES attendance_sessions(id, course_code, academic_period_id)
       ON DELETE CASCADE ON UPDATE CASCADE,

   CONSTRAINT fk_att_rec_enrollment_composite
       FOREIGN KEY (enrollment_id, student_id, course_code, academic_period_id)
       REFERENCES course_enrollments(id, student_id, course_code, academic_period_id)
       ON DELETE CASCADE ON UPDATE CASCADE
   ```
4. **Relational Guarantees Enforced at Storage Engine Level:**
   - The attendance session is mathematically guaranteed to belong to the exact same course (`course_code`) as the enrollment.
   - The attendance session and the enrollment are mathematically guaranteed to belong to the exact same academic period (`academic_period_id`).
   - The student in the attendance record is mathematically guaranteed to be the exact student registered under that enrollment (`student_id`).
5. **Enrollment Status Gating (Active Registration Only):**
   - Database trigger `trg_validate_attendance_enrollment_status` fires on `BEFORE INSERT` and `BEFORE UPDATE` on `attendance_records`. It inspects `course_enrollments.status` and raises SQLSTATE `45000` if the student's enrollment status is `'Dropped'` or `'Completed'`.

---

### B. Multi-Session & Period-Aware Attendance Scheduling
Because course codes (e.g. `CS501`) are reused across academic terms, `attendance_sessions` incorporates `academic_period_id`.
- Furthermore, engineering curricula schedule multiple class sessions for the same course on the same date (e.g., Slot 1 Morning Lecture and Slot 3 Afternoon Lab).
- We declare:
  ```sql
  CONSTRAINT uk_course_period_session_slot
      UNIQUE (course_code, academic_period_id, session_date, session_slot)
  ```
  This naturally accommodates multiple daily lecture/lab slots while preventing duplicate slot scheduling for the same course in the same term.

---

### C. Protection of Audit Records: Defense-in-Depth Immutability
Declaring `ON DELETE SET NULL` on `defaulter_audit_log.student_id` preserves audit records when students are deleted, but does not prevent unauthorized `UPDATE` or `DELETE` statements from tampering with historical data.

To guarantee true regulatory immutability:
1. **Engine-Level Trigger Protection:**
   - Trigger `trg_prevent_defaulter_audit_update`:
     ```sql
     CREATE TRIGGER trg_prevent_defaulter_audit_update
     BEFORE UPDATE ON defaulter_audit_log
     FOR EACH ROW
     BEGIN
         SIGNAL SQLSTATE '45000'
             SET MESSAGE_TEXT = 'Security Violation: Defaulter audit snapshots are legally immutable and cannot be updated.';
     END;
     ```
   - Trigger `trg_prevent_defaulter_audit_delete`:
     ```sql
     CREATE TRIGGER trg_prevent_defaulter_audit_delete
     BEFORE DELETE ON defaulter_audit_log
     FOR EACH ROW
     BEGIN
         IF @ALLOW_AUDIT_PURGE IS NULL OR @ALLOW_AUDIT_PURGE != TRUE THEN
             SIGNAL SQLSTATE '45000'
                 SET MESSAGE_TEXT = 'Security Violation: Direct deletion of defaulter audit records is prohibited.';
         END IF;
     END;
     ```
2. **DCL Privilege Separation (Data Control Language):**
   ```sql
   REVOKE UPDATE, DELETE ON campus_harmony.defaulter_audit_log FROM 'campus_app'@'localhost';
   GRANT SELECT, INSERT ON campus_harmony.defaulter_audit_log TO 'campus_app'@'localhost';
   ```
   This dual-layer mechanism prevents both accidental application-level overwrites and direct administrative tampering.

---

### D. Department Duplication & Migration Plan
- **Authoritative Source of Truth:** `students.department_id INT NOT NULL REFERENCES departments(id)`.
- **Legacy Compatibility Mirror:** `students.department VARCHAR(100) NOT NULL` is maintained solely so existing evaluated frontend code (`students.html`, `app.js`) and REST controllers can read `student.department` without breaking.
- **Synchronization Mechanism:**
  - Database trigger `trg_sync_student_department_before_insert_update` executes on `BEFORE INSERT` and `BEFORE UPDATE`. It looks up `departments.name` using `NEW.department_id` and automatically populates `NEW.department = dept_name`. If a legacy client passes `department` text without `department_id`, the trigger resolves `department_id`. This prevents conflicting states.
- **Migration & Deprecation Roadmap:**
  - *Phase 1 (Current):* Both fields exist; trigger guarantees synchronization.
  - *Phase 2 (Stage D):* Modernized React frontend components migrate to reading `departmentId` / `departmentName`.
  - *Phase 3 (Post-Evaluation Deprecation):* Column `students.department` is dropped in favor of direct relational joins or an SQL View `v_students`.

---

### E. Legacy Marks Architecture: Explicit Physical Summary Cache Table
- **Decision:** The legacy `marks` entity is explicitly implemented as a **Physical Summary Cache Table** (NOT an SQL view).
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
- `CONSTRAINT fk_att_rec_session_composite FOREIGN KEY (session_id, course_code, academic_period_id) REFERENCES attendance_sessions(id, course_code, academic_period_id) ON DELETE CASCADE ON UPDATE CASCADE`  
- `CONSTRAINT fk_att_rec_enrollment_composite FOREIGN KEY (enrollment_id, student_id, course_code, academic_period_id) REFERENCES course_enrollments(id, student_id, course_code, academic_period_id) ON DELETE CASCADE ON UPDATE CASCADE`

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

### A. Delineation of Relations: Core BCNF vs. Intentional Denormalizations

To maintain strict academic integrity, the database design distinguishes between:
1. **Core Relational Models:** Designed to satisfy 1NF, 2NF, 3NF, and BCNF without functional redundancy.
2. **Intentional Denormalizations & Caching Layers:** Explicit engineering trade-offs introduced for API backward compatibility, high-performance UI reads, and regulatory audit immutability.

---

### B. Group 1: Core Relational Models (Demonstrated BCNF Compliance)

#### 1. Relation `departments`:
- Schema: $(\text{id}, \text{name}, \text{code})$
- Candidate Keys $CK = \{\{\text{id}\}, \{\text{name}\}, \{\text{code}\}\}$
- Non-Trivial FDs: $\text{id} \to \{\text{name}, \text{code}\}, \quad \text{name} \to \{\text{id}, \text{code}\}, \quad \text{code} \to \{\text{id}, \text{name}\}$
- **BCNF Analysis:** Every determinant is a candidate key. **Strictly in BCNF.**

#### 2. Relation `subjects`:
- Schema: $(\text{subject\_key}, \text{label})$
- Candidate Keys $CK = \{\{\text{subject\_key}\}, \{\text{label}\}\}$
- Non-Trivial FDs: $\text{subject\_key} \to \{\text{label}\}, \quad \text{label} \to \{\text{subject\_key}\}$
- **BCNF Analysis:** Every determinant is a candidate key. **Strictly in BCNF.**

#### 3. Relation `academic_periods`:
- Schema: $(\text{id}, \text{code}, \text{name}, \text{academic\_year}, \text{semester\_term}, \text{is\_current})$
- Candidate Keys $CK = \{\{\text{id}\}, \{\text{code}\}\}$
- Non-Trivial FDs: $\text{id} \to \{\text{code}, \text{name}, \text{academic\_year}, \text{semester\_term}, \text{is\_current}\}, \quad \text{code} \to \text{all}$
- **BCNF Analysis:** Every determinant is a candidate key. **Strictly in BCNF.**

#### 4. Relation `teachers`:
- Schema: $(\text{id}, \text{name}, \text{department\_id}, \text{subject}, \text{workspace}, \text{created\_at})$
- Candidate Keys $CK = \{\{\text{id}\}\}$
- Non-Trivial FDs: $\text{id} \to \{\text{name}, \text{department\_id}, \text{subject}, \text{workspace}, \text{created\_at}\}$
- **BCNF Analysis:** The single determinant is the primary key. **Strictly in BCNF.**

#### 5. Relation `students_core` (Without Compatibility String):
- Schema: $(\text{id}, \text{roll}, \text{name}, \text{department\_id}, \text{semester}, \text{email}, \text{phone}, \text{status}, \text{gender}, \text{address}, \text{teacher\_id}, \text{created\_at}, \text{updated\_at})$
- Candidate Keys $CK = \{\{\text{id}\}, \{\text{roll}\}, \{\text{email}\}\}$
- Non-Trivial FDs: $\text{id} \to \text{all attributes}, \quad \text{roll} \to \text{all attributes}, \quad \text{email} \to \text{all attributes}$
- **BCNF Analysis:** Every determinant is a candidate key (superkey). **Strictly in BCNF.**

#### 6. Relation `courses_core` (Without Compatibility String):
- Schema: $(\text{code}, \text{name}, \text{department\_id}, \text{subject\_key}, \text{credits}, \text{semester}, \text{status}, \text{teacher\_id}, \text{created\_at})$
- Candidate Keys $CK = \{\{\text{code}\}\}$
- Non-Trivial FDs: $\text{code} \to \text{all attributes}$
- **BCNF Analysis:** The single determinant is the primary key. **Strictly in BCNF.**

#### 7. Relation `course_enrollments`:
- Schema: $(\text{id}, \text{student\_id}, \text{course\_code}, \text{academic\_period\_id}, \text{enrollment\_date}, \text{status}, \text{grade}, \text{created\_at})$
- Candidate Keys $CK = \{\{\text{id}\}, \{\text{student\_id}, \text{course\_code}, \text{academic\_period\_id}\}\}$
- Non-Trivial FDs:  
  $\text{id} \to \text{all attributes}, \quad \{\text{student\_id}, \text{course\_code}, \text{academic\_period\_id}\} \to \text{all attributes}$
- **BCNF Analysis:** Every determinant is a candidate key. **Strictly in BCNF.**

#### 8. Relation `attendance_sessions`:
- Schema: $(\text{id}, \text{course\_code}, \text{academic\_period\_id}, \text{teacher\_id}, \text{session\_date}, \text{session\_slot}, \text{session\_type}, \text{session\_topic}, \text{created\_at})$
- Candidate Keys $CK = \{\{\text{id}\}, \{\text{course\_code}, \text{academic\_period\_id}, \text{session\_date}, \text{session\_slot}\}\}$
- Non-Trivial FDs:  
  $\text{id} \to \text{all attributes}, \quad \{\text{course\_code}, \text{academic\_period\_id}, \text{session\_date}, \text{session\_slot}\} \to \text{all attributes}$
- **BCNF Analysis:** Every determinant is a candidate key. **Strictly in BCNF.**

#### 9. Relation `attendance_records`:
- Schema: $(\text{id}, \text{session\_id}, \text{enrollment\_id}, \text{student\_id}, \text{course\_code}, \text{academic\_period\_id}, \text{status}, \text{remarks}, \text{created\_at})$
- Candidate Keys $CK = \{\{\text{id}\}, \{\text{session\_id}, \text{student\_id}\}\}$
- Non-Trivial FDs:  
  $\text{id} \to \text{all attributes}, \quad \{\text{session\_id}, \text{student\_id}\} \to \text{all attributes}$
- **BCNF Analysis:** Every determinant is a candidate key. **Strictly in BCNF.**

#### 10. Relation `student_marks`:
- Schema: $(\text{id}, \text{student\_id}, \text{subject\_key}, \text{academic\_period\_id}, \text{semester}, \text{exam\_type}, \text{marks\_obtained}, \text{max\_marks}, \text{grade}, \text{remarks}, \text{updated\_at})$
- Candidate Keys $CK = \{\{\text{id}\}, \{\text{student\_id}, \text{subject\_key}, \text{exam\_type}, \text{academic\_period\_id}\}\}$
- Non-Trivial FDs:  
  $\text{id} \to \text{all attributes}, \quad \{\text{student\_id}, \text{subject\_key}, \text{exam\_type}, \text{academic\_period\_id}\} \to \text{all attributes}$
- **BCNF Analysis:** Every determinant is a candidate key. **Strictly in BCNF.**

---

### C. Group 2: Intentional Denormalizations & Pragmatic Compatibility Caches

The following 5 constructs intentionally deviate from pure BCNF. We document the exact functional dependencies that cause the deviation and provide the concrete academic and software engineering rationale:

| Entity / Column | Violating Functional Dependency | Normal Form Level | Engineering & Academic Rationale for Intentional Deviation |
| :--- | :--- | :---: | :--- |
| **`students.department`** | $\text{department\_id} \to \text{department}$ (Transitive dependency on non-candidate key `department_id`) | **2NF** (Violates 3NF/BCNF) | **Interim Read-Compatibility Mirror:** Evaluated FEE-II vanilla pages (`students.html`, `app.js`) and REST controllers directly read `student.department`. Maintained via database trigger `trg_sync_student_department` to guarantee zero breaking changes. Scheduled for retirement in Phase 3 of roadmap. |
| **`courses.faculty`** | $\text{teacher\_id} \to \text{faculty}$ (Transitive dependency on non-candidate key `teacher_id`) | **2NF** (Violates 3NF/BCNF) | **Course Card Display Cache:** Retained as a nullable display string to populate course cards without requiring multi-table joins on legacy endpoints. |
| **`attendance` Table** | $\text{student\_id} \to \{\text{present\_days}, \text{absent\_days}, \text{total\_days}\}$ (Derived aggregation of `attendance_records`) | **Unnormalized View Cache** | **$O(1)$ KPI Performance Cache:** Eliminates expensive `COUNT(*)` aggregate table scans across historical lecture logs when loading dashboard KPI counters. Kept in lockstep via `AFTER INSERT ON attendance_records` trigger. |
| **`marks` Table** | Repeating columns: `mathematics`, `physics`, `chemistry`, `english`, `computer_science` | **Non-1NF Legacy Structure** | **JPA Repository Compatibility:** Retained as a physical summary table because Spring Boot's existing `MarksServiceImpl.java` calls `marksRepository.save(fresh)`. Non-updatable SQL views fail on `.save()`. Kept in sync with `student_marks` via trigger. |
| **`defaulter_audit_log` Table** | $\text{student\_id} \to \{\text{roll}, \text{student\_name}, \text{department}\}$ (Snapshot of master records) | **Controlled Snapshot** | **Audit Immutability & Regulatory Compliance:** Deliberately denormalized so that historical defaulter snapshots remain legally immutable even if student master records are edited, updated, or removed (`ON DELETE SET NULL`). |
