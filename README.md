# CampusHarmony

**CampusHarmony** is a full-stack, enterprise-grade Academic Management System designed for colleges and universities. It integrates academic structure administration, course offerings, lecture-wise attendance management, marks evaluation, timetable scheduling, attendance analytics, and student grievance resolution into a unified, responsive platform.

---

## Table of Contents

1. [Main Features](#main-features)
2. [User Roles & Workflows](#user-roles--workflows)
3. [Technology Stack](#technology-stack)
4. [Project Folder Structure](#project-folder-structure)
5. [Prerequisites & Required Software](#prerequisites--required-software)
6. [First-Time Installation & Setup](#first-time-installation--setup)
7. [Environment Variables Configuration](#environment-variables-configuration)
8. [One-Click Startup (RUN_CAMPUSHARMONY.bat)](#one-click-startup-run_campusharmonybat)
9. [Safe Service Shutdown (STOP_CAMPUSHARMONY.bat)](#safe-service-shutdown-stop_campusharmonybat)
10. [Accessing the Application](#accessing-the-application)
11. [Initial Administrator Provisioning](#initial-administrator-provisioning)
12. [Running Tests](#running-tests)
13. [Database Architecture & Persistence](#database-architecture--persistence)
14. [Troubleshooting Guide](#troubleshooting-guide)
15. [Cloning & Uploading to GitHub](#cloning--uploading-to-github)

---

## Main Features

- **Academic Foundation & Structure**: Departments, academic terms, semesters, sections, courses, and course offerings with strict relational integrity.
- **Role-Based Access Control (RBAC)**: Secure session-based authentication separating Administrator, Teacher, and Student permissions with interceptor guards.
- **Lecture-Wise Attendance Management**: Date- and slot-based attendance tracking, bulk Present/Absent toggle, roster search, live attendance counters, and audit-logged corrections.
- **Dynamic Assessments & Evaluations**: Multi-component grading (Internal, Midterm, End-Semester, Assignment, Quiz, Project) with score validation and audit tracking.
- **Interactive Timetable & Lecture Scheduling**: Section-wise weekly schedule grid, conflict-prevention constraints, timetable-to-attendance jump, and responsive mobile day view.
- **Attendance Analytics & Defaulters**: Real-time attendance percentages, threshold filters (e.g. <75%), shortfall lecture recovery calculations, and defaulter audits.
- **Student Grievance & Complaint Redressal**: Student ticket filing, category tagging, administrative status updates (Pending, In Review, Resolved, Dismissed), and resolution logging.

---

## User Roles & Workflows

### 1. Administrator
- Manage academic catalog: Departments, Terms, Sections, Courses, and Offerings.
- Assign faculty to sections and enroll students into cohorts.
- View system-wide attendance trends, analytics, and defaulter rosters.
- Triage and resolve student grievances and complaints.
- Register teacher and student accounts.

### 2. Teacher
- View assigned course offerings and timetable schedule.
- Conduct lecture attendance with quick Present/Absent toggles and search filters.
- Submit and update assessment marks with real-time validation and change detection.
- Audit attendance corrections with mandatory reason logging.

### 3. Student
- View personalized timetable and class schedule.
- Track course-wise attendance percentages, attended/conducted counts, and shortfall warnings.
- Check assessment marks and evaluation grades.
- Submit complaints/grievances and track resolution progress.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TanStack Router, TanStack Start, Tailwind CSS v4, Radix UI, Lucide Icons, Recharts |
| **Backend** | Java 17/21, Spring Boot 3.2.5, Spring Web, Spring Data JPA / JDBC, Hibernate Validator |
| **Database** | MySQL Server 8.0+ (InnoDB Engine), Stored Procedures, Functions, Views, Row-Level Triggers |
| **Containerization** | Docker, Docker Compose (Optional) |
| **Testing** | Vitest, React Testing Library, JUnit 5, Spring Boot Test |

---

## Project Folder Structure

```
CampusHarmony/
├── backend/                       # Java Spring Boot REST API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/campusharmony/   # Controllers, Services, Security, Entities
│   │   │   └── resources/                # application.properties
│   │   └── test/                         # JUnit 5 integration & access tests
│   ├── Dockerfile                 # Backend container definition
│   └── pom.xml                    # Maven dependency & build definition
├── database/                      # Relational schema, routines, and migrations
│   ├── migrations/                # Migration scripts 006 through 010
│   │   ├── 006_academic_foundation.sql
│   │   ├── 007_evaluations_management.sql
│   │   ├── 008_timetable_scheduling.sql
│   │   ├── 009_attendance_analytics.sql
│   │   └── 010_student_complaints.sql
│   ├── init_complete.sql          # Unified full database bootstrap script
│   ├── schema_v5.sql              # Base relational schema
│   └── procedures_triggers.sql    # Core stored routines, views, and triggers
├── frontend/                      # React 19 + TanStack single-page / SSR application
│   ├── src/                       # Components, routes, layouts, API clients
│   ├── public/                    # Static assets
│   ├── Dockerfile                 # Frontend container definition
│   ├── package.json               # Node.js dependencies & scripts
│   ├── vite.config.js             # Vite + TanStack Start configuration
│   └── vitest.config.js           # Frontend testing configuration
├── scripts/                       # Automation and helper scripts
│   └── init-db.ps1                # PowerShell idempotent database initializer
├── .dockerignore                  # Docker ignore rules
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git ignore rules
├── docker-compose.yml             # Multi-container orchestration (MySQL + Backend + Frontend)
├── README.md                      # Project documentation
├── RUN_CAMPUSHARMONY.bat          # One-click startup script (Docker or Native)
└── STOP_CAMPUSHARMONY.bat         # Safe shutdown utility
```

---

## Prerequisites & Required Software

### Option A: Docker Compose (Recommended)
- **Docker Desktop** (version 20.10+ or higher)
- Ensure Docker Desktop is started and the Docker daemon is active.

### Option B: Native Windows Setup
If running natively without Docker:
- **Java Development Kit (JDK)**: JDK 17 or JDK 21 (Eclipse Temurin or Oracle JDK)
- **Apache Maven**: Version 3.8 or higher (added to system `PATH`)
- **Node.js & npm**: Node.js 18 LTS or 20 LTS (npm 9+)
- **MySQL Server**: MySQL Server 8.0 or higher running on `localhost:3306`

---

## First-Time Installation & Setup

1. **Extract the ZIP file** to your desired directory (avoid paths containing special characters).
2. **Copy the environment template**:
   ```cmd
   copy .env.example .env
   ```
3. **Install Frontend Dependencies** (required only for Native mode):
   ```cmd
   cd frontend
   npm install
   cd ..
   ```
4. **Compile Backend** (optional check for Native mode):
   ```cmd
   cd backend
   mvn clean compile -DskipTests
   cd ..
   ```

---

## Environment Variables Configuration

Copy `.env.example` to `.env` in the project root:

```ini
# --- MySQL Database Configuration ---
CAMPUS_DB_USER=root
CAMPUS_DB_PASSWORD=RootPass2026!
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/campus_harmony?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true

# --- First-Run Administrator Provisioning ---
# On the very first boot against a fresh database, Spring Boot automatically
# creates an administrator account with these credentials.
CAMPUS_ADMIN_LOGIN=admin
CAMPUS_ADMIN_PASSWORD=AdminSecurePass2026!

# --- Frontend API Connectivity ---
VITE_API_URL=http://localhost:8080/api
```

---

## One-Click Startup (RUN_CAMPUSHARMONY.bat)

Simply **double-click** `RUN_CAMPUSHARMONY.bat` from Windows Explorer or run from Command Prompt:

```cmd
RUN_CAMPUSHARMONY.bat
```

### What the script does automatically:
1. **Loads configuration**: Reads credentials and settings from `.env` (or applies safe defaults).
2. **Detects runtime mode**:
   - If Docker is running, launches the entire stack with `docker compose up -d`.
   - If Docker is not running, executes native mode.
3. **Checks prerequisites**: Verifies Java, Maven, Node.js, and MySQL.
4. **Initializes database on first run**: Executes `database/init_complete.sql` only if tables are not yet present. Preserves existing data on subsequent runs.
5. **Starts Spring Boot Backend**: Dispatches the backend on port 8080 and waits until the REST API responds.
6. **Starts React Frontend**: Launches the Vite server on port 5173.
7. **Launches Browser**: Automatically opens `http://localhost:5173` in your default web browser.

---

## Safe Service Shutdown (STOP_CAMPUSHARMONY.bat)

To cleanly stop the application, **double-click** `STOP_CAMPUSHARMONY.bat`:

```cmd
STOP_CAMPUSHARMONY.bat
```

### Safety Guarantees:
- Stops running Docker containers with `docker compose stop` (does **not** delete volumes).
- Terminates background processes on ports 8080 and 5173.
- Leaves MySQL Server running and preserves all academic and database records.

---

## Accessing the Application

- **Web Application**: [http://localhost:5173](http://localhost:5173)
- **Spring Boot REST API**: [http://localhost:8080/api](http://localhost:8080/api)
- **API Health Check**: [http://localhost:8080/api/auth/me](http://localhost:8080/api/auth/me)

---

## Initial Administrator Provisioning

When Spring Boot boots for the first time against an empty database, its built-in authentication bootstrap detects that no administrator account exists in the `accounts` table. It securely hashes `CAMPUS_ADMIN_PASSWORD` and inserts the administrator record with `CAMPUS_ADMIN_LOGIN`.

- **Default Username**: `admin` (or the value set in `.env`)
- **Default Password**: Set in `.env` (`CAMPUS_ADMIN_PASSWORD`)

> **Note**: Subsequent launches read the existing account from MySQL and do not overwrite your credentials or reset the database.

---

## Running Tests

### 1. Frontend Test Suite (Vitest)
Executes 37 component, router, and UI unit tests:
```cmd
cd frontend
npm test
```

### 2. Backend Unit & Access Tests (Maven)
Executes Spring Boot security and controller access tests:
```cmd
cd backend
mvn test -Dtest=BackendAccessIT
```

### 3. Full Integration Suite (with Disposable MySQL)
```powershell
powershell -ExecutionPolicy Bypass -File .\backend\verify-foundation.ps1 -SqlOnly
```

---

## Database Architecture & Persistence

CampusHarmony uses an enterprise relational schema normalized to 3NF/BCNF with strict foreign keys, unique composite indexes, and business-logic triggers.

### Relational Schema Summary:
- **Core Entities**: `departments`, `academic_periods`, `sections`, `section_members`, `subjects`, `courses`, `course_offerings`, `teachers`, `students`, `accounts`.
- **Attendance**: `attendance_sessions`, `attendance_records`, `attendance_corrections_audit`.
- **Evaluations**: `assessments`, `assessment_marks`, `assessment_marks_audit`.
- **Timetable**: `timetable_entries` with slot conflict constraints.
- **Analytics & Complaints**: `complaints`, `complaint_activity`, `defaulter_audit_log`.

### Persistence Guarantee:
- **Docker**: The named volume `campusharmony_mysql_data` persists data across container stops and restarts.
- **Native**: Data resides directly in the host MySQL data directory and is never dropped during normal application restarts.

---

## Troubleshooting Guide

### 1. Port 8080 or Port 5173 is already in use
Run `STOP_CAMPUSHARMONY.bat` to clear lingering processes from previous sessions. Alternatively, terminate manually:
```cmd
for /f "tokens=5" %a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /F /PID %a
for /f "tokens=5" %a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %a
```

### 2. MySQL Connection Refused (Native Mode)
Ensure MySQL 8.0 service is running:
```cmd
net start MySQL80
```
Verify that `CAMPUS_DB_PASSWORD` in `.env` matches your local MySQL `root` password.

### 3. "Access Denied for user 'root'@'localhost'"
Update `.env` with the correct password:
```ini
CAMPUS_DB_PASSWORD=your_actual_mysql_password
```

### 4. Docker Desktop Engine Not Running
If you see `failed to connect to docker API`, start the **Docker Desktop** application from your Windows Start menu, wait for the green "Engine running" indicator, and run `RUN_CAMPUSHARMONY.bat` again.

---

## Cloning & Uploading to GitHub

To upload this clean package to your own GitHub repository:

```cmd
# 1. Initialize a new git repository in the extracted folder
git init

# 2. Stage all source files (cleanly filtered by .gitignore)
git add .

# 3. Create initial commit
git commit -m "feat: initial commit of CampusHarmony academic management platform"

# 4. Set default branch to main
git branch -M main

# 5. Link to your own newly created GitHub repository
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 6. Push code to GitHub
git push -u origin main
```

---

## License

This project is prepared for academic and educational evaluation. All rights reserved.
