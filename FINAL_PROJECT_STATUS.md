# CampusHarmony — Final Project Status & Submission Report

**Date**: November 23, 2026  
**Git Branch**: `phase-4c`  
**Latest Commit**: `1405f08` (`feat(qa): complete Phase 4D final quality assurance, security review, and submission readiness`)  
**Overall Readiness**: **READY FOR COLLEGE DEMONSTRATION & UNIVERSITY EVALUATION**

---

## 1. Executive Summary

CampusHarmony is a full-stack, enterprise-grade Academic & Campus Management System developed for Chitkara University's BE CSE Semester III curriculum. It completely replaces simulated local-storage prototypes with a 3NF normalized MySQL database, secure Spring Boot REST APIs with HTTP-only session authentication and PBKDF2 hashing, and a responsive React frontend utilizing TanStack Router and Tailwind CSS.

All development through Phase 4D is complete. Development is frozen; no new features will be introduced.

---

## 2. Technology Stack

| Layer | Technologies & Frameworks | Key Capabilities |
| --- | --- | --- |
| **Front End** | React 18, Vite, TanStack Router, TanStack Start / Nitro, Tailwind CSS, Lucide Icons, Vitest, Testing Library | Single Page Architecture, type-safe routing, responsive layouts (390px–1920px), light/dark mode, accessible modals, controlled forms |
| **Back End** | Java 17, Spring Boot 3.2.5, Spring MVC, Spring JDBC (`JdbcTemplate`), Spring Security Cryptography (PBKDF2) | RESTful API controllers, role-based `@Access` interception, double-layer CSRF defense, transactional ACID concurrency control |
| **Database** | MySQL 8.0 Community / InnoDB | 3NF relational schema, foreign key cascade constraints, stored procedures, triggers, stored functions, analytical views, row-level locking (`FOR UPDATE`) |
| **Testing** | Vitest (frontend unit/workflow), JUnit 5 / Surefire (backend role access), PowerShell automated integration suites, Chrome/Webview browser automation | 37/37 Vitest tests passing, 7/7 backend access tests passing, 5/5 Spring Boot integration suites passing against disposable MySQL |

---

## 3. Final Features Matrix

### A. Authentication & Role-Based Workspaces
- Real server-backed session authentication using HTTP-only cookies with `SameSite=Strict`.
- Dedicated, role-tailored dashboards for **Administrator**, **Teacher**, and **Student**.
- Live dashboard metrics derived strictly from authenticated backend endpoints.

### B. Academic Foundation & Setup
- Institutional catalog hierarchy: Departments, Academic Terms, Subjects, Courses, and Sections.
- Dependent offering assignment forms (`AssignOfferingForm`) preventing invalid cross-department faculty or course bindings.
- Atomic section member enrollment preserving genuine database enrollment IDs (`course_enrollments.id`).

### C. Attendance Management
- Lecture session scheduling with overlap and collision prevention.
- Roster loading with real student identity mapping.
- Live attendance counters (`Total`, `Present`, `Absent`, `Unmarked`).
- One-click bulk attendance actions (`Mark All Present`, `Mark All Absent`, `Clear`).
- Responsive roster search filtering (`Search by name or roll…`) preserving complete enrollment payloads.
- Incomplete roster submission guards client-side and server-side.
- Attendance corrections workflow with audit reason tracking and history logging (`attendance_corrections_audit`).

### D. Marks & Evaluations Management
- Continuous assessment creation (`CA-1`, `CA-2`, `Midterm`, `End-Semester`, `Quiz`, `Practical`) with max mark validations.
- Deep-linked `/marks?offeringId=...` route support.
- Live roster counters (`Enrolled`, `Evaluated`, `Unscored`).
- Student roster search filter with dirty-state tracking (`Unsaved changes` warning).
- Distinction between unrecorded scores (`Unscored`) and explicit zero marks.
- Redundant audit row suppression: identical scores/remarks are not re-logged.
- Automated letter grade computation (`A+` to `F`) via MySQL stored function `fn_calculate_grade` and triggers.

### E. Professional Weekly Timetable
- Conflict-free timetable engine: prevents section overlaps, teacher double-booking, and classroom collisions using row locks.
- Teacher fast-track attendance conduction: one-click `"Conduct"` and completed lecture `"View Roster"` navigation.
- Student weekly schedule view and dedicated mobile day selector (`[Mon] [Tue] [Wed] [Thu] [Fri] [Sat]`).

### F. Attendance Analytics & Defaulters
- Real-time attendance percentage computation excluding cancelled or unconducted lectures.
- Institutional threshold configuration (default: 75%).
- Student standing badges (`Good Academic Standing` vs `Attendance Defaulter Warning`).
- Shortfall lecture recovery calculations via database view `v_attendance_defaulters`.

### G. Student Grievance & Complaints Portal
- Secure student grievance submission with unique reference codes (`GRV-YYYY-XXXXXX`).
- Student ownership enforcement: students view only their own filed complaints.
- Administrative status progression (`Open` → `In Progress` → `Resolved` → `Closed`).
- Official administrative responses and full chronological activity timeline.

---

## 4. Setup & Launch Instructions

### Prerequisites
- **Node.js**: v18.x or v20.x
- **Java JDK**: 17 or higher
- **Maven**: 3.8+ (or included `mvnw`)
- **MySQL**: 8.0 Server
- **OS**: Windows PowerShell (Windows 10/11)

### Option A: Standard Production / Local Execution

1. **Database Setup**:
   Create the database and apply the 5 sequential migrations:
   ```powershell
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS campus_harmony;"
   mysql -u root -p campus_harmony < database/migrations/006_academic_foundation.sql
   mysql -u root -p campus_harmony < database/migrations/007_evaluations_management.sql
   mysql -u root -p campus_harmony < database/migrations/008_timetable_scheduling.sql
   mysql -u root -p campus_harmony < database/migrations/009_attendance_analytics.sql
   mysql -u root -p campus_harmony < database/migrations/010_student_complaints.sql
   ```

2. **Configure Environment Variables**:
   ```powershell
   $env:CAMPUS_DB_USER = "root"
   $env:CAMPUS_DB_PASSWORD = "YourPassword"
   ```

3. **Start Spring Boot Backend** (Port 8080):
   ```powershell
   cd backend
   .\mvnw.cmd spring-boot:run
   ```

4. **Start React Frontend** (Port 5173):
   ```powershell
   cd frontend
   npm install
   npm run dev -- --host 127.0.0.1
   ```
   Open `http://127.0.0.1:5173/` in any modern web browser.

---

### Option B: One-Command Disposable Evaluation Verification Lab
Runs the automated verification suite against an isolated, disposable MySQL instance on Windows:
```powershell
.\backend\verify-foundation.ps1 -Browser
```
This script initializes an isolated database, applies all migrations, seeds test administrative and academic records, executes the test suites, and serves both backend (8080) and frontend (5173) for interactive examination.

---

## 5. Verified Test Results

| Test Suite | Framework / Environment | Scope | Result |
| --- | --- | --- | --- |
| **Frontend Unit & Route Tests** | Vitest 4.1.12 / jsdom | 12 test files, 37 test cases | **37 passed (100%)** |
| **Frontend Production Build** | Vite 8.3.8 + Nitro SSR | 155 client modules, 98 SSR modules | **BUILD SUCCESS (0 errors)** |
| **Backend Role Access Tests** | JUnit 5 / Maven Surefire | 5 test classes (`FoundationAccessTests`, `MarksAccessTests`, `TimetableAccessTests`, `AnalyticsAccessTests`, `ComplaintAccessTests`) | **7 passed, 0 failures (`BUILD SUCCESS`)** |
| **Backend Integration Suites** | Spring Boot Test / MySQL | 5 workflow suites (`FoundationWorkflowIT`, `MarksWorkflowIT`, `TimetableWorkflowIT`, `AnalyticsWorkflowIT`, `ComplaintWorkflowIT`) | **5 passed, 0 failures (`BUILD SUCCESS`)** |
| **Live Browser Workflow Walkthrough** | Chrome / Webview Automation | End-to-end multi-role lifecycle (Admin → Teacher → Student → Admin) | **100% verified** |
| **Responsive Layouts** | Viewport Emulation | 390px, 768px, 1366px, 1920px | **0px document horizontal overflow** |

---

## 6. Database Schema & Migration Architecture

The database follows Third Normal Form (3NF) across 5 versioned SQL migrations in `database/migrations/`:

```
database/migrations/
├── 006_academic_foundation.sql     # Core academic structure, sections, offerings, enrollments, sessions, accounts
├── 007_evaluations_management.sql  # Assessments, marks, audit, grade stored function & insert/update triggers
├── 008_timetable_scheduling.sql    # Weekly routine slots, periods, rooms, day-of-week
├── 009_attendance_analytics.sql    # Attendance views, defaulters procedure, transcript procedure
└── 010_student_complaints.sql      # Student grievance categories, complaints, activity timeline, resolution tracking
```

### Relational Schema Summary:
- **`departments` & `subjects`**: Department codes and curricular subject catalog.
- **`academic_periods`**: Semesters and calendar terms (`TERM_2026_ODD`).
- **`sections` & `section_members`**: Cohort grouping per semester.
- **`course_offerings`**: Relational junction connecting section, course, and assigned faculty with `UNIQUE(section_id, course_code)`.
- **`course_enrollments`**: Real student enrollment records (`enrollment_id`).
- **`attendance_sessions` & `attendance_records`**: Lecture session tracking with `status` (`Scheduled`, `Completed`, `Cancelled`) and atomic student attendance (`Present`, `Absent`).
- **`attendance_corrections_audit`**: Audit trail of every post-submission attendance alteration.
- **`assessments` & `assessment_marks`**: Evaluated scores with `CHECK (marks_obtained >= 0 AND marks_obtained <= max_marks)`.
- **`assessment_marks_audit`**: Audit history tracking mark modifications.
- **`timetable_entries`**: Weekly schedule routines with collision prevention.
- **`student_complaints` & `complaint_activity_log`**: Institutional grievance lifecycle.

---

## 7. Screenshot Evidence Locations

All screenshot evidence captured during live browser automation has been staged and preserved:

- **Browser Evidence Directory**:  
  `C:\Users\aksha\.gemini\antigravity\brain\59c36e1b-3352-4da2-8ad9-9874ab051942\browser_evidence\aef26641-1e7a-4217-a4da-31a85f34e15b\`
- **Milestone Screenshots**:
  - `final_step_298.png`: Resolved Student Grievance Modal & Timeline
  - `step_263_shot_1_teacher_attendance_corrected.png`: Teacher Attendance Roster & Correction Save
  - `step_271_shot_1_teacher_marks_updated.png`: Teacher Marks Evaluation with Unsaved Indicator
  - `step_273_shot_1_teacher_timetable_view.png`: Teacher Schedule with "View Roster" Conduction Button
  - `step_284_shot_1_student_dashboard_overview.png`: Authenticated Student Dashboard Overview
  - `step_284_shot_2_student_dashboard_attendance_table.png`: Subject-Wise Attendance Breakdown
  - `step_286_shot_1_student_timetable_batch3.png`: Student Weekly Master Timetable
  - `step_290_shot_1_student_marks_report_batch3.png`: Student Academic Performance & Letter Grades
  - `step_292_shot_1_student_defaulters_batch3.png`: Student Defaulter Standing & Recovery Projection
  - `step_296_shot_1_student_complaint_modal_batch3.png`: Student Grievance Resolution Audit Details

---

## 8. Remaining Blockers & Limitations

- **Genuine Blockers**: **NONE**. There are zero application defects, build failures, broken routes, or blocking issues.
- **Intentional Scope Boundaries**:
  - Payment processing and external SMS/email gateways are omitted by academic design.
  - Large client bundle chunks (>500 kB) trigger a standard Vite warning; this does not affect functionality or execution.

---

## 9. Conclusion & Demonstration Readiness

> [!IMPORTANT]
> **College Demonstration Readiness**: **CONFIRMED & READY**.
> The CampusHarmony repository is completely stable, fully integrated, and verified across all academic tracks (Front End Engineering-II, Database Management System, Programming in Java). All core workflows demonstrate real database persistence, transactional integrity, and responsive design across desktop, tablet, and mobile displays.
