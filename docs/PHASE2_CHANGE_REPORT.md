# CAMPUS HARMONY — PHASE 2 FINAL CHANGE REPORT (VERSION 5.0)

**Document:** Comprehensive Change Log & Design Evolution Report  
**Academic Context:** BE CSE Semester III, Batch 2025  
**Course:** Database Management Systems (24CSE0209) / Programming in Java (25CSE0202)  
**Date:** November 16, 2026  
**Revision:** Version 5.0 (Implementation-Readiness & Final Technical Verification)  

---

## 1. Evolution Overview (Baseline $\to$ Version 2 $\to$ Version 3 $\to$ Version 4 $\to$ Version 5)

| Technical Dimension | Version 1 (Baseline) | Version 2 | Version 3 | Version 4 | Version 5 (Implementation-Ready) | Academic / Engineering Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Attendance Enrollment Integrity** | Inferred by semester match in code | Independent FKs (`session_id`, `student_id`) | Independent FKs + `enrollment_id` | Composite Foreign Keys | **Composite FKs + Full Lifecycle Triggers + Concurrency Locks** | Mathematically guarantees session, enrollment, and attendance record share course and term; status gating on INSERT & UPDATE; blocks Dropping if attendance exists; InnoDB shared locks prevent race conditions. |
| **Attendance Summary Cache Sync** | No cache or loose writes | Loose writes | AFTER INSERT sync only | AFTER INSERT sync only | **Full DML Sync (INSERT, UPDATE, DELETE) + Cascade Mitigation + Audit Query** | Row triggers on INSERT, UPDATE, DELETE; symmetric student deletion + RESTRICT on session deletion; DQL reconciliation query verifying $total = present + absent$; self-healing stored procedure. |
| **Attendance Sessions Across Terms** | Reused course codes without term ID | No term ID | No term ID | Term ID Added | **`academic_period_id` + Slot Constraints** | Avoids course code collisions across academic years; constraint `(course_code, academic_period_id, session_date, session_slot)` supports multi-slot schedules. |
| **Audit Record Immutability** | `ON DELETE CASCADE` | `ON DELETE CASCADE` | `ON DELETE SET NULL` | Triggers + DCL | **`ON DELETE SET NULL` + Engine Triggers + DCL** | `BEFORE UPDATE` halts edits; `BEFORE DELETE` blocks ad-hoc deletion; DCL revokes privileges from app user. |
| **Normalization & BCNF Claims** | Claimed universal BCNF | Claimed universal BCNF | Acknowledged some caches | Partial distinction | **Rigorous Delineation: Core BCNF vs Physical 3NF** | Proves core relational projections achieve BCNF; refutes universal physical BCNF; thoroughly documents the 5 intentional engineering denormalizations. |
| **Department Field Authority** | String only | String + FK | String + FK | FK Authoritative | **`department_id` Authoritative + Auto-Sync Trigger** | `department_id` is the single source of truth; string mirror is auto-populated via trigger with a 3-phase deprecation roadmap. |
| **Legacy Marks Structure** | Ambiguous view/table | Called view/table | Physical cache table | Physical cache table | **Physical Summary Cache Table** | Verified against `MarksServiceImpl.java` (line 50 calls `.save(fresh)` requiring a physical table). Synchronized via trigger. |

---

## 2. Detailed Technical Breakdown of Version 4 Corrections

### A. Correction 1: Enforcing Genuine Attendance Enrollment Integrity
- **Flaw in Previous Versions:** Independent foreign keys for `session_id`, `enrollment_id`, and `student_id` permitted corrupted records where a student's attendance in `CS501` was marked against an enrollment in `EC701` from a different semester.
- **Relational Strategy:**
  - Implemented **Composite Foreign Keys**:
    1. In `course_enrollments`: Candidate key `uk_enrollment_composite (id, student_id, course_code, academic_period_id)`.
    2. In `attendance_sessions`: Candidate key `uk_session_composite (id, course_code, academic_period_id)`.
    3. In `attendance_records`:
       - `CONSTRAINT fk_att_rec_session_composite FOREIGN KEY (session_id, course_code, academic_period_id) REFERENCES attendance_sessions(id, course_code, academic_period_id) ON DELETE RESTRICT ON UPDATE CASCADE`
       - `CONSTRAINT fk_att_rec_enrollment_composite FOREIGN KEY (enrollment_id, student_id, course_code, academic_period_id) REFERENCES course_enrollments(id, student_id, course_code, academic_period_id) ON DELETE RESTRICT ON UPDATE CASCADE`
  - **Relational Proof:** The shared attributes `(course_code, academic_period_id)` must match across both parent tables simultaneously.

---

### B. Correction 2: Term-Aware Attendance Sessions (`academic_period_id`)
- Added `academic_period_id INT NOT NULL REFERENCES academic_periods(id) ON DELETE RESTRICT`.
- Added unique timetable slot constraint `uk_course_period_session_slot (course_code, academic_period_id, session_date, session_slot)` accommodating multiple lectures/labs per day without collision.

---

### C. Correction 3: Audit Snapshot Protection (Immutability Defense-in-Depth)
- `ON DELETE SET NULL` on `defaulter_audit_log.student_id`.
- Triggers `trg_prevent_defaulter_audit_update` and `trg_prevent_defaulter_audit_delete`.
- DCL privilege separation revoking `UPDATE` and `DELETE` from application database users.

---

## 3. Detailed Technical Breakdown of Version 5.0 Implementation-Readiness Corrections

### A. Correction 5: Enrollment Status Lifecycle Gating & Concurrency Control
1. **Validation on INSERT and UPDATE:**
   - Database triggers `trg_validate_attendance_enrollment_insert` and `trg_validate_attendance_enrollment_update` on `attendance_records` verify that `course_enrollments.status = 'Enrolled'`. Any attempt to record or modify attendance for a student whose enrollment is `'Dropped'` or `'Completed'` is aborted with `SIGNAL SQLSTATE '45000'`.
2. **Preventing Invalid Status Transitions on `course_enrollments`:**
   - Trigger `trg_validate_enrollment_status_transition` executes `BEFORE UPDATE ON course_enrollments`.
   - If an enrollment status transitions to `'Dropped'` while historical attendance records already exist (`EXISTS (SELECT 1 FROM attendance_records WHERE enrollment_id = OLD.id)`), the statement is rejected with SQLSTATE `45000`:
     *"Integrity Violation: Cannot drop course enrollment after attendance records have been logged. Historical records must be preserved; use formal withdrawal or retain enrollment record."*
3. **Historical Record Policy for Completed Courses:**
   - When an academic term concludes and final grades are posted, status transitions to `'Completed'`.
   - Historical attendance records remain preserved permanently as immutable archives. Further attendance insertions or modifications are blocked by engine triggers.
4. **Concurrency & Storage Engine Protection:**
   - The trigger issues `SELECT status FROM course_enrollments WHERE id = NEW.enrollment_id LOCK IN SHARE MODE`, acquiring an InnoDB shared lock.
   - If an administrative transaction concurrently attempts to drop the enrollment, it requires an exclusive lock (`FOR UPDATE`), which is blocked until the attendance transaction commits.
   - Once committed, the attendance records exist, causing the subsequent status update to trigger the validation block and fail safely.
   - Engine-level triggers cannot be bypassed by Spring Data JPA dirty checking or ad-hoc SQL.

---

### B. Correction 6: Full DML Summary Cache Synchronization & Cascade Handling
1. **Full DML Trigger Coverage:**
   - `trg_after_attendance_record_insert`: Increments `total_days` and increments `present_days` or `absent_days`.
   - `trg_after_attendance_record_update`: Corrects `present_days` and `absent_days` counters when an attendance mark changes status (e.g., Excused Absence adjusted to Present).
   - `trg_after_attendance_record_delete`: Decrements `total_days` and the corresponding status counter when a record is revoked.
2. **Mitigating MySQL Cascade Trigger Limitations:**
   - *Technical Limitation:* In MySQL InnoDB, cascaded foreign-key actions (`ON DELETE CASCADE`) do NOT activate child table triggers.
   - *Mitigation Architecture:*
     - **Symmetric Student Hard-Deletion:** `attendance` and `attendance_records` both link to `students(id)` with `ON DELETE CASCADE`. If a student is purged, InnoDB deletes both summary cache and detailed records atomically.
     - **Protected Session Deletion:** In `attendance_records`, foreign keys to `attendance_sessions` and `course_enrollments` specify `ON DELETE RESTRICT`, preventing accidental cascaded deletions.
     - **Controlled Deletion Stored Procedure:** Administrative session cancellations execute `sp_delete_attendance_session_controlled`, which explicitly deletes child attendance records in an isolated transaction so triggers update caches.
3. **Cache Reconciliation DQL Query:**
   - Standalone query in `docs/DATABASE_DESIGN.md` Section 4 compares `attendance` summary rows against live `COUNT(id)` and `SUM(...)` aggregates from `attendance_records`, validating that $total\_days = present\_days + absent\_days$ and flagging any drifted records.
4. **Self-Healing Stored Procedure:**
   - Procedure `sp_reconcile_attendance_cache(p_student_id)` provides one-click healing from source-of-truth logs.

---

### C. Correction 7: Formal Delineation of Normalization Claims
1. **Refutation of Universal Physical BCNF:**
   - Explicitly clarified that the physical deployment schema as a whole does NOT claim universal BCNF compliance.
2. **Mathematical Proof of Core Projections:**
   - Proved that the 11 normalized core relational projections (`departments`, `subjects`, `academic_periods`, `teachers`, `students_core`, `courses_core`, `course_enrollments`, `attendance_sessions`, `attendance_records`, `student_marks`, `activities`) satisfy BCNF because every determinant of a non-trivial functional dependency is a superkey.
3. **Intentional Denormalizations in Physical Schema:**
   - Fully documented the 5 deliberate engineering trade-offs (`students.department`, `courses.faculty`, `attendance`, `marks`, `defaulter_audit_log`), their normal form level (2NF or unnormalized cache), violating functional dependencies, and explicit justifications (backward compatibility with evaluated code, $O(1)$ dashboard reads, JPA `.save()`, and regulatory audit immutability).
