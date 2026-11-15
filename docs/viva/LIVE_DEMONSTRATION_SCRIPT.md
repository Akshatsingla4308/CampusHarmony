# CAMPUS HARMONY — LIVE DEMONSTRATION & PRESENTATION SCRIPT

**Project Title:** Campus Harmony (Sunrise Institute ERP)  
**Academic Session:** July–December 2026, Semester III (Batch 2025)  
**Target Evaluations:**
1. Front End Engineering-II (FEE-II, 25CSE0203) — 40 Marks
2. Database Management Systems (DBMS, 24CSE0209) — 50 Marks
3. Programming in Java (25CSE0202) — 25 Marks  
**Estimated Presentation Duration:** 15–20 minutes (Combined) or 5–7 minutes per subject  

---

## 1. Pre-Presentation Setup Checklist

Execute this checklist 10 minutes before the evaluator arrives:

- [ ] **Check 1: MySQL Server Running**
  Verify MySQL 8.0 service is active on port 3306.
  ```powershell
  Get-Service -Name MySQL80
  ```
- [ ] **Check 2: Launch System via One-Click Script**
  Double-click `RUN-CAMPUS-HARMONY.bat` in the project root, or execute:
  ```powershell
  cd c:\Users\aksha\Documents\CampusHarmony
  .\RUN-CAMPUS-HARMONY.bat
  ```
- [ ] **Check 3: Verify URLs in Web Browser**
  Open Google Chrome or Microsoft Edge and open these tabs:
  1. **Modern React ERP:** `http://localhost:5173`
  2. **Evaluated Vanilla Portal:** `http://localhost:5173/sms/index.html`
  3. **Backend Swagger / API Health:** `http://localhost:8080/api/dashboard/stats`
- [ ] **Check 4: Verify Clean Data State**
  Ensure database contains the 20 evaluated students and clean audit logs.
  ```powershell
  mysql -u root -proot campus_harmony -e "SELECT COUNT(*) FROM students;"
  # Expected: 20
  ```

---

## 2. Project Introduction (1 Minute Opening)

**Student Script:**
> *"Good morning / afternoon, respected evaluators. Today, we present **Campus Harmony**, an enterprise-grade academic and attendance management system designed for the Sunrise Institute of Technology.
> 
> Our system bridges three core disciplines of our Computer Science curriculum:
> 1. **Front End Engineering-II (40 Marks):** A modern React 19 single-page enterprise frontend seamlessly integrated with our evaluated legacy vanilla HTML5/CSS3/JavaScript portal.
> 2. **Database Management Systems (50 Marks):** A normalized MySQL 8.0 InnoDB database enforcing composite referential integrity, automated triggers, cursors, stored procedures, and ACID transaction safety.
> 3. **Programming in Java (25 Marks):** A dual-tier Spring Boot 3.2.5 backend alongside a dedicated academic demonstration module proving direct low-level JDBC transactions, custom Comparators, Stream API analytics, character stream file I/O, and multithreaded concurrency.
> 
> The application is 100% locally runnable, self-contained, and completely offline."*

---

## 3. Section A: Front End Engineering-II (FEE-II) Demonstration Flow

### Step A.1: Modern React Dashboard & Metric Cards
- **Action:** Open `http://localhost:5173/` in the browser.
- **Show Evaluator:**
  - 4 Key Metric Cards: Total Students (20), Faculty Count (10), Active Courses (11), and System Attendance Rate.
  - Quick action shortcuts, recent system activity feed, and institutional notices banner.
- **Talking Point:**
  > *"The dashboard is built using reusable functional components: `MetricCard.jsx`, `StatusBadge.jsx`, and `AppLayout.jsx`. State is managed via React hooks (`useState`, `useEffect`) and loaded asynchronously from our Spring Boot REST API."*

### Step A.2: Persona Switching & Dynamic RBAC Navigation
- **Action:** Point to the top navbar where it says **"Faculty Portal (Dr. Rajesh Kumar)"**.
- **Click:** The switch icon next to the persona badge.
- **Show Evaluator:**
  - The portal instantly switches to **"Student Portal (Rahul Sharma)"**.
  - Notice the sidebar navigation dynamically filters: faculty-only links (Add Student, Marks Entry, Controlled Session Deletion) disappear, leaving student-safe views (My Profile, Attendance, Subject Marks).
- **Talking Point:**
  > *"This is implemented in `AuthContext.jsx` using the React Context API. The entire component tree subscribes to `AuthContext`. State updates persist to `localStorage` and trigger instantaneous, clean re-renders without full page reloads."*

### Step A.3: Reusable `DataTable.jsx` (Search, Filter, Pagination)
- **Action:** Navigate to **Students** (`/students`).
- **Show Evaluator:**
  - Type `"Sharma"` in the search bar: table filters live instantly.
  - Click on column headers (`Name`, `Roll`, `Attendance`): demonstrates client-side ascending/descending sorting.
  - Change department filter dropdown from `All Departments` to `Computer Science`.
  - Show page navigation controls at the bottom.
- **Talking Point:**
  > *"Our `DataTable.jsx` component is completely reusable across students, teachers, courses, and marks. It handles search filtering, dynamic comparator sorting, and pagination purely in React state."*

### Step A.4: Preserved Legacy Vanilla Portal Integration
- **Action:** Click **"Evaluated Vanilla Portal"** in the sidebar or open `/sms/index.html`.
- **Show Evaluator:**
  - The original HTML5, CSS3, and vanilla JavaScript portal evaluated in previous continuous evaluations is 100% intact, fully operational, and linked inside the modern React application via `VanillaPortal.jsx`.
- **Talking Point:**
  > *"As required by our master specification, we did not destroy or replace our evaluated FEE-II coursework. We preserved the vanilla portal inside `frontend/public/sms/` and integrated it alongside our enterprise React application."*

### Step A.5: Automated Frontend Vitest Execution
- **Action:** In a terminal, run:
  ```powershell
  cd frontend
  npm run test
  ```
- **Show Evaluator:**
  - All 19 tests in `DataTable.test.jsx`, `MetricCard.test.jsx`, and `StatusBadge.test.jsx` pass in under 2 seconds.

---

## 4. Section B: Database Management Systems (DBMS) Demonstration Flow

### Step B.1: Relational Schema & Composite Integrity Inspection
- **Action:** Open MySQL command line or show `docs/DATABASE_DESIGN.md`.
- **Show Evaluator:**
  - 15 InnoDB tables, 4 views, 3 functions, 6 procedures, and 15 triggers.
  - Explain the composite foreign keys in `attendance_records`:
    ```sql
    CONSTRAINT fk_att_rec_session_composite 
        FOREIGN KEY (session_id, course_code, academic_period_id) 
        REFERENCES attendance_sessions(id, course_code, academic_period_id)
    ```
- **Talking Point:**
  > *"We avoid the common pitfall of independent foreign keys. Our composite foreign keys mathematically guarantee that an attendance record cannot reference a session and an enrollment that belong to different courses or different academic periods."*

### Step B.2: Live Trigger Summary Cache Synchronization
- **Action:** Navigate to **Attendance** (`/attendance`) in the browser.
- **Show Evaluator:**
  - Look at student **Rahul Sharma (CS-2101)**: Total Classes: 25, Present: 23, Attendance: 92.00%.
  - Click **"Mark Routine Attendance"** for CS-2101 as `Absent`.
  - Notice the table immediately updates: Total Classes: 26, Absent: 3, Percentage: 88.46%.
- **Talking Point:**
  > *"This update was NOT calculated by Java application code. It was executed directly by MySQL engine trigger `trg_after_attendance_record_insert`. It performs an atomic `ON DUPLICATE KEY UPDATE` on the `attendance` summary cache table in real-time."*

### Step B.3: Stored Procedure with Cursor & Defaulter Audit Log
- **Action:** Navigate to **DBMS Demonstration** (`/dbms-demo`).
- **Show Evaluator:**
  - Under **"Stored Procedure with Cursor (`sp_generate_attendance_defaulter_report`)"**, leave the threshold at `75.0%` and click **"Execute Defaulter Stored Procedure"**.
  - A success toast appears: *"Defaulter audit procedure executed. Flagged students recorded in audit log."*
  - The table below updates with historical audit snapshots showing student roll, name, attendance percentage, and classes needed.
- **Talking Point:**
  > *"Inside MySQL, `sp_generate_attendance_defaulter_report` opens an explicit cursor `cur_students`, iterates through the student records, handles end-of-cursor with a continue handler, calculates the continuous shortfall formula, and inserts audit records."*

### Step B.4: Immutability Trigger Protection Demonstration
- **Action:** In MySQL CLI or on `/dbms-demo`, attempt to delete an audit record.
  ```sql
  DELETE FROM defaulter_audit_log WHERE id = 1;
  ```
- **Show Evaluator:**
  - MySQL immediately blocks the statement:
    `ERROR 1644 (45000): Integrity Violation: Historical defaulter audit log records are immutable and cannot be deleted.`
- **Talking Point:**
  > *"Triggers `trg_prevent_defaulter_audit_update` and `trg_prevent_defaulter_audit_delete` enforce non-bypassable legal immutability for compliance records at the storage engine level."*

### Step B.5: Continuous Shortfall Attendance Formula
- **Action:** Navigate to **Defaulters Roster** (`/defaulters`).
- **Show Evaluator:**
  - Point to **Yash Patel (CS-2117)**: Attendance: 41.67%, Classes Needed: 16.
- **Talking Point:**
  > *"Our deterministic stored function `fn_calculate_classes_needed` computes the exact number of consecutive classes a student must attend to clear debarment using the formula: $\lceil (0.75 \times \text{total} - \text{present}) / 0.25 \rceil$."*

### Step B.6: Automated DBMS JUnit 5 Test Suite
- **Action:** In terminal, run:
  ```powershell
  mvn test -f backend/pom.xml -Dtest=DbmsIntegrityAndTriggerTests
  ```
- **Show Evaluator:**
  - All 6 database integrity and trigger tests pass cleanly.

---

## 5. Section C: Programming in Java Demonstration Flow

### Step C.1: Interactive Java Demonstration Hub
- **Action:** Navigate to **Java Demonstration** (`/java-demo`) in the web browser.
- **Show Evaluator:**
  - The 5 dedicated academic demonstration cards: Direct JDBC Transactions, Custom Comparators, Stream API Analytics, CSV File Streaming, and Multithreaded Concurrency.

### Step C.2: Direct Low-Level JDBC ACID Commit & Rollback
- **Action:** On `/java-demo`, scroll to the **Direct JDBC Transactions** card.
  - **Scenario 1 (Commit):** Enter Roll `JDBC-DEMO-01`, Name `Vikram Verma`, leave "Simulate Unrecoverable Failure" **UNCHECKED**, click **"Execute JDBC Transaction"**.
    - Result: `Status: COMMITTED`. Generated ID displayed. Row persists in MySQL.
  - **Scenario 2 (Rollback):** Enter Roll `JDBC-FAIL-02`, Name `Anil Mehta`, **CHECK** "Simulate Unrecoverable Failure (Force Rollback)", click **"Execute JDBC Transaction"**.
    - Result: `Status: ROLLED_BACK`. Message: *"Transaction rolled back cleanly: Simulated unrecoverable failure during transaction processing."*
  - Verify in MySQL CLI:
    ```sql
    SELECT COUNT(*) FROM students WHERE roll = 'JDBC-FAIL-02'; -- Returns 0!
    ```
- **Talking Point:**
  > *"Here we bypass Spring Data JPA to demonstrate raw JDBC mastery. We explicitly disable auto-commit (`conn.setAutoCommit(false)`), use `PreparedStatement` to prevent SQL injection, and manually invoke `conn.rollback()` inside `catch (SQLException)` to guarantee atomicity."*

### Step C.3: Custom Comparator Sorting Strategies
- **Action:** Scroll to the **Custom Comparator Sorting** card.
  - Click **"Sort by Name (Alphabetical)"**: Students sort from A to Z.
  - Click **"Sort by Attendance (Descending)"**: Highest attendance (Ananya Iyer 96%) appears first; lowest appears last.
- **Talking Point:**
  > *"Implemented in `StudentComparatorDemo.java`. Instead of hardcoding ordering into the entity, we supply external `Comparator<Student>` implementations dynamically, preserving Open/Closed Principle."*

### Step C.4: Streams API Analytics & Grouping
- **Action:** Scroll to **Stream API & Functional Programming** card and click **"Compute Stream Analytics"**.
- **Show Evaluator:**
  - Eligible vs. Defaulters partitioned map using `Collectors.partitioningBy()`.
  - Average attendance per department using `Collectors.groupingBy()` with downstream averaging collector.
  - Min, Max, Average attendance summary using `IntSummaryStatistics`.
- **Talking Point:**
  > *"All metrics are computed in memory using declarative Stream API pipelines without a single mutable for-loop."*

### Step C.5: CSV Character Streams & Checked Exception Handling
- **Action:** Click **"Download Students CSV"**.
  - Browser downloads `students_roster.csv`. Open the file to show clean RFC-4180 formatted rows.
- **Talking Point:**
  > *"Implemented in `CsvReportHandler.java` using `BufferedReader`, `BufferedWriter`, and `try-with-resources`. Malformed lines trigger our custom checked exception `CsvParseException`."*

### Step C.6: Multithreading & Thread Pool Parallel Processing
- **Action:** Scroll to **Concurrency & Multi-Threading** card. Set Batches = 4, Records = 100, click **"Run Parallel Attendance Batch"**.
- **Show Evaluator:**
  - Execution completes in $\approx 15\text{ ms}$.
  - Look at the thread execution log:
    - `Batch #1 processed 100 records on pool-2-thread-1`
    - `Batch #2 processed 100 records on pool-2-thread-2`
    - `Batch #3 processed 100 records on pool-2-thread-3`
    - `Batch #4 processed 100 records on pool-2-thread-4`
- **Talking Point:**
  > *"Implemented in `AttendanceProcessingDemo.java`. We use an `ExecutorService` with 4 fixed worker threads, `CountDownLatch` to block until all workers complete, and `AtomicInteger` for lock-free thread-safe tallying."*

### Step C.7: Standalone CLI Runner & JUnit 5 Tests
- **Action:** In terminal, execute the standalone Java CLI launcher:
  ```powershell
  mvn test-compile exec:java -f backend/pom.xml -Dexec.mainClass="com.campusharmony.demo.CampusHarmonyJavaDemo"
  ```
- **Show Evaluator:**
  - Formatted terminal output demonstrating all 5 modules running in pure Java.
- **Action:** Run the automated Java test suite:
  ```powershell
  mvn test -f backend/pom.xml -Dtest=JavaModuleDemoTests
  ```
  - All 7 tests pass with 0 failures.

---

## 6. Closing & Q&A Transition (30 Seconds)

**Student Script:**
> *"To conclude, Campus Harmony satisfies every requirement of Front End Engineering-II, Database Management Systems, and Programming in Java.
> - The frontend is modern, responsive, accessible, and rigorously tested.
> - The database enforces relational integrity, real-time trigger synchronization, and immutable auditing.
> - The Java backend bridges production enterprise Spring Boot with low-level direct JDBC and concurrency mastery.
> 
> We are now ready to answer your questions. Thank you!"*

---

## 7. Emergency Troubleshooting & Contingency Matrix

| Issue During Viva | Quick Root Cause | Instant Fix Command |
| :--- | :--- | :--- |
| **Port 8080 already in use** | A previous backend instance is running | `Stop-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess -Force` |
| **Frontend shows "Network Error"** | Backend is still starting up | Wait 10 seconds and refresh browser; check backend terminal for `Started CampusHarmonyApplication`. |
| **MySQL Connection Refused** | MySQL80 service is stopped | Run PowerShell as Admin: `Start-Service MySQL80` |
| **Rollback Demo row still appears** | You used the same roll number in a previous test | Change the roll number in the form input (e.g., `JDBC-FAIL-99`) and re-run. |
| **Browser styling looks broken** | Old browser cache | Press `Ctrl + Shift + R` (Hard Reload). |
