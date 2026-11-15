# CAMPUS HARMONY — PHASE 2 FINAL CHANGE REPORT (VERSION 3.0)

**Document:** Comprehensive Change Log & Design Evolution Report  
**Academic Context:** BE CSE Semester III, Batch 2025  
**Course:** Database Management Systems (24CSE0209)  
**Date:** November 16, 2026  
**Revision:** Version 3.0 (Final Corrected Phase 2 Architecture)  

---

## 1. Evolution Overview (Version 1 $\to$ Version 2 $\to$ Version 3)

| Design Area | Version 1 (Baseline Stage B) | Version 2 (First Revision) | Version 3 (Final Corrected Phase 2) | Academic Justification / Resolution |
| :--- | :--- | :--- | :--- | :--- |
| **Defaulter Audit Deletion Behavior** | `ON DELETE CASCADE` | `ON DELETE CASCADE` | **`ON DELETE SET NULL`** | Deleting a student from master tables **cannot destroy historical audit compliance logs**! Immutable snapshot fields are permanently preserved. |
| **Academic Terms & Repeat Exams** | Not modeled | Not modeled | **`ACADEMIC_PERIODS` Entity & `academic_period_id` FK** | Permits repeated examinations across different terms (e.g. backlogs, improvements) while preventing duplicates within the same term via candidate key `(student_id, subject_key, exam_type, academic_period_id)`. |
| **Course Enrollment Integrity** | Inferred by semester match in code | `course_enrollments` associative entity | **`course_enrollments` + Enrollment-Gated Attendance** | Attendance can **only** be marked for a student actively enrolled in the course (`attendance_records` has FK to `course_enrollments(id)`). |
| **Multi-Session Attendance Support** | 1 session per date `(student_id, date, course)` | 1 session per date | **`ATTENDANCE_SESSIONS` Entity with `session_slot`** | Naturally supports multiple class sessions on the same date (e.g., Slot 1 Lecture at 09:00 AM and Slot 3 Practical Lab at 02:00 PM) without key collision. |
| **Department Duplication** | Plain text string `department` | `department_id` + string | **`department_id` (Authoritative) + Auto-Sync Trigger** | `department_id` is the single authoritative source of truth. Legacy string `department` is populated via trigger for backward compatibility, with an explicit 3-phase deprecation roadmap. |
| **Legacy Marks Architecture** | Ambiguously called "cached view" and "table" | Called "view/table" | **Explicitly a Physical Summary Cache Table** | Verified against `MarksServiceImpl.java` (line 50 calls `marksRepository.save(fresh)` which fails on SQL views). Kept in sync with `student_marks` via database triggers. |
| **Normalization Proofs** | Informal summary | Informal summary | **Formal Mathematical Proofs** | Formally defined relations, candidate keys $CK(R)$, and non-trivial functional dependencies $F(R)$; proved 1NF, 2NF, 3NF, and BCNF mathematically. |
| **Mermaid ER Diagram** | 10 entities | 12 entities | **14 Entities with Complete Relational Integrity** | Full diagram modeling all entities, cardinality indicators, and participation constraints. |
| **Source Code Verification** | Conceptual statements | Conceptual statements | **Line-by-Line Code Verification** | Inspected actual code in `StudentServiceImpl.java`, `MarksServiceImpl.java`, `CourseServiceImpl.java`, `AttendanceServiceImpl.java`, and `app.js` to prove zero breaking changes. |

---

## 2. Detailed Technical Breakdown of Version 3 Modifications

### A. Resolution 1: Defaulter Audit History (`ON DELETE SET NULL`)
- **Problem in Version 2:** If a student was deleted or withdrew, `ON DELETE CASCADE` on `defaulter_audit_log.student_id` purged all audit records involving that student. This violated regulatory requirements for immutable academic audit trails.
- **Correction in Version 3:**
  - Foreign key definition updated to:
    ```sql
    CONSTRAINT fk_defaulter_student FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
    ```
  - `student_id` is made `NULLABLE`.
  - The snapshot columns (`roll`, `student_name`, `department`, `attendance_percentage`, `classes_needed`, `reported_at`) are declared `NOT NULL`.
  - **Outcome:** If a student is deleted, `student_id` is set to `NULL`, but the complete audit record with their roll number, student name, department, attendance percentage, classes needed, and audit timestamp remains permanently preserved.

---

### B. Resolution 2: Student Marks and Academic Periods
- **Problem in Version 2:** The uniqueness constraint `UNIQUE(student_id, subject_key, exam_type)` precluded a student from taking the same subject examination in different semesters or academic years (e.g. improvement exam, backlog examination, or recurring subjects).
- **Correction in Version 3:**
  - Created entity `academic_periods` (`id`, `code`, `name`, `academic_year`, `semester_term`, `is_current`).
  - Added `academic_period_id INT NOT NULL` and `semester INT NOT NULL` to `student_marks`.
  - Updated candidate key:
    ```sql
    CONSTRAINT uk_student_subject_exam_period
        UNIQUE (student_id, subject_key, exam_type, academic_period_id)
    ```
  - **Outcome:** A student can have an `'Endterm'` evaluation in `computerScience` for `2026-ODD` and another evaluation for `2027-ODD`, while duplicate entries within the exact same academic term are strictly prevented.

---

### C. Resolution 3: Attendance and Course Enrollment Integrity
- **Problem in Version 2:**
  1. Attendance could theoretically be logged for a student without verifying their enrollment in that course.
  2. The unique key `(student_id, session_date, course_code)` prevented marking multiple sessions on the same date (e.g., a theory lecture in the morning and a lab in the afternoon).
- **Correction in Version 3:**
  - Introduced `attendance_sessions` representing the scheduled lecture slot:
    ```sql
    CONSTRAINT uk_course_session_slot UNIQUE (course_code, session_date, session_slot)
    ```
  - Introduced `attendance_records` linked directly to `session_id`, `student_id`, and `enrollment_id`:
    ```sql
    CONSTRAINT fk_att_rec_enrollment FOREIGN KEY (enrollment_id)
        REFERENCES course_enrollments(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uk_session_student UNIQUE (session_id, student_id)
    ```
  - **Outcome:** Attendance is physically gated on `course_enrollments(id)`, and multiple sessions per day are cleanly supported via `session_slot`.

---

### D. Resolution 4: Department Duplication & Single Source of Truth
- **Problem in Version 2:** Both `students.department_id` and `students.department` existed without a formally documented synchronization mechanism.
- **Correction in Version 3:**
  - Designated `department_id INT NOT NULL REFERENCES departments(id)` as the **single authoritative source of truth**.
  - Documented the database trigger `trg_sync_student_department_before_insert_update` that automatically maintains `students.department = departments.name` on write operations.
  - Published an explicit 3-phase deprecation roadmap to eliminate string duplication post-evaluation.

---

### E. Resolution 5: Legacy Marks as a Physical Summary Cache Table
- **Problem in Version 2:** The documentation referred to `marks` interchangeably as a "cached view" and a "physical table".
- **Correction in Version 3:**
  - Formally established that `marks` is a **Physical Summary Cache Table**, NOT an SQL view.
  - Verified against `MarksServiceImpl.java` (line 50 calls `marksRepository.save(fresh)` which requires an updatable table).
  - Documented trigger `trg_sync_student_marks_to_legacy` for real-time synchronization with `student_marks`.

---

### F. Resolution 6: Rigorous Mathematical Normalization Proofs
- **Problem in Version 2:** Normalization claims lacked formal candidate keys and functional dependency proofs.
- **Correction in Version 3:**
  - Formally listed candidate keys $CK(R)$ and non-trivial functional dependencies $F(R)$ for all relations.
  - Proved that all relations strictly satisfy 1NF, 2NF, 3NF, and BCNF.
  - Detailed the engineering rationale for intentional controlled denormalizations (`attendance` summary cache and `defaulter_audit_log` snapshot).
