# CampusHarmony

**CampusHarmony** is a full-stack, enterprise-grade Academic Management System designed for colleges and universities. It integrates academic structure administration, course offerings, lecture-wise attendance management, marks evaluation, timetable scheduling, attendance analytics, and student grievance resolution into a unified, responsive platform.

GitHub Repository: [https://github.com/Akshatsingla4308/CampusHarmony.git](https://github.com/Akshatsingla4308/CampusHarmony.git)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Main Features](#3-main-features)
4. [Administrator Functionality](#4-administrator-functionality)
5. [Teacher Functionality](#5-teacher-functionality)
6. [Student Functionality](#6-student-functionality)
7. [Technology Stack](#7-technology-stack)
8. [System Architecture (Frontend / Backend / Database)](#8-system-architecture)
9. [Complete Folder Structure](#9-complete-folder-structure)
10. [Software Prerequisites](#10-software-prerequisites)
11. [First-Time Installation](#11-first-time-installation)
12. [Database Initialization](#12-database-initialization)
13. [How to Seed the Realistic Academic Demonstration Dataset](#13-how-to-seed-the-realistic-academic-demonstration-dataset)
14. [How to Configure Environment Variables](#14-how-to-configure-environment-variables)
15. [How to Launch the Entire Application](#15-how-to-launch-the-entire-application)
16. [How to Stop the Application](#16-how-to-stop-the-application)
17. [How to Access the Website & Demo Logins](#17-how-to-access-the-website--demo-logins)
18. [How to Securely Create the First Administrator](#18-how-to-securely-create-the-first-administrator)
19. [How to Run Frontend Tests](#19-how-to-run-frontend-tests)
20. [How to Run Backend Tests](#20-how-to-run-backend-tests)
21. [Troubleshooting Common Errors](#21-troubleshooting-common-errors)

---

## 1. Project Overview

CampusHarmony modernizes higher education academic administration. Instead of maintaining disjointed spreadsheets and isolated legacy tools, CampusHarmony brings departments, terms, sections, course offerings, lecture attendance, continuous marks evaluation, weekly schedules, attendance defaulter tracking, and student complaints into a cohesive, secure, role-based system.

---

## 2. Problem Statement

Higher education institutions frequently suffer from fragmented administrative workflows:
- **Attendance Discrepancies**: Paper rosters and manual roll calls delay defaulter identification, preventing timely student interventions.
- **Marks Inconsistencies**: Ad-hoc spreadsheets lack transactional consistency, audit trails, and automated grade calculations.
- **Timetable Conflicts**: Manual room and faculty allocations lead to overlapping periods and student scheduling confusion.
- **Unresolved Grievances**: Student complaints regarding discrepancies or evaluations lack transparent tracking and accountability.
- **Siloed Systems**: Students, teachers, and administrators operate on different platforms without real-time data synchronization.

CampusHarmony solves these challenges by providing a relational database foundation backed by ACID guarantees, a secured Spring Boot REST backend with role-based access control, and a responsive React client interface.

---

## 3. Main Features

- **Academic Catalog Management**: Strict hierarchies for Departments, Academic Terms, Semesters, Sections, Subjects, Courses, and Section Offerings.
- **Lecture-Wise Attendance Tracking**: Date- and slot-based attendance logging with bulk toggle controls, live counters, search filtering, and audit-logged corrections.
- **Multi-Component Marks & Evaluations**: Support for Internal, Midterm, End-Semester, Assignment, Quiz, and Project components with real-time score validation.
- **Interactive Weekly Timetable**: Section-specific schedule grid with conflict-prevention constraints, timetable-to-attendance jump links, and responsive mobile day view.
- **Attendance Analytics & Defaulters**: Real-time attendance percentage aggregation, threshold filtering (e.g., <75%), and mathematical shortfall lecture calculation.
- **Student Complaints & Grievance Redressal**: Student ticket filing, category tagging, administrative status updates (Pending, In Review, Resolved, Dismissed), and resolution audit logs.

---

## 4. Administrator Functionality

- **Catalog Administration**: Create and manage Departments, Terms, Sections, and Courses.
- **Cohort Allocations**: Assign faculty to course offerings and enroll student cohorts into sections.
- **System-Wide Oversight**: View institution-wide attendance summaries, low-attendance alerts, and course performance analytics.
- **Complaint Resolution**: Triage incoming student grievances, update status with resolution remarks, and monitor redressed issues.
- **Account Provisioning**: Register verified Teacher and Student user accounts linked to faculty and student records.

---

## 5. Teacher Functionality

- **Teaching Dashboard**: Access active course offerings, section rosters, and weekly timetable schedules.
- **Daily Lecture Attendance**: Mark attendance for scheduled lectures with bulk "All Present" / "All Absent" shortcuts and student search.
- **Attendance Corrections**: Edit existing attendance records with mandatory audit justification logging.
- **Continuous Evaluation**: Record assessment scores with real-time range validation, unsaved change alerts, and audit logging.

---

## 6. Student Functionality

- **Academic Schedule**: View daily and weekly class timetable slots and assigned classrooms.
- **Attendance Monitoring**: Check course-wise attendance percentages, attended/conducted counts, and required recovery lectures to meet threshold.
- **Evaluation Grades**: Review assessment scores and letter grades.
- **Grievance Redressal**: Submit complaints, upload category details, and track resolution status in real-time.

---

## 7. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TanStack Router, TanStack Start, Tailwind CSS v4, Radix UI, Lucide React, Recharts |
| **Backend** | Java 17/21, Spring Boot 3.2.5, Spring Web, Spring Data JPA / JDBC, Hibernate Validator |
| **Database** | MySQL Server 8.0+ (InnoDB Engine), Stored Procedures, Functions, Views, Row-Level Triggers |
| **Containerization** | Docker, Docker Compose (`compose.yaml`) |
| **Testing** | Vitest, React Testing Library, JUnit 5, Spring Boot Test |

---

## 8. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CAMPUS HARMONY ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                CLIENT TIER                                  │
│   React 19 SPA / TanStack Router + Tailwind CSS v4 + Radix UI Primitives    │
│   Role-based portals: Administrator, Teacher, and Student                   │
├──────────────────────────────────────┬──────────────────────────────────────┤
│                                      │ HTTP REST API (Port 8080)            │
│                                      │ JSON payloads + Session Cookies      │
│                                      ▼                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                              APPLICATION TIER                               │
│   Spring Boot 3.2.5 (Java 17/21) REST Backend                               │
│   • CorsConfig & Role-based Access Interceptor (RBAC)                       │
│   • Security Session Context & Secure Password Hashing                      │
│   • Controllers: Academic, Attendance, Marks, Timetable, Analytics, Grievance│
│   • Spring Data JPA + Direct JDBC Transaction Support                       │
├──────────────────────────────────────┬──────────────────────────────────────┤
│                                      │ JDBC / TCP Connection (Port 3306)    │
│                                      │ MySQL Connector/J                    │
│                                      ▼                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                DATABASE TIER                                │
│   MySQL Server 8.0+ (InnoDB Engine)                                         │
│   • 36 Normalized Relational Tables & Views (3NF / BCNF)                    │
│   • 17 Row-Level Integrity Triggers & Defaulter Loggers                     │
│   • 11 Stored Procedures & Shortfall Calculation Functions                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Complete Folder Structure

```
CampusHarmony/
├── backend/                       # Java Spring Boot REST API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/campusharmony/   # Controllers, Security, Services, Entities
│   │   │   └── resources/                # application.properties
│   │   └── test/                         # JUnit 5 integration & access tests
│   ├── Dockerfile                 # Multi-stage Java 17 container build
│   └── pom.xml                    # Maven build & dependencies definition
├── database/                      # Relational schema, routines, and migrations
│   ├── migrations/                # Migration scripts 006 through 010
│   │   ├── 006_academic_foundation.sql
│   │   ├── 007_evaluations_management.sql
│   │   ├── 008_timetable_scheduling.sql
│   │   ├── 009_attendance_analytics.sql
│   │   └── 010_student_complaints.sql
│   ├── init_complete.sql          # Unified full database bootstrap script
│   ├── schema_v5.sql              # Base relational schema
│   ├── procedures_triggers.sql    # Core stored routines, views, and triggers
│   └── queries.sql                # Analytical and demonstration queries
├── frontend/                      # React 19 + TanStack single-page / SSR application
│   ├── src/                       # Components, routes, role layouts, state, and API client
│   ├── public/                    # Static assets and entrypoints
│   ├── Dockerfile                 # Node 20 SSR / client container
│   ├── package.json               # Node.js dependencies & scripts
│   ├── package-lock.json          # Locked dependency tree
│   ├── vite.config.js             # TanStack Start / Vite configuration
│   └── vitest.config.js           # Frontend unit/component test configuration
├── scripts/                       # Automation and helper scripts
│   ├── init-db.ps1                # Idempotent PowerShell 5.1+ database initializer
│   ├── run.ps1                    # Safe PowerShell 5.1+ launcher & orchestrator
│   └── stop.ps1                   # Safe PID-targeted service shutdown utility
├── .dockerignore                  # Docker build ignore rules
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git ignore rules
├── compose.yaml                   # Docker Compose specification (canonical V2)
├── README.md                      # Complete project documentation
├── RUN_CAMPUSHARMONY.bat          # Verified one-click startup script (Docker or Native)
└── STOP_CAMPUSHARMONY.bat         # Targeted service shutdown utility (PID tracking)
```

---

## 10. Software Prerequisites

### Option A: Docker Compose (Recommended)
- **Docker Desktop** (version 20.10+ or higher).
- Ensure Docker Desktop is started and active.

### Option B: Native Windows Mode
- **Java Development Kit (JDK)**: JDK 17 or JDK 21 (Eclipse Temurin or Oracle JDK).
- **Apache Maven**: Version 3.8+ (accessible in system `PATH`).
- **Node.js & npm**: Node.js 18 LTS or 20 LTS (npm 9+).
- **MySQL Server**: MySQL Server 8.0+ running on `localhost:3306`.
- **PowerShell**: Windows PowerShell 5.1 (built into Windows) or PowerShell 7+.

---

## 11. First-Time Installation

Clone the official repository:

```cmd
git clone https://github.com/Akshatsingla4308/CampusHarmony.git
cd CampusHarmony
```

Copy the environment template:

```cmd
copy .env.example .env
```

Open `.env` in any text editor and supply your own secure passwords for `CAMPUS_DB_PASSWORD` and `CAMPUS_ADMIN_PASSWORD`.

> **Note**: For native mode, `RUN_CAMPUSHARMONY.bat` will automatically install frontend dependencies (`npm install`) on first launch if `node_modules` is not found.

---

## 12. Database Initialization

The repository includes a complete, self-contained database bootstrap file:
`database/init_complete.sql`

This file executes:
1. `schema_v5.sql` — Base tables, foreign keys, and indexes.
2. `procedures_triggers.sql` — Stored procedures, triggers, and functions.
3. `migrations/006_academic_foundation.sql` — Academic sections, offerings, accounts.
4. `migrations/007_evaluations_management.sql` — Continuous assessment marks & audit.
5. `migrations/008_timetable_scheduling.sql` — Timetable entries & slot views.
6. `migrations/009_attendance_analytics.sql` — Attendance aggregation & shortfall procedures.
7. `migrations/010_student_complaints.sql` — Student complaints & activity logging.

### Automatic Initialization & Idempotency:
- In **Docker Compose**: Executed automatically on first container boot via `/docker-entrypoint-initdb.d/`. Persistent volume `campusharmony_mysql_data` preserves data across restarts.
- In **Native Mode**: `RUN_CAMPUSHARMONY.bat` calls `scripts/init-db.ps1`. It verifies table existence and applies `init_complete.sql` only if the database is uninitialized. Subsequent launches preserve all existing data.

---

## 13. How to Seed the Realistic Academic Demonstration Dataset

CampusHarmony includes an interconnected, realistic university demonstration dataset designed for academic review and grading.

To seed or reset the complete demonstration dataset:

```cmd
SETUP_DEMO.bat
```

Simply **double-click** `SETUP_DEMO.bat` or run in PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\seed-demo.ps1
```

### What this provisions automatically:
1. **3 Academic Programs**:
   - `B.Tech CSE Core` (Fully populated academic cohort)
   - `B.Tech CSE AI & ML` (Catalog program)
   - `B.Tech CSE AI & FT` (Catalog program)
2. **5 Academic Sections for CSE Core**:
   - `CSE-A`, `CSE-B`, `CSE-C`, `CSE-D`, `CSE-E` (Semester 5, Autumn 2026)
3. **15 Faculty Members**:
   - Exactly 3 faculty members per curricular subject.
   - Realistic teaching workloads: maximum 2 sections per teacher (25 course offerings total).
   - 5 Designated Section Mentors assigned from the 15 faculty members.
4. **Exactly 300 Enrolled Students**:
   - 60 students per section with distinct names, roll numbers (`24CSE001` to `24CSE300`), official institutional emails, phone numbers, and individual login accounts.
   - 1,500 course enrollments across 5 core subjects: Data Structures & Algorithms, Discrete Mathematics, Database Management Systems, Front End Engineering-II, and OOP with Java.
5. **Conflict-Free Weekly Timetable**:
   - Complete Monday to Saturday schedule (Periods 1 to 5, 09:00 to 15:00).
   - 150 verified timetable entries with **zero collisions** across rooms, faculty, and student sections.
6. **Multi-Week Attendance History**:
   - 375 conducted sessions with 22,500 student attendance records across the semester.
   - Realistic attendance distributions: High attendance (90%–100%), Normal attendance (75%–89%), and Defaulters (< 75% triggering shortage warnings).
7. **Assessments & Continuous Evaluation**:
   - 75 course assessments (Midterm, Quiz, Lab practical) with 4,500 graded marks entries strictly validated within maximum limits.
8. **Student Grievance Resolution Desk**:
   - 12 multi-category student tickets (Academic, Attendance, Infrastructure, Examination) with status flows (Open, In Progress, Resolved) and administrative audit trails.

---

## 14. How to Configure Environment Variables

Create `.env` from `.env.example` in the project root:

```ini
# --- Runtime Mode ---
# Options: 'auto' (default: Docker if active and port 3306 free; else Native Windows),
#          'native' (uses local JDK, Maven, Node.js, and local MySQL Server),
#          'docker' (requires Docker Desktop running with port 3306 free)
CAMPUS_RUN_MODE=auto

# --- MySQL Database Configuration ---
CAMPUS_DB_USER=root
# REQUIRED: Set your actual local or container MySQL password
CAMPUS_DB_PASSWORD=your_secure_mysql_password_here

# JDBC DataSource URL (defaults to localhost:3306 for native mode)
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/campus_harmony?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true

# --- First-Run Administrator Provisioning ---
CAMPUS_ADMIN_LOGIN=admin
# REQUIRED: Set your initial administrator password
CAMPUS_ADMIN_PASSWORD=your_secure_admin_password_here

# --- Frontend API Connectivity ---
VITE_API_URL=http://localhost:8080/api
```

> [!IMPORTANT]
> Both `CAMPUS_DB_PASSWORD` and `CAMPUS_ADMIN_PASSWORD` must be set to custom values. The launch scripts strictly reject placeholder defaults and empty passwords.

---

## 15. How to Launch the Entire Application

CampusHarmony provides an automated one-click launcher for Windows:

```cmd
RUN_CAMPUSHARMONY.bat
```

Simply **double-click** `RUN_CAMPUSHARMONY.bat` from Windows Explorer.

### What happens automatically:
1. Validates that `.env` exists and that passwords are not empty or left as placeholders.
2. Checks runtime environment (prefers Docker Desktop if running; falls back to native services).
3. If native mode is selected:
   - Verifies Java, Maven, Node.js, npm, and MySQL prerequisites.
   - Automatically installs frontend dependencies (`npm install`) if `node_modules` is missing.
   - Idempotently initializes the database schema and migrations on first run.
   - Boots Spring Boot on port 8080 and writes its PID to `.campus_run/backend.pid`.
   - Polls `http://localhost:8080/api/auth/me` with a strict timeout; aborts cleanly if backend fails.
   - Starts Vite on port 5173 and writes its PID to `.campus_run/frontend.pid`.
   - Polls `http://localhost:5173` with a strict timeout; aborts cleanly if frontend fails.
4. **Browser Launch**: Only opens `http://localhost:5173` in your default browser once all services are verified responsive.

---

## 16. How to Stop the Application

To safely shut down all CampusHarmony services:

```cmd
STOP_CAMPUSHARMONY.bat
```

Double-clicking `STOP_CAMPUSHARMONY.bat`:
- Safely stops Docker containers using `docker compose -f compose.yaml stop` without deleting named volume `campusharmony_mysql_data`.
- Terminates native backend and frontend processes using exact recorded Process IDs (`.campus_run/*.pid`) and targeted command-line matching.
- Does **not** terminate unrelated Java, Node.js, or MySQL processes.
- Leaves MySQL Server and all academic database records completely intact.

---

## 17. How to Access the Website & Demo Logins

| Endpoint | URL | Description |
|---|---|---|
| **Web Portal** | [http://localhost:5173](http://localhost:5173) | Primary modern React academic interface |
| **Backend REST API** | [http://localhost:8080/api](http://localhost:8080/api) | Spring Boot REST endpoints |
| **API Session Check** | [http://localhost:8080/api/auth/me](http://localhost:8080/api/auth/me) | Authentication identity status endpoint |

### Curated Demonstration Logins:

| Role / Persona | Name | Username | Standard Password | Key Features to Test |
|---|---|---|---|---|
| **Administrator** | System Administrator | `admin` | *(Set in .env)* | Academic cockpit: Audit log, catalog, section creation, timetable overview, grievance redressal |
| **Faculty & Mentor** | Dr. Rajesh Rao | `prof_rao` | `Teacher@123456` | DSA Faculty & CSE-A Mentor. Assigned to CSE-A & CSE-B. Attendance sessions, marks grading, timetable |
| **Faculty & Mentor** | Dr. Priya Sharma | `prof_sharma` | `Teacher@123456` | DBMS Faculty & CSE-B Mentor. Assigned to CSE-A & CSE-B. Database practical evaluations |
| **Faculty & Mentor** | Dr. Amit Kapoor | `prof_kapoor` | `Teacher@123456` | OOP Java Faculty & CSE-C Mentor. Java continuous assessments |
| **Faculty & Mentor** | Dr. Sunita Mehra | `prof_mehra` | `Teacher@123456` | FEE-II Faculty & CSE-D Mentor. Web engineering marks and lab sessions |
| **Faculty & Mentor** | Dr. Vikram Joshi | `prof_joshi` | `Teacher@123456` | Discrete Math Faculty & CSE-E Mentor. Mathematical logic evaluation |
| **Faculty (Single Section)** | Prof. Arjun Sengupta | `prof_sengupta` | `Teacher@123456` | DSA Faculty handling CSE-E only (1 section load) |
| **Student (High Att.)** | Ayaan Verma | `24CSE001` | `Student@123456` | Section CSE-A. 100% attendance standing. Outstanding grades (O/A+). Timetable |
| **Student (Normal Att.)** | Aarav Nair | `24CSE046` | `Student@123456` | Section CSE-A. 80.0% attendance standing. Demonstrates normal academic progress |
| **Student (Defaulter)** | Aadhya Nair | `24CSE058` | `Student@123456` | Section CSE-A. 53.3% attendance (<75%). Triggers shortage warning badge and alert |
| **Student (Grievance)** | Sai Bhattacharya | `24CSE005` | `Student@123456` | Section CSE-A. Filed re-evaluation grievance with full administrative resolution timeline |

> [!NOTE]
> **Complete Credentials Workbook**:
> The full roster of all 15 faculty members and all 300 student credentials is saved in the private Excel workbook outside Git:
> `CampusHarmony_Private/CampusHarmony_Demo_Credentials.xlsx`.
> For security, this file is never committed or published publicly.

---

## 18. How to Securely Create the First Administrator

CampusHarmony features an automated first-run administrator provisioning bootstrap in `AuthController`:
1. When Spring Boot boots against a newly initialized database, it checks `SELECT COUNT(*) FROM accounts WHERE role='admin'`.
2. If zero administrator accounts exist, it reads `CAMPUS_ADMIN_LOGIN` and `CAMPUS_ADMIN_PASSWORD` from `.env`.
3. It securely hashes the password with PBKDF2 (600,000 rounds HMAC-SHA256) and creates the initial administrator account.
4. On subsequent boots, the existing administrator account is detected, and credentials are preserved without re-hashing or overwriting.

---

## 19. How to Run Frontend Tests

The frontend test suite runs 37 automated tests across 12 test files covering components, router flows, and role logic:

```cmd
cd frontend
npm test
```

---

## 20. How to Run Backend Tests

### Controller & Security Access Tests:
```cmd
cd backend
mvn test -Dtest=*AccessTests
```

### Full Integration Test Suite (with Disposable MySQL):
```powershell
powershell -ExecutionPolicy Bypass -File .\backend\verify-foundation.ps1 -SqlOnly
```

---

## 21. Troubleshooting Common Errors

### 1. "CAMPUS_DB_PASSWORD is not set in .env" or Placeholder Error
Open `.env` in a text editor and replace `your_secure_mysql_password_here` with your actual MySQL password. Ensure `CAMPUS_ADMIN_PASSWORD` is also populated with a secure password.

### 2. Port 8080 or Port 5173 already occupied
Run `STOP_CAMPUSHARMONY.bat` to clear lingering processes. To inspect active listeners:
```cmd
netstat -aon | findstr :8080
netstat -aon | findstr :5173
```

### 3. MySQL Connection Refused (Native Mode)
Ensure MySQL Server 8.0 service is active:
```cmd
net start MySQL80
```
Verify that `CAMPUS_DB_PASSWORD` in `.env` matches your local MySQL `root` password.

### 4. "Access Denied for user 'root'@'localhost'"
Update `.env` with your actual MySQL credentials:
```ini
CAMPUS_DB_USER=root
CAMPUS_DB_PASSWORD=your_actual_password
```

### 5. Docker Desktop Engine Not Running
If you receive `failed to connect to docker API`, start Docker Desktop from the Windows Start menu, ensure the daemon is running, and re-run `RUN_CAMPUSHARMONY.bat`.

---

## License

This project is prepared for academic and educational evaluation. All rights reserved.
