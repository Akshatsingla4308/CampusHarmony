# CAMPUS HARMONY — Sunrise Institute ERP System
**Comprehensive College Student Management System**  
**Academic Context:** Chitkara University | BE CSE | Batch 2025 | Semester III (July–December 2026)  
**Evaluation Triple-Threat:**  
- **Front End Engineering-II (25CSE0203)** — 40 Marks (Project Based Evaluation III)  
- **Database Management System (24CSE0209)** — 50 Marks (Final Project Evaluation)  
- **Programming in Java (25CSE0202)** — 25 Marks (CA-3 Project Milestone & CA-4 Viva)  

---

## 1. Project Overview & Architecture

Campus Harmony is a production-grade, local/offline University ERP system designed and implemented to satisfy rigorous university curriculum requirements across frontend engineering, relational database integrity, and core Java programming paradigms.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CAMPUS HARMONY ARCHITECTURE                           │
├───────────────────────────────────┬─────────────────────────────────────────┤
│ FRONTEND (FEE-II - 40M)           │ • React 19 + Tailwind CSS v4 + Radix UI │
│                                   │ • TanStack Router (File-based routing)  │
│                                   │ • Recharts + Lucide React Icons         │
│                                   │ • Vanilla FEE-II Portal (/sms/ intact)  │
│                                   │ • 19 Vitest / React Testing Library     │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ BACKEND PERSISTENCE (Java - 25M)  │ • Spring Boot 3.2.5 (OpenJDK 21 LTS)    │
│                                   │ • Spring Data JPA + Direct JDBC CRUD    │
│                                   │ • Core Java CHO Demo Module (7 classes) │
│                                   │ • 13 JUnit 5 Backend Integration Tests  │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ DATABASE (DBMS - 50M)             │ • MySQL Server 8.0 (InnoDB Engine)      │
│                                   │ • 15 Normalized Relational Tables       │
│                                   │ • 15 Row-Level Triggers (Integrity/Sync)│
│                                   │ • 6 Stored Procedures (Cursor, ACID)    │
│                                   │ • 3 Stored Functions (Grades, Shortfall)│
│                                   │ • 4 Analytical Relational Views         │
└───────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 2. Quick-Start Guide (One-Click Local / Offline Launch)

### Prerequisites
- **JDK 21 LTS** installed and configured (`java -version`)
- **Apache Maven 3.9+** (`mvn -version`)
- **Node.js 20+** and **npm** (`node -v`, `npm -v`)
- **MySQL Server 8.0+** running on `localhost:3306` with the v5 schema and migration 006. Configure the database credentials and first admin as described in [the foundation setup](docs/ACADEMIC_FOUNDATION.md)

### One-Click Launchers
Campus Harmony includes automated Windows batch scripts in the project root:
- **`RUN-CAMPUS-HARMONY.bat`**: Starts MySQL service check, compiles/boots Spring Boot on `http://localhost:8080`, launches Vite on `http://localhost:5173`, and opens the browser.
- **`STOP-CAMPUS-HARMONY.bat`**: Gracefully terminates background Java, Maven, and Node.js processes, freeing ports 8080, 5173, and 8081 cleanly.

### Manual Launch Steps
```powershell
# 1. Start Backend API Server (Port 8080)
mvn spring-boot:run -f backend/pom.xml

# 2. In a separate terminal, start React Development Server (Port 5173)
npm --prefix frontend run dev
```

*Modern React ERP:* `http://localhost:5173`  
*Evaluated Vanilla FEE-II Portal:* `http://localhost:5173/sms/index.html`  
*Backend REST API Base:* `http://localhost:8080/api`  

---

## 3. Academic Demonstrations for Viva Evaluators

### A. Front End Engineering-II Evaluation (40 Marks) — React & Modern Web
1. **Interactive Single-Page ERP:**
   - 16 production modules with responsive layouts and accessible controls.
   - Sign in with a provisioned admin, teacher or student account. The backend session determines access.
   - Reusable `DataTable.jsx`: Client-side search, multi-column sorting, and pagination.
   - Recharts visual analytics (attendance distribution, enrollment breakdown).
2. **Preserved Evaluated Vanilla Portal:**
   - Preserved under `frontend/public/sms/` (`index.html`, `students.html`, `attendance.html`, `reports.html`).
   - Accessible via direct sidebar link and embedded iframe view at `/vanilla-portal`.
3. **Automated Testing:**
   - 19 Vitest unit and integration tests covering components (`DataTable`, `MetricCard`, `StatusBadge`). Run: `npm --prefix frontend run test`.

### B. Database Management Systems Evaluation (50 Marks) — Live Demonstrations
1. **Stored Procedure with Cursor & Continuous Shortfall Calculation:**
   - Procedure `sp_generate_attendance_defaulter_report` opens cursor `cur_students`, iterates through cohorts, identifies students $< 75\%$, and writes immutable snapshots to `defaulter_audit_log`.
   - Stored Function `fn_calculate_classes_needed` computes shortfall using:
     $$\text{Classes Needed} = \left\lceil \frac{0.75 \times \text{total} - \text{present}}{0.25} \right\rceil$$
2. **Real-Time Trigger Summary Cache Synchronization:**
   - Triggers `trg_after_attendance_record_insert`, `update`, and `delete` synchronize the `attendance` summary cache table in $O(1)$ time upon any attendance DML.
3. **Composite Foreign Key Integrity & Enrollment Gating:**
   - Composite foreign keys link `attendance_records` to `course_enrollments` and `attendance_sessions`, preventing mismatched courses/periods.
   - Triggers block attendance logging if enrollment status is `'Dropped'` or `'Completed'`.
4. **Audit Immutability Protection:**
   - Triggers `trg_prevent_defaulter_audit_update` and `delete` raise SQLSTATE `45000` to prevent tampering with legal debarment records.
5. **ACID Transaction Management:**
   - Multi-table operations support explicit commit and rollback with zero orphan rows.

### C. Programming in Java Evaluation (25 Marks) — Standalone & Web Demonstrations
Run the standalone terminal demonstration CLI directly:
```powershell
mvn exec:java "-Dexec.mainClass=com.campusharmony.demo.CampusHarmonyJavaDemo" -f backend/pom.xml
```
Demonstrations displayed:
1. **Direct Low-Level JDBC Transactions:** Manual `conn.setAutoCommit(false)` with explicit commit and rollback in `JdbcTransactionDemo.java`.
2. **Collections & Custom Comparators:** Dynamic sorting algorithms by name, roll, and attendance percentage in `StudentComparatorDemo.java`.
3. **Stream API & Functional Analytics:** Defaulter partitioning, department grouping, and `IntSummaryStatistics` in `AnalyticsStreamDemo.java`.
4. **Bounded Generics:** Type-safe repository `<T extends BaseEntity, ID>` with `Predicate<? super T>` filters in `GenericDataRepository.java`.
5. **CSV Character Stream I/O:** Stream parsing and export with `try-with-resources` and custom checked exception `CsvParseException` in `CsvReportHandler.java`.
6. **Concurrency & Thread Pooling:** Parallel batch processing across 4 worker threads using `ExecutorService`, `Callable`, `Future`, `CountDownLatch`, and `AtomicInteger` in `AttendanceProcessingDemo.java`.

---

## 4. Automated Test Verification

Both frontend and backend test suites are 100% automated and pass with 0 errors:

```powershell
# Run Backend DBMS & Java Integration Tests (13 Tests)
mvn test -f backend/pom.xml
# Result: Tests run: 13, Failures: 0, Errors: 0, Skipped: 0 -> BUILD SUCCESS

# Run Frontend Component & Unit Tests (19 Tests)
npm --prefix frontend run test
# Result: Test Files: 3 passed (3), Tests: 19 passed (19) -> 100% PASS

# Verify Production Build
npm --prefix frontend run build
# Result: 2283 modules transformed, 0 errors -> BUILD SUCCESS
```

---

## 5. Application Modules Inventory

| # | Route | Module Name | Primary Backend API Connected |
|---|---|---|---|
| 1 | `/` | Academic workspace by role | `/api/academic/**` |
| 2 | `/students` | Student Directory & Admissions | `/api/students/**` (CRUD) |
| 3 | `/teachers` | Faculty & Instructors | `/api/teachers/**` (CRUD) |
| 4 | `/departments` | Academic Departments | `/api/departments/**` (CRUD) |
| 5 | `/subjects` | Curriculum Subjects Catalog | `/api/subjects/**` (CRUD) |
| 6 | `/courses` | Course Offerings & Enrollments | `/api/courses/**` |
| 7 | `/attendance` | Lecture Attendance & Sessions | `/api/academic/lectures/**`, `/api/academic/my-attendance` |
| 8 | `/marks` | Marks & Examination Tiers | `/api/marks/**`, `/api/marks/evaluations/**` |
| 9 | `/transcript` | Official Academic Transcripts | `/api/marks/transcript/**` |
| 10 | `/defaulters` | Defaulter Reports (Cursor Math) | `/api/dbms/defaulters?threshold=...` |
| 11 | `/activities` | Campus Activities & Notice Board| `/api/activities/**` (CRUD) |
| 12 | `/dbms-demo` | DBMS Stored Procedures & ACID | `/api/dbms/**` |
| 13 | `/java-demo` | Core Java CHO Demonstrations | `/api/java-demo/**` |
| 14 | `/vanilla-portal`| Preserved Legacy Vanilla Portal | Direct `/sms/index.html` iframe & link |
| 15 | `/profile` | User Profile & Settings | Authenticated profile and session controls |
| 16 | `/sms/index.html`| Evaluated Vanilla FEE-II Portal | Direct vanilla JS DOM/LocalStorage portal |

---

## 6. Comprehensive Academic Documentation Directory

All documentation has been compiled specifically for student examination and evaluator defense:

### Master Academic Reports (Stage F Deliverables)
- [`docs/FEE_II_PROJECT_REPORT.md`](docs/FEE_II_PROJECT_REPORT.md): **FEE-II (25CSE0203) Complete Academic Report (40 Marks)** — HTML5/CSS3/JS, React 19 architecture, reusable components, Context API, Vitest testing, and build verification.
- [`docs/DBMS_PROJECT_REPORT.md`](docs/DBMS_PROJECT_REPORT.md): **DBMS (24CSE0209) Complete Academic Report (50 Marks)** — Conceptual ER modeling, Crow's foot diagrams, 15 tables, 1NF–BCNF normalization proofs, stored functions, procedures with cursors, 15 triggers, and ACID transactions.
- [`docs/JAVA_PROJECT_REPORT.md`](docs/JAVA_PROJECT_REPORT.md): **Programming in Java (25CSE0202) Complete Academic Report (25 Marks)** — OOP design, JPA vs. direct JDBC transactions, collections and custom comparators, Stream API analytics, bounded generics, CSV streaming, and multithreaded concurrency.

### Viva Preparation Question Banks (180 Total Questions)
- [`docs/viva/FEE_II_VIVA_QUESTIONS.md`](docs/viva/FEE_II_VIVA_QUESTIONS.md): **FEE-II Viva Question Bank** — 30 Basic, 20 Intermediate, 10 Project-Specific Questions with student answers and Top 10 mistakes to avoid.
- [`docs/viva/DBMS_VIVA_QUESTIONS.md`](docs/viva/DBMS_VIVA_QUESTIONS.md): **DBMS Viva Question Bank** — 30 Basic, 20 Intermediate, 10 Project-Specific Questions with schema references and Top 10 mistakes to avoid.
- [`docs/viva/JAVA_VIVA_QUESTIONS.md`](docs/viva/JAVA_VIVA_QUESTIONS.md): **Java Viva Question Bank** — 30 Basic, 20 Intermediate, 10 Project-Specific Questions with code references and Top 10 mistakes to avoid.

### Live Demonstration & Presentation Script
- [`docs/viva/LIVE_DEMONSTRATION_SCRIPT.md`](docs/viva/LIVE_DEMONSTRATION_SCRIPT.md): **Step-by-Step Live Demonstration Script** — 15–20 minute presentation flow for students across FEE-II, DBMS, and Java with exact click-by-click instructions, talking points, and contingency fixes.

### Engineering & Implementation Audits
- [`docs/STAGE_A_AUDIT_REPORT.md`](docs/STAGE_A_AUDIT_REPORT.md): Initial repository, data, and academic requirements audit.
- [`docs/DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md): Database architecture, composite referential integrity, and normalization analysis.
- [`docs/DBMS_USE_CASES.md`](docs/DBMS_USE_CASES.md): Specification of stored routines, cursors, triggers, and views.
- [`docs/JAVA_CONCEPT_MAP.md`](docs/JAVA_CONCEPT_MAP.md): Detailed CHO topic-by-topic concept mapping matrix.
- [`docs/STAGE_C_IMPLEMENTATION_REPORT.md`](docs/STAGE_C_IMPLEMENTATION_REPORT.md): Backend and MySQL implementation milestone report.
- [`docs/STAGE_D_IMPLEMENTATION_REPORT.md`](docs/STAGE_D_IMPLEMENTATION_REPORT.md): Frontend modernization and FEE-II integration milestone report.
- [`docs/STAGE_E_TESTING_REPORT.md`](docs/STAGE_E_TESTING_REPORT.md): Full-system integration, live CRUD verification, and regression test report.

---
**Campus Harmony ERP** | Built for Sunrise Institute & Evaluated at Chitkara University Batch 2025.
