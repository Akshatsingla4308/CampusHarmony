# CAMPUS HARMONY — RELATIONAL DATABASE DESIGN & NORMALIZATION ANALYSIS (FINAL PHASE 2)

**Course:** Database Management Systems (24CSE0209)  
**Evaluation:** Project-Based Evaluation (50 Marks)  
**Database Engine:** MySQL Server 8.0+ (InnoDB Storage Engine)  
**Revision:** Version 3.0 (Final Comprehensive Revision)  

---

## 1. Relational Mapping & Architectural Decisions

### A. Academic Period & Repeat Examination Support
In university curricula, students may take examinations in the same subject across different semesters or academic years (e.g. improvement exams, backlogs, or repeated course registrations).
- To support repeated examinations while strictly preventing duplicate score entry within the same academic term, we introduce `academic_periods` (`id`, `code`, `name`, `academic_year`, `semester_term`, `is_current`).
- `student_marks` references `academic_period_id` and enforces candidate key:
  `UNIQUE KEY uk_student_subject_exam_period (student_id, subject_key, exam_type, academic_period_id)`.

### B. Attendance & Course Enrollment Integrity
In an institutional ERP, attendance can only be logged for a student who is actively enrolled in that course. Furthermore, universities schedule multiple lecture/lab sessions for the same course on the same date (e.g., Slot 1 Theory Lecture at 09:00 AM and Slot 3 Practical Lab at 02:00 PM).
- We introduce `attendance_sessions` representing the conducted lecture slot (`course_code`, `session_date`, `session_slot`, `session_type`, `teacher_id`).
  - Constraint: `UNIQUE KEY uk_course_session_slot (course_code, session_date, session_slot)`.
- Individual student attendance is stored in `attendance_records`, which holds foreign keys to both `attendance_sessions(id)`, `students(id)`, and `course_enrollments(id)`.
  - Constraint: `UNIQUE KEY uk_session_student (session_id, student_id)` ensures exactly one status per student per session.
  - Foreign key linkage to `course_enrollments(id)` guarantees that attendance can **only** be recorded if the student is registered for that course!

### C. Immutable Defaulter Audit Log (`ON DELETE SET NULL`)
In compliance auditing, an administrative audit trail must never be destroyed when a student withdraws, graduates, or is removed from the master table.
- In `defaulter_audit_log`, `student_id` is declared `NULLABLE` with `ON DELETE SET NULL ON UPDATE CASCADE`.
- The snapshot attributes (`roll`, `student_name`, `department`, `attendance_percentage`, `classes_needed`, `reported_at`) are declared `NOT NULL`.
- If a student is deleted, `student_id` becomes `NULL`, but the complete audit record with their roll number, student name, department, attendance percentage, classes needed, and audit timestamp remains intact for regulatory reporting.

### D. Department Duplication & Single Source of Truth
- **Authoritative Field:** `students.department_id INT NOT NULL REFERENCES departments(id)` is the single source of relational truth.
- **Legacy Compatibility Field:** `students.department VARCHAR(100) NOT NULL` is retained strictly as a read-compatible mirror for evaluated frontend code and legacy API callers.
- **Synchronization Mechanism:**
  - A database trigger `trg_sync_student_department_before_insert_update` executes on `BEFORE INSERT` and `BEFORE UPDATE`. It looks up `departments.name` using `NEW.department_id` and automatically populates `NEW.department = dept_name`.
  - If a legacy client passes `department` string without `department_id`, the trigger resolves `NEW.department_id` via `departments.name`. This eliminates dual sources of truth.
- **Migration / Removal Plan:**
  1. *Phase 1 (Current):* Trigger guarantees synchronization with zero application disruption.
  2. *Phase 2 (Stage D):* Modernized React frontend components read `departmentName` / `departmentId`.
  3. *Phase 3 (Post-Evaluation Deprecation):* Column `students.department` is retired in favor of direct relational joins or a database view `v_students`.

### E. Legacy Marks: Physical Summary Cache Table (Architectural Decision)
- **Decision:** The legacy `marks` entity is explicitly implemented as a **Physical Summary Cache Table** (NOT an SQL view).
- **Academic & Framework Rationale:**
  - Spring Data JPA's existing repository (`MarksRepository extends JpaRepository<Marks, Long>`) and service (`MarksServiceImpl`) perform direct `.save(marks)` and `.findByStudentId()` operations.
  - In MySQL, standard views that do not map 1-to-1 to a single updatable table fail on `.save()` without complex `INSTEAD OF` triggers.
  - Retaining `marks` as a physical table guarantees 100% runtime compatibility with existing backend controllers (`MarksController`) and frontend pages (`marks.html` / `marks.js`).
- **Synchronization Mechanism:** A database trigger `trg_sync_student_marks_to_legacy` automatically updates `marks.computer_science`, `marks.mathematics`, etc., whenever evaluations are entered into `student_marks`.
- **Deprecation Roadmap:** Once the marks interface is fully ported to the normalized `/api/marks/evaluations` endpoints in Stage D, the legacy physical `marks` table can be safely retired.

---

## 2. Comprehensive Relational Data Dictionary

### Table 1: `departments` (Department Master)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | No | AUTO_INCREMENT | PK | Department Identifier |
| `name` | `VARCHAR(100)` | No | — | UNIQUE, NOT NULL | Full Department Name |
| `code` | `VARCHAR(10)` | No | — | UNIQUE, NOT NULL | Department Abbreviation (e.g. CS, IT) |

### Table 2: `subjects` (Curricular Subject Master)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `subject_key` | `VARCHAR(50)` | No | — | PK | Identifier Key (e.g. `computerScience`) |
| `label` | `VARCHAR(100)` | No | — | UNIQUE, NOT NULL | Subject Display Label |

### Table 3: `academic_periods` (Academic Terms)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | No | AUTO_INCREMENT | PK | Period Identifier |
| `code` | `VARCHAR(20)` | No | — | UNIQUE, NOT NULL | Period Code (e.g. `2026-ODD`) |
| `name` | `VARCHAR(100)` | No | — | NOT NULL | Display Title (e.g. Autumn Semester 2026) |
| `academic_year`| `VARCHAR(20)` | No | — | NOT NULL | Academic Year (e.g. `2026-2027`) |
| `semester_term`| `VARCHAR(10)` | No | — | CHECK (semester_term IN ('Odd', 'Even', 'Summer')) | Term Type |
| `is_current` | `BOOLEAN` | No | FALSE | NOT NULL | Active Flag |

### Table 4: `teachers` (Faculty Master)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `VARCHAR(30)` | No | — | PK | Faculty Identifier (e.g. `T-1001`) |
| `name` | `VARCHAR(100)` | No | — | NOT NULL | Instructor Full Name |
| `department_id`| `INT` | No | — | FK -> `departments(id)`, NOT NULL | Employing Department |
| `subject` | `VARCHAR(50)` | No | — | FK -> `subjects(subject_key)`, NOT NULL | Subject Specialization |
| `workspace` | `VARCHAR(20)` | No | `'demo'` | CHECK (workspace IN ('demo', 'own')) | Workspace Mode |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Record Creation Timestamp |

### Table 5: `students` (Student Master)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Student ID |
| `roll` | `VARCHAR(30)` | No | — | UNIQUE, NOT NULL | University Roll Number |
| `name` | `VARCHAR(100)` | No | — | NOT NULL | Full Student Name |
| `department_id`| `INT` | No | — | FK -> `departments(id)`, NOT NULL | Authoritative Department FK |
| `department` | `VARCHAR(100)` | No | — | NOT NULL | Synchronized Legacy Department String |
| `semester` | `INT` | No | — | CHECK (semester BETWEEN 1 AND 8) | Current Semester |
| `email` | `VARCHAR(120)` | No | — | UNIQUE, NOT NULL | Institutional Email |
| `phone` | `VARCHAR(20)` | No | — | NOT NULL | Contact Number |
| `status` | `VARCHAR(20)` | No | `'Active'` | CHECK (status IN ('Active', 'Probation', 'Inactive')) | Status |
| `gender` | `VARCHAR(10)` | No | — | CHECK (gender IN ('Male', 'Female', 'Other')) | Gender |
| `address` | `VARCHAR(255)` | Yes | NULL | — | Residential Address |
| `teacher_id` | `VARCHAR(30)` | Yes | NULL | FK -> `teachers(id)` (SET NULL) | Optional Faculty Mentor |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Enrollment Timestamp |
| `updated_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP ON UPDATE | NOT NULL | Last Modification Timestamp |

### Table 6: `courses` (Course Catalogue)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `code` | `VARCHAR(20)` | No | — | PK | Course Code (e.g. `CS501`) |
| `name` | `VARCHAR(150)` | No | — | NOT NULL | Course Title |
| `department_id`| `INT` | No | — | FK -> `departments(id)`, NOT NULL | Department Offering Course |
| `subject_key` | `VARCHAR(50)` | No | — | FK -> `subjects(subject_key)`, NOT NULL | Curricular Subject Discipline |
| `credits` | `INT` | No | — | CHECK (credits BETWEEN 1 AND 10) | Credit Weight |
| `semester` | `INT` | No | — | CHECK (semester BETWEEN 1 AND 8) | Semester Course Belongs To |
| `status` | `VARCHAR(20)` | No | `'Upcoming'` | CHECK (status IN ('Upcoming', 'Ongoing', 'Completed')) | Course Operational Status |
| `teacher_id` | `VARCHAR(30)` | Yes | NULL | FK -> `teachers(id)` (SET NULL) | Assigned Teacher ID |
| `faculty` | `VARCHAR(100)` | Yes | NULL | — | Derived/Legacy Instructor String |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Creation Timestamp |

### Table 7: `course_enrollments` (Student Course Registrations)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Enrollment ID |
| `student_id` | `BIGINT` | No | — | FK -> `students(id)` (CASCADE), NOT NULL | Student Reference |
| `course_code` | `VARCHAR(20)` | No | — | FK -> `courses(code)` (CASCADE), NOT NULL | Course Reference |
| `academic_period_id`| `INT` | No | — | FK -> `academic_periods(id)` (RESTRICT), NOT NULL | Academic Term |
| `enrollment_date` | `DATE` | No | (CURRENT_DATE) | NOT NULL | Registration Date |
| `status` | `VARCHAR(20)` | No | `'Enrolled'` | CHECK (status IN ('Enrolled', 'Dropped', 'Completed')) | Status |
| `grade` | `VARCHAR(5)` | Yes | NULL | — | Final Course Grade |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Timestamp |

*Constraint:* `UNIQUE KEY uk_student_course_period (student_id, course_code, academic_period_id)`.

### Table 8: `attendance_sessions` (Conducted Lecture/Lab Slots)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Session ID |
| `course_code` | `VARCHAR(20)` | No | — | FK -> `courses(code)` (CASCADE), NOT NULL | Course Session Held For |
| `teacher_id` | `VARCHAR(30)` | Yes | NULL | FK -> `teachers(id)` (SET NULL) | Faculty Instructor |
| `session_date` | `DATE` | No | — | NOT NULL | Session Date |
| `session_slot` | `INT` | No | 1 | CHECK (session_slot BETWEEN 1 AND 10) | Timetable Slot Number |
| `session_type` | `VARCHAR(20)` | No | `'Lecture'` | CHECK (session_type IN ('Lecture', 'Lab', 'Tutorial')) | Session Type |
| `session_topic`| `VARCHAR(150)` | Yes | NULL | — | Topic Covered |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Creation Timestamp |

*Constraint:* `UNIQUE KEY uk_course_session_slot (course_code, session_date, session_slot)`.

### Table 9: `attendance_records` (Individual Student Attendance Status)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Attendance Mark ID |
| `session_id` | `BIGINT` | No | — | FK -> `attendance_sessions(id)` (CASCADE), NOT NULL | Session Reference |
| `enrollment_id`| `BIGINT` | No | — | FK -> `course_enrollments(id)` (CASCADE), NOT NULL | Validated Course Enrollment |
| `student_id` | `BIGINT` | No | — | FK -> `students(id)` (CASCADE), NOT NULL | Student Reference |
| `status` | `ENUM('Present','Absent')`| No | — | NOT NULL | Attendance Status |
| `remarks` | `VARCHAR(100)` | Yes | NULL | — | Notes (e.g. Medical leave) |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Entry Timestamp |

*Constraint:* `UNIQUE KEY uk_session_student (session_id, student_id)`.

### Table 10: `attendance` (Summary Read Cache)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Cache ID |
| `student_id` | `BIGINT` | No | — | UNIQUE, FK -> `students(id)` (CASCADE), NOT NULL | Student Reference |
| `total_days` | `INT` | No | 0 | CHECK (total_days >= 0) | Total Lectures Conducted |
| `present_days` | `INT` | No | 0 | CHECK (present_days >= 0) | Total Lectures Attended |
| `absent_days` | `INT` | No | 0 | CHECK (absent_days >= 0) | Total Lectures Missed |
| `last_marked` | `VARCHAR(20)` | Yes | `'—'` | — | Date string YYYY-MM-DD |
| `updated_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP ON UPDATE | NOT NULL | Modification Timestamp |

### Table 11: `student_marks` (Normalized Subject/Exam Evaluations)
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Marks Entry ID |
| `student_id` | `BIGINT` | No | — | FK -> `students(id)` (CASCADE), NOT NULL | Student Reference |
| `subject_key` | `VARCHAR(50)` | No | — | FK -> `subjects(subject_key)` (RESTRICT), NOT NULL | Curricular Subject |
| `academic_period_id`| `INT` | No | — | FK -> `academic_periods(id)` (RESTRICT), NOT NULL | Academic Term |
| `semester` | `INT` | No | — | CHECK (semester BETWEEN 1 AND 8) | Semester of Assessment |
| `exam_type` | `VARCHAR(20)` | No | `'Endterm'` | CHECK (exam_type IN ('Internal', 'Midterm', 'Endterm')) | Exam Category |
| `marks_obtained` | `DECIMAL(5,2)` | No | — | CHECK (marks_obtained >= 0) | Score Obtained |
| `max_marks` | `DECIMAL(5,2)` | No | 100.00 | CHECK (max_marks > 0) | Maximum Score |
| `grade` | `VARCHAR(5)` | Yes | NULL | — | Computed Letter Grade (A+, A, B, C, D, F) |
| `remarks` | `VARCHAR(100)` | Yes | NULL | — | Notes |
| `updated_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP ON UPDATE | NOT NULL | Modification Timestamp |

*Constraint:* `UNIQUE KEY uk_student_subject_exam_period (student_id, subject_key, exam_type, academic_period_id)`.  
*Constraint:* `CHECK (marks_obtained <= max_marks)`.

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
| `text` | `VARCHAR(255)` | No | — | NOT NULL | Description |
| `type` | `VARCHAR(50)` | No | `'notice'` | CHECK (type IN ('notice', 'attendance', 'grade', 'enroll', 'course')) | Event Type |
| `teacher_id` | `VARCHAR(30)` | Yes | NULL | FK -> `teachers(id)` (SET NULL) | Authoring Faculty (nullable) |
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
| `classes_needed`| `INT` | No | — | NOT NULL | Consecutive Classes to Reach 75% |
| `reported_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Audit Generation Timestamp |

---

## 3. Comprehensive Foreign-Key Referential Integrity Matrix

| Child Table | Foreign Key Column | Parent Table | ON UPDATE | ON DELETE | Academic Rationale |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `teachers` | `department_id` | `departments(id)` | CASCADE | RESTRICT | Deleting a department is blocked if faculty members belong to it. |
| `teachers` | `subject` | `subjects(subject_key)` | CASCADE | RESTRICT | Deleting a subject is blocked if teachers are specialized in it. |
| `students` | `department_id` | `departments(id)` | CASCADE | RESTRICT | Deleting a department is blocked if students are enrolled in it. |
| `students` | `teacher_id` | `teachers(id)` | CASCADE | SET NULL | If a faculty mentor leaves, students remain enrolled; mentor reference is cleared. |
| `courses` | `department_id` | `departments(id)` | CASCADE | RESTRICT | Deleting a department is blocked while offering courses. |
| `courses` | `subject_key` | `subjects(subject_key)` | CASCADE | RESTRICT | Deleting a subject is blocked if courses map to it. |
| `courses` | `teacher_id` | `teachers(id)` | CASCADE | SET NULL | If a teacher leaves, the course remains in catalogue unassigned. |
| `course_enrollments`| `student_id` | `students(id)` | CASCADE | CASCADE | Deleting a student removes their course enrollments. |
| `course_enrollments`| `course_code` | `courses(code)` | CASCADE | CASCADE | Deleting a course purges enrollments for that course. |
| `course_enrollments`| `academic_period_id`| `academic_periods(id)`| CASCADE | RESTRICT | Deleting an active academic term is blocked if registrations exist. |
| `attendance_sessions`| `course_code` | `courses(code)` | CASCADE | CASCADE | Deleting a course purges scheduled sessions. |
| `attendance_sessions`| `teacher_id` | `teachers(id)` | CASCADE | SET NULL | If a teacher leaves, scheduled historical sessions remain on record. |
| `attendance_records`| `session_id` | `attendance_sessions(id)`| CASCADE | CASCADE | Deleting a session purges student status marks for that session. |
| `attendance_records`| `enrollment_id`| `course_enrollments(id)`| CASCADE | CASCADE | Deleting an enrollment removes attendance marks tied to it. |
| `attendance_records`| `student_id` | `students(id)` | CASCADE | CASCADE | Deleting a student removes their individual session attendance marks. |
| `attendance` | `student_id` | `students(id)` | CASCADE | CASCADE | Deleting a student purges their attendance summary cache. |
| `student_marks` | `student_id` | `students(id)` | CASCADE | CASCADE | Deleting a student removes all subject evaluation marks. |
| `student_marks` | `subject_key` | `subjects(subject_key)` | CASCADE | RESTRICT | Deleting a subject is blocked if student marks exist under it. |
| `student_marks` | `academic_period_id`| `academic_periods(id)`| CASCADE | RESTRICT | Deleting an academic term is blocked if evaluation marks reference it. |
| `marks` | `student_id` | `students(id)` | CASCADE | CASCADE | Deleting a student removes their legacy summary cache row. |
| `activities` | `teacher_id` | `teachers(id)` | CASCADE | SET NULL | If a teacher leaves, administrative notices authored by them remain visible. |
| `defaulter_audit_log`| `student_id`| `students(id)` | CASCADE | **SET NULL** | Deleting a student **cannot destroy historical audit compliance logs**! |

---

## 4. Formal Functional Dependencies & Normalization Analysis

### A. Candidate Keys and Non-Trivial Functional Dependencies

#### 1. Relation `departments`:
- $\text{Schema: } (\text{id}, \text{name}, \text{code})$
- $\text{Candidate Keys } CK = \{\{\text{id}\}, \{\text{name}\}, \{\text{code}\}\}$
- $\text{Functional Dependencies } F = \{$  
  $\text{id} \to \{\text{name}, \text{code}\}, \quad \text{name} \to \{\text{id}, \text{code}\}, \quad \text{code} \to \{\text{id}, \text{name}\} \}$

#### 2. Relation `subjects`:
- $\text{Schema: } (\text{subject\_key}, \text{label})$
- $\text{Candidate Keys } CK = \{\{\text{subject\_key}\}, \{\text{label}\}\}$
- $\text{Functional Dependencies } F = \{ \text{subject\_key} \to \{\text{label}\}, \quad \text{label} \to \{\text{subject\_key}\} \}$

#### 3. Relation `academic_periods`:
- $\text{Schema: } (\text{id}, \text{code}, \text{name}, \text{academic\_year}, \text{semester\_term}, \text{is\_current})$
- $\text{Candidate Keys } CK = \{\{\text{id}\}, \{\text{code}\}\}$
- $\text{Functional Dependencies } F = \{$  
  $\text{id} \to \{\text{code}, \text{name}, \text{academic\_year}, \text{semester\_term}, \text{is\_current}\}, \quad \text{code} \to \{\text{id}, \text{name}, \text{academic\_year}, \text{semester\_term}, \text{is\_current}\} \}$

#### 4. Relation `teachers`:
- $\text{Schema: } (\text{id}, \text{name}, \text{department\_id}, \text{subject}, \text{workspace}, \text{created\_at})$
- $\text{Candidate Keys } CK = \{\{\text{id}\}\}$
- $\text{Functional Dependencies } F = \{ \text{id} \to \{\text{name}, \text{department\_id}, \text{subject}, \text{workspace}, \text{created\_at}\} \}$

#### 5. Relation `students`:
- $\text{Schema: } (\text{id}, \text{roll}, \text{name}, \text{department\_id}, \text{department}, \text{semester}, \text{email}, \text{phone}, \text{status}, \text{gender}, \text{address}, \text{teacher\_id}, \text{created\_at}, \text{updated\_at})$
- $\text{Candidate Keys } CK = \{\{\text{id}\}, \{\text{roll}\}, \{\text{email}\}\}$
- $\text{Functional Dependencies } F = \{$  
  $\text{id} \to \{\text{roll}, \text{name}, \text{department\_id}, \text{department}, \text{semester}, \text{email}, \text{phone}, \text{status}, \text{gender}, \text{address}, \text{teacher\_id}, \text{created\_at}, \text{updated\_at}\},$  
  $\text{roll} \to \text{all attributes}, \quad \text{email} \to \text{all attributes} \}$  
  *(Note: $\text{department\_id} \to \text{department}$ is handled strictly as an automated read-compatibility mirror via trigger).*

#### 6. Relation `courses`:
- $\text{Schema: } (\text{code}, \text{name}, \text{department\_id}, \text{subject\_key}, \text{credits}, \text{semester}, \text{status}, \text{teacher\_id}, \text{faculty}, \text{created\_at})$
- $\text{Candidate Keys } CK = \{\{\text{code}\}\}$
- $\text{Functional Dependencies } F = \{ \text{code} \to \{\text{name}, \text{department\_id}, \text{subject\_key}, \text{credits}, \text{semester}, \text{status}, \text{teacher\_id}, \text{faculty}, \text{created\_at}\} \}$

#### 7. Relation `course_enrollments`:
- $\text{Schema: } (\text{id}, \text{student\_id}, \text{course\_code}, \text{academic\_period\_id}, \text{enrollment\_date}, \text{status}, \text{grade}, \text{created\_at})$
- $\text{Candidate Keys } CK = \{\{\text{id}\}, \{\text{student\_id}, \text{course\_code}, \text{academic\_period\_id}\}\}$
- $\text{Functional Dependencies } F = \{$  
  $\text{id} \to \{\text{student\_id}, \text{course\_code}, \text{academic\_period\_id}, \text{enrollment\_date}, \text{status}, \text{grade}, \text{created\_at}\},$  
  $\{\text{student\_id}, \text{course\_code}, \text{academic\_period\_id}\} \to \{\text{id}, \text{enrollment\_date}, \text{status}, \text{grade}, \text{created\_at}\} \}$

#### 8. Relation `attendance_sessions`:
- $\text{Schema: } (\text{id}, \text{course\_code}, \text{teacher\_id}, \text{session\_date}, \text{session\_slot}, \text{session\_type}, \text{session\_topic}, \text{created\_at})$
- $\text{Candidate Keys } CK = \{\{\text{id}\}, \{\text{course\_code}, \text{session\_date}, \text{session\_slot}\}\}$
- $\text{Functional Dependencies } F = \{$  
  $\text{id} \to \{\text{course\_code}, \text{teacher\_id}, \text{session\_date}, \text{session\_slot}, \text{session\_type}, \text{session\_topic}, \text{created\_at}\},$  
  $\{\text{course\_code}, \text{session\_date}, \text{session\_slot}\} \to \{\text{id}, \text{teacher\_id}, \text{session\_type}, \text{session\_topic}, \text{created\_at}\} \}$

#### 9. Relation `attendance_records`:
- $\text{Schema: } (\text{id}, \text{session\_id}, \text{enrollment\_id}, \text{student\_id}, \text{status}, \text{remarks}, \text{created\_at})$
- $\text{Candidate Keys } CK = \{\{\text{id}\}, \{\text{session\_id}, \text{student\_id}\}\}$
- $\text{Functional Dependencies } F = \{$  
  $\text{id} \to \{\text{session\_id}, \text{enrollment\_id}, \text{student\_id}, \text{status}, \text{remarks}, \text{created\_at}\},$  
  $\{\text{session\_id}, \text{student\_id}\} \to \{\text{id}, \text{enrollment\_id}, \text{status}, \text{remarks}, \text{created\_at}\} \}$

#### 10. Relation `student_marks`:
- $\text{Schema: } (\text{id}, \text{student\_id}, \text{subject\_key}, \text{academic\_period\_id}, \text{semester}, \text{exam\_type}, \text{marks\_obtained}, \text{max\_marks}, \text{grade}, \text{remarks}, \text{updated\_at})$
- $\text{Candidate Keys } CK = \{\{\text{id}\}, \{\text{student\_id}, \text{subject\_key}, \text{exam\_type}, \text{academic\_period\_id}\}\}$
- $\text{Functional Dependencies } F = \{$  
  $\text{id} \to \{\text{student\_id}, \text{subject\_key}, \text{academic\_period\_id}, \text{semester}, \text{exam\_type}, \text{marks\_obtained}, \text{max\_marks}, \text{grade}, \text{remarks}, \text{updated\_at}\},$  
  $\{\text{student\_id}, \text{subject\_key}, \text{exam\_type}, \text{academic\_period\_id}\} \to \{\text{id}, \text{semester}, \text{marks\_obtained}, \text{max\_marks}, \text{grade}, \text{remarks}, \text{updated\_at}\} \}$

---

### B. Mathematical Proof of Normal Forms

#### 1. Proof of First Normal Form (1NF)
- **Criterion:** A relation $R$ is in 1NF if and only if every attribute domain contains only atomic (scalar) values, and there are no repeating groups or composite columns.
- **Verification:**
  - In `student_marks`, evaluation scores are decomposed into discrete rows per subject, eliminating the legacy repeating columns (`mathematics`, `physics`, `chemistry`, `english`, `computer_science`).
  - No column stores comma-delimited strings, JSON arrays, or repeating groups. Every cell in every relation holds an atomic scalar value.
  - All relations possess a defined primary key.
- **Conclusion:** All relations strictly satisfy **1NF**.

#### 2. Proof of Second Normal Form (2NF)
- **Criterion:** A relation $R$ is in 2NF if and only if it is in 1NF and no non-prime attribute is partially dependent on any candidate key of $R$. (That is, no $X \to Y$ exists where $X$ is a strict proper subset of a candidate key and $Y$ is a non-prime attribute).
- **Verification:**
  - For single-attribute candidate key relations (`departments`, `subjects`, `teachers`, `students`, `courses`, `academic_periods`), partial dependencies are impossible since no proper subset of a single attribute exists.
  - For composite candidate key relations:
    - In `course_enrollments`, candidate key is $K = \{\text{student\_id}, \text{course\_code}, \text{academic\_period\_id}\}$. Attributes `enrollment_date`, `status`, and `grade` depend on the student enrolled in that specific course for that specific term. They do not depend on `student_id` alone or `course_code` alone.
    - In `attendance_sessions`, candidate key is $K = \{\text{course\_code}, \text{session\_date}, \text{session\_slot}\}$. Attributes `session_type` and `session_topic` depend on the specific lecture slot conducted for that course on that date.
    - In `attendance_records`, candidate key is $K = \{\text{session\_id}, \text{student\_id}\}$. Attribute `status` represents the student's presence at that specific session. It cannot be determined by `student_id` alone or `session_id` alone.
    - In `student_marks`, candidate key is $K = \{\text{student\_id}, \text{subject\_key}, \text{exam\_type}, \text{academic\_period\_id}\}$. Attributes `marks_obtained`, `max_marks`, `grade`, and `remarks` require the entire 4-tuple key.
- **Conclusion:** There are zero partial dependencies. All relations strictly satisfy **2NF**.

#### 3. Proof of Third Normal Form (3NF)
- **Criterion:** A relation $R$ is in 3NF if and only if it is in 2NF and for every non-trivial functional dependency $X \to Y$, either:
  1. $X$ is a superkey of $R$, or
  2. $Y$ is a prime attribute of $R$ (part of some candidate key).
- **Verification:**
  - In `departments`, `subjects`, `academic_periods`, `teachers`, `courses`, `course_enrollments`, `attendance_sessions`, `attendance_records`, and `student_marks`, every determinant $X$ in every functional dependency is a superkey (candidate key).
  - There are no transitive dependencies of non-prime attributes on other non-prime attributes.
  - For derived attribute `grade` in `student_marks`, `grade` is calculated deterministically via stored function `fn_calculate_grade(marks_obtained, max_marks)` enforced by a `BEFORE INSERT/UPDATE` trigger, eliminating update anomalies.
- **Conclusion:** All relations strictly satisfy **3NF**.

#### 4. Proof of Boyce-Codd Normal Form (BCNF)
- **Criterion:** A relation $R$ is in BCNF if and only if for every non-trivial functional dependency $X \to Y$, $X$ is a superkey of $R$.
- **Verification:**
  - In `departments`: Determinants are $\{\text{id}\}$, $\{\text{name}\}$, $\{\text{code}\}$; all are candidate keys (superkeys).
  - In `subjects`: Determinants are $\{\text{subject\_key}\}$, $\{\text{label}\}$; both are candidate keys (superkeys).
  - In `academic_periods`: Determinants are $\{\text{id}\}$, $\{\text{code}\}$; both are candidate keys (superkeys).
  - In `teachers`: Determinant is $\{\text{id}\}$, which is a superkey.
  - In `students`: Determinants are $\{\text{id}\}$, $\{\text{roll}\}$, $\{\text{email}\}$; all are candidate keys (superkeys).
  - In `courses`: Determinant is $\{\text{code}\}$, which is a superkey.
  - In `course_enrollments`: Determinants are $\{\text{id}\}$ and $\{\text{student\_id}, \text{course\_code}, \text{academic\_period\_id}\}$; both are candidate keys (superkeys).
  - In `attendance_sessions`: Determinants are $\{\text{id}\}$ and $\{\text{course\_code}, \text{session\_date}, \text{session\_slot}\}$; both are candidate keys (superkeys).
  - In `attendance_records`: Determinants are $\{\text{id}\}$ and $\{\text{session\_id}, \text{student\_id}\}$; both are candidate keys (superkeys).
  - In `student_marks`: Determinants are $\{\text{id}\}$ and $\{\text{student\_id}, \text{subject\_key}, \text{exam\_type}, \text{academic\_period\_id}\}$; both are candidate keys (superkeys).
- **Conclusion:** Every determinant in the normalized relational model is a superkey. The core schema strictly satisfies **BCNF**.

#### 5. Controlled Intentional Denormalizations:
1. **`attendance` Table (Summary Read Model):**
   - Holds aggregate counters (`total_days`, `present_days`, `absent_days`, `last_marked`).
   - Purpose: Provides $O(1)$ constant-time dashboard KPI retrieval without performing expensive runtime aggregate queries (`COUNT(*)`) across hundreds of thousands of session logs. Maintained in strict real-time synchronization via `AFTER INSERT ON attendance_records` trigger.
2. **`defaulter_audit_log` Table (Compliance Snapshot):**
   - Holds snapshot copies of `roll`, `student_name`, and `department`.
   - Purpose: Preserves historical compliance state even if student names or departments are later modified or deleted (`ON DELETE SET NULL`).
