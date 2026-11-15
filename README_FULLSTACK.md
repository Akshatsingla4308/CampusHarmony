## Latest fixes (login / register)

- **"Subject you teach" no longer shows for students.** A CSS rule (`.field { display:flex }`) was overriding the HTML `hidden` attribute, so the box was always visible. `[hidden]` now always wins. The subject box appears only when a *teacher* clicks "Register here". Students see Department + Semester instead.
- **Student registration added.** "New student? Register here" on the login page (name, roll number, department, semester). Backend endpoint: `POST /api/auth/register-student`.
- **Sign-in / register work even if the backend is not running.** `js/auth.js` first calls the Spring Boot API; if the server is unreachable (or returns a 5xx error) it falls back to the demo data + browser storage. Real errors (wrong name, duplicate ID) are still shown to the user.
- **Fresh database is seeded automatically.** `DataSeeder.java` loads `seed-data.sql` (subjects, teachers, students, courses...) on first start when the teachers table is empty, so teacher registration no longer fails on a missing subject.
- **Unknown roll numbers are rejected** at student sign-in (with a hint to register) instead of opening an empty profile.
- **Launcher fix:** opening `http://localhost:5173/` served the login page without its CSS/JS (scripts came back as HTML), so no button worked. `serve.js` now redirects `/` to `/sms/login.html`, and the launchers print that address.
- Fixed the submit button showing "Register" after a successful registration.

---

# Campus Harmony — Full-Stack College ERP Web Application

**Course / Degree:** Bachelor of Engineering (B.E.) — Computer Science & Engineering  
**Application Title:** Campus Harmony / Sunrise Institute Student Management System (SMS)  
**Architecture:** 3-Tier Client-Server Architecture (RESTful Full-Stack Web Application)  

---

## 1. System Architecture & Project Overview

This project converts a frontend Student ERP into a production-ready, fully functional **Full-Stack Web Application** backed by **Java Spring Boot** and **MySQL Server**.

```
+-----------------------------------------------------------------------------------+
|                            PRESENTATION TIER (FRONTEND)                           |
|  - HTML5, CSS3, ES6 JavaScript, React.js (Vite / TanStack Start)                  |
|  - Dynamic Pages: Login, Dashboard, Students CRUD, Attendance, Courses, Marks     |
|  - Real-time HTTP Communication via Fetch API / Axios                            |
+-----------------------------------------------------------------------------------+
                                         |
                                         | JSON via HTTP REST APIs (Port 8080)
                                         v
+-----------------------------------------------------------------------------------+
|                             LOGIC TIER (JAVA BACKEND)                             |
|  - Controller Layer: Spring REST Controllers (GET, POST, PUT, DELETE)             |
|  - Service Layer: Business Logic, Abstraction & Polymorphic Services              |
|  - Repository Layer: Spring Data JPA Repositories (ORM abstraction)               |
|  - Entity Layer: Encapsulated JPA Domain Models with OOP Inheritance             |
|  - Exception Handling: Centralized @RestControllerAdvice Global Handler           |
+-----------------------------------------------------------------------------------+
                                         |
                                         | JDBC / Hibernate ORM Dialect
                                         v
+-----------------------------------------------------------------------------------+
|                           DATA TIER (RELATIONAL DATABASE)                         |
|  - MySQL 8.0 Database (campus_harmony)                                            |
|  - Normalized Relational Tables (1NF, 2NF, 3NF)                                   |
|  - Primary Keys, Foreign Keys, CASCADE rules, CHECK Constraints, Indexes          |
+-----------------------------------------------------------------------------------+
```

---

## 2. Updated Project Folder Structure

```
campus-harmony/
├── frontend/                               # React & Vanilla UI Presentation Layer
│   ├── public/sms/
│   │   ├── index.html                      # Teacher Dashboard
│   │   ├── students.html                   # Student Directory & Management (CRUD)
│   │   ├── attendance.html                 # Attendance Register & Band Filter
│   │   ├── courses.html                    # Course Catalogue
│   │   ├── marks.html                      # Examination Marks & Grades Matrix
│   │   ├── profile.html                    # Comprehensive Student Profile
│   │   ├── login.html                      # Sign-in & Teacher Registration
│   │   ├── css/                            # Preserved Stylesheets
│   │   │   ├── style.css
│   │   │   ├── dashboard.css
│   │   │   ├── students.css
│   │   │   └── attendance.css
│   │   └── js/                             # Integrated Frontend Scripts
│   │       ├── app.js                      # Central Data Access Layer (Connected to REST API)
│   │       ├── auth.js                     # Authentication & Session Service
│   │       ├── login.js                    # Login & Teacher Registration handler
│   │       ├── dashboard.js                # Live Dashboard charts & Activity feed
│   │       ├── students.js                 # Search, Filter, Sort, Add, Edit, Delete
│   │       ├── attendance.js               # Mark Present/Absent & Recalculate
│   │       ├── courses.js                  # Add Course & Enrolled count
│   │       ├── marks.js                    # Save Marks by Subject (0-100)
│   │       └── profile.js                  # Student Details & Performance View
│   ├── src/                                # React / Vite entry & Components
│   ├── package.json                        # Frontend dependencies & scripts
│   ├── vite.config.js                      # Vite server configuration
│   └── run-frontend.bat                    # One-click frontend launcher
│
├── backend/                                # Java Spring Boot REST Backend
│   ├── src/main/java/com/campusharmony/
│   │   ├── CampusHarmonyApplication.java   # Spring Boot Application Bootstrap
│   │   ├── config/
│   │   │   └── CorsConfig.java             # Cross-Origin Resource Sharing Configuration
│   │   ├── entity/                         # Encapsulated JPA Entity Models
│   │   │   ├── BaseEntity.java             # Abstract Class demonstrating Inheritance
│   │   │   ├── Teacher.java                # Teacher credentials & assigned subject
│   │   │   ├── Student.java                # Enrolled students (extends BaseEntity)
│   │   │   ├── Course.java                 # Curriculum courses & credit allocation
│   │   │   ├── Attendance.java             # 1-to-1 Attendance register
│   │   │   ├── Marks.java                  # 1-to-1 Subject marks records (5 subjects)
│   │   │   ├── Activity.java               # ERP Audit trail & recent actions
│   │   │   ├── Department.java             # Department lookup entity
│   │   │   └── Subject.java                # Subject catalog entity
│   │   ├── repository/                     # Spring Data JPA Data Access Layer
│   │   │   ├── TeacherRepository.java
│   │   │   ├── StudentRepository.java
│   │   │   ├── CourseRepository.java
│   │   │   ├── AttendanceRepository.java
│   │   │   ├── MarksRepository.java
│   │   │   ├── ActivityRepository.java
│   │   │   ├── DepartmentRepository.java
│   │   │   └── SubjectRepository.java
│   │   ├── service/                        # Abstraction & Business Logic
│   │   │   ├── TeacherService.java         # Interface (Abstraction)
│   │   │   ├── TeacherServiceImpl.java     # Class (Polymorphism)
│   │   │   ├── StudentService.java
│   │   │   ├── StudentServiceImpl.java
│   │   │   ├── CourseService.java
│   │   │   ├── CourseServiceImpl.java
│   │   │   ├── AttendanceService.java
│   │   │   ├── AttendanceServiceImpl.java
│   │   │   ├── MarksService.java
│   │   │   ├── MarksServiceImpl.java
│   │   │   ├── DashboardService.java
│   │   │   └── DashboardServiceImpl.java
│   │   ├── controller/                     # REST API Controllers (Endpoints)
│   │   │   ├── AuthController.java         # /api/auth/*
│   │   │   ├── StudentController.java      # /api/students, /api/departments
│   │   │   ├── CourseController.java       # /api/courses, /api/subjects
│   │   │   ├── AttendanceController.java   # /api/attendance/*
│   │   │   ├── MarksController.java        # /api/marks/*
│   │   │   └── DashboardController.java    # /api/dashboard/*
│   │   ├── dto/                            # Data Transfer Objects & Payloads
│   │   │   ├── LoginRequest.java
│   │   │   ├── RegisterTeacherRequest.java
│   │   │   ├── StudentRequest.java
│   │   │   ├── CourseRequest.java
│   │   │   ├── MarkAttendanceRequest.java
│   │   │   ├── SaveMarksRequest.java
│   │   │   ├── SubjectMarkEntry.java
│   │   │   ├── StatCardResponse.java
│   │   │   └── ApiResponse.java
│   │   └── exception/                      # Robust Exception Handling Layer
│   │       ├── ResourceNotFoundException.java
│   │       ├── BadRequestException.java
│   │       ├── ErrorResponse.java
│   │       └── GlobalExceptionHandler.java
│   ├── src/main/resources/
│   │   └── application.properties          # Server port, JDBC URL, MySQL credentials
│   ├── pom.xml                             # Maven build dependencies & plugins
│   └── run-backend.bat                     # One-click backend launcher
│
├── database/                               # Database Scripts
│   ├── schema.sql                          # DDL: Database & Table Creation with Constraints
│   ├── data.sql                            # DML: Seed Records (Teachers, Students, Courses)
│   └── queries.sql                         # Viva demonstration SQL queries (JOINs, Aggregates)
│
└── run-project.bat                         # Master launcher for both frontend & backend
```

---

## 3. Database Schema & Normalization (DBMS Requirements)

The MySQL database `campus_harmony` is organized into normalized relational tables adhering to **First (1NF), Second (2NF), and Third Normal Form (3NF)**:

### Tables & Relationships:
1. `departments` (`id` PK, `name` UNIQUE, `code` UNIQUE): Eliminates transitive dependency on department attributes.
2. `subjects` (`subject_key` PK, `label` UNIQUE): Core evaluation subjects.
3. `teachers` (`id` PK, `name`, `subject` FK -> `subjects.subject_key`, `workspace`): Instructor accounts.
4. `students` (`id` PK AUTO_INCREMENT, `roll` UNIQUE, `name`, `department`, `semester`, `email` UNIQUE, `phone`, `status`, `gender`, `address`, `teacher_id` FK -> `teachers.id`).
5. `courses` (`code` PK, `name`, `faculty`, `credits`, `semester`, `status`, `teacher_id` FK -> `teachers.id`).
6. `attendance` (`id` PK, `student_id` FK -> `students.id` ON DELETE CASCADE, `total_days`, `present_days`, `absent_days`, `last_marked`): Ensures 1:1 referential integrity.
7. `marks` (`id` PK, `student_id` FK -> `students.id` ON DELETE CASCADE, `mathematics`, `physics`, `chemistry`, `english`, `computer_science`): Exam scores bounded between 0-100 by CHECK constraints.
8. `activities` (`id` PK, `text`, `type`, `teacher_id` FK, `created_at`): Audit log for student additions, edits, attendance updates, marks submissions.

---

## 4. Java Object-Oriented Programming (OOP) Demonstration

| OOP Concept | Demonstration in this Codebase |
|---|---|
| **Classes & Objects** | Domain models (`Student`, `Teacher`, `Course`, `Marks`, `Attendance`) instantiated as runtime objects representing database records. |
| **Encapsulation** | All entity and DTO fields are declared `private`; access and mutations are strictly mediated through public getter and setter methods with input bounds validation. |
| **Inheritance** | `Student` entity extends `BaseEntity`, inheriting timestamp audit fields (`createdAt`, `updatedAt`) and lifecycle hooks (`@PrePersist`, `@PreUpdate`). |
| **Abstraction** | Service interfaces (`StudentService`, `TeacherService`, `AttendanceService`, etc.) define API contracts without exposing implementation details to Controllers. |
| **Polymorphism** | Implementation classes (`StudentServiceImpl`, etc.) implement interface contracts. Dynamic method dispatch allows swapping or extending business rules. |
| **Exception Handling** | Custom exceptions (`ResourceNotFoundException`, `BadRequestException`) intercepted by a centralized `@RestControllerAdvice` (`GlobalExceptionHandler`). |
| **Collections Framework** | Heavy utilization of `java.util.List`, `Set`, `Map`, `Optional`, and Java 8 Streams (`filter`, `map`, `collect`). |
| **ORM / JPA Connectivity** | `Spring Data JPA` and `Hibernate` provide automated Object-Relational Mapping, connection pooling via `HikariCP`, and type-safe query generation. |

---

## 5. Complete REST API Reference

| HTTP Method | API Endpoint | Description | Request Body / Query Params | Response Code |
|---|---|---|---|---|
| **POST** | `/api/auth/login` | Sign-in as Teacher or Student | `{ role, name, roll }` | 200 OK / 400 Bad Request |
| **POST** | `/api/auth/register-teacher` | Register a new Teacher | `{ id, name, subject }` | 201 Created / 400 Bad Request |
| **GET** | `/api/auth/teachers` | Get all teacher accounts | None | 200 OK |
| **GET** | `/api/students` | Get all students (with attendance %) | `teacherId`, `department`, `semester`, `search` | 200 OK |
| **GET** | `/api/students/{id}` | Get single student details | Path variable `id` | 200 OK / 404 Not Found |
| **POST** | `/api/students` | Add new student | `{ name, department, semester, email, phone, gender, address }` | 201 Created |
| **PUT** | `/api/students/{id}` | Update existing student | `{ name, department, semester, email, phone, status, gender, address }` | 200 OK |
| **DELETE** | `/api/students/{id}` | Delete student, marks & attendance | Path variable `id` | 200 OK |
| **GET** | `/api/departments` | List all college departments | None | 200 OK |
| **GET** | `/api/courses` | List all curriculum courses | Optional `teacherId` | 200 OK |
| **POST** | `/api/courses` | Add a new course | `{ code, name, faculty, credits, semester, status }` | 201 Created |
| **GET** | `/api/subjects` | List subjects for evaluation | None | 200 OK |
| **GET** | `/api/attendance` | Get attendance register for students | Optional `teacherId` | 200 OK |
| **POST** | `/api/attendance/mark` | Mark student present or absent | `{ studentId: 101, present: true }` | 200 OK |
| **GET** | `/api/marks` | Get marks records for students | Optional `teacherId` | 200 OK |
| **POST** | `/api/marks/save` | Save marks for teacher's subject | `{ teacherId, subjectKey, entries: [{ studentId, value }] }` | 200 OK |
| **GET** | `/api/dashboard/stats` | Key stat cards for teacher dashboard | Optional `teacherId` | 200 OK |
| **GET** | `/api/dashboard/activity` | Recent activity audit trail (8 items) | Optional `teacherId` | 200 OK |
| **POST** | `/api/dashboard/activity` | Record custom event into audit trail | `{ text, type, teacherId }` | 200 OK |

---

## 6. How to Run the Project (Step-by-Step)

### Prerequisites:
1. **Java Development Kit (JDK 17 or higher)**
2. **MySQL Server 8.0+** (Running on default port `3306`)
3. **Node.js (v18+)** and **npm**

### Step 1: Initialize MySQL Database
1. Open MySQL Workbench or your MySQL Command Line Client.
2. Run the provided SQL scripts:
   ```sql
   source /path/to/database/schema.sql;
   source /path/to/database/data.sql;
   ```
   *(Note: The database is configured with username `root` and password `root`. If your MySQL password differs, update `backend/src/main/resources/application.properties` accordingly).*

### Step 2: Start the Java Spring Boot Backend
Option A (One-click launcher):
- Double click `backend/run-backend.bat`.

Option B (Command Line):
```bash
cd backend
mvn spring-boot:run
```
- Backend starts on `http://localhost:8080`.
- Verify by opening `http://localhost:8080/api/students` in your browser.

### Step 3: Start the Frontend Application
Option A (One-click launcher):
- Double click `frontend/run-frontend.bat`.

Option B (Command Line):
```bash
cd frontend
npm run dev
```
- Open `http://localhost:5173` in any browser.
- It will automatically open the login page: `http://localhost:5173/sms/login.html`.

Option C (Master launcher):
- Simply double-click `run-project.bat` in the project root to start both backend and frontend simultaneously in separate terminals!

---

## 7. College Project Demonstration & Viva Preparation

### Key Questions & Answers:

**Q1: How does your frontend communicate with the backend?**  
*Answer:* The frontend sends asynchronous HTTP REST requests (using the native ES6 `fetch` API) formatted as JSON payloads to `http://localhost:8080/api/*`. The Spring Boot backend accepts the request, performs business validation in the service layer, accesses MySQL through Spring Data JPA, and returns standard JSON responses with appropriate HTTP status codes (200 OK, 201 Created, 400 Bad Request, 404 Not Found).

**Q2: What is the benefit of 3-Tier Architecture in this project?**  
*Answer:* It decouples the Presentation Tier (React/HTML/CSS), Logic Tier (Spring Boot Services), and Data Tier (MySQL). If the database engine changes or frontend framework is upgraded, the business rules remain isolated and unharmed.

**Q3: How did you maintain Referential Integrity in MySQL?**  
*Answer:* We defined Foreign Key constraints with `ON DELETE CASCADE` between `students` (parent table) and both `attendance` and `marks` (child tables). When a student is deleted via `DELETE /api/students/{id}`, their attendance records and mark sheets are automatically cleaned up, preventing orphaned records.

**Q4: Where is Object-Oriented Inheritance used in Java?**  
*Answer:* The abstract class `BaseEntity` contains audit fields (`createdAt`, `updatedAt`) and lifecycle callbacks (`@PrePersist`, `@PreUpdate`). The `Student` entity inherits from `BaseEntity`, reusing these properties and behavior cleanly.

**Q5: Why did you use Spring Data JPA instead of plain JDBC?**  
*Answer:* Plain JDBC requires writing repetitive boilerplate code (connection management, `PreparedStatement`, `ResultSet` mapping, manual SQL string concatenation). Spring Data JPA abstracts this using Object-Relational Mapping (ORM) via Hibernate, automatically generating SQL queries from repository method names and providing transaction management via `@Transactional`.
