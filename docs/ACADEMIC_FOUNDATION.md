# Academic foundation

## Local setup

The React application at http://localhost:5173 uses the Spring Boot API at http://localhost:8080. Use the same hostname for both. The session cookie is HTTP-only, has SameSite Strict, and expires after 30 minutes of inactivity. For an HTTPS deployment, enable the servlet secure-cookie setting and configure the specific frontend origin.

Set CAMPUS_DB_USER and CAMPUS_DB_PASSWORD for the process running Spring Boot. The default schema is campus_harmony on port 3306. SPRING_DATASOURCE_URL can select a different MySQL instance. The application does not generate the schema. The application account needs access to the academic tables and to the relevant course procedures. Keep database administration credentials separate.

On the first boot against a migrated schema, supply CAMPUS_ADMIN_LOGIN and CAMPUS_ADMIN_PASSWORD through the process environment. Use a newly generated password of at least 12 characters. Remove the bootstrap variables after the first admin account exists. Subsequent starts read the existing account. Teacher and student accounts are created by authorized users through the academic workspace.

## Database rollout and cleanup

1. Inventory the existing v5 schema, including the collation of course and teacher keys, indexes and the existing attendance triggers. Export the database and restore it into a separate MySQL 8 instance. The v5 schema script rebuilds tables and is for a disposable instance only.
2. On the copy, apply database/migrations/006_academic_foundation.sql once. It adds four tables and nullable offering references to enrollments, sessions and attendance records. It replaces the lecture uniqueness index so parallel sections can use the same course and slot. Its zero-valued index expression retains the previous uniqueness rule for historical sessions. MySQL commits DDL in stages. Restore the copy from backup before repeating a failed migration.
3. Compare per-table counts, enrollment IDs, historical attendance totals and trigger definitions before and after migration. Review section membership with the academic office. The earlier schema stores department and semester, which are insufficient to infer a section. Identify existing profile IDs to link to accounts, reviewed teaching assignments, and each historical enrollment that can be linked unambiguously. Provisioning a new profile with an existing login, faculty ID, roll or email is rejected.
4. Review a separate backfill against that mapping. Passwords must be newly provisioned. Existing names and roll numbers are insufficient login credentials. Retain ambiguous historical rows for review. Existing student percentages include their enrolled course records even if the historical section is unknown.
5. Obtain approval before applying changes to the existing database. This milestone applies the migration only on a private disposable instance. No deletion of historical profiles or demo rows is included. The former automatic seeder is enabled only by the explicit demo-fixtures profile.

## Daily workflow

- An administrator creates departments, subjects, academic terms, sections and courses as needed. They create a teacher account, assign a teacher and course to a section, and schedule a dated lecture period.
- A teacher opens their workspace and registers a student in an assigned section. The server links the student to all offerings in the section in the same transaction as account creation. Assigning a new offering also enrolls the existing section members.
- The teacher selects the class, course, date and lecture. The roster uses persisted enrollment IDs. Every eligible student needs a present or absent status. A submitted lecture displays the saved register. An overlapping teacher or class slot, a future attendance submission and a repeated submission are rejected by the implementation.
- A student signs in to see their own enrolled courses, marked lectures, present count and percentage. An unmarked course displays an empty percentage.

The previously evaluated static portal under frontend/public/sms is an archived coursework interface. Use the React workspace for authenticated operations. The Java demonstrations and DBMS procedures remain available to administrators.

## Verification

Run the following from the repository root in Windows PowerShell with MySQL Server 8.0, Maven and a JDK installed. The script creates a private data directory, checks its identity before applying SQL, generates disposable credentials and cleans up its own instance. Use -MySqlBin to select a different MySQL installation.

```powershell
.\backend\verify-foundation.ps1
```

The full run builds the actual backend, opens HTTP sessions for the three roles, submits a lecture and starts a second Spring Boot context against the same data directory. It also attempts an unauthorized registration, a foreign roster read, a student write, an invalid enrollment, duplicate registration, duplicate scheduling and duplicate submission.

The SQL-only mode uses Windows shared memory and verifies persisted attendance after restarting MySQL. The Java access tests exercise the MVC interceptor and password hashing. The React tests exercise login states and roster form payloads.

```powershell
.\backend\verify-foundation.ps1 -SqlOnly
mvn -f backend/pom.xml -Dtest=FoundationAccessTests test
npm --prefix frontend test
npm --prefix frontend run build
```

## Source changes

| Area | Files |
| --- | --- |
| Schema and verification | database/migrations/006_academic_foundation.sql, backend/verify-foundation.ps1, backend/src/test/resources/foundation_constraints.sql |
| Configuration | backend/src/main/resources/application.properties, CorsConfig.java, DataSeeder.java, frontend/vite.config.js |
| Login and access control | AuthController.java, Access.java, Identity.java, Passwords.java, GlobalExceptionHandler.java |
| Catalog and attendance | AcademicController.java, CatalogController.java, StudentController.java, TeacherController.java, AttendanceSession.java, AttendanceSessionServiceImpl.java, StudentServiceImpl.java, TeacherService.java, TeacherServiceImpl.java |
| React | AcademicWorkspace.jsx, AppLayout.jsx, Navbar.jsx, AuthContext.jsx, lib/api.js, routes/index.jsx, attendance.jsx, profile.jsx, courses.jsx, students.jsx, teachers.jsx, transcript.jsx, marks.jsx |
| Tests | FoundationAccessTests.java, FoundationWorkflowIT.java, AuthContext.test.jsx, AcademicWorkspace.test.jsx |
| Setup | README.md and this guide |
