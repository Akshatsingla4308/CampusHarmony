# CAMPUS HARMONY — ARCHITECTURAL COMPATIBILITY & MIGRATION IMPACT REPORT

**Document:** Compatibility & Migration Impact Assessment  
**Academic Context:** BE CSE Semester III, Batch 2025  
**Course:** Front End Engineering-II (25CSE0203) / Programming in Java (25CSE0202) / DBMS (24CSE0209)  
**Date:** November 15, 2026  

---

## 1. Executive Summary: Zero-Regression Architecture

A non-negotiable instruction of the Campus Harmony master specification is:
> *"Do not destroy evaluated work. Preserve earlier evaluated work and avoid gratuitous redesigns that erase the evidence of that work."*
> *"Preserve existing data and identify any migration implications."*

To satisfy advanced DBMS normalization (3NF/BCNF) and Java CLO requirements without breaking the existing Spring Boot REST endpoints or evaluated UI components, a **Non-Breaking Dual-Model Strategy** is adopted:

```text
+-----------------------------------------------------------------------------------+
|                           CLIENT APPLICATION LAYER                                |
|   Existing Frontend UI & REST Clients continue using established JSON shapes     |
|   { "id": 101, "roll": "CS-2101", "name": "Rahul Sharma", "department": "Computer Science", ... }
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                        SPRING BOOT APPLICATION LAYER                              |
|   - Backward-Compatible Entity Adapters preserve getters: getDepartment(), getFaculty()
|   - New Normalized Entities introduced for 3NF models & Java Lab Demonstrations    |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                        MYSQL 8.0 RELATIONAL STORAGE LAYER                         |
|   - Foreign Keys (department_id, subject_key) act as the Single Source of Truth   |
|   - Legacy columns (department, faculty, marks summary) kept in sync via triggers  |
|   - 100% Data Integrity: No stale data, no breaking schema changes, zero data loss|
+-----------------------------------------------------------------------------------+
```

---

## 2. Java Entity Impact & Compatibility Strategy

### A. Master Entity Adaptations

#### 1. `Student.java`
- **Schema Addition:** `department_id INT NOT NULL REFERENCES departments(id)`.
- **Entity Compatibility Implementation:**
  ```java
  @Column(name = "department_id", nullable = false)
  private Integer departmentId;

  @Column(nullable = false, length = 100)
  private String department; // Retained for backward-compatible JSON serialization
  ```
- **Behavior:** `student.getDepartment()` continues to return `"Computer Science"`. The frontend receives the exact string key expected by its tables and filter dropdowns. On save/update, `departmentId` is verified against `DepartmentRepository`.

#### 2. `Teacher.java`
- **Schema Addition:** `department_id INT NOT NULL REFERENCES departments(id)`.
- **Entity Compatibility Implementation:**
  ```java
  @Column(name = "department_id", nullable = false)
  private Integer departmentId;
  ```
- **Behavior:** Existing constructors and authentication queries (`findByIdIgnoreCase`) continue working seamlessly. In seed data and registration, `departmentId` is mapped from the teacher's subject/department.

#### 3. `Course.java`
- **Schema Additions:**
  - `department_id INT NOT NULL REFERENCES departments(id)`.
  - `subject_key VARCHAR(50) NOT NULL REFERENCES subjects(subject_key)`.
- **Entity Compatibility Implementation:**
  ```java
  @Column(name = "department_id", nullable = false)
  private Integer departmentId;

  @Column(name = "subject_key", nullable = false, length = 50)
  private String subjectKey;

  @Column(length = 100)
  private String faculty; // Retained as fallback string for existing UI cards
  ```
- **Behavior:** `course.getFaculty()` returns instructor name or faculty string. `CourseRequest` DTO continues to accept existing payloads while defaulting `subjectKey` and `departmentId` based on course code prefix (e.g., `CS...` $\to$ CS department, `computerScience` subject).

---

### B. New Normalized Entities (Phase 3 Additions)

To represent the 3NF/BCNF data model and support the Java Lab module without disturbing legacy repositories:

1. **`CourseEnrollment.java` (`course_enrollments`):**
   - `@Entity @Table(name = "course_enrollments")`
   - Fields: `id`, `studentId`, `courseCode`, `enrollmentDate`, `status`, `grade`, `createdAt`.
   - Used for explicit course registration queries and student course lists.
2. **`AttendanceRecord.java` (`attendance_records`):**
   - `@Entity @Table(name = "attendance_records")`
   - Fields: `id`, `studentId`, `courseCode`, `sessionDate`, `status` (`Present`/`Absent`), `sessionTopic`, `markedByTeacherId`, `createdAt`.
   - Used for student historical attendance timelines and audit reporting.
3. **`StudentMark.java` (`student_marks`):**
   - `@Entity @Table(name = "student_marks")`
   - Fields: `id`, `studentId`, `subjectKey`, `examType` (`Internal`/`Midterm`/`Endterm`), `marksObtained`, `maxMarks`, `grade`, `remarks`, `updatedAt`.
   - Used for normalized grade analytics, GPA calculations, and Java Stream processing.

---

## 3. REST API Compatibility & Contract Inventory

All existing endpoints maintain 100% contract stability:

| API Endpoint | HTTP Method | Existing Payload / Parameters | Breaking Change? | Backward Compatibility Mechanism |
| :--- | :---: | :--- | :---: | :--- |
| `/api/auth/login` | `POST` | `LoginRequest` (`role`, `name`, `roll`) | **None** | Session object returned contains identical keys (`role`, `name`, `roll`, `subject`, `workspace`). |
| `/api/auth/register-teacher` | `POST` | `RegisterTeacherRequest` | **None** | Automatically maps `departmentId` from selected subject. |
| `/api/auth/register-student` | `POST` | `RegisterStudentRequest` | **None** | Automatically maps `departmentId` from `department` name lookup. |
| `/api/students` | `GET` | `?teacherId=&department=&semester=&search=` | **None** | Filters support both `department` name and `department_id`. |
| `/api/students/{id}` | `GET` | Path variable `id` | **None** | JSON shape unchanged; includes `attendance` transient field. |
| `/api/students` | `POST` | `StudentRequest` | **None** | Resolves `department_id` via lookup if only name is provided. |
| `/api/students/{id}` | `PUT` | `StudentRequest` | **None** | Updates both `department_id` and `department` string atomically. |
| `/api/students/{id}` | `DELETE` | Path variable `id` | **None** | Cascade deletes all dependent child rows cleanly. |
| `/api/courses` | `GET` | `?teacherId=` | **None** | Calculates `totalStudents` dynamically from `course_enrollments` (or semester matching fallback). |
| `/api/attendance` | `GET` | `?teacherId=` | **None** | Reads aggregate summaries from `attendance` table. |
| `/api/attendance/mark` | `POST` | `MarkAttendanceRequest` (`studentId`, `present`) | **None** | Inserts dated session row in `attendance_records` while trigger updates `attendance` counters. |
| `/api/marks` | `GET` | `?teacherId=` | **None** | Returns marks rows matching teacher's subject. |
| `/api/marks/save` | `POST` | `SaveMarksRequest` | **None** | Batch updates both `student_marks` and legacy `marks` table. |
| `/api/dashboard/stats` | `GET` | `?teacherId=` | **None** | Returns identical stat card array (`Total Students`, `My Subject`, `Average Attendance`, etc.). |

---

## 4. Frontend Compatibility & Transition Strategy

- **Zero Breaking Changes to UI Logic:**
  - The frontend expects students to have `student.department` as a string for display in tables (`<td>{student.department}</td>`) and for filter options (`<option value="Computer Science">`). Because `department` string is maintained in the JSON payload, **no existing frontend template or script breaks**.
  - Course cards continue displaying `course.faculty` and `course.name`.
  - Marks table continues reading `marks.computerScience`, `marks.mathematics`, etc., for the 5-subject overview.
- **Enhanced Capabilities Added in React SPA:**
  - In Stage D, when porting the static HTML screens to React components, the components will additionally have access to normalized data (e.g. detailed attendance calendar history, exam-wise marks breakdowns) through optional new endpoints, significantly enhancing the demonstration without destabilizing evaluated features.

---

## 5. Seed Data & Database Migration Implications

When transitioning from the initial uninitialized database to the revised normalized database in Phase 3:
1. **Initial Seed Execution:**
   - Seed departments: `(1, 'Computer Science', 'CS')`, `(2, 'Information Technology', 'IT')`, `(3, 'Electronics', 'EC')`, `(4, 'Mechanical', 'ME')`, `(5, 'Civil', 'CV')`.
   - Seed teachers: Include `department_id` matching their discipline (e.g. `T-1001` Dr. Sudha Rao $\to$ dept 1 CS).
   - Seed students: Include both `department_id` (1–5) and `department` string (e.g. `CS-2101` $\to$ dept 1, `'Computer Science'`).
   - Seed courses: Include `department_id` and `subject_key` (e.g. `CS501` $\to$ dept 1, subject `'computerScience'`).
   - Seed course enrollments: Automatically enroll students into courses matching their department and semester.
   - Seed normalized marks: Insert initial `'Endterm'` marks in `student_marks` matching the 20 demo student records in `marksRecords`.
2. **Idempotence & Safety:**
   - All migration inserts use `ON DUPLICATE KEY UPDATE` or `INSERT IGNORE`.
   - No data is wiped; subsequent application restarts preserve all newly created student records.
