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
│                                   │ • Vanilla FEE-II Portal (/sms/ preserved)│
│                                   │ • 15 Vitest / React Testing Library tests│
├───────────────────────────────────┼─────────────────────────────────────────┤
│ BACKEND PERSISTENCE (Java - 25M)  │ • Spring Boot 3.2.5 (Java 21 LTS)       │
│                                   │ • Spring Data JPA + Direct JDBC CRUD    │
│                                   │ • Core Java CHO Demo Module (7 classes) │
│                                   │ • 13 JUnit 5 Backend Integration Tests  │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ DATABASE (DBMS - 50M)             │ • MySQL Server 8.0 (InnoDB Engine)      │
│                                   │ • 15 Normalized / Legacy Tables         │
│                                   │ • 15 Row-Level Triggers (Integrity/Sync)│
│                                   │ • 6 Stored Procedures (Cursor, ACID)    │
│                                   │ • 3 Stored Functions (Grades, Averages) │
│                                   │ • 4 Analytical Relational Views         │
└───────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 2. Quick-Start Guide (Local / Offline Setup)

### Prerequisites
- **JDK 21 LTS** installed and configured (`java -version`)
- **Apache Maven 3.9+** (`mvn -version`)
- **Node.js 20+** and **npm** (`node -v`, `npm -v`)
- **MySQL Server 8.0+** running on `localhost:3306` with user `root`, password `root`

### Step 1: Database Initialization
Open MySQL CLI or terminal and run the database initialization scripts in sequence:
```powershell
# 1. Create Schema and 15 Tables
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot < database/schema_v5.sql

# 2. Install 3 Functions, 6 Procedures, and 15 Triggers
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot campus_harmony < database/procedures_triggers.sql

# 3. Populate 20-Student Academic Seed Dataset
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot campus_harmony < database/seed_data_v5.sql
```

### Step 2: Start Spring Boot Backend
In the project root, launch the backend API server on port 8080:
```powershell
mvn spring-boot:run -f backend/pom.xml
```
*API Base URL:* `http://localhost:8080/api`

### Step 3: Start React Modern Frontend
In a new terminal, launch the Vite development server:
```powershell
npm --prefix frontend run dev
```
*Frontend URL:* `http://localhost:5173` (or port assigned by Vite)  
*Legacy Vanilla FEE-II Portal:* `http://localhost:5173/sms/index.html`

---

## 3. Academic Demonstrations for Viva Evaluators

### A. DBMS Evaluation (50 Marks) — Live Demonstrations
1. **Stored Procedure with Cursor & Shortfall Calculation:**
   - Evaluator Command:
     ```bash
     curl -s "http://localhost:8080/api/dbms/defaulters?threshold=75.0"
     ```
   - Mathematical Shortfall Formula:
     $$\text{Classes Needed} = \left\lceil \frac{(\text{threshold} \times \text{total}) - (100 \times \text{present})}{100 - \text{threshold}} \right\rceil$$
2. **ACID Multi-Table Transaction (Commit vs. Rollback):**
   - Clean Commit:
     ```bash
     curl -s -X POST "http://localhost:8080/api/dbms/transaction-demo?simulateError=false"
     ```
   - Simulated Rollback:
     ```bash
     curl -s -X POST "http://localhost:8080/api/dbms/transaction-demo?simulateError=true"
     ```
3. **Summary Cache Self-Healing:**
   ```bash
   curl -s -X POST "http://localhost:8080/api/dbms/reconcile-attendance/1"
   ```
4. **Trigger Integrity Tests:**
   - Attempting to mark attendance for a dropped enrollment throws SQLSTATE 45000: `Integrity Error: Attendance requires active Enrolled status`.
   - Attempting to delete a student with attendance records throws SQLSTATE 45000: `Audit Violation: Cannot delete student with attendance history. Use sp_archive_and_delete_student`.

### B. Programming in Java Evaluation (25 Marks) — Standalone Demonstrations
Run the standalone terminal demonstration CLI directly without starting the server:
```powershell
mvn exec:java "-Dexec.mainClass=com.campusharmony.demo.CampusHarmonyJavaDemo" -f backend/pom.xml
```
Demonstrations displayed:
1. **Direct JDBC Transactions:** Manual `conn.setAutoCommit(false)` with explicit commit and rollback.
2. **Collections & Custom Comparator:** Sorting students by name, roll, and attendance percentage.
3. **Stream API & Functional Programming:** Defaulter partitioning, department grouping, and `IntSummaryStatistics`.
4. **Java Generics:** Bounded type repository `<T extends BaseEntity, ID>` with `Predicate<? super T>` filters.
5. **CSV File I/O:** Export/import stream with checked exception `CsvParseException`.
6. **Concurrency & Thread Pooling:** Parallel batch processing using `ExecutorService`, `Callable`, `CountDownLatch`, and `AtomicInteger`.

### C. Front End Engineering-II Evaluation (40 Marks) — React & Modern Web
1. **Interactive Single-Page ERP:**
   - Responsive layouts, dark/light theme switcher, role-based persona toggling (Faculty vs. Student).
   - Recharts visual analytics (attendance distribution, enrollment breakdown).
   - Form validation and instant CRUD feedback.
2. **Preserved Evaluated Vanilla Portal:**
   - Click "Vanilla FEE-II Portal" in the sidebar or open `/sms/index.html` to review previously evaluated vanilla HTML5, CSS3, and JavaScript modules.

---

## 4. Automated Test Verification

Both frontend and backend suites are 100% automated and pass with 0 errors:

```powershell
# Run Backend DBMS & Java Integration Tests (13 Tests)
mvn test -f backend/pom.xml
# Result: Tests run: 13, Failures: 0, Errors: 0, Skipped: 0 -> BUILD SUCCESS

# Run Frontend Component & API Tests (15 Tests)
npm --prefix frontend run test
# Result: Test Files: 5 passed (5), Tests: 15 passed (15)

# Verify Production Build
npm --prefix frontend run build
# Result: 2283 modules transformed, 0 errors -> BUILD SUCCESS
```

---

## 5. Application Modules Inventory

| # | Route | Module Name | Primary Backend API Connected |
|---|---|---|---|
| 1 | `/` | Executive ERP Dashboard | `/api/students`, `/api/teachers`, `/api/attendance` |
| 2 | `/students` | Student Directory & Admissions | `/api/students/**` (CRUD) |
| 3 | `/teachers` | Faculty & Instructors | `/api/teachers/**` (CRUD) |
| 4 | `/departments` | Academic Departments | `/api/departments/**` (CRUD) |
| 5 | `/subjects` | Curriculum Subjects Catalog | `/api/subjects/**` (CRUD) |
| 6 | `/courses` | Course Offerings & Enrollments | `/api/courses/**` |
| 7 | `/attendance` | Lecture Attendance & Sessions | `/api/attendance/**`, `/api/attendance/sessions/**` |
| 8 | `/marks` | Marks & Examinations | `/api/marks/**`, `/api/marks/evaluations/**` |
| 9 | `/transcript` | Official Academic Transcripts | `/api/marks/transcript/**` |
| 10 | `/defaulters` | Defaulter Reports (Cursor Math) | `/api/dbms/defaulters?threshold=...` |
| 11 | `/activities` | Campus Activities & Mentorship | `/api/activities/**` (CRUD) |
| 12 | `/dbms-demo` | DBMS Stored Procedures & ACID | `/api/dbms/**` |
| 13 | `/java-demo` | Core Java CHO Demonstrations | `/api/java-demo/**` |
| 14 | `/profile` | User Profile & Settings | Local persona switching & session controls |
| 15 | `/sms/index.html` | Evaluated Vanilla FEE-II Portal | Direct vanilla JS DOM/LocalStorage portal |

---

## 6. Project Documentation Directory

- [`docs/STAGE_A_AUDIT_REPORT.md`](docs/STAGE_A_AUDIT_REPORT.md): Complete repository, data, and academic requirements audit.
- [`docs/DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md): Normalized ER schema, 1NF–BCNF mapping, and denormalization rationale.
- [`docs/DBMS_USE_CASES.md`](docs/DBMS_USE_CASES.md): Full specification of 28 stored programs, triggers, and views.
- [`docs/STAGE_C_IMPLEMENTATION_REPORT.md`](docs/STAGE_C_IMPLEMENTATION_REPORT.md): Stage C physical MySQL and backend implementation verification.
- [`docs/STAGE_D_IMPLEMENTATION_REPORT.md`](docs/STAGE_D_IMPLEMENTATION_REPORT.md): Stage D frontend modernization and FEE-II integration report.

---
**Campus Harmony ERP** | Built for Sunrise Institute & Evaluated at Chitkara University Batch 2025.
