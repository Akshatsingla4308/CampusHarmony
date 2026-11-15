# CAMPUS HARMONY — RELATIONAL DATABASE DESIGN & NORMALIZATION ANALYSIS (REVISED PHASE 2)

**Course:** Database Management Systems (24CSE0209)  
**Evaluation:** Project-Based Evaluation (50 Marks)  
**Database Engine:** MySQL Server 8.0+ (InnoDB Storage Engine)  
**Revision:** Version 2.0 (Post-Review Academic Alignment)  

---

## 1. Relational Mapping from Conceptual ER Model

The revised conceptual ER model maps to normalized relational tables using standard ER-to-Relational conversion rules:
1. **Strong Entities:** Converted into distinct relational master tables (`departments`, `subjects`, `teachers`, `students`, `courses`).
2. **Associative Entities (M:N Binary Relationships):**
   - The $M:N$ relationship between `STUDENTS` and `COURSES` is realized as an independent associative entity: `course_enrollments`.
3. **1:N Binary Relationships:** Represented by placing the Primary Key of the "1" side as a Foreign Key in the "N" side table:
   - `department_id` in `teachers`, `students`, and `courses`.
   - `subject_key` in `teachers`, `courses`, and `student_marks`.
   - `teacher_id` in `students`, `courses`, `activities`, and `attendance_records`.
4. **1:1 Relationships & Participation Clarification:**
   - A Foreign Key with a `UNIQUE` constraint (such as `attendance.student_id` and `marks.student_id`) enforces at most one child row per student ($0..1$). It **does not** enforce mandatory bidirectional participation at the storage engine level. Until the application or enrollment trigger initializes a summary row, a student exists with 0 attendance/marks rows. This structural $0..1$ relationship is explicitly recognized in the schema.
5. **Historical Snapshot Entities:**
   - `defaulter_audit_log` references `students(id)` as a foreign key while deliberately preserving denormalized point-in-time snapshot values (`roll`, `student_name`, `department`, `attendance_percentage`) to ensure historical audit immutability even if master student records are subsequently altered.

---

## 2. Updated Comprehensive Data Dictionary

### Table 1: `departments` (Department Master)
Stores academic departments of the institute.
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | No | AUTO_INCREMENT | PK | Primary Key |
| `name` | `VARCHAR(100)` | No | — | UNIQUE, NOT NULL | Full Department Name (e.g. Computer Science) |
| `code` | `VARCHAR(10)` | No | — | UNIQUE, NOT NULL | Department Abbreviation (e.g. CS, IT, EC, ME, CV) |

### Table 2: `subjects` (Curricular Subject Master)
Defines overarching academic subject disciplines evaluated across curricula.
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `subject_key` | `VARCHAR(50)` | No | — | PK | Key Identifier (e.g. `computerScience`, `mathematics`) |
| `label` | `VARCHAR(100)` | No | — | UNIQUE, NOT NULL | Human-readable title (e.g. Computer Science) |

### Table 3: `teachers` (Faculty Master)
Stores faculty members, their employing department, and their subject specialization.
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `VARCHAR(30)` | No | — | PK | Faculty Identifier (e.g. `T-1001`) |
| `name` | `VARCHAR(100)` | No | — | NOT NULL | Instructor Full Name |
| `department_id`| `INT` | No | — | FK -> `departments(id)`, NOT NULL | Employing Department |
| `subject` | `VARCHAR(50)` | No | — | FK -> `subjects(subject_key)`, NOT NULL | Subject Specialization |
| `workspace` | `VARCHAR(20)` | No | `'demo'` | CHECK (workspace IN ('demo', 'own')) | `'demo'` (shared) or `'own'` (isolated) |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Record creation timestamp |

### Table 4: `students` (Student Master)
Master entity for enrolled students.
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Primary Key |
| `roll` | `VARCHAR(30)` | No | — | UNIQUE, NOT NULL | University Roll Number (e.g. `CS-2101`) |
| `name` | `VARCHAR(100)` | No | — | NOT NULL | Full Student Name |
| `department_id`| `INT` | No | — | FK -> `departments(id)`, NOT NULL | Department Affiliation (Source of Truth) |
| `department` | `VARCHAR(100)` | No | — | NOT NULL | Legacy Compatibility Name string |
| `semester` | `INT` | No | — | CHECK (semester BETWEEN 1 AND 8) | Academic Semester |
| `email` | `VARCHAR(120)` | No | — | UNIQUE, NOT NULL | Institutional Email Address |
| `phone` | `VARCHAR(20)` | No | — | NOT NULL | Contact Phone Number |
| `status` | `VARCHAR(20)` | No | `'Active'` | CHECK (status IN ('Active', 'Probation', 'Inactive')) | Enrollment Status |
| `gender` | `VARCHAR(10)` | No | — | CHECK (gender IN ('Male', 'Female', 'Other')) | Gender |
| `address` | `VARCHAR(255)` | Yes | NULL | — | Postal Address |
| `teacher_id` | `VARCHAR(30)` | Yes | NULL | FK -> `teachers(id)` (ON DELETE SET NULL) | Optional Faculty Mentor ID |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Enrollment Timestamp |
| `updated_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP ON UPDATE | NOT NULL | Last Modification Timestamp |

### Table 5: `courses` (Course Catalogue)
Operational courses offered in specific semesters with designated syllabus and credits.
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `code` | `VARCHAR(20)` | No | — | PK | Course Code (e.g. `CS501`) |
| `name` | `VARCHAR(150)` | No | — | NOT NULL | Course Title |
| `department_id`| `INT` | No | — | FK -> `departments(id)`, NOT NULL | Department Offering Course |
| `subject_key` | `VARCHAR(50)` | No | — | FK -> `subjects(subject_key)`, NOT NULL | Parent Subject Discipline |
| `credits` | `INT` | No | — | CHECK (credits BETWEEN 1 AND 10) | Credit Weight |
| `semester` | `INT` | No | — | CHECK (semester BETWEEN 1 AND 8) | Semester Course Belongs To |
| `status` | `VARCHAR(20)` | No | `'Upcoming'` | CHECK (status IN ('Upcoming', 'Ongoing', 'Completed')) | Course Operational Status |
| `teacher_id` | `VARCHAR(30)` | Yes | NULL | FK -> `teachers(id)` (ON DELETE SET NULL) | Assigned Faculty Instructor |
| `faculty` | `VARCHAR(100)` | Yes | NULL | — | Legacy Instructor Name String |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Creation Timestamp |

### Table 6: `course_enrollments` (Associative Entity: Student Course Registrations)
Models student course registrations explicitly and independently of attendance.
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Primary Key |
| `student_id` | `BIGINT` | No | — | FK -> `students(id)` (ON DELETE CASCADE) | Student Enrolled |
| `course_code` | `VARCHAR(20)` | No | — | FK -> `courses(code)` (ON DELETE CASCADE) | Course Enrolled |
| `enrollment_date` | `DATE` | No | (CURRENT_DATE) | NOT NULL | Date of Registration |
| `status` | `VARCHAR(20)` | No | `'Enrolled'` | CHECK (status IN ('Enrolled', 'Dropped', 'Completed')) | Registration Status |
| `grade` | `VARCHAR(5)` | Yes | NULL | — | Final Course Grade (if completed) |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Registration Timestamp |

*Constraint:* `UNIQUE KEY uk_student_course (student_id, course_code)` strictly guarantees a student cannot be enrolled twice in the same course.

### Table 7: `attendance_records` (Normalized Dated Lecture Sessions)
Event-level attendance records tracking every conducted lecture session.
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Primary Key |
| `student_id` | `BIGINT` | No | — | FK -> `students(id)` (ON DELETE CASCADE) | Student Reference |
| `course_code` | `VARCHAR(20)` | Yes | NULL | FK -> `courses(code)` (ON DELETE CASCADE) | Course Session |
| `session_date` | `DATE` | No | — | NOT NULL | Date of Lecture Session |
| `status` | `ENUM('Present','Absent')`| No | — | NOT NULL | Attendance Status |
| `session_topic`| `VARCHAR(150)` | Yes | NULL | — | Lecture Topic Covered |
| `marked_by_teacher_id` | `VARCHAR(30)` | Yes | NULL | FK -> `teachers(id)` (ON DELETE SET NULL) | Faculty Invigilator Reference |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Entry Timestamp |

*Constraint:* `UNIQUE KEY uk_student_session (student_id, session_date, course_code)` guarantees idempotency, preventing duplicate marks for the same student, course, and date.

### Table 8: `attendance` (Summary Cache Entity)
Aggregate attendance counters for students (structural $0..1$ relationship until initialized).
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Primary Key |
| `student_id` | `BIGINT` | No | — | UNIQUE, FK -> `students(id)` (CASCADE) | Student Reference |
| `total_days` | `INT` | No | 0 | CHECK (total_days >= 0) | Total Lectures Conducted |
| `present_days` | `INT` | No | 0 | CHECK (present_days >= 0) | Total Lectures Attended |
| `absent_days` | `INT` | No | 0 | CHECK (absent_days >= 0) | Total Lectures Missed |
| `last_marked` | `VARCHAR(20)` | Yes | `'—'` | — | Date of last attendance mark |
| `updated_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP ON UPDATE | NOT NULL | Modification Timestamp |

*Constraint:* `CHECK (present_days + absent_days = total_days)` maintains mathematical sanity.

### Table 9: `student_marks` (Normalized Subject/Exam Evaluation)
Normalized marks table eliminating repeating subject columns.
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Primary Key |
| `student_id` | `BIGINT` | No | — | FK -> `students(id)` (ON DELETE CASCADE) | Student Reference |
| `subject_key` | `VARCHAR(50)` | No | — | FK -> `subjects(subject_key)` (RESTRICT) | Curricular Subject Evaluated |
| `exam_type` | `VARCHAR(20)` | No | `'Endterm'` | CHECK (exam_type IN ('Internal', 'Midterm', 'Endterm')) | Standardized Exam Category |
| `marks_obtained` | `DECIMAL(5,2)` | No | — | CHECK (marks_obtained >= 0) | Score Obtained |
| `max_marks` | `DECIMAL(5,2)` | No | 100.00 | CHECK (max_marks > 0) | Maximum Score |
| `grade` | `VARCHAR(5)` | Yes | NULL | — | Computed Letter Grade (A+, A, B, C, D, F) |
| `remarks` | `VARCHAR(100)` | Yes | NULL | — | Evaluator Remarks |
| `updated_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP ON UPDATE | NOT NULL | Last Update Timestamp |

*Constraint:* `UNIQUE KEY uk_student_subject_exam (student_id, subject_key, exam_type)` guarantees uniqueness per student per subject per exam.  
*Constraint:* `CHECK (marks_obtained <= max_marks)` prevents impossible scores.

### Table 10: `marks` (Legacy 5-Subject Summary)
Maintained for backward compatibility with existing 5-subject UI screen and JPA repository.
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Primary Key |
| `student_id` | `BIGINT` | No | — | UNIQUE, FK -> `students(id)` (CASCADE) | Student Reference |
| `mathematics` | `INT` | Yes | NULL | CHECK (mathematics IS NULL OR (mathematics BETWEEN 0 AND 100)) | Math Score |
| `physics` | `INT` | Yes | NULL | CHECK (physics IS NULL OR (physics BETWEEN 0 AND 100)) | Physics Score |
| `chemistry` | `INT` | Yes | NULL | CHECK (chemistry IS NULL OR (chemistry BETWEEN 0 AND 100)) | Chemistry Score |
| `english` | `INT` | Yes | NULL | CHECK (english IS NULL OR (english BETWEEN 0 AND 100)) | English Score |
| `computer_science` | `INT` | Yes | NULL | CHECK (computer_science IS NULL OR (computer_science BETWEEN 0 AND 100)) | CS Score |
| `updated_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP ON UPDATE | NOT NULL | Modification Timestamp |

### Table 11: `activities` (Audit & Feed Log)
Audit log tracking announcements, marks updates, and enrollments.
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Primary Key |
| `text` | `VARCHAR(255)` | No | — | NOT NULL | Activity Description |
| `type` | `VARCHAR(50)` | No | `'notice'` | CHECK (type IN ('notice', 'attendance', 'grade', 'enroll', 'course')) | Event Category |
| `teacher_id` | `VARCHAR(30)` | Yes | NULL | FK -> `teachers(id)` (ON DELETE SET NULL) | Authoring Faculty ID (nullable) |
| `created_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Event Timestamp |

### Table 12: `defaulter_audit_log` (Procedural Cursor Output Log)
Audit snapshot log generated dynamically by `sp_generate_attendance_defaulter_report`.
| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `BIGINT` | No | AUTO_INCREMENT | PK | Primary Key |
| `student_id` | `BIGINT` | No | — | FK -> `students(id)` (ON DELETE CASCADE) | Student Reference |
| `roll` | `VARCHAR(30)` | No | — | NOT NULL | Snapshot Roll Number |
| `student_name` | `VARCHAR(100)` | No | — | NOT NULL | Snapshot Student Name |
| `department` | `VARCHAR(100)` | No | — | NOT NULL | Snapshot Department Name |
| `attendance_percentage` | `DECIMAL(5,2)` | No | — | NOT NULL | Snapshot Attendance % at Audit Time |
| `classes_needed`| `INT` | No | — | NOT NULL | Required Consecutive Classes to Reach 75% |
| `reported_at` | `TIMESTAMP` | No | CURRENT_TIMESTAMP | NOT NULL | Snapshot Generation Timestamp |

---

## 3. Comprehensive Foreign-Key Referential Integrity Matrix

| Child Table | Foreign Key Column | Parent Table (Referenced Column) | ON UPDATE | ON DELETE | Academic Rationale |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `teachers` | `department_id` | `departments(id)` | CASCADE | RESTRICT | A department cannot be deleted if faculty members belong to it. |
| `teachers` | `subject` | `subjects(subject_key)` | CASCADE | RESTRICT | A subject cannot be deleted if teachers are specialized in it. |
| `students` | `department_id` | `departments(id)` | CASCADE | RESTRICT | A department cannot be deleted if students are currently enrolled in it. |
| `students` | `teacher_id` | `teachers(id)` | CASCADE | SET NULL | If a faculty mentor leaves, students remain enrolled; mentor reference is cleared. |
| `courses` | `department_id` | `departments(id)` | CASCADE | RESTRICT | A department cannot be deleted while offering courses. |
| `courses` | `subject_key` | `subjects(subject_key)` | CASCADE | RESTRICT | A curricular subject discipline cannot be deleted if active courses map to it. |
| `courses` | `teacher_id` | `teachers(id)` | CASCADE | SET NULL | If a teacher leaves, the course remains in the catalogue and becomes unassigned. |
| `course_enrollments`| `student_id` | `students(id)` | CASCADE | CASCADE | Deleting a student record deletes their course registrations. |
| `course_enrollments`| `course_code` | `courses(code)` | CASCADE | CASCADE | Deleting a course purges registrations for that course. |
| `attendance` | `student_id` | `students(id)` | CASCADE | CASCADE | Deleting a student removes their summary attendance counters. |
| `attendance_records`| `student_id` | `students(id)` | CASCADE | CASCADE | Deleting a student purges all individual session attendance logs. |
| `attendance_records`| `course_code` | `courses(code)` | CASCADE | CASCADE | Deleting a course purges attendance sessions held for that course. |
| `attendance_records`| `marked_by_teacher_id` | `teachers(id)` | CASCADE | SET NULL | If a teacher leaves, historic session attendance records remain intact. |
| `marks` | `student_id` | `students(id)` | CASCADE | CASCADE | Deleting a student removes their legacy marks row. |
| `student_marks` | `student_id` | `students(id)` | CASCADE | CASCADE | Deleting a student removes all subject evaluation marks. |
| `student_marks` | `subject_key` | `subjects(subject_key)` | CASCADE | RESTRICT | A subject cannot be removed while student marks exist under it. |
| `activities` | `teacher_id` | `teachers(id)` | CASCADE | SET NULL | If a teacher leaves, administrative notices authored by them remain visible. |
| `defaulter_audit_log`| `student_id`| `students(id)` | CASCADE | CASCADE | Deleting a student purges audit log snapshots referencing that student. |

---

## 4. Normalization Step-by-Step Progression (1NF to BCNF)

### Functional Dependencies ($X \to Y$):
1. **`departments`:** $\text{id} \to \{\text{name}, \text{code}\}$; $\text{code} \to \{\text{id}, \text{name}\}$; $\text{name} \to \{\text{id}, \text{code}\}$.
2. **`subjects`:** $\text{subject\_key} \to \{\text{label}\}$.
3. **`teachers`:** $\text{id} \to \{\text{name}, \text{department\_id}, \text{subject}, \text{workspace}, \text{created\_at}\}$.
4. **`students`:** $\text{id} \to \{\text{roll}, \text{name}, \text{department\_id}, \text{semester}, \text{email}, \text{phone}, \text{status}, \text{gender}, \text{address}, \text{teacher\_id}\}$; $\text{roll} \to \dots$; $\text{email} \to \dots$.
5. **`courses`:** $\text{code} \to \{\text{name}, \text{department\_id}, \text{subject\_key}, \text{credits}, \text{semester}, \text{status}, \text{teacher\_id}\}$.
6. **`course_enrollments`:** $\{\text{student\_id}, \text{course\_code}\} \to \{\text{id}, \text{enrollment\_date}, \text{status}, \text{grade}, \text{created\_at}\}$.
7. **`attendance_records`:** $\{\text{student\_id}, \text{session\_date}, \text{course\_code}\} \to \{\text{id}, \text{status}, \text{session\_topic}, \text{marked\_by\_teacher\_id}, \text{created\_at}\}$.
8. **`student_marks`:** $\{\text{student\_id}, \text{subject\_key}, \text{exam\_type}\} \to \{\text{id}, \text{marks\_obtained}, \text{max\_marks}, \text{grade}, \text{remarks}, \text{updated\_at}\}$.

### Normal Forms Justification:
- **1NF:**
  - All attributes contain atomic, scalar values (no multivalued sets, nested structures, or repeating column lists).
  - Legacy repeating marks columns (`math`, `physics`, `chem`, `eng`, `cs`) are normalized into atomic records in `student_marks`.
  - Every table has a declared primary key.
- **2NF:**
  - The relations are in 1NF and contain **no partial functional dependencies**.
  - In composite-key relations (`course_enrollments`, `attendance_records`, `student_marks`), all non-prime attributes depend on the entire candidate key, never a proper subset:
    - In `course_enrollments`, `enrollment_date` and `status` depend on BOTH `student_id` and `course_code`.
    - In `student_marks`, `marks_obtained` cannot be determined by `student_id` alone or `subject_key` alone; all three components (`student_id`, `subject_key`, `exam_type`) are strictly required.
- **3NF:**
  - The relations are in 2NF and contain **no transitive functional dependencies** ($X \to Y \to Z$ where $X$ is a key and $Y$ is non-prime).
  - Faculty details are not duplicated in `courses`; only `teacher_id` is stored.
  - Department code/name are not duplicated in `students`; only `department_id` is stored.
  - Grade is derived from `(marks_obtained / max_marks)` and enforced via trigger/function.
- **BCNF:**
  - For every non-trivial functional dependency $X \to Y$, $X$ is a superkey.
  - In all relations (`departments`, `subjects`, `teachers`, `students`, `courses`, `course_enrollments`, `attendance_records`, `student_marks`), the determinants are either primary keys or unique candidate keys.
