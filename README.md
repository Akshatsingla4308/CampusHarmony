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
13. [How to Configure Environment Variables](#13-how-to-configure-environment-variables)
14. [How to Launch the Entire Application](#14-how-to-launch-the-entire-application)
15. [How to Stop the Application](#15-how-to-stop-the-application)
16. [How to Access the Website](#16-how-to-access-the-website)
17. [How to Securely Create the First Administrator](#17-how-to-securely-create-the-first-administrator)
18. [How to Run Frontend Tests](#18-how-to-run-frontend-tests)
19. [How to Run Backend Tests](#19-how-to-run-backend-tests)
20. [Troubleshooting Common Errors](#20-troubleshooting-common-errors)

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
| **Containerization** | Docker, Docker Compose (`compose.yaml` / `docker-compose.yml`) |
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
├── docs/                          # Technical architecture and design references
│   ├── ACADEMIC_FOUNDATION.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── DBMS_USE_CASES.md
│   └── ERD.md
├── frontend/                      # React 19 + TanStack single-page / SSR application
│   ├── src/                       # Components, routes, role layouts, state, and API client
│   ├── public/                    # Static assets and entrypoints
│   ├── Dockerfile                 # Node 20 SSR / client container
│   ├── package.json               # Node.js dependencies & scripts
│   ├── package-lock.json          # Locked dependency tree
│   ├── vite.config.js             # TanStack Start / Vite configuration
│   └── vitest.config.js           # Frontend unit/component test configuration
├── scripts/                       # Automation and helper scripts
│   └── init-db.ps1                # Idempotent PowerShell DB initializer
├── .dockerignore                  # Docker build ignore rules
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git ignore rules
├── compose.yaml                   # Docker Compose specification (standard Compose V2)
├── docker-compose.yml             # Docker Compose specification (compatible alias)
├── README.md                      # Complete project documentation
├── RUN_CAMPUSHARMONY.bat          # One-click startup script (Docker or Native Windows)
└── STOP_CAMPUSHARMONY.bat         # Safe service shutdown utility
```

---

## 10. Software Prerequisites

### Option A: Docker Compose (Recommended)
- **Docker Desktop** (version 20.10+ or higher).
- Ensure Docker Desktop is running.

### Option B: Native Windows Mode
- **Java Development Kit (JDK)**: JDK 17 or JDK 21 (Eclipse Temurin or Oracle JDK).
- **Apache Maven**: Version 3.8+ (accessible in system `PATH`).
- **Node.js & npm**: Node.js 18 LTS or 20 LTS (npm 9+).
- **MySQL Server**: MySQL Server 8.0+ running on `localhost:3306`.

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

If running in Native mode without Docker, install frontend dependencies:

```cmd
cd frontend
npm install
cd ..
```

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

### Automatic Initialization:
- In **Docker Compose**: Executed automatically on container boot via `/docker-entrypoint-initdb.d/`.
- In **Native Mode**: `RUN_CAMPUSHARMONY.bat` automatically checks table existence and applies `init_complete.sql` if the database is uninitialized. Subsequent launches preserve all existing data.

---

## 13. How to Configure Environment Variables

Create `.env` from `.env.example` in the project root:

```ini
# --- MySQL Database Configuration ---
CAMPUS_DB_USER=root
CAMPUS_DB_PASSWORD=RootPass2026!
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/campus_harmony?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true

# --- First-Run Administrator Provisioning ---
# On the first boot against a fresh database, Spring Boot automatically
# provisions an administrator account with these credentials.
CAMPUS_ADMIN_LOGIN=admin
CAMPUS_ADMIN_PASSWORD=AdminSecurePass2026!

# --- Frontend API Connectivity ---
VITE_API_URL=http://localhost:8080/api
```

---

## 14. How to Launch the Entire Application

CampusHarmony provides an automated one-click launcher for Windows:

```cmd
RUN_CAMPUSHARMONY.bat
```

Simply **double-click** `RUN_CAMPUSHARMONY.bat` from Windows Explorer.

### What happens automatically:
1. Validates environment configuration from `.env`.
2. Detects runtime environment (prefers Docker Desktop if active, falls back to native services).
3. Verifies prerequisite binaries and checks database availability.
4. Initializes database schema and migrations on first run (preserves data on subsequent runs).
5. Boots Spring Boot backend on port 8080 and waits for API responsiveness.
6. Starts React frontend on port 5173.
7. Automatically launches `http://localhost:5173` in your default web browser.

---

## 15. How to Stop the Application

To safely shut down all CampusHarmony services:

```cmd
STOP_CAMPUSHARMONY.bat
```

Double-clicking `STOP_CAMPUSHARMONY.bat`:
- Gracefully stops Docker containers with `docker compose stop` without deleting named volume `campusharmony_mysql_data`.
- Terminates background processes on port 8080 and 5173.
- Leaves MySQL Server and all academic database records completely intact.

---

## 16. How to Access the Website

| Endpoint | URL | Description |
|---|---|---|
| **Web Portal** | [http://localhost:5173](http://localhost:5173) | Primary modern React academic interface |
| **Backend REST API** | [http://localhost:8080/api](http://localhost:8080/api) | Spring Boot REST endpoints |
| **API Session Check** | [http://localhost:8080/api/auth/me](http://localhost:8080/api/auth/me) | Authentication identity status endpoint |

---

## 17. How to Securely Create the First Administrator

CampusHarmony features an automated, secure first-run administrator provisioning bootstrap in `AuthController`:
1. When Spring Boot boots against a newly initialized database, it checks `SELECT COUNT(*) FROM accounts WHERE role='admin'`.
2. If zero administrator accounts exist, it reads `CAMPUS_ADMIN_LOGIN` and `CAMPUS_ADMIN_PASSWORD` from `.env`.
3. It securely hashes the password with BCrypt/PBKDF2 and creates the initial administrator account.
4. On subsequent boots, the existing administrator account is detected, and credentials are preserved without re-hashing or overwriting.

---

## 18. How to Run Frontend Tests

The frontend test suite runs 37 automated tests across 12 test files covering components, router flows, and role logic:

```cmd
cd frontend
npm test
```

---

## 19. How to Run Backend Tests

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

## 20. Troubleshooting Common Errors

### 1. Port 8080 or Port 5173 already occupied
Run `STOP_CAMPUSHARMONY.bat` to clear lingering processes. To manually kill by PID:
```cmd
for /f "tokens=5" %a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /F /PID %a
for /f "tokens=5" %a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %a
```

### 2. MySQL Connection Refused (Native Mode)
Ensure MySQL Server 8.0 service is active:
```cmd
net start MySQL80
```
Verify that `CAMPUS_DB_PASSWORD` in `.env` matches your local MySQL `root` password.

### 3. "Access Denied for user 'root'@'localhost'"
Update `.env` with your actual MySQL credentials:
```ini
CAMPUS_DB_USER=root
CAMPUS_DB_PASSWORD=your_actual_password
```

### 4. Docker Desktop Engine Not Running
If you receive `failed to connect to docker API`, start Docker Desktop from the Windows Start menu, ensure the daemon is running, and re-run `RUN_CAMPUSHARMONY.bat`.

---

## License

This project is prepared for academic and educational evaluation. All rights reserved.
