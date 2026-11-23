# CampusHarmony — Development Handoff & Architecture Log

## Overview & System State
- **Project**: CampusHarmony (Academic & Campus Management System)
- **Academic Context**: BE CSE Batch 2025, Semester III, Chitkara University, Punjab, India.
- **Evaluation Tracks**:
  1. Front End Engineering-II (React, Vite, TanStack Router, Context API, responsive Tailwind CSS, Vitest)
  2. Database Management System (MySQL 8.0, normalized relational schema, foreign keys, stored procedures, triggers, views, ACID transactions)
  3. Programming in Java (Spring Boot 3.2.5, REST APIs, session management, PBKDF2 password hashing, JDBC/JPA, transactions, custom exceptions)

---

## Phase 1 Milestone Verification (COMPLETED)

### Objective
One genuine admin-created teacher can log in, view their assigned academic course offerings, access real student enrollments (with true database enrollment IDs), schedule authorized lecture sessions, and record persistent lecture-wise attendance that calculates live subject-wise attendance for students across restarts.

### Key Achievements
- **Server-Backed Authentication**: Replaced simulated localStorage teacher object with server-backed HTTP-only cookie sessions and PBKDF2 password hashing.
- **Relational Academic Foundation (`006_academic_foundation.sql`)**: Implemented `sections`, `section_members`, `course_offerings`, `accounts`, and linked `offering_id` to enrollments and attendance sessions.
- **Teacher Course & Attendance Operations**: Teacher scoped to assigned sections and course offerings; attendance roster uses real enrollment IDs; atomic transactions.
- **Live Attendance Calculation**: Live percentage calculation with NULL distinction for unmarked courses.

---

## Phase 2A Milestone: Marks & Evaluations Management (COMPLETED)

### Objective
Create a complete, course-wise Marks & Evaluations Management system connected to real teachers, students, course offerings, and MySQL records. Prevent fake/hardcoded scores, support dynamic assessments (CA-1, CA-2, Midterm, End-Semester, Quiz, Practical), enforce strict score validations, maintain an audit log for mark modifications, compute letter grades via database stored functions, provide role-tailored UIs, and verify full persistence across application restarts.

### 1. Database Architecture & Migrations (`database/migrations/007_evaluations_management.sql`)
- **`assessments` table**:
  - `id` (BIGINT PRIMARY KEY AUTO_INCREMENT)
  - `offering_id` (BIGINT NOT NULL, FK -> `course_offerings(id)` ON DELETE CASCADE)
  - `academic_period_id` (INT NOT NULL, FK -> `academic_periods(id)`)
  - `course_code` (VARCHAR(20) NOT NULL, FK -> `courses(code)`)
  - `teacher_id` (VARCHAR(30) NOT NULL, FK -> `teachers(id)`)
  - `title` (VARCHAR(100) NOT NULL)
  - `assessment_type` (VARCHAR(50) NOT NULL: `CA-1`, `CA-2`, `Midterm`, `End-Semester`, `Quiz`, `Practical`)
  - `max_marks` (DECIMAL(5,2) NOT NULL, `CHECK (max_marks > 0)`)
  - `assessment_date` (DATE NOT NULL)
  - `UNIQUE KEY uk_offering_assessment_title (offering_id, title)`: guarantees distinct assessment titles within any course offering.
- **`assessment_marks` table**:
  - `id` (BIGINT PRIMARY KEY AUTO_INCREMENT)
  - `assessment_id` (BIGINT NOT NULL, FK -> `assessments(id)` ON DELETE CASCADE)
  - `enrollment_id` (BIGINT NOT NULL, FK -> `course_enrollments(id)` ON DELETE CASCADE)
  - `student_id` (BIGINT NOT NULL, FK -> `students(id)` ON DELETE CASCADE)
  - `marks_obtained` (DECIMAL(5,2) NOT NULL)
  - `max_marks` (DECIMAL(5,2) NOT NULL)
  - `grade` (VARCHAR(5) NULL)
  - `remarks` (VARCHAR(100) NULL)
  - `UNIQUE KEY uk_assessment_student (assessment_id, student_id)`: prevents duplicate mark entries for the same student and assessment.
  - `CONSTRAINT chk_obtained_marks_range CHECK (marks_obtained >= 0 AND marks_obtained <= max_marks)`
- **`assessment_marks_audit` table**:
  - `id` (BIGINT PRIMARY KEY AUTO_INCREMENT)
  - `mark_id` (BIGINT NOT NULL)
  - `assessment_id` (BIGINT NOT NULL)
  - `student_id` (BIGINT NOT NULL)
  - `old_marks` (DECIMAL(5,2) NULL)
  - `new_marks` (DECIMAL(5,2) NOT NULL)
  - `changed_by` (VARCHAR(80) NOT NULL)
  - `action_type` (VARCHAR(20) NOT NULL: `INSERT`, `UPDATE`)
  - `reason` (VARCHAR(255) NULL)
  - `changed_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- **DBMS Triggers**:
  - `trg_assessment_marks_grade_ins`: BEFORE INSERT trigger calling evaluated DBMS stored function `fn_calculate_grade(marks_obtained, max_marks)` to assign `A+`, `A`, `B`, `C`, `D`, or `F`.
  - `trg_assessment_marks_grade_upd`: BEFORE UPDATE trigger recalculating letter grades upon score edits.
- **Reporting View (`v_course_assessment_performance`)**:
  - Relational aggregation joining `assessments`, `course_offerings`, `courses`, `sections`, `teachers`, `academic_periods`, and `assessment_marks`.
  - Computes `submissions_count`, `avg_marks`, `min_marks`, `max_marks_obtained`, and `avg_percentage`.

### 2. Backend REST APIs (`AcademicMarksController.java`)
- `GET /api/academic/offerings/{offeringId}/assessments` (`@Access({"teacher","admin"})`): List assessments with submission counts and average scores.
- `POST /api/academic/offerings/{offeringId}/assessments` (`@Access({"teacher","admin"})`): Create assessment; validates offering ownership, maxMarks > 0, unique title.
- `GET /api/academic/assessments/{assessmentId}/roster` (`@Access({"teacher","admin"})`): Returns enrolled student roster with saved marks (`is_saved`), grade, remarks, and null scores for unscored students.
- `POST /api/academic/assessments/{assessmentId}/marks` (`@Access({"teacher","admin"})`): Batch marks entry/update; validates ranges [0, maxMarks], enrollment existence, prevents payload duplicates, updates or inserts records atomically in a transaction, and writes audit log to `assessment_marks_audit`.
- `GET /api/academic/assessments/{assessmentId}/stats` (`@Access({"teacher","admin"})`): Real-time class analytics (average score, highest, lowest, average %, grade distribution).
- `GET /api/academic/my-marks` (`@Access("student")`): Student personal grades query, strictly scoped to authenticated `user.studentId()`.
- `GET /api/academic/admin/marks-reports` (`@Access("admin")`): Comprehensive institutional evaluation report from `v_course_assessment_performance`.

### 3. Frontend Interface (`frontend/src/routes/marks.jsx`)
- **Teacher View**:
  - Section & course offering selector scoped to teacher's assignments.
  - Assessment cards list with submission counters and "+ Create Assessment" modal (Title, Type, Max Marks, Date).
  - Enrolled student grading table with numeric score inputs, real-time grade calculation, optional feedback remarks, and save status pills.
  - Class performance statistics card (average, highest, lowest, grade distribution chips).
  - Audit note input for change tracking.
- **Student View**:
  - Organized report card grouped by semester and course.
  - Displays course aggregates, assessment titles, exam types, dates, scores / max, percentages, letter grade badges, and teacher feedback.
  - Empty state when no marks have been recorded.
- **Administrator View**:
  - Filterable institutional overview displaying course, section, instructor, assessment title, max marks, submissions count, class average, and score ranges.
- **Navigation**:
  - Accessible via Sidebar for all roles (`Class Attendance` and `Marks & Evaluations` for teachers; `My Attendance` and `My Marks & Grades` for students; full suite for admin).
  - Unlocked in `AppLayout.jsx` foundation routes.

---

## Phase 2B Milestone: Professional Timetable & Lecture Scheduling (COMPLETED)

### Objective
Build a practical, weekly recurring timetable and lecture scheduling system for Admin, Teacher, and Student roles, integrated with MySQL relational schemas, course offerings, teacher assignments, and the existing lecture-wise attendance module.

### 1. Database Architecture & Migrations (`database/migrations/008_timetable_scheduling.sql`)
- **`timetable_entries` table**:
  - `id` (BIGINT PRIMARY KEY AUTO_INCREMENT)
  - `academic_period_id` (INT NOT NULL, FK -> `academic_periods(id)`)
  - `section_id` (BIGINT NOT NULL, FK -> `sections(id, academic_period_id)`)
  - `offering_id` (BIGINT NOT NULL, FK -> `course_offerings(id, course_code, academic_period_id)`)
  - `course_code` (VARCHAR(20) NOT NULL, FK -> `courses(code)`)
  - `teacher_id` (VARCHAR(30) NOT NULL, FK -> `teachers(id)`)
  - `day_of_week` (ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL)
  - `period_number` (INT NOT NULL, `CHECK (period_number BETWEEN 1 AND 10)`)
  - `start_time` (TIME NOT NULL)
  - `end_time` (TIME NOT NULL, `CHECK (start_time < end_time)`)
  - `room` (VARCHAR(50) NULL)
  - `is_active` (TINYINT(1) NOT NULL DEFAULT 1)
  - `active_status` (`TINYINT GENERATED ALWAYS AS (IF(is_active = 1, 1, NULL)) STORED`)
  - `active_room` (`VARCHAR(80) GENERATED ALWAYS AS (IF(is_active = 1 AND room IS NOT NULL AND TRIM(room) != '', CONCAT(LOWER(TRIM(room)), ':', period_number, ':', day_of_week), NULL)) STORED`)
- **Database-Level Conflict Prevention**:
  - `UNIQUE KEY uk_tt_section_slot (academic_period_id, section_id, day_of_week, period_number, active_status)`: prevents section double-booking at database engine level while allowing inactive slots.
  - `UNIQUE KEY uk_tt_teacher_slot (academic_period_id, teacher_id, day_of_week, period_number, active_status)`: prevents teacher double-booking at database engine level.
  - `UNIQUE KEY uk_tt_room_slot (academic_period_id, active_room)`: prevents room collisions for simultaneous active lectures.
- **`v_weekly_timetable` View**:
  - Fully joined reporting view combining `timetable_entries`, `academic_periods`, `sections`, `departments`, `course_offerings`, `courses`, and `teachers`.

### 2. Backend REST APIs (`AcademicTimetableController.java`)
- `POST /api/academic/timetable` (`@Access("admin")`): Schedule recurring lecture slot; executes multi-level conflict engine (section overlap, teacher overlap, room collision, period bounds, start < end) and returns 409 Conflict with descriptive message on collisions.
- `PUT /api/academic/timetable/{id}` (`@Access("admin")`): Update slot timing, day, room, or active status with self-excluding conflict validation.
- `DELETE /api/academic/timetable/{id}` (`@Access("admin")`): Remove timetable entry.
- `GET /api/academic/timetable/section/{sectionId}` (`@Access({"admin","teacher","student"})`): Section weekly schedule; students restricted to their enrolled section.
- `GET /api/academic/timetable/teacher-schedule/{teacherId}` (`@Access("admin")`): Administrator faculty-wise timetable view.
- `GET /api/academic/timetable/my-schedule` (`@Access({"teacher","student"})`): Personal weekly schedule dynamically filtered to authenticated teacher's offerings or student's section enrollment.
- `GET /api/academic/timetable/today` (`@Access({"teacher","student"})`): Today's lectures correlated with live attendance conduction state (`Scheduled`, `In Progress`, `Completed`, `Cancelled`).
- `POST /api/academic/timetable/{id}/conduct` (`@Access("teacher")`): Fast-tracks recurring timetable slot into an active `attendance_sessions` instance; allows instant attendance marking.
- `POST /api/academic/timetable/cancel-lecture` (`@Access({"teacher","admin"})`): Mark an individual lecture date/slot cancelled with recorded reason.

### 3. Frontend Interface (`frontend/src/routes/timetable.jsx`)
- **Admin Management View**:
  - Section vs Faculty schedule view switch.
  - Complete Monday–Saturday x Periods 1–8 master timetable grid.
  - "+ Schedule Lecture Slot" modal with offering selector, period picker, time auto-fill, room input, and conflict alert display.
- **Teacher View**:
  - Prominent "Today's Lectures" banner with period number, time, course, section, room, and live conduction badge.
  - One-click "Conduct" button that creates/links the attendance session and navigates to the attendance marking roster.
  - "Cancel Lecture" button to record session cancellation with justification.
  - Full weekly teaching grid.
- **Student View**:
  - "Today's Lectures" overview with room, timing, and instructor information.
  - Clean, read-only 6-day weekly class timetable grid.
- **Navigation**:
  - Registered in `Sidebar.jsx` for Admin, Teacher, and Student roles with `Clock` icon.
  - Whitelisted in `AppLayout.jsx` foundation routes.

---

## Verified Test Results

### 1. Backend Security & Role Access (`FoundationAccessTests`, `MarksAccessTests`, `TimetableAccessTests`)
- Verified unauthenticated requests return 401.
- Verified missing CSRF headers on mutation POSTs return 403.
- Verified students cannot create assessments, submit marks, or create timetable slots (403).
- Verified teachers can create assessments, submit marks, conduct assigned timetable lectures, and cancel lectures (200).
- Verified students can access `/my-marks`, `/my-attendance`, `/academic/timetable/my-schedule`, and `/academic/timetable/today` (200).
- **Result: 5 / 5 access tests PASSED (`BUILD SUCCESS`)**

### 2. End-to-End Disposable MySQL Integration (`verify-foundation.ps1`)
- Runs `FoundationWorkflowIT`, `MarksWorkflowIT`, and `TimetableWorkflowIT` against an isolated MySQL 8.0 instance:
  1. Admin provisions department, subject, term, sections, courses, and teacher accounts.
  2. Course offerings assigned; student enrolled in section.
  3. Admin creates recurring timetable slot (Monday Period 1 in Room LH-201).
  4. Time range validation verified (rejects start time >= end time with 400).
  5. Section conflict detection verified: rejects overlapping lecture for same section in same period (409 Conflict).
  6. Teacher conflict detection verified: rejects scheduling busy teacher for another section in same period (409 Conflict).
  7. Room conflict detection verified: rejects booking occupied room for another section in same period (409 Conflict).
  8. Valid second slot (Monday Period 2) created.
  9. Retrieval verified: section schedule, student personal schedule, and teacher personal schedule.
  10. Teacher conducts lecture from timetable slot: creates `attendance_sessions` instance with status `Scheduled`.
  11. Unauthorized teacher attempt to conduct another faculty's slot rejected (403).
  12. Teacher loads student roster and records attendance (`Present`).
  13. Student verifies attendance reflects conducted lecture (1 lecture, 1 present, 100.0%).
  14. Teacher cancels a lecture slot with justification ("Guest Faculty Seminar").
  15. Spring Boot restart persistence test: Student logs in against fresh application context and verifies timetable schedule and attendance records persist intact across application restarts.
- **Result: 3 / 3 integration test suites PASSED (`BUILD SUCCESS`, 0 failures, 0 errors, time: 20.3s)**

### 3. Frontend Vitest Automated Test Suite (`npm test`)
- `src/test/Timetable.test.jsx`:
  - Teacher view: loads assigned schedule, displays today's lectures with room and period, and conducts lecture.
  - Student view: displays personal class timetable in read-only weekly grid.
  - Admin view: opens scheduling modal, selects offering, and submits new lecture slot.
- Total Vitest Suite: 9 test files, 26 passed tests.
- **Result: 26 / 26 tests PASSED (100% pass rate)**

### 4. Frontend Production Build (`npm run build`)
- Client bundle: 435.56 kB JS (132.5 kB gzip), 49.45 kB CSS.
- SSR bundle: 97 modules transformed.
- Zero errors, route `/timetable` registered in TanStack Router.
- **Result: PASSED**

---

## File Inventory & Changes for Phase 2B

| Area | Modified / Added Files |
| --- | --- |
| **Database Migrations** | `database/migrations/008_timetable_scheduling.sql`, `backend/verify-foundation.ps1` |
| **Backend Controllers & Security** | `com.campusharmony.controller.AcademicTimetableController` |
| **Backend Tests** | `com.campusharmony.TimetableAccessTests`, `com.campusharmony.TimetableWorkflowIT` |
| **Frontend Navigation & Layout** | `frontend/src/components/layout/AppLayout.jsx`, `frontend/src/components/layout/Sidebar.jsx` |
| **Frontend Timetable Routes & Client** | `frontend/src/lib/api.js`, `frontend/src/routes/timetable.jsx`, `frontend/src/routeTree.gen.ts` |
| **Frontend Tests** | `frontend/src/test/Timetable.test.jsx` |
| **Documentation** | `docs/DEVELOPMENT_HANDOFF.md` |

---

## Phase 2C Milestone: Attendance Analytics & Defaulter Management (COMPLETED)

### Objective
Develop a complete, reliable, real-data Attendance Analytics and Defaulter Management System across Admin, Teacher, and Student roles. All statistics are calculated dynamically from actual persisted, non-cancelled attendance sessions conducted on or after each student's enrollment date. No artificial or hardcoded percentages are permitted.

### 1. Database Architecture & Migrations (`database/migrations/009_attendance_analytics.sql`)
- **`academic_settings` table**:
  - `setting_key` (VARCHAR(50) PRIMARY KEY)
  - `setting_value` (VARCHAR(255) NOT NULL)
  - `description` (TEXT NULL)
  - `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
  - Seeded initial threshold: `attendance_defaulter_threshold = '75.0'`.
- **DBMS Stored Function (`fn_calculate_attendance_shortfall`)**:
  - Implements the mathematical formula:
    $$x = \left\lceil \frac{T \cdot C - 100 \cdot P}{100 - T} \right\rceil$$
    where $T$ is the threshold percentage, $C$ is eligible conducted lectures, and $P$ is attended lectures. Returns 0 if already meeting threshold or if no lectures conducted.
- **Relational View (`v_student_course_attendance`)**:
  - Joins `course_enrollments`, `students`, `course_offerings`, `courses`, `sections`, `academic_periods`, `attendance_sessions`, and `attendance_records`.
  - Filters strictly to `session_date >= e.enrollment_date`, `e.status = 'Enrolled'`, and excludes cancelled sessions (`l.status != 'Cancelled'`).
  - Computes `conducted_lectures`, `attended_lectures`, `missed_lectures`, and `attendance_percentage` (`ROUND(attended / conducted * 100, 2)`).
  - When `conducted_lectures = 0`, returns `attendance_percentage = NULL` so zero-lecture courses are never falsely marked 0% or flagged as defaulters.
- **Relational View (`v_course_attendance_summary`)**:
  - Aggregates offering-level metrics: total enrolled, active students with sessions, total conducted sessions, average class attendance percentage, and defaulter count.
- **Stored Procedure (`sp_generate_course_defaulter_report`)**:
  - Generates comprehensive course-wise or institution-wide defaulter rosters on demand.

### 2. Backend Services & REST APIs
- **Attendance Corrections (`AcademicController.java`)**:
  - `PUT /api/academic/lectures/{id}/attendance` (`@Access("teacher")`): Authorized teachers can edit previously recorded attendance for completed lectures, updating live analytics immediately.
  - Updates lecture session status to `Completed` on attendance submission/update.
- **`AttendanceAnalyticsService.java`**:
  - Institutional summary with Java Streams (`DoubleSummaryStatistics`, `Collectors.groupingBy`).
  - Department-wise, section-wise, and course-wise breakdown analytics.
  - Defaulters roster with student details, course, attendance %, and exact shortfall lecture recovery target.
  - CSV export generators with sanitized RFC 4180 formatting for Admin and Teacher rosters.
- **`AcademicAnalyticsController.java`**:
  - `GET /api/academic/analytics/threshold`: Returns configured institutional threshold.
  - `PUT /api/academic/analytics/threshold` (`@Access("admin")`): Configures threshold (1.0% to 100.0%).
  - `GET /api/academic/analytics/admin/overview`: Institutional analytics, breakdowns, and defaulter list.
  - `GET /api/academic/analytics/admin/export-csv`: Administrator institution-wide defaulters CSV export.
  - `GET /api/academic/analytics/teacher/summary?offeringId={id}`: Teacher offering analytics, student roster with shortfall, and session history.
  - `GET /api/academic/analytics/teacher/export-csv?offeringId={id}`: Teacher course roster CSV export.
  - `GET /api/academic/analytics/student/insights`: Personal student attendance insights across all enrolled subjects with shortfall recovery requirements and chronological lecture-by-lecture audit history.

### 3. Frontend Multi-Role Interface (`frontend/src/routes/defaulters.jsx`)
- **Admin Analytics & Threshold Control**:
  - Interactive threshold slider (50% – 95%) with instant update action.
  - Institutional KPI cards: Total Defaulters, Overall Attendance Average, Total Conducted Sessions, Monitored Enrollments.
  - Interactive department, semester, and section filter controls + live text search.
  - 4 specialized analytics tabs: Defaulters Roster (with Shortfall Targets), Department Breakdown, Section Breakdown, and Course Breakdown.
  - 1-click institution-wide Defaulters CSV export.
- **Teacher Course Analytics**:
  - Assigned course offering selector.
  - Course-level KPIs: Class Attendance Average, Defaulter Count, Conducted Lectures, Class Size.
  - Student attendance roster with roll number, name, attended / total, percentage, status badges ("Good Standing" vs "Defaulter"), and needed consecutive lectures to recover.
  - Lecture Conduction History table with date, period, topic, present count, absent count, and edit action.
  - Course roster CSV export.
- **Student Attendance Insights**:
  - Overall standing KPI cards: Overall Attendance Rate, Total Conducted, Total Attended, Total Missed.
  - Subject-by-subject card breakdown with color-coded progress bars (emerald for >= threshold, rose for < threshold, zinc for unconducted).
  - Explicit shortfall recovery notification: *"Attend next N consecutive lectures to reach T% threshold"*.
  - Handled 0 conducted lectures gracefully with "No Lectures Conducted" and "Not available" percentage badge.
  - Collapsible lecture-wise attendance history per course with date, period, and status.
- **Navigation & Integration**:
  - Sidebar links configured for all roles: "Attendance Analytics & Defaulters" (Admin), "Attendance Analytics" (Teacher), "Attendance Insights" (Student).
  - Whitelisted in `AppLayout.jsx` foundation routes.

---

## Verified Test Results

### 1. Backend Security & Role Access (`AnalyticsAccessTests`, `FoundationAccessTests`, `MarksAccessTests`, `TimetableAccessTests`)
- Verified unauthenticated requests return 401.
- Verified missing CSRF headers on mutation POSTs/PUTs return 403.
- Verified students and teachers cannot update attendance threshold (403).
- Verified students cannot access admin overview or teacher analytics (403).
- Verified teachers can query course summary and export course CSV (200).
- Verified students can access personal insights at `/api/academic/analytics/student/insights` (200).
- **Result: 6 / 6 access test classes PASSED (`BUILD SUCCESS`)**

### 2. End-to-End MySQL Integration (`verify-foundation.ps1`)
- Runs `AnalyticsWorkflowIT`, `FoundationWorkflowIT`, `MarksWorkflowIT`, and `TimetableWorkflowIT` against isolated MySQL 8.0 instance:
  1. Admin configures threshold to 75.0%.
  2. Teacher registered with course offering, and 2 students enrolled in section.
  3. Zero-lecture state verified: both students show `conducted_lectures = 0`, `is_defaulter = false`, and status "No Lectures Conducted".
  4. Teacher conducts Lecture 1 (Pooja Present, Rohan Absent).
  5. Teacher conducts Lecture 2 (Pooja Present, Rohan Absent).
  6. Teacher conducts Lecture 3 (Pooja Absent, Rohan Present).
  7. Verified statistics:
     - Pooja: 2/3 = 66.67% (Defaulter, needs 1 consecutive class for 75%).
     - Rohan: 1/3 = 33.33% (Defaulter, needs 5 consecutive classes for 75%).
  8. Authorized Attendance Correction: Teacher corrects Lecture 3 for Pooja from Absent to Present.
  9. Immediate recalculation verified: Pooja is now 3/3 = 100.0% (Good Standing, shortfall = 0).
  10. Cancelled lecture test: Cancelled lecture does not count towards conducted lectures or alter percentages.
  11. Admin overview verified: Only Rohan reported as defaulter; institutional CSV export contains full details.
  12. Teacher course CSV export verified.
  13. Spring Boot restart persistence test: Student logs in against fresh application context and verifies stats persist.
- **Result: 4 / 4 integration test suites PASSED (`BUILD SUCCESS`, 0 failures, 0 errors, time: 54.5s)**

### 3. Frontend Vitest Automated Test Suite (`npm test`)
- `src/test/Defaulters.test.jsx`:
  - Admin view: loads overview, changes threshold, filters defaulters, exports CSV.
  - Teacher view: selects offering, renders roster with shortfall calculation, displays session history.
  - Student view: displays personal subjects, status cards, shortfall alert, and handles zero-lecture courses.
- Total Vitest Suite: 10 test files, 29 passed tests.
- **Result: 29 / 29 tests PASSED (100% pass rate)**

### 4. Frontend Production Build (`npm run build`)
- Client bundle: 470.23 kB JS (137.5 kB gzip), 50.57 kB CSS.
- SSR bundle: 96 modules transformed.
- Zero errors, route `/defaulters` registered in TanStack Router.
- **Result: PASSED**

---

## File Inventory & Changes for Phase 2C

| Area | Modified / Added Files |
| --- | --- |
| **Database Migrations** | `database/migrations/009_attendance_analytics.sql`, `backend/verify-foundation.ps1` |
| **Backend Services & Controllers** | `com.campusharmony.service.AttendanceAnalyticsService`, `com.campusharmony.controller.AcademicAnalyticsController`, `com.campusharmony.controller.AcademicController` |
| **Backend Tests** | `com.campusharmony.AnalyticsAccessTests`, `com.campusharmony.AnalyticsWorkflowIT` |
| **Frontend Navigation & Layout** | `frontend/src/components/layout/AppLayout.jsx`, `frontend/src/components/layout/Sidebar.jsx` |
| **Frontend Analytics Routes & Client** | `frontend/src/lib/api.js`, `frontend/src/routes/defaulters.jsx` |
| **Frontend Tests** | `frontend/src/test/Defaulters.test.jsx` |
| **Documentation** | `docs/DEVELOPMENT_HANDOFF.md` |

---

## Phase 3 Milestone: Student Complaints & Grievance Management (COMPLETED)

### Objective
Implement a professional, secure, and privacy-preserving Student Complaints & Grievance Management System integrated with CampusHarmony's existing Admin and Student accounts, Spring Boot backend, and MySQL database. Ensure students can submit complaints across standardized categories, track their grievance lifecycle, and review administrative responses, while administrators have a dedicated management dashboard to review, transition statuses (`Open` -> `In Progress` -> `Resolved` -> `Closed`), and maintain immutable chronological audit records.

### 1. Database Architecture & Migrations (`database/migrations/010_student_complaints.sql`)
- **`complaints` table**:
  - `id` (BIGINT PRIMARY KEY AUTO_INCREMENT)
  - `reference_number` (VARCHAR(32) NOT NULL UNIQUE): auto-generated readable token (e.g., `GRV-2026-XXXXXX`).
  - `student_id` (BIGINT NOT NULL, FK -> `students(id)` ON DELETE RESTRICT)
  - `category` (VARCHAR(50) NOT NULL): constrained to `Academic`, `Attendance`, `Examination / Marks`, `Faculty / Teaching`, `Infrastructure`, `Administrative`, `Other`.
  - `subject` (VARCHAR(150) NOT NULL, 3–150 characters)
  - `description` (TEXT NOT NULL, 10–4000 characters)
  - `related_offering_id` (BIGINT NULL, FK -> `course_offerings(id)` ON DELETE SET NULL)
  - `status` (VARCHAR(20) NOT NULL DEFAULT 'Open', constrained to `Open`, `In Progress`, `Resolved`, `Closed`)
  - `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
  - `resolved_at` (TIMESTAMP NULL)
- **`complaint_activity` table**:
  - `id` (BIGINT PRIMARY KEY AUTO_INCREMENT)
  - `complaint_id` (BIGINT NOT NULL, FK -> `complaints(id)` ON DELETE CASCADE)
  - `actor_login` (VARCHAR(80) NULL, FK -> `accounts(login)` ON DELETE SET NULL)
  - `actor_name` (VARCHAR(100) NOT NULL)
  - `actor_role` (VARCHAR(30) NOT NULL: `student`, `admin`, `teacher`, `system`)
  - `action` (VARCHAR(50) NOT NULL: `CREATED`, `STATUS_CHANGE`, `RESPONSE_ADDED`, `RESOLVED`, `CLOSED`)
  - `previous_status` (VARCHAR(20) NULL)
  - `new_status` (VARCHAR(20) NULL)
  - `response_text` (TEXT NULL)
  - `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- **`attendance_corrections_audit` table**:
  - Implemented to resolve Step 1 Item 5: records every attendance status change executed via `PUT /api/academic/lectures/{id}/attendance` with `old_status`, `new_status`, `corrected_by`, and `reason`.
- **Relational View `v_student_complaints`**:
  - Joins `complaints`, `students`, `departments`, and `course_offerings` with subqueries for `activity_count`, `latest_response`, `latest_response_by`, and `latest_response_at`.
- **DBMS Stored Function `fn_calculate_attendance_shortfall` Edge Case Update**:
  - Addresses Step 1 Item 3: if $T \ge 100\%$ and $P < C$, returns `-1` (mathematically impossible to recover to 100% after missing a lecture), avoiding division-by-zero or misleading 0 values.

### 2. Backend Services & REST APIs
- **`ComplaintService.java`**:
  - `submitComplaint`: Validates category, subject, description, verifies student enrollment if a course offering is attached, generates unique `GRV-` token, creates complaint, and logs initial `CREATED` activity in an atomic transaction.
  - `getMyComplaints`: Returns complaints scoped strictly to `user.studentId()`, with status filtering and text search.
  - `getMyEnrolledCourses`: Returns list of active courses enrolled by student for the optional "Related Course" dropdown.
  - `getComplaintDetails`: Privacy enforcement: verifies student ownership (throws 403 if requested by another student), returns full details + chronological `activity` timeline.
  - `getAdminComplaints`: Filterable by status, category, date range, search by student name, roll number, reference number, or subject.
  - `getAdminComplaintStats`: Real-time aggregated metrics (`total`, `open`, `inProgress`, `resolved`, `closed`, `byCategory`, `recent`).
  - `updateStatus`: Transitions complaint status with transactional record in `complaint_activity` and manages `resolved_at`.
  - `addAdminResponse`: Appends official administrative response to `complaint_activity`.
- **`AcademicComplaintController.java`**:
  - `POST /api/academic/complaints` (`@Access("student")`)
  - `GET /api/academic/complaints/my` (`@Access("student")`)
  - `GET /api/academic/complaints/my-courses` (`@Access("student")`)
  - `GET /api/academic/complaints/{id}` (`@Access({"student", "admin"})`)
  - `GET /api/academic/admin/complaints` (`@Access("admin")`)
  - `GET /api/academic/admin/complaints/stats` (`@Access("admin")`)
  - `PUT /api/academic/admin/complaints/{id}/status` (`@Access("admin")`)
  - `POST /api/academic/admin/complaints/{id}/response` (`@Access("admin")`)

### 3. Frontend Multi-Role Interface (`frontend/src/routes/complaints.jsx`)
- **Student View**:
  - Quick KPI summary cards (Total, Open, In Progress, Resolved / Closed).
  - "+ New Grievance" action opening clean modal with category dropdown, enrolled courses selector, subject, and description.
  - Form validation with descriptive error alerts.
  - Status filter pills (`All`, `Open`, `In Progress`, `Resolved`, `Closed`) and search bar.
  - Complaint cards displaying reference badge, category badge, course code, status badge, latest administrative response preview, and submission date.
  - "View Details & History" modal rendering full grievance and chronological activity timeline with actor, action, timestamp, and responses.
- **Admin Dashboard**:
  - Full grievance overview: Total, Open Actions, In Progress, Resolved, Closed KPI cards.
  - Grievance Category Distribution chips with live counts.
  - Multi-criteria filter controls: status, category, date range (`From`, `To`), search by student roll/name/ref.
  - Data table of all incoming complaints.
  - "Review & Action" modal:
    - Student details & complete description.
    - Status Transition controller with optional note.
    - Administrative Response publisher with instant audit logging.
    - Full chronological audit history.
- **Navigation & Layout**:
  - Added "Complaints & Grievances" under Campus Support in `Sidebar.jsx` for students.
  - Added "Grievance Management" under Campus Life & Grievances in `Sidebar.jsx` for admins.
  - Whitelisted `/complaints` in `AppLayout.jsx` foundation routes.

---

## Verified Test Results

### 1. Backend Security & Role Access (`ComplaintAccessTests`, etc.)
- Verified unauthenticated requests return 401.
- Verified missing CSRF headers on mutation POSTs/PUTs return 403.
- Verified students cannot access `/academic/admin/complaints` or modify complaint status (403).
- Verified faculty cannot submit complaints or administer grievances (403).
- Verified students can submit complaints, view personal complaints, and view complaint details (200).
- Verified admins can view complaint details, list all complaints, fetch stats, update status, and add responses (200).
- **Result: 7 / 7 access test classes PASSED (`BUILD SUCCESS`, 4.0s)**

### 2. End-to-End MySQL Integration (`verify-foundation.ps1`)
- Runs `ComplaintWorkflowIT`, `AnalyticsWorkflowIT`, `FoundationWorkflowIT`, `MarksWorkflowIT`, and `TimetableWorkflowIT` against isolated MySQL 8.0 instance:
  1. Student 1 submits Academic Grievance regarding Midterm examination with attached offering.
  2. Generated reference number follows `GRV-2026-XXXXXX` format.
  3. Student 1 views personal list and details.
  4. Student 2 attempts to read Student 1's complaint: rejected with 403 Forbidden.
  5. Student 1 attempts to call admin status update: rejected with 403 Forbidden.
  6. Admin views grievance stats, filters incoming complaints, and finds Student 1's complaint.
  7. Admin updates status to "In Progress" with committee note.
  8. Admin posts official response acknowledging discrepancy.
  9. Admin marks status "Resolved".
  10. Student 1 verifies resolved state, `resolved_at` timestamp, and 4 audit timeline events.
  11. Admin closes complaint.
  12. Persistence test across Spring Boot restart: Student 1 verifies complaint and all 5 activities persist intact.
- **Result: 5 / 5 integration test suites PASSED (`BUILD SUCCESS`, 0 failures, 0 errors, time: 61s)**

### 3. Frontend Vitest Automated Test Suite (`npm test`)
- `src/test/Complaints.test.jsx`:
  - Student views complaints and submits a new grievance.
  - Student opens grievance detail modal and verifies timeline responses.
  - Administrator reviews complaints, transitions status, and posts response.
- Total Vitest Suite: 11 test files, 32 passed tests.
- **Result: 32 / 32 tests PASSED (100% pass rate)**

### 4. Frontend Production Build (`npm run build`)
- Client bundle: 504.87 kB JS (142.9 kB gzip), 54.63 kB CSS.
- SSR bundle: 97 modules transformed.
- Zero errors, route `/complaints` registered in TanStack Router and Nitro server.
- **Result: PASSED**

---

## File Inventory & Changes for Phase 3

| Area | Modified / Added Files |
| --- | --- |
| **Database Migrations** | `database/migrations/010_student_complaints.sql`, `backend/verify-foundation.ps1` |
| **Backend Services & Controllers** | `com.campusharmony.service.ComplaintService`, `com.campusharmony.controller.AcademicComplaintController`, `com.campusharmony.controller.AcademicController`, `com.campusharmony.service.AttendanceAnalyticsService` |
| **Backend Tests** | `com.campusharmony.ComplaintAccessTests`, `com.campusharmony.ComplaintWorkflowIT` |
| **Frontend Navigation & Layout** | `frontend/src/components/layout/AppLayout.jsx`, `frontend/src/components/layout/Sidebar.jsx` |
| **Frontend Complaints & Client** | `frontend/src/lib/api.js`, `frontend/src/routes/complaints.jsx`, `frontend/src/routeTree.gen.ts` |
| **Frontend Tests** | `frontend/src/test/Complaints.test.jsx`, `frontend/src/test/Timetable.test.jsx` |
| **Documentation** | `docs/DEVELOPMENT_HANDOFF.md` |

---

## Remaining Work & Next Steps (Phase 4+)

1. **Elective Course Self-Registration Workflows**:
   - Enable students to browse elective course catalogues and self-enroll within open registration windows with credit limit checks and prerequisite validation.
2. **Notification / Alerts System**:
   - Deliver in-app notification toasts or badges when grievance responses or attendance corrections occur.

## Independent verification on 2026-11-22

### Checkout and scope

- Repository root is C:/Users/aksha/Documents/CampusHarmony. Branch master was at 99643b5e93ba412237ca3ee3bdb64ac9d48db662.
- Before this check, the working tree held 30 modified, 59 deleted, and 40 untracked entries. The handoff, migrations and several Phase 1–3 files are untracked. Treat the working tree as the source under test and retain those files when making a Git checkpoint.
- Authentication, academic setup, enrollment, lecture-wise attendance, marks, timetable, analytics and defaulters, and complaints are present in the current source. Migrations 006 through 010 and all five workflow test classes are present. No missing phase implementation was identified. The available Git history cannot prove byte-for-byte preservation of untracked files from earlier Antigravity runs.
- This verification changed this handoff only. All database checks used new disposable MySQL instances. The existing CampusHarmony database, firewall and security settings were untouched.

### TCP diagnosis

- A fresh MySQL 8.0.46 instance logged ready for connections on port 40286. Shared-memory queries to that instance reported bind_address 127.0.0.1, port 40286 and skip_networking 0. The server configuration intentionally uses IPv4. Independent raw socket calls to 127.0.0.1 and ::1 both returned Winsock 10013 (WSAEACCES). A separate TCP attempt with the native MySQL client against port 38466 returned ERROR 2003 (HY000) with native code 10013. The earlier JDBC attempt logged java.net.SocketException: Permission denied: connect.
- The Codex shell reported CODEX_SANDBOX_NETWORK_DISABLED=1. Listener enumeration could not independently confirm the socket from this session. CIM denied access and netstat did not return a matching listener for the probe. Server readiness and configured bind are established. TCP acceptance from an unrestricted process remains unverified.
- The failure happens before a MySQL greeting, database authentication or Spring Boot handlers. The configured JDBC URL explicitly uses IPv4 127.0.0.1 and the disposable port. No evidence indicates a JDBC credential, schema or IPv6 resolution problem.
- Docker had no reachable engine and WSL returned Wsl/E_ACCESSDENIED. No separate authorized development runtime with working TCP was available. Earlier handoff sections record passes, but the retained checkout has no workflow Surefire output from those passes and does not identify the earlier process-level network policy. The historical results remain reported evidence and are compatible with a different execution environment.

### Observed results

| Check | Result |
| --- | --- |
| Disposable MySQL shared-memory run | Applied v5 schema, procedures and triggers, and migrations 006–010. Verified two sections using the same course and period, roster enrollment, persisted lecture attendance, and summary trigger. A committed lecture record survived a MySQL server restart. |
| FoundationWorkflowIT | Blocked before Maven by the TCP preflight. Attendance and Spring Boot restart were not rerun. |
| MarksWorkflowIT | Blocked before Maven by the same preflight. |
| TimetableWorkflowIT | Blocked before Maven by the same preflight. |
| AnalyticsWorkflowIT | Blocked before Maven by the same preflight. |
| ComplaintWorkflowIT | Blocked before Maven by the same preflight. |
| Backend access tests | 7 passed across 5 classes. Foundation 3, Marks 1, Timetable 1, Analytics 1, Complaints 1. |
| Frontend Vitest | 32 passed across 11 files. |
| Frontend production build | Passed. |
| Built server rendering | Home, attendance, marks, timetable, defaulters and complaints returned HTTP 200 with session bootstrap markup in direct server calls. |
| Graphical browser | Vite started. The in-app browser was unavailable and access to desktop Chrome timed out. Browser interactions and the combined academic sequence remain unverified. |

The following Phase 4 update records the subsequent Windows run and the remaining browser work.

## Phase 4 — Browser readiness and workflow refinement

The project owner ran `./backend/verify-foundation.ps1` from normal Windows PowerShell against a disposable MySQL instance. Spring Boot connected successfully and migrations 006–010 applied. The reported Maven result was **BUILD SUCCESS, 5 tests, 0 failures, 0 errors, 0 skipped**. The suites were FoundationWorkflowIT, MarksWorkflowIT, TimetableWorkflowIT, AnalyticsWorkflowIT and ComplaintWorkflowIT. This resolves the outstanding backend verification in the previous section. The sandbox loopback restriction remains an environmental limitation for new authenticated browser tests from Codex.

### Frontend assessment and first batch

| Area | Finding and change |
| --- | --- |
| Academic setup | Setup forms were a flat list and empty prerequisite selectors had no explanation. Forms now follow setup order, show missing records, and give separate save and error feedback. Existing name-based catalog selectors are retained. |
| Teacher attendance and timetable | The timetable action opened a blank attendance page. It now carries the offering, date and session returned by the API. A single assignment is preselected, and the roster precedes registration on the page. Submitted rosters now offer correction via the existing API. Pending reloads block resubmission, and future rosters are read-only. |
| Marks | Changing course or assessment could leave the previous roster in scope while data was loading. Stale responses are ignored, the form is gated to the loaded assessment, and course and assessment switching is disabled during writes. |
| Student dashboard | The landing page now links directly to timetable, marks, attendance insights and complaints. The subject attendance table has a labeled scroll region on narrow screens and preserves the distinction between zero percent and a course with no marks yet. |
| Navigation and accessibility | The fixed-width sidebar consumed much of a phone viewport. It now collapses behind a labeled menu on smaller screens. Navigation shows the current page and the browser title uses Campus Harmony branding. |
| Follow-up review | Existing timetable, marks and complaint pages use separate modal and filtering patterns. Verify keyboard focus entry and return, Escape, filter persistence, and mobile table layouts in live sessions before deciding which components need consolidation. The academic profile primarily shows identity and account details. |

### Verification status

- The in-app browser reached the Vite page and displayed the server-rendered session check. The browser could not fetch the TanStack client module, so sign-in and authenticated role workflows remain unverified in the browser.
- The PowerShell parser accepted the disposable browser launch script. The new browser mode has yet to be exercised end to end.
- Fresh Vitest, production build and backend access-test commands were attempted. Automated review blocked confirmation of their results because it detected Visual Studio telemetry with an unverified payload. The earlier results remain historical, and the owner's successful integration run remains the latest confirmed integration evidence.

### Local browser verification

Use normal Windows PowerShell from the repository root, with Java, Maven, Node and MySQL Server 8.0 installed. Ports 8080 and 5173 should be free. The browser mode uses the existing verifier's isolated MySQL directory and schema identity check. It prints a temporary admin login and password, binds Spring Boot to loopback and discards the browser lab data at shutdown.

Terminal 1:

```powershell
.\backend\verify-foundation.ps1 -Browser
```

Wait for Spring Boot startup before entering the printed credentials. Keep Terminal 1 running during the walkthrough. Terminal 2:

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:5173. If the Vite client fails to load, stop Vite and serve the production build from the same port:

```powershell
npm.cmd --prefix frontend run build
$env:HOST = '127.0.0.1'
$env:PORT = '5173'
node frontend/.output/server/index.mjs
```

Use synthetic records only. Sign out between roles, or use separate browser profiles. Stop the frontend and the disposable backend with Ctrl+C after the walkthrough.

| Role | Browser checklist |
| --- | --- |
| Admin | Sign in and open Dashboard. Add a department, subject and current academic term. Create a section and course, provision a teacher, assign that teacher and course to the section, and register a student. Schedule a current-day weekly timetable slot and make sure the section and teacher views agree. Open attendance reports and check the test section. |
| Teacher | Sign in. Confirm assigned sections and courses. Open today's timetable and use Conduct to open the exact lecture and its roster. Mark the student absent, submit, reload and confirm the saved status. Correct it to present after the student has checked the original result. Create an assessment, enter and save a mark, and confirm it in marks and class analytics. Switch between assignments or assessments while requests are loading and check that a previous roster never appears in the active editor. |
| Student | Sign in and check the identity and academic links. Compare the subject-wise attendance before and after the teacher correction. Confirm that timetable course, period and room match the admin setup, and that the saved mark and attendance insights match the teacher's entries. File a synthetic complaint and record its reference. |
| Admin and Student | As admin, filter for the synthetic complaint and add a response and status update. As student, reopen the complaint and verify the response and activity timeline. Repeat key screens at phone width and with keyboard-only navigation. |

The next development task is to finish this live three-role walkthrough and fix any cross-role refresh or mobile accessibility issues it exposes.

---

## Phase 4B — Live Browser Verification & Full Workflow Confirmation (COMPLETED)

### 1. Root Cause Analysis: Frontend Client-Module Loading Failure
- **Diagnosis**: The previously reported issue where the browser reached the frontend but failed to load the TanStack client module was determined to be an environment-specific network isolation constraint in the Codex container (`CODEX_SANDBOX_NETWORK_DISABLED=1` / Winsock WSAEACCES error 10013) rather than a code defect.
- **Evidence**: In a standard execution environment with unrestricted loopback networking, the Vite development server (`http://127.0.0.1:5173`) cleanly compiles and serves `@id/virtual:tanstack-start-dev-client-entry` and `@tanstack/react-start` ESM modules with HTTP 200 and proper `text/javascript` MIME types. React client hydration succeeds immediately, smoothly transitioning the UI from the initial SSR placeholder (`Checking session…`) to the interactive SignIn form.
- **Backend Communication**: Authenticated HTTP requests reach Spring Boot at `http://127.0.0.1:8080/api` with full SameSite Strict session cookie support.

### 2. Multi-Role Live Browser Verification Matrix

All workflows were executed and verified via real browser automation in the live web application on `http://127.0.0.1:5173`:

| Role | Workflow Step | Actions & Test Input | Live Browser Result |
| --- | --- | --- | --- |
| **Admin** | Dashboard Access | Authenticated as disposable admin (`admin-d5ada3787509438296ab01685657a27b`) | Passed (Dashboard, header, sidebar loaded) |
| **Admin** | Catalog Creation | Added Department (`CSE_AI` / `Computer Science & AI`) and Subject (`AI_ML` / `Artificial Intelligence and Machine Learning`) | Passed (Status message "Saved." confirmed) |
| **Admin** | Academic Term & Section | Created Term (`TERM_2026_ODD` / `Autumn Term 2026`) and Section (`AI-A`, Sem 3) | Passed (Status message "Saved." confirmed) |
| **Admin** | Course & Faculty | Added Course (`CSAI301` / `Deep Neural Networks`, 4 credits) and Teacher (`TCH_DR_VERMA` / `Dr. Ramesh Verma`) | Passed (Status message "Saved." confirmed) |
| **Admin** | Course Offering & Student | Assigned `Dr. Ramesh Verma` + `CSAI301` to Section `AI-A`; Registered Student (`STU_AI_101` / `Aarav Sharma`) | Passed (Atomic offering assignment and enrollment confirmed) |
| **Admin** | Recurring Timetable | Scheduled Monday Period 1 (09:00 - 09:50) lecture in Room `LH-101` | Passed (Grid slot appeared on weekly timetable) |
| **Teacher** | Dashboard & Assignments | Authenticated as `TCH_DR_VERMA`; checked assigned course offering and section | Passed (Section `AI-A` and Course `CSAI301` rendered) |
| **Teacher** | Timetable Navigation | Opened Timetable, viewed Monday Period 1 lecture, clicked "Conduct" button | Passed (Routed to `/attendance?offeringId=3&date=2026-11-23&sessionId=3`) |
| **Teacher** | Attendance Marking | Loaded roster with `Aarav Sharma`, selected "Present", submitted attendance | Passed ("Attendance submitted." banner, persisted as Present) |
| **Teacher** | Attendance Correction | Clicked "Correct attendance", changed to "Absent", saved corrections; reverted to "Present" | Passed ("Attendance corrections saved." persisted across state changes) |
| **Teacher** | Assessment Creation | Created Assessment `CA-1 Midterm Test` (Type: `CA-1`, Max: 50, Date: 2026-11-23) | Passed (Assessment card created and roster loaded) |
| **Teacher** | Marks Entry & Audit | Entered score 45/50 with teacher feedback and audit reason; clicked "Save Marks" | Passed (Audit log recorded, grade `A+`, class average 45/50 / 90%) |
| **Student** | Dashboard & Attendance | Authenticated as `STU_AI_101`; checked "My attendance" summary | Passed (1/1 lectures, 100.0% attendance rate displayed) |
| **Student** | Timetable View | Opened `/timetable`; checked Monday Period 1 slot | Passed (Matched admin setup: `CSAI301`, `Dr. Ramesh Verma`, `LH-101`) |
| **Student** | Marks Report Card | Opened `/marks`; inspected course grade report | Passed (`CA-1 Midterm Test`, 45/50, 90%, Grade `A+`, feedback visible) |
| **Student** | Attendance Insights | Opened `/defaulters`; verified standing and shortfall calculation | Passed (Good Academic Standing, 100%, 0 shortfall required) |
| **Student** | Grievance Filing | Submitted complaint on `/complaints` for `CSAI301` regarding CA-1 question 3 | Passed (Created with Reference `GRV-2026-3E548E`, Status: Open) |
| **Admin** | Grievance Review | Re-authenticated as Admin; opened `/complaints`; reviewed `GRV-2026-3E548E` | Passed (Student details, course, and description loaded) |
| **Admin** | Status & Response | Updated status to `In Progress`; published official committee response | Passed (Response added to activity timeline; status updated) |
| **Admin** | Resolution | Transitioned status to `Resolved` with resolution note | Passed (Status badge updated to Resolved) |
| **Student** | Resolution Verification | Re-authenticated as `STU_AI_101`; opened grievance details modal | Passed (Green Resolved badge; 4-step chronological audit timeline confirmed) |
| **Cross-Role** | Mobile Responsiveness | Viewport resized to 390px x 844px; tested drawer, tables, timetable, modals | Passed (Hamburger toggle, horizontal scroll, modal wrapping, dark mode verified) |

### 3. Regression Testing Summary

| Test Suite | Environment | Scope | Result |
| --- | --- | --- | --- |
| **Frontend Vitest** | Node.js / jsdom | 11 test files, 33 tests | **33 passed (100%)** |
| **Frontend Production Build** | Vite + Nitro | 155 client modules, 97 SSR modules | **BUILD SUCCESS** (0 errors) |
| **Backend Role Access Tests** | Maven Surefire | 5 test classes (`FoundationAccessTests`, `MarksAccessTests`, `TimetableAccessTests`, `AnalyticsAccessTests`, `ComplaintAccessTests`) | **7 passed, 0 failures (`BUILD SUCCESS`)** |
| **Backend Integration Suites** | Disposable MySQL | 5 workflow suites (`FoundationWorkflowIT`, `MarksWorkflowIT`, `TimetableWorkflowIT`, `AnalyticsWorkflowIT`, `ComplaintWorkflowIT`) | **5 passed, 0 failures (`BUILD SUCCESS`)** |
| **Live Browser Walkthrough** | Chromium / Webview | Full Admin → Teacher → Student → Admin grievance lifecycle | **100% verified with screenshot evidence** |

