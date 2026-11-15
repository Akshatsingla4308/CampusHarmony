# CAMPUS HARMONY — PHASE 2 DESIGN REVISION & CHANGE REPORT

**Document:** Phase 2 Change Report (Post-Review Revision)  
**Academic Context:** BE CSE Semester III, Batch 2025  
**Course:** Database Management Systems (24CSE0209) / Programming in Java (25CSE0202)  
**Date:** November 15, 2026  

---

## 1. Executive Summary of Changes

Following faculty review of the initial Phase 2 ER Model & Diagram report, 10 structural and relational issues were identified. This document details the exact modifications made to the conceptual ER model, Crow's Foot ER diagram, cardinality matrix, relational schema, data dictionary, and normalization justifications.

---

## 2. Point-by-Point Resolution of Review Issues

### Issue 1: Missing DEPARTMENTS–TEACHERS Relationship
- **Previous State:** The `teachers` table had no foreign key linking it to `departments`. Teachers were mapped only to `subjects.subject_key`.
- **Revision Applied:**
  - Added `department_id INT NOT NULL` to `teachers` as a foreign key referencing `departments(id)`.
  - Defined referential integrity: `ON UPDATE CASCADE ON DELETE RESTRICT` (a department cannot be deleted if active faculty members are employed by it).
  - Updated ER diagram with mandatory $1 : 1..N$ relationship: `DEPARTMENTS ||--|{ TEACHERS : "employs"`.

---

### Issue 2: STUDENTS.department String Replaced with department_id FK
- **Previous State:** `students` stored `department VARCHAR(100)` as plain text without referential integrity to `departments`.
- **Revision Applied:**
  - Added `department_id INT NOT NULL` referencing `departments(id)`.
  - Defined referential integrity: `ON UPDATE CASCADE ON DELETE RESTRICT`.
  - Maintained `department VARCHAR(100)` strictly as a synchronized legacy compatibility field so existing frontend components and API endpoints reading `student.department` continue operating without breaking changes.
  - Updated ER diagram: `DEPARTMENTS ||--|{ STUDENTS : "enrolls"`.

---

### Issue 3: Missing COURSES–SUBJECTS Relationship & Clear Distinction
- **Previous State:** `courses` had no direct link to `subjects`. The distinction between an overarching academic subject and an operational course offering was ambiguous.
- **Revision Applied:**
  - **Academic Distinction Established:**
    - **Subject (Academic Discipline / Evaluation Domain):** Broader curriculum knowledge area (e.g. `computerScience`, `mathematics`, `physics`, `chemistry`, `english`) that faculty specialize in and under which student cumulative marks are aggregated.
    - **Course (Specific Instructional Module / Class Offering):** A discrete operational lecture course offered in a specific semester with credit weight and assigned faculty (e.g., `CS501` "Data Structures & Algorithms", `CS502` "Operating Systems", `IT301` "Database Management Systems").
  - Added `subject_key VARCHAR(50) NOT NULL` to `courses` referencing `subjects(subject_key) ON UPDATE CASCADE ON DELETE RESTRICT`.
  - Added `department_id INT NOT NULL` to `courses` referencing `departments(id) ON UPDATE CASCADE ON DELETE RESTRICT`.
  - Updated ER diagram: `SUBJECTS ||--|{ COURSES : "categorizes"` and `DEPARTMENTS ||--|{ COURSES : "offers"`.

---

### Issue 4: Addition of COURSE_ENROLLMENTS Associative Entity
- **Previous State:** Course registration was implicit and conflated with attendance or semester matching (e.g., assuming all semester 5 students were enrolled in all semester 5 courses).
- **Revision Applied:**
  - Introduced `COURSE_ENROLLMENTS` associative entity modeling the $M:N$ relationship between `STUDENTS` and `COURSES`:
    - Attributes: `id` (PK), `student_id` (FK), `course_code` (FK), `enrollment_date`, `status` (`'Enrolled'`, `'Dropped'`, `'Completed'`), `grade` (nullable final grade), `created_at`.
    - Constraint: `UNIQUE KEY uk_student_course (student_id, course_code)` guarantees unique enrollment per course.
    - Referential Actions: `ON UPDATE CASCADE ON DELETE CASCADE`.

---

### Issue 5: Correction of Crow's Foot Cardinalities for Optional Mentors and Authors
- **Previous State:** Previous ER diagram incorrectly depicted mentor relationships as mandatory for students (`TEACHERS ||--o{ STUDENTS`) and mandatory for activities (`TEACHERS ||--o{ ACTIVITIES`).
- **Revision Applied:**
  - **Student Mentor:** A teacher may mentor $0..N$ students; a student has **$0..1$** mentor (`teacher_id` is nullable for unassigned or global demo students). Diagram corrected to: `TEACHERS |o--o{ STUDENTS : "mentors (optional)"`.
  - **Activity Author:** A teacher authors $0..N$ activities; an activity has **$0..1$** author (`teacher_id` is nullable for system/automated notifications). Diagram corrected to: `TEACHERS |o--o{ ACTIVITIES : "authors (optional)"`.
  - **Course Instructor:** A teacher instructs $0..N$ courses; a course has **$0..1$** assigned instructor (`teacher_id` is nullable). Diagram corrected to: `TEACHERS |o--o{ COURSES : "instructs (optional)"`.

---

### Issue 6: Clarification of ATTENDANCE and MARKS Participation
- **Previous State:** Previously claimed that a `UNIQUE` foreign key guaranteed mandatory 1:1 participation.
- **Revision Applied:**
  - Clarified database theory: In relational databases, a Foreign Key with a `UNIQUE` constraint in a child table only enforces that each child row references at most one parent and no two child rows share the same parent ($0..1$). It does **not** force a parent row to possess a child row at creation time.
  - Structurally, until the enrollment logic or trigger initializes summary rows, a newly enrolled student has 0 attendance rows and 0 marks rows.
  - Diagram corrected to: `STUDENTS |o--o| ATTENDANCE` and `STUDENTS |o--o| MARKS` (structural $0..1$ participation until initialized).

---

### Issue 7: Inconsistency in Supported Exam Types
- **Previous State:** Text mentioned `Assignment`, while schema and circulars emphasized formal university evaluations.
- **Revision Applied:**
  - Standardized supported exam types strictly across all documentation, check constraints, and triggers to the 3 university examination categories:
    `CHECK (exam_type IN ('Internal', 'Midterm', 'Endterm'))`.

---

### Issue 8: DEFAULTER_AUDIT_LOG Relationship & Historical Snapshot Semantics
- **Previous State:** `defaulter_audit_log` appeared isolated without clear relational context.
- **Revision Applied:**
  - Formally linked to `STUDENTS` via `student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE`.
  - Documented historical snapshot semantics: The table deliberately preserves denormalized snapshot fields (`roll`, `student_name`, `department`, `attendance_percentage`, `classes_needed`) so that the audit trail remains an immutable, historically accurate record of student status at the exact time the audit procedure executed, even if the student's department or attendance changes later.
  - Updated ER diagram: `STUDENTS ||--o{ DEFAULTER_AUDIT_LOG : "audited in"`.

---

### Issue 9: Review of Duplicate Data & Legacy Compatibility Boundaries
- **Previous State:** Unclear distinction between normalized source of truth and legacy compatibility fields.
- **Revision Applied:**
  - `COURSES.faculty`: Identified as redundant with `teachers.name`. Established `teacher_id` as the relational foreign key source of truth; `faculty` is made nullable and populated dynamically/on-insert for legacy API clients.
  - `STUDENTS.department`: Identified as redundant with `departments.name`. Established `department_id` as the relational foreign key source of truth; string `department` is maintained for zero-breakage compatibility with existing UI filters.
  - Legacy `MARKS` table: Formally documented as a cached legacy summary table representing the 5 fixed curriculum subjects, kept in sync with the normalized `student_marks` table via triggers.

---

### Issue 10: Consistent Foreign-Key Deletion Rules, Constraints & Nullability
- **Previous State:** Deletion actions were fragmented or omitted for some tables.
- **Revision Applied:**
  - Produced a comprehensive 18-row Foreign-Key Referential Integrity Matrix covering every relationship with explicit `ON UPDATE CASCADE`, `ON DELETE RESTRICT / CASCADE / SET NULL`, and academic justifications.
  - Enforced `NOT NULL` on all primary keys, non-optional foreign keys (`department_id`, `subject_key`), and core operational fields.
  - Enforced `CHECK` constraints on semesters (1–8), credits (1–10), marks ($0 \le \text{marks} \le \text{max\_marks}$), statuses, and non-negative attendance counters.
