# CAMPUS HARMONY — PHASE 2 FINAL CHANGE REPORT (VERSION 4.0)

**Document:** Comprehensive Change Log & Design Evolution Report  
**Academic Context:** BE CSE Semester III, Batch 2025  
**Course:** Database Management Systems (24CSE0209) / Programming in Java (25CSE0202)  
**Date:** November 16, 2026  
**Revision:** Version 4.0 (Final Technical Corrections)  

---

## 1. Evolution Overview (Baseline $\to$ Version 2 $\to$ Version 3 $\to$ Version 4)

| Technical Dimension | Version 1 (Baseline) | Version 2 | Version 3 | Version 4 (Final Corrected) | Academic / Engineering Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Attendance Enrollment Integrity** | Inferred by semester match in code | Independent FKs (`session_id`, `student_id`) | Independent FKs + `enrollment_id` | **Composite Foreign Keys** | Mathematically guarantees session, enrollment, and attendance record share the exact same course and term; gating trigger blocks `'Dropped'`/`'Completed'`. |
| **Attendance Sessions Across Terms** | Reused course codes without term ID | No term ID | No term ID | **`academic_period_id` Added** | Avoids course code collisions across academic years; constraint `(course_code, academic_period_id, session_date, session_slot)` supports multi-slot schedules. |
| **Audit Record Immutability** | `ON DELETE CASCADE` | `ON DELETE CASCADE` | `ON DELETE SET NULL` | **`ON DELETE SET NULL` + Defense-in-Depth Triggers** | `BEFORE UPDATE` halts edits; `BEFORE DELETE` blocks ad-hoc deletion; DCL revokes privileges from app user. |
| **Normalization & BCNF Claims** | Claimed universal BCNF | Claimed universal BCNF | Acknowledged some caches | **Rigorous Formal Delineation** | Formally proved BCNF for core normalized models; explicitly documented functional dependencies causing 2NF/denormalization for pragmatic compatibility caches. |
| **Department Field Authority** | String only | String + FK | String + FK | **`department_id` Authoritative + Auto-Sync Trigger** | `department_id` is the single source of truth; string mirror is auto-populated via trigger with a 3-phase deprecation roadmap. |
| **Legacy Marks Structure** | Ambiguous view/table | Called view/table | Physical cache table | **Physical Summary Cache Table** | Verified against `MarksServiceImpl.java` (line 50 calls `.save(fresh)` requiring a physical table). Synchronized via trigger. |

---

## 2. Detailed Technical Breakdown of Version 4 Corrections

### A. Correction 1: Enforcing Genuine Attendance Enrollment Integrity
- **Flaw in Previous Versions:** Independent foreign keys for `session_id`, `enrollment_id`, and `student_id` permitted corrupted records where a student's attendance in `CS501` was marked against an enrollment in `EC701` from a different semester.
- **Relational Strategy in Version 4:**
  - Implemented **Composite Foreign Keys**:
    1. In `course_enrollments`: Candidate key `uk_enrollment_composite (id, student_id, course_code, academic_period_id)`.
    2. In `attendance_sessions`: Candidate key `uk_session_composite (id, course_code, academic_period_id)`.
    3. In `attendance_records`:
       - `CONSTRAINT fk_att_rec_session_composite FOREIGN KEY (session_id, course_code, academic_period_id) REFERENCES attendance_sessions(id, course_code, academic_period_id) ON DELETE CASCADE ON UPDATE CASCADE`
       - `CONSTRAINT fk_att_rec_enrollment_composite FOREIGN KEY (enrollment_id, student_id, course_code, academic_period_id) REFERENCES course_enrollments(id, student_id, course_code, academic_period_id) ON DELETE CASCADE ON UPDATE CASCADE`
  - **Relational Proof:** The shared attributes `(course_code, academic_period_id)` must match across both parent tables simultaneously.
  - **Enrollment Status Gating:** Trigger `trg_validate_attendance_enrollment_status` inspects `course_enrollments.status` and aborts with SQLSTATE `45000` if the student is `'Dropped'` or `'Completed'`.

---

### B. Correction 2: Term-Aware Attendance Sessions (`academic_period_id`)
- **Problem:** Course codes like `CS501` are offered year after year across multiple academic periods.
- **Correction in Version 4:**
  - Added `academic_period_id INT NOT NULL REFERENCES academic_periods(id) ON DELETE RESTRICT`.
  - Added unique timetable slot constraint:
    ```sql
    CONSTRAINT uk_course_period_session_slot
        UNIQUE (course_code, academic_period_id, session_date, session_slot)
    ```
  - This allows multiple slots per day (e.g., Slot 1 Lecture at 09:00 AM and Slot 3 Practical Lab at 02:00 PM) while preventing slot collision in the same term.

---

### C. Correction 3: Rigorous Normalization & BCNF Delineation
- **Problem:** Previous versions claimed universal BCNF across all tables while simultaneously retaining `students.department` and `courses.faculty`.
- **Correction in Version 4:**
  - We explicitly separate relations into two groups:
    1. **Core Relational Models (Strictly in BCNF):** `departments`, `subjects`, `academic_periods`, `teachers`, `students_core`, `courses_core`, `course_enrollments`, `attendance_sessions`, `attendance_records`, `student_marks`.
    2. **Pragmatic Compatibility Caches & Intentional Denormalizations:**
       - `students.department`: Transitive functional dependency $\text{department\_id} \to \text{department}$ violates 3NF/BCNF; retained intentionally as an interim read-compatibility mirror for evaluated frontend code with trigger synchronization.
       - `courses.faculty`: Transitive functional dependency $\text{teacher\_id} \to \text{faculty}$ violates 3NF/BCNF; retained intentionally as an interim display cache.
       - `attendance`: Aggregate cache violating 3NF retained for $O(1)$ dashboard reads.
       - `marks`: Legacy physical cache table violating 1NF/3NF retained because Spring Boot JPA `MarksServiceImpl` performs `.save(marks)`.
       - `defaulter_audit_log`: Historical snapshot intentionally violating 3NF/BCNF to prevent retroactive mutation of compliance records when master student records change.

---

### D. Correction 4: Audit Snapshot Protection (Immutability Defense-in-Depth)
- **Problem:** `ON DELETE SET NULL` prevents records from vanishing when students are deleted, but does not prevent direct `UPDATE` or `DELETE` statements.
- **Correction in Version 4:**
  - **Engine-Level Trigger Immutability:**
    - `trg_prevent_defaulter_audit_update`: Halts any `UPDATE` on `defaulter_audit_log` with SQLSTATE `45000`.
    - `trg_prevent_defaulter_audit_delete`: Halts ad-hoc `DELETE` unless session authorization token `@ALLOW_AUDIT_PURGE = TRUE` is set (used only by automated batch regeneration).
  - **DCL Privilege Revocation:**
    ```sql
    REVOKE UPDATE, DELETE ON campus_harmony.defaulter_audit_log FROM 'campus_app'@'localhost';
    GRANT SELECT, INSERT ON campus_harmony.defaulter_audit_log TO 'campus_app'@'localhost';
    ```
