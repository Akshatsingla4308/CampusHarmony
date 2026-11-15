# CAMPUS HARMONY — STAGE A: COMPREHENSIVE REPOSITORY & ACADEMIC REQUIREMENTS AUDIT

**Date:** November 15, 2026  
**Academic Context:** Chitkara University, BE CSE, Semester III, Batch 2025 (July–December 2026)  
**Subjects Audited:**
1. **Front End Engineering-II (FEE-II, 25CSE0203)** — Evaluation III Project-Based (Final Evaluation, 40 marks)
2. **Database Management System (DBMS, 24CSE0209)** — Demonstration-Based Project Evaluation (50 marks)
3. **Programming in Java (25CSE0202)** — Continuous Evaluation 3 (CA-3) Project Milestone (25 marks) & CA-4 Final Project Viva

---

## 1. Academic Requirements & Rubrics Authority Audit

### A. Front End Engineering-II (25CSE0203)
* **Authority Documents:** `Circular_20261103155154_Notice_fee-ii.pdf` (Ref: CUIET/CSE/ACAD/2026/355) and Course Handout `Circular_20260709155958_Front_End_Engineering-ii25cse0203_.pdf`.
* **Evaluation History:** Evaluation I (HTML/CSS/JS) and Evaluation II (React/Context API) are completed.
* **Remaining Target:** Final Project-Based Evaluation-III (**40 Marks**):
  * **Component 1: Presentation (7 Marks)** — Understanding, structure, engagement.
  * **Component 2: File Work / Report (8 Marks)** — Report following exact format (Title Page, Abstract, TOC, 1. Intro 3-5 pages, 2. Problem Definition & Requirements 1-2 pages, 3. Proposed Design/Methodology 3-5 pages, 4. Results 10-15 pages, 5. References API style). Times New Roman, 16/14/12 pt, 1.5 spacing.
  * **Component 3: Project Work & Viva (25 Marks)**:
    1. HTML, CSS, JavaScript, DOM event handling (as per Eval-I): **5 Marks**
    2. React, Context API, state management (as per Eval-II): **6 Marks**
    3. API integration, CRUD workflows, React testing, Git implementation, performance optimization: **7 Marks**
    4. Component re-rendering, React best practices, tested dashboard development, build processes, environment configuration, production deployment: **7 Marks**
* **Deployment Policy Reconciliation:** While the handout mentions cloud hosting (Vercel/Netlify), the agreed project setup is local Windows. We will build a production frontend bundle (`npm run build`), test it locally with zero secret leakage, and explicitly document the local-only deployment rationale in the report.

---

### B. Database Management System (DBMS, 24CSE0209)
* **Authority Documents:** `Circular_20261103151707_Rubrics_For_Project-based_Evaluations-dbms_Batch_2025_Cse.pdf` and Course Handout `Circular_20260709162005_Database_Managment_System_24cse0209.pdf`.
* **Rubric Breakdown (**50 Marks**):**
  * **Presentation & File (10 Marks):** Demonstration skill (3), Report format (4), Teamwork (3). Report must include Title Page, TOC, 1. Intro, 2. ERD, 3. Schema, 4. Use Cases with SQL queries and screenshot evidence.
  * **Project Work & Viva (40 Marks):**
    * Case Study: **5 Marks**
    * ER Diagram mapping from case study: **10 Marks**
    * ER-to-relational model mapping and normalization (1NF, 2NF, 3NF, BCNF): **10 Marks**
    * Use cases implemented and knowledge of techniques used: **15 Marks** (Explicitly requires Procedural SQL: stored procedures, stored functions, cursors, triggers, exception handling, control flow structures).

---

### C. Programming in Java (25CSE0202)
* **Authority Documents:** `Circular_20261112160604_Notice_ca3.pdf` (Ref: CUIET/CSE/ACAD/2026/358, Date: 12-11-2026) and Java Course Handout `CHO_JAVA.pdf`.
* **Rubric Breakdown (**25 Marks for CA-3 Project Milestone**):**
  * 1. Problem Statement: **3 Marks**
  * 2. Project Objectives & Scope: **2 Marks**
  * 3. Project Design & Prototype: **9 Marks** (Sensible class/package structure, data model, application flow, working initial module).
  * 4. Integration of all Course Concepts: **6 Marks** (OOP, Collections, Exception Handling, JDBC or File persistence, Lambdas/Streams, Concurrency/Threads).
  * 5. Code Quality, Progress Evidence & Documentation: **5 Marks** (Clean naming, Git history, documented setup and milestone evidence).
* **Target Environment:** JDK 21 LTS (System currently has OpenJDK 21.0.10).

---

## 2. Current Architecture & Repository Baseline

```text
c:\Users\aksha\Documents\CampusHarmony
├── backend/
│   ├── pom.xml                                  (Configured for Java 17; Spring Boot 3.2.5)
│   ├── run-backend.bat                          (Runs backend via Maven)
│   └── src/main/
│       ├── java/com/campusharmony/
│       │   ├── config/                          (CorsConfig, DataSeeder)
│       │   ├── controller/                      (Attendance, Auth, Course, Dashboard, Marks, Student)
│       │   ├── dto/                             (Request/Response DTOs)
│       │   ├── entity/                          (Activity, Attendance, BaseEntity, Course, Department, Marks, Student, Subject, Teacher)
│       │   ├── exception/                       (GlobalExceptionHandler, ResourceNotFoundException, BadRequestException)
│       │   ├── repository/                      (Spring Data JPA Repositories)
│       │   └── service/                         (Service interfaces and implementations)
│       └── resources/
│           ├── application.properties           (MySQL port 3306, user: root, pass: root, ddl-auto: update)
│           └── seed-data.sql                    (Demo SQL inserts)
├── database/
│   ├── schema.sql                               (DDL with destructive DROP TABLE IF EXISTS)
│   ├── data.sql                                 (Seed inserts matching frontend datasets)
│   └── queries.sql                              (6 sample SELECT queries, NO procedural SQL)
├── frontend/
│   ├── package.json                             (React 19, TanStack Router/Start, Vite 8, Tailwind v4)
│   ├── vite.config.js                           (Uses @lovable.dev/vite-tanstack-config with Nitro cloudflare preset)
│   ├── serve.js                                 (Zero-dependency Node HTTP static file server)
│   ├── run-frontend.bat                         (Runs Vite or serve.js)
│   ├── public/sms/                              (Static HTML/CSS/ES6 Vanilla JS application)
│   │   ├── login.html, index.html, students.html, attendance.html, courses.html, marks.html, profile.html
│   │   ├── css/ (style.css, dashboard.css, students.css, attendance.css)
│   │   ├── js/ (app.js, auth.js, students.js, attendance.js, courses.js, marks.js, profile.js, dashboard.js)
│   │   └── data/data.js (hardcoded mock data)
│   └── src/
│       ├── routes/ (index.jsx redirects to /sms/login.html; __root.jsx)
│       └── components/ui/ (40+ shadcn/ui components)
└── run-project.bat                              (Launches backend and frontend without pre-checks)
```

---

## 3. Detailed Audit: What Works, What is Broken, and What is Missing

### A. Working & Sound Assets to Preserve
1. **Frontend UI Aesthetics & Layouts:** The HTML/CSS screens in `frontend/public/sms/` (Login, Dashboard, Students, Attendance, Courses, Marks, Profile) have complete styling, dark/light theme support, responsive sidebars, modals, and tables. These visual and workflow designs should be directly ported to React components to preserve evaluated work.
2. **Spring Boot Backend Layering:** Controller → Service → Repository → Entity layering is clean, idiomatic, and uses Jakarta Validation annotations.
3. **Local MySQL Service:** MySQL Server 8.0.46 is installed as Windows Service `MySQL80` and is actively running; credentials (`root`/`root`) connect successfully.
4. **Vite Build Infrastructure:** Vite 8 and React 19 dependencies are installed and can generate production bundles.

---

### B. Immediate Broken Features & Compilation Blockers
1. **`AttendanceServiceImpl.java` Syntax Failure:**
   * **Root Cause:** Lines 103–131 contain orphaned, duplicated code from a broken merge located outside any method boundary.
   * **Impact:** `mvn compile` fails immediately with 18 syntax errors.
2. **`AttendanceController.java` Missing Import:**
   * **Root Cause:** Line 26 references `List<Attendance>` without `import com.campusharmony.entity.Attendance;`.
3. **Fake Functionality & Silent Fallbacks in `SMS.api` (`frontend/public/sms/js/app.js`):**
   * **Violation:** Lines 200–347 catch backend errors and silently substitute mock data from `localStorage` or `data.js`. If the backend is down or MySQL write fails, the UI falsely indicates success!
4. **Database Non-Existence:**
   * **Issue:** The database `campus_harmony` does not yet exist on MySQL. Running `database/schema.sql` naively will drop all tables if re-executed.
5. **No Stop Script:**
   * There is no safe Windows `STOP-CAMPUS-HARMONY.bat` script.

---

### C. Missing Academic Requirements

| Subject / Course | Required Academic Outcome | Current State in Repository | Gap Severity |
| :--- | :--- | :--- | :--- |
| **FEE-II (25CSE0203)** | React SPA with React Router, Context API, Protected Routes, Hooks | The active app is **100% vanilla HTML/CSS/JS** in `public/sms/`. The React route (`index.jsx`) only redirects to `/sms/login.html`. | **CRITICAL** (FEE-II Eval II & III require React) |
| **FEE-II (25CSE0203)** | Component Testing (Jest / React Testing Library) | **Zero** tests in frontend. | **HIGH** |
| **FEE-II (25CSE0203)** | Real REST CRUD with explicit Loading / Error states | Silently falls back to browser memory/localStorage on API error. | **HIGH** |
| **DBMS (24CSE0209)** | Procedural SQL (Stored Procedures, Functions, Cursors, Triggers) | **Zero** stored procedures, **zero** functions, **zero** triggers, **zero** cursors. Only 6 basic SELECT queries in `queries.sql`. | **CRITICAL** (Mandatory for top band of 15 marks) |
| **DBMS (24CSE0209)** | Normalized Relational Model (1NF, 2NF, 3NF, BCNF) | `marks` has repeating subject columns (`math`, `physics`, `chemistry`, etc. violating 1NF). `attendance` is only aggregate counters, not dated session events. `students.department` is string text without FK to `departments`. | **HIGH** |
| **DBMS (24CSE0209)** | ACID Transactions & Concurrency demonstration | No scripts demonstrating transaction commit/rollback, savepoints, or isolation levels. | **HIGH** |
| **Java (25CSE0202)** | Direct JDBC Lab Module (`DriverManager`, `Connection`, `PreparedStatement`, `ResultSet`, Transaction commit/rollback) | Only Spring Data JPA exists. **No direct JDBC module exists.** | **CRITICAL** (Explicitly required by Java CHO CLO04) |
| **Java (25CSE0202)** | Java Collections, Comparators, Lambdas & Streams reporting | Not implemented in a dedicated, demonstrable Java module. | **HIGH** |
| **Java (25CSE0202)** | File I/O (CSV Import/Export) with try-with-resources | Missing. | **MEDIUM** |
| **Java (25CSE0202)** | Multithreading & Concurrency demonstration (`Thread`, `Runnable`, `ExecutorService`) | Missing. | **MEDIUM** |
| **Java (25CSE0202)** | Automated Unit / Service Tests (`src/test/java`) | `backend/src/test` does not exist! | **HIGH** |
| **Cross-Course** | Source Control & Git Repository | Repository was unversioned (no `.git` directory). Regular GitHub commits required. | **HIGH** |

---

## 4. Database Schema Issues & Safe Data Migration Strategy

### Current Issues:
1. `database/schema.sql` lines 14–22 contain `DROP TABLE IF EXISTS ...`. Running this wipes all student records.
2. `marks` table stores columns: `mathematics`, `physics`, `chemistry`, `english`, `computer_science`. This violates 1NF and prevents extensible subjects/assessments.
3. `attendance` table stores only `total_days`, `present_days`, `absent_days`, `last_marked`. There is no historical attendance log.
4. `students.department` is an unconstrained string, disregarding `departments` lookup.

### Safe Migration Plan:
1. **Preserve Compatibility:** Maintain backward compatibility with the existing JPA entities while introducing normalized tables (`attendance_records` for dated sessions, `student_marks` for subject-level scores).
2. **Idempotent DDL:** Use `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, and versioned SQL scripts (`V1__baseline.sql`, `V2__normalized_schema.sql`, `V3__procedural_sql.sql`).
3. **Preserve User Data:** Ensure the application startup never drops tables.

---

## 5. Safe Stage-by-Stage Implementation Plan

### Stage B: Architecture & Data Design
* Initialize Git repository with proper `.gitignore` (ignore `node_modules`, `target`, `.output`, dist).
* Design normalized relational schema (ERD & relational mapping).
* Formulate concrete DBMS procedural use cases (1 procedure with cursor, 1 stored function, 2 triggers, 1 transaction use case with rollback).
* Design Java CHO teaching module (Direct JDBC CRUD + Transaction, Collections & Stream Analytics, CSV File I/O, Executor Service demonstration).

### Stage C: Backend & Database Implementation
* Fix `AttendanceServiceImpl.java` syntax error and `AttendanceController.java` missing import.
* Upgrade `pom.xml` to Java 21 LTS (`<java.version>21</java.version>`) and enable `mysql-connector-j` for compile scope.
* Create and execute database schema, seed data, and procedural SQL objects in MySQL `campus_harmony`.
* Implement Direct JDBC package (`com.campusharmony.jdbc.JdbcDemoService`) and CLI/REST endpoints for Java viva.
* Implement Collections, Lambdas, Streams, Generic helper, and CSV Import/Export.
* Add comprehensive backend JUnit tests covering entities, services, and JDBC transactions.

### Stage D: React Frontend Modernization
* Port the vanilla HTML/CSS screens into a genuine, responsive React SPA using React Router, Context API, and controlled components.
* Replace fake `localStorage` fallback in API calls with honest loading indicators, error banners, and toast notifications.
* Connect all user-facing workflows (Auth, Dashboard, Students CRUD, Attendance, Courses, Marks, Profile) to Spring Boot REST endpoints.
* Add Vitest / React Testing Library tests for core UI components and workflows.

### Stage E: Windows Scripts & Academic Documentation
* Create bulletproof Windows scripts:
  * `RUN-CAMPUS-HARMONY.bat` (checks JDK 21, Node, MySQL service; initializes DB if needed; starts backend with health check; starts frontend; opens browser).
  * `STOP-CAMPUS-HARMONY.bat` (safely stops only backend and frontend processes).
* Generate academic reports matching the exact required formats:
  * `FEE_II_PROJECT_REPORT.md` (Times New Roman guidelines, 5 mandatory sections).
  * `DBMS_PROJECT_REPORT.md` (Title, TOC, Intro, ERD, Schema, Use Cases with SQL & output).
  * `JAVA_CA3_PROJECT_REPORT.md` (Aligned with 5 CA-3 evaluation rubrics).
* Create concept maps: `docs/FEE2_CONCEPT_MAP.md`, `docs/DBMS_USE_CASES.md`, `docs/JAVA_CONCEPT_MAP.md`, and `docs/TEST_EVIDENCE.md`.

### Stage F: End-to-End Verification & Acceptance Gates
* Execute automated tests (Frontend & Backend).
* Execute end-to-end launch and verify persistence across restarts in MySQL.
* Verify viva readiness for students.
