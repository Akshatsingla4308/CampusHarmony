# CAMPUS HARMONY — SYSTEM ARCHITECTURE & TECHNICAL SPECIFICATION

**Project:** Campus Harmony (College ERP / Student Management System)  
**Academic Submission:** BE Computer Science & Engineering, Batch 2025, Semester III  
**Target Environment:** Local Windows 11, JDK 21 LTS, Node.js 20 LTS, MySQL 8.0+  

---

## 1. High-Level Architectural Overview

Campus Harmony employs a modern, decoupled three-tier architecture:
1. **Presentation Tier (Frontend):** A responsive Single Page Application (SPA) built with **React 19**, **Vite 8**, **React Router**, **Context API**, and **Tailwind CSS**. It incorporates accessible HTML5 semantic elements, controlled input forms, dark/light theme switching, and live charts.
2. **Application Tier (Backend):** A high-performance REST API built with **Java (JDK 21 LTS)**, **Spring Boot 3.2.5**, **Spring Data JPA/Hibernate**, **Jakarta Validation**, and an isolated **Direct JDBC Lab Module** (`com.campusharmony.lab.*`) specifically implementing Java Course Handout outcomes.
3. **Data Tier (Database):** A relational database running on **MySQL Community Server 8.0+** with InnoDB storage engine, implementing 3NF/BCNF normalization, primary/foreign key referential integrity, indexes, stored procedures with cursors, stored functions, triggers, and ACID transactions.

```text
+-----------------------------------------------------------------------------------+
|                                 CLIENT BROWSER                                    |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                  React 19 SPA (Vite, React Router, Context API)          |   |
|   |  - AuthContext (Session, Teacher/Student Role, Workspace Prefix)          |   |
|   |  - ThemeContext (Dark / Light Theme Toggle)                               |   |
|   |  - Pages: Login, Dashboard, Students CRUD, Attendance, Courses, Marks     |   |
|   |  - Controlled Forms, Validation, Toasts, Responsive Navigation Drawer    |   |
|   +---------------------------------------------------------------------------+   |
+------------------------------------------+----------------------------------------+
                                           |
                                           | HTTP / REST (JSON)
                                           | Port 5173 -> Port 8080 (CORS Configured)
                                           v
+-----------------------------------------------------------------------------------+
|                        JAVA SPRING BOOT 3.2.5 BACKEND                             |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                        REST Controller Layer                              |   |
|   |   AuthController, StudentController, AttendanceController,                |   |
|   |   CourseController, MarksController, DashboardController,                 |   |
|   |   JavaLabDemoController (Direct JDBC / Streams / Concurrency Viva)       |   |
|   +-------------------------------------+-------------------------------------+   |
|                                         |                                         |
|   +-------------------------------------v-------------------------------------+   |
|   |                         Service Layer                                     |   |
|   |   - StudentServiceImpl, AttendanceServiceImpl, MarksServiceImpl           |   |
|   |   - GlobalExceptionHandler (@ControllerAdvice, Jakarta Validation)        |   |
|   |   - DirectJdbcStudentService (PreparedStatement, Manual Rollback/Commit)  |   |
|   |   - StudentStreamAnalyticsService (Lambdas, GroupingBy, PartitioningBy)   |   |
|   |   - ConcurrencyDemoService (Thread, Runnable, ExecutorService)            |   |
|   +------------------+------------------------------------+-------------------+   |
|                      |                                    |                       |
|   +------------------v------------------+  +--------------v-------------------+   |
|   | Spring Data JPA / Hibernate Layer   |  |   Direct JDBC Demonstration      |   |
|   | - Entity Mappings (BaseEntity)      |  | - java.sql.DriverManager         |   |
|   | - CrudRepository & Derived Queries  |  | - java.sql.PreparedStatement     |   |
|   | - 1:1, 1:N Managed Relationships    |  | - java.sql.ResultSet             |   |
|   +------------------+------------------+  +--------------+-------------------+   |
+----------------------|------------------------------------|-----------------------+
                       |                                    |
                       | JDBC Connection Pool (HikariCP)    | Direct JDBC Connection
                       v                                    v
+-----------------------------------------------------------------------------------+
|                        LOCAL MYSQL SERVER 8.0+ (Port 3306)                        |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   | Relational Schema: campus_harmony                                         |   |
|   | - Master Tables: departments, subjects, teachers, students, courses       |   |
|   | - Event Tables (3NF): attendance_records (dated), student_marks (exams)   |   |
|   | - Cache Tables: attendance (counters), marks (5-subject legacy summary)   |   |
|   | - Audit Tables: activities, defaulter_audit_log                           |   |
|   | - Triggers: trg_after_attendance_record_insert, trg_validate_student_marks|   |
|   | - Procedures: sp_generate_attendance_defaulter_report (with Cursor)       |   |
|   |               sp_batch_enroll_student_with_transaction (ACID Rollback)    |   |
|   | - Functions: fn_calculate_grade, fn_get_student_average                   |   |
|   | - Indexes: idx_students_dept, idx_students_sem, idx_att_rec_student_date |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## 2. End-to-End Request & Data Flow

### Scenario A: Marking Student Attendance
1. **User Action:** Teacher clicks "Mark Present" on the Attendance register UI for student `CS-2101`.
2. **Frontend Dispatch:** React component calls `api.markAttendance(studentId, true)`. An optimistic loading spinner appears.
3. **HTTP Transport:** An HTTP `POST` request is sent to `http://localhost:8080/api/attendance/mark` with JSON payload `{"studentId": 101, "present": true}`.
4. **Backend Ingestion:** `AttendanceController.markAttendance(@Valid @RequestBody MarkAttendanceRequest req)` validates that `studentId` is not null.
5. **Service Execution:** `AttendanceServiceImpl.markAttendance()`:
   - Validates student existence in `StudentRepository`.
   - Inserts dated session record into `attendance_records` table.
   - Database trigger `trg_after_attendance_record_insert` executes atomically inside MySQL, updating `total_days`, `present_days`, and `last_marked` in the summary table.
   - Logs event in `activities`.
6. **HTTP Response:** Controller returns HTTP `200 OK` with updated percentage and student entity.
7. **UI Update:** React state updates, displaying a success toast notification with recalculated attendance percentage. If the backend fails, an explicit red alert is displayed — **no silent mock fallback occurs**.

---

## 3. Comprehensive REST API Inventory

### A. Authentication & Registration (`/api/auth`)
| Method | Endpoint | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | `LoginRequest` (`role`, `name`, `roll`) | Authenticates teacher or student session. |
| `POST` | `/api/auth/register-teacher` | `RegisterTeacherRequest` (`id`, `name`, `subject`) | Registers a new faculty member with isolated workspace. |
| `POST` | `/api/auth/register-student` | `RegisterStudentRequest` (`roll`, `name`, `department`, `semester`) | Registers a new student. |
| `GET` | `/api/auth/teachers` | None | Returns list of all registered teachers. |

### B. Student Management (`/api/students`)
| Method | Endpoint | Query Params / Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students` | `?teacherId=&department=&semester=&search=` | Lists students with filtering and search. |
| `GET` | `/api/students/{id}` | None | Retrieves single student details. |
| `POST` | `/api/students` | `StudentRequest` (JSON) | Enrolls a new student with server validation. |
| `PUT` | `/api/students/{id}` | `StudentRequest` (JSON) | Updates student information. |
| `DELETE` | `/api/students/{id}` | None | Deletes student and cascade-removes marks and attendance. |
| `GET` | `/api/departments` | None | Returns list of active department names. |

### C. Courses & Subjects (`/api`)
| Method | Endpoint | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/courses` | `?teacherId=` | Retrieves courses for current semester/teacher. |
| `POST` | `/api/courses` | `CourseRequest` (JSON) | Adds a new course to catalogue. |
| `GET` | `/api/subjects` | None | Returns active academic subjects. |

### D. Attendance Management (`/api/attendance`)
| Method | Endpoint | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/attendance` | `?teacherId=` | Retrieves attendance roster with current percentages. |
| `POST` | `/api/attendance/mark` | `MarkAttendanceRequest` (`studentId`, `present`) | Records attendance session event. |
| `GET` | `/api/attendance/history/{studentId}`| None | Returns dated attendance session logs. |

### E. Marks & Academic Performance (`/api/marks`)
| Method | Endpoint | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/marks` | `?teacherId=` | Retrieves student marks records for teacher's subject. |
| `POST` | `/api/marks/save` | `SaveMarksRequest` (`subjectKey`, `entries[]`) | Batch updates subject marks. |

### F. Dashboard & Analytics (`/api/dashboard`)
| Method | Endpoint | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | `?teacherId=` | Summary KPI cards (total students, avg attendance, defaulters). |
| `GET` | `/api/dashboard/activity` | `?teacherId=` | Recent activities and notices audit log. |
| `POST` | `/api/dashboard/activity` | `{"text": "...", "type": "notice"}` | Publishes a new administrative notice. |

### G. Java Academic Lab & Viva Module (`/api/lab`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/lab/jdbc/student/{id}` | Direct JDBC `PreparedStatement` query demonstration. |
| `POST` | `/api/lab/jdbc/transfer` | Direct JDBC manual transaction with commit and rollback test. |
| `GET` | `/api/lab/streams/analytics` | Streams API grouping by department and partitioning defaulters. |
| `GET` | `/api/lab/concurrency/demo` | Demonstrates thread pool, `Callable`, and critical section safety. |
| `GET` | `/api/lab/file/export-csv` | Streams student directory to CSV using character streams. |

---

## 4. Frontend State Management & Component Architecture

### Component Hierarchy:
```text
App (React Router Root)
├── AuthProvider (AuthContext: user, role, token/session, workspace)
│   └── ThemeProvider (ThemeContext: 'light' | 'dark')
│       └── AppShell (Sidebar, Header, ThemeToggle, UserProfileMenu)
│           ├── DashboardView (StatsCards, DonutChart, BarChart, ActivityFeed)
│           ├── StudentsView (SearchInput, Filters, StudentsTable, AddModal, EditModal)
│           ├── AttendanceView (SummaryBanner, FilterPills, AttendanceTable, ActionButtons)
│           ├── CoursesView (CourseGrid, AddCourseModal, EnrolledModal)
│           ├── MarksView (SubjectHeader, MarksTable, SaveButton, GradeIndicators)
│           ├── ProfileView (StudentCard, AttendanceBadge, ResultsBreakdown)
│           └── JavaLabView (Live Viva Demonstrations for Evaluators)
```

### Context API Architecture:
1. **`AuthContext`:**
   - Holds active user object (`name`, `roll`, `role`, `subject`, `workspace`).
   - Provides `login(credentials)` and `logout()` methods.
   - Enforces Route Protection (`ProtectedRoute.jsx` redirects unauthenticated users to `/login`, and restricts students from faculty pages).
2. **`ThemeContext`:**
   - Persists user theme preference (`'dark'` or `'light'`) in `localStorage`.
   - Dynamically adds/removes the `.dark` class to `document.documentElement`.

---

## 5. Security, Input Validation & Error Handling Architecture

1. **Client-Side Validation:** Form inputs (email format, roll format, non-empty name, marks 0–100) are validated prior to submission, providing immediate visual feedback.
2. **Server-Side Validation:** Controller endpoints enforce Jakarta Bean Validation annotations:
   - `@NotNull`, `@NotBlank`, `@Size(min=2, max=100)`, `@Min(1)`, `@Max(8)`, `@Email`.
   - If invalid, Spring Boot automatically throws `MethodArgumentNotValidException`.
3. **Centralized Error Handling (`GlobalExceptionHandler`):**
   - Intercepts `MethodArgumentNotValidException`, `ResourceNotFoundException`, `BadRequestException`, and `SQLException`.
   - Returns a structured `ErrorResponse` payload:
     ```json
     {
       "success": false,
       "message": "Validation failed for field: email. Email must be a valid institutional address.",
       "status": 400,
       "timestamp": "2026-11-15T18:05:00Z"
     }
     ```
   - Prevents stack trace leakage to the client browser.
4. **Database Constraint Enforcement:**
   - Check constraints, foreign keys, and database triggers reject invalid rows at the storage layer as a secondary defense.
