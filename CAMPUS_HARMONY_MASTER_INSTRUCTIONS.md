# CAMPUS HARMONY — MASTER PROJECT INSTRUCTIONS FOR ANTIGRAVITY

**Project identity:** Campus Harmony  
**Existing application identity in the codebase:** Campus Harmony / Sunrise Institute Student Management System (SMS)  
**Academic context:** Chitkara University, BE CSE, Semester III, Batch 2025, July–December 2026  
**Purpose:** Upgrade and complete the existing project so the same application can be demonstrated and explained for FEE-II, DBMS and Programming in Java evaluations.

---

## 0. Non-negotiable instructions

1. **Do not rename the project.** The submitted project name is **Campus Harmony**. Preserve its identity, purpose and recognizable branding. Do not replace it with a different project or a generic admin dashboard.
2. **Do not restart from an empty template.** First inspect the complete repository and understand the existing application. Reuse sound code, data, UI assets and working features. Refactor only where justified.
3. **Do not destroy evaluated work.** FEE-II Evaluation I and Evaluation II have already been completed. Preserve the work that supports those evaluations and avoid gratuitous redesigns that erase the evidence of that work. The remaining FEE-II target is the final Project Based Evaluation-III, alongside the DBMS project evaluation and Java CA-3/CA-4.
4. **Do not invent requirements, results, screenshots, test outcomes, faculty approvals or student contributions.** Mark anything not yet verified as pending.
5. **Do not create fake functionality.** Every visible action must have a real outcome. CRUD must persist in MySQL. Never silently switch to browser/local-storage/demo data when the backend fails. Show a useful error instead.
6. **Do not claim “production-ready”, “fully tested”, “secure”, “normalized” or “offline” unless the implementation and tests actually support the claim.**
7. **Keep the project explainable by a 3rd-semester student.** Prefer straightforward, readable code and clear module boundaries over unnecessary enterprise complexity. Do not add technologies solely for decoration.
8. **GitHub is for source control and documentation.** The actual application/database setup target is a local Windows machine. Do not migrate the app or database to a cloud platform.
9. **AI-use academic integrity:** AI-generated output must be reviewed, understood, adapted and personally contributed to by the students. Prepare genuine code walkthroughs and explanations. Never fabricate individual contribution evidence.

---

## 1. Source documents and authority

Use the following uploaded documents as the primary academic sources. If any instruction in this file differs from the original document, the original document wins.

### FEE-II
- `Circular_20261103155154_Notice_fee-ii.pdf` — final project-based evaluation rubric and report guidelines for Front End Engineering-II, course **25CSE0203**.
- `Circular_20260709155958_Front_End_Engineering-ii25cse0203_(1).pdf` — FEE-II Course Handout (CHO), July–December 2026.

### DBMS
- `Circular_20261103151707_Rubrics_For_Project-based_Evaluations-dbms_Batch_2025_Cse.pdf` — DBMS project evaluation rubric and documentation guidelines for course **24CSE0209**.
- `Circular_20260709162005_Database_Managment_System_24cse0209(1).pdf` — DBMS Course Handout (CHO), July–December 2026.

### Java
- `CHO_JAVA.pdf` — Programming in Java Course Handout, course **25CSE0202**, July–December 2026.

**Important gap:** No separate Java CA-3/CA-4 marks rubric was included in the supplied files. Use the Java CHO's stated CA-3 milestone and CA-4 final-project/viva requirements. Do not invent a CA-3/CA-4 marks breakdown. If a separate Java rubric is later supplied, incorporate it.

---

## 2. Existing repository baseline — inspect before changing

The supplied archive is `campus-harmony-fullstack-updated.zip`. It contains an existing full-stack project, including generated/build/dependency content. Do not treat every archived file as source code.

The source layout observed in the archive includes:

```text
Campus Harmony/
├── backend/
│   ├── pom.xml
│   ├── run-backend.bat
│   └── src/main/
│       ├── java/com/campusharmony/
│       │   ├── CampusHarmonyApplication.java
│       │   ├── config/
│       │   ├── controller/
│       │   ├── dto/
│       │   ├── entity/
│       │   ├── exception/
│       │   ├── repository/
│       │   └── service/
│       └── resources/
│           ├── application.properties
│           └── seed-data.sql
├── database/
│   ├── schema.sql
│   ├── data.sql
│   └── queries.sql
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── run-frontend.bat
│   ├── serve.js
│   ├── public/sms/
│   │   ├── login.html
│   │   ├── index.html
│   │   ├── students.html
│   │   ├── attendance.html
│   │   ├── courses.html
│   │   ├── marks.html
│   │   ├── profile.html
│   │   ├── css/
│   │   ├── js/
│   │   └── data/data.js
│   └── src/
│       ├── routes/
│       ├── components/ui/
│       └── styles.css
├── README_FULLSTACK.md
└── run-project.bat
```

The archive also contains a large number of generated/dependency files (including backend `target` and frontend dependency/build-related content). Inspect `.gitignore`, package lockfiles and build configuration. Keep reproducible source and lockfiles; do not commit bulky generated folders such as `node_modules`, `target`, `dist`, or caches unless there is a specific documented reason.

### Known baseline observations that must be verified against the current extracted code
- The frontend contains functional-looking **vanilla HTML/CSS/ES6 JavaScript pages** under `frontend/public/sms/`.
- The frontend also has a React/Vite/TanStack-based `frontend/src/` area and React dependencies, but the existing SMS pages are not thereby proven to be React pages. The current React route appears to direct users to the static SMS login page. Audit which entry points are actually used.
- `frontend/public/sms/js/app.js` contains a localStorage/in-memory workspace and an API client. Its comments and README describe backend integration, but inspect every operation to determine whether API failure can fall back to demo/local data and whether all operations truly persist.
- The backend is Java/Spring Boot with controller → service → repository → entity layering and Spring Data JPA/Hibernate.
- Existing database scripts define tables including departments, subjects, teachers, students, courses, attendance, marks and activities. The supplied SQL schema uses aggregate attendance counters and a fixed set of subject columns in a student-linked marks record. These are not equivalent to dated attendance events and a normalized student-subject-exam marks model.
- The current README describes the architecture and features; treat it as documentation to verify, not as proof that each feature works.
- The root launcher starts backend and frontend terminals, but must be tested end-to-end. It does not by itself prove that MySQL is installed, running, initialized safely, or that the browser is opened only after readiness.
- Check the current Java version in `pom.xml` and scripts. The Java CHO recommends **JDK 21 LTS**. Align the project to JDK 21 after verifying dependencies and compatibility.
- Inspect the exact `AttendanceController` imports, all endpoints, validation and persistence before assuming compilation or runtime correctness.

Produce a written audit before major refactoring:
- What currently runs and how to run it.
- Actual frontend entry point and which pages are React versus static HTML.
- Backend build/runtime status and API inventory.
- Database schema and current seed-data behavior.
- Which features persist in MySQL, which are browser-only, and which are incomplete.
- Existing bugs, security gaps, duplicate/unused files and risky migrations.
- Files/features that must be preserved because earlier FEE-II evaluations are complete.

---

## 3. Agreed target architecture and environment

Use this as the target unless the existing repository proves a compelling compatibility issue. Explain any deviation before applying it.

### Runtime
- Windows local development and demonstration.
- **JDK 21 LTS**.
- Node.js LTS and npm (use the existing lockfile/package manager consistently; do not casually switch npm to Bun or vice versa).
- MySQL Community Server 8.x locally; MySQL Workbench is optional.
- Maven for Java dependency/build management.
- Git/GitHub for source version control.
- React + Vite frontend.
- Java Spring Boot backend.
- MySQL relational database.

### Application flow

```text
Browser
  |
  v
React SPA (Vite, HTML5, CSS3, ES6+ JavaScript)
  |  Fetch/Axios + JSON + REST
  v
Java Spring Boot REST API
  |-----------------------------|
  | Spring Data JPA/Hibernate   | Direct JDBC teaching/demo module
  |                             | (DriverManager, Connection,
  |                             | PreparedStatement, ResultSet)
  v                             v
             Local MySQL 8.x
```

Use Spring Data JPA for the ordinary application data layer. In addition, implement a **small, genuine, clearly identified direct JDBC module** that visibly uses `DriverManager`, `Connection`, `PreparedStatement`, `ResultSet`, try-with-resources and transaction management. Do not claim Spring Data JPA alone demonstrates the direct JDBC lab outcomes.

### Offline/local requirement versus FEE-II handout
The FEE-II CHO names deployment on Vercel/Netlify and the final rubric includes build process, environment configuration and production deployment. The agreed project setup is local/offline, with no cloud backend or cloud database. Do not falsely claim a public deployment. Instead:
- Produce and test a production frontend build (`npm run build`).
- Demonstrate environment-specific configuration without exposing secrets.
- Serve/test the built frontend locally against the local backend.
- Document that public Vercel/Netlify deployment was intentionally not performed because the agreed deployment target is local-only.
- If the evaluator explicitly requires a public URL, flag this as a rubric-vs-environment conflict for the student to decide; do not silently change the deployment decision.

---

## 4. Academic requirements — FEE-II (25CSE0203)

### CHO outcomes and topics
The FEE-II CHO specifies:
- HTML5 structure, semantic tags and accessibility basics.
- CSS3, box model, Flexbox, Grid, responsive design, media queries and mobile-first layouts.
- JavaScript fundamentals, ES6+ (`let`/`const`, arrow functions, destructuring, spread/rest, modules), promises, async/await and Fetch API.
- DOM manipulation and event handling, browser storage, JSON and forms.
- React project setup, component architecture, JSX, props, state, list/conditional rendering.
- Hooks: `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`; reusable components, custom hooks, lifting state and prop-drilling concepts.
- React Router, nested/dynamic routes, route params, protected routes and 404 pages.
- Navigation layout and multi-page SPA design.
- Context API, global/local state architecture; Redux Toolkit or Zustand are mentioned as introductory alternatives, not a mandate.
- Form handling, validation, reusable input components, modals, tabs, dropdowns, toast notifications, search/filter/sort.
- REST API consumption using fetch/axios, loading/error/retry handling, pagination/infinite scroll/debounce and CRUD workflows.
- Jest and React Testing Library; unit, integration and UI tests.
- Performance optimization: memoization, lazy loading and code splitting.
- Component re-render understanding and React best practices.
- Build/deployment workflow, environment variables and production configuration.

### Evaluation history and final evaluation focus
FEE-II Evaluation I and Evaluation II have already been completed. Preserve the existing evaluated work and do not present them as upcoming.
The final FEE-II Project Based Evaluation-III is the remaining target. The supplied final rubric is scored out of **40**:
- Presentation: **7**
- File work: **8**
- Project Work and Viva: **25**

Project Work/Viva rubric areas:
1. HTML, CSS, JavaScript and event handling as per Evaluation-I coverage.
2. React and Context API as per Evaluation-II coverage.
3. API integration, CRUD workflows, React testing, Git implementation and performance optimization.
4. Component re-rendering, React best practices, tested dashboard development, build processes, environment configuration and production deployment.

Additional rules:
- Project team may consist of 3–4 members.
- GitHub submission is mandatory and the repository should be updated regularly.
- The notice states that direct AI-generated submission without significant personal contribution can receive zero. Build genuine student understanding and contributions.

### FEE-II report format
Follow the notice's order:
1. Title Page (use supplied title-page format)
2. Abstract
3. Table of Contents
4. Introduction — background, objectives, significance (3–5 pages)
5. Problem Definition and Requirements — problem statement and software/hardware requirements/datasets (1–2 pages)
6. Proposed Design / Methodology — schematic diagram/file structure etc. (3–5 pages)
7. Results — actual screenshots etc. (10–15 pages)
8. References (the notice says style-API; verify the faculty's intended style if unclear rather than inventing one)

Formatting:
- Times New Roman.
- Heading 16 pt bold, left aligned.
- Subheading 14 pt bold, left aligned.
- Body 12 pt, normal, justified.
- Line spacing 1.5.
- Number and label tables/figures in order; captions Times New Roman 12 pt, normal, centered.

### FEE-II implementation requirements
- Make the actual app UI a React SPA, with clear components, React Router, Context API, controlled forms and protected routes. Preserve visual/feature continuity with existing Campus Harmony screens.
- Keep HTML semantics, accessible labels, responsive CSS and real event handling.
- Connect every user-facing data workflow to real backend REST endpoints.
- Include explicit loading, empty, success and error states. Do not silently show stale seed/local data as if it were live.
- Include practical tests for core components, forms, route protection, API behavior and key CRUD workflows.
- Demonstrate a dashboard with real database-derived metrics and tested components.
- Demonstrate a production build and local production-mode run; document the local-only deployment limitation above.
- Use Git commits with meaningful messages; do not fabricate commit history or individual contributions.

---

## 5. Academic requirements — DBMS (24CSE0209)

### CHO outcomes and topics
The DBMS CHO specifies:
- DBMS fundamentals, file systems, architecture, users, schema, instance and metadata.
- Keys, entities, relationships, ER modeling, relational model, domains, tuples, relations and constraints.
- ER-to-relational mapping.
- Relational algebra: selection, projection and set operations.
- DDL (`CREATE`, `ALTER`, `DROP`), DML (`INSERT`, `UPDATE`, `DELETE`), DQL (`SELECT`, `WHERE`, `ORDER BY`).
- Aggregate functions, `GROUP BY`, `HAVING`, joins, nested/correlated subqueries.
- Set operations (`UNION`, `INTERSECT`, `MINUS`) and DCL (`GRANT`, `REVOKE`) as covered in the CHO; use MySQL-compatible equivalents/syntax where needed and document differences.
- Views and view operations.
- Functional dependencies, decomposition, lossless join, dependency preservation.
- Normalization: 1NF, 2NF, 3NF and BCNF.
- File structures/record formats, primary/secondary/clustered indexes, hashing and B-tree basics.
- MySQL stored-program blocks, variables, scope and data types.
- Control flow, cursors, error handling, procedures, functions and triggers.
- Transactions, ACID, concurrency problems, serializability, lock-based protocols, deadlocks and recovery.

The CHO recommends MySQL Installer **8.0.38** and Testpad. Target MySQL 8.x and verify syntax against the installed server version.

### DBMS evaluation rubric
The supplied project rubric is out of **50**:
- Presentation and File: **10**
  - Demonstration skill: 3
  - Report format: 4
  - Teamwork/engagement: 3
- Project Work and Viva: **40**
  - Case study: 5
  - ER diagram mapping from case study: 10
  - ER-to-relational model mapping and normalization: 10
  - Use cases implemented and knowledge of techniques used: 15

For the 15-mark procedural SQL criterion, the notice explicitly calls for use cases demonstrating procedures/functions, cursors, triggers, exception handling and/or control structures, and the student must explain the purpose and working of implemented techniques. Basic SQL queries alone are insufficient for the top band.

The DBMS notice uses a library-system example to explain how to identify entities, attributes, relationships and cardinalities. **Do not change Campus Harmony into a library system.** Apply those modeling expectations to the existing college ERP case study.

### DBMS report format
The notice requires a concise report containing:
1. Title Page
2. Table of Contents
3. Introduction
4. E-R Diagram
5. Database Schema
6. Use Cases (Problem Statements)
   - SQL queries for each use case
   - Screenshot/output for each implemented use case

Formatting:
- Times New Roman.
- Heading 16 pt bold, left aligned.
- Subheading 14 pt bold, left aligned.
- Body 12 pt, normal, justified.
- Line spacing 1.5.
- Number/label tables and figures in order.
- Figure/table caption: Times New Roman 10 pt, normal, centered.

### DBMS implementation requirements
- Design a coherent Campus Harmony case study and identify entities, attributes, relationships, cardinalities and constraints.
- Produce an accurate ERD, then map it into relational tables with PKs, FKs, unique/check/not-null constraints as appropriate.
- Document functional dependencies and show the normalization process through 1NF, 2NF, 3NF and BCNF where applicable. Explain why the final relations satisfy the chosen normal forms.
- Avoid storing repeating subject columns in a single marks row. Use a relational student–subject–assessment/exam marks design.
- Avoid representing attendance only as aggregate counters. Store dated attendance records (and course/subject/session where relevant), prevent duplicate attendance for the same student/session and derive summaries from records.
- Use proper department/course/subject foreign keys rather than department-name text as a pseudo-relationship.
- Implement meaningful SQL examples: DDL, DML, DQL, joins, aggregates, GROUP BY/HAVING, nested/correlated subqueries, set operations, views, indexes and constraints.
- Create multiple well-defined business use cases, each with a problem statement, SQL implementation and actual output evidence.
- Implement meaningful MySQL stored procedures, functions, triggers, cursors, variables, conditional/loop control structures and exception/error handling. Each must serve a real Campus Harmony use case rather than being an unused demo.
- Include ACID transaction examples and explain concurrency, serializability, locks/deadlocks and recovery at an appropriate project/viva level. Use reproducible scripts/tests for transaction behavior where practical.
- Keep SQL scripts organized and rerunnable. Never drop the user's data on each app launch.
- Include indexes tied to actual query patterns and explain why they exist.

---

## 6. Academic requirements — Programming in Java (25CSE0202)

### CHO outcomes
The Java CHO's five CLOs require:
- CLO01: OOP, string handling and exception handling.
- CLO02: Collections Framework for organizing, retrieving, traversing, comparing and sorting data.
- CLO03: Multithreaded/concurrent Java using Thread, Runnable, synchronization, inter-thread communication and executor utilities.
- CLO04: JDBC, lambda expressions, Stream API, introductory generics and file handling.
- CLO05: Integrate Java concepts into a guided application and demonstrate implementation, testing, documentation and viva-level understanding.

### Java theory/lab concepts to demonstrate in Campus Harmony
- OOP: classes/objects, constructors, `this`/`static`, inheritance, polymorphism, abstraction/interfaces; arrays; strings/StringBuilder/StringBuffer; wrappers; checked/unchecked/custom exceptions and propagation.
- Collections: ArrayList, LinkedList, HashSet, LinkedHashSet, TreeSet, HashMap, LinkedHashMap, TreeMap, Queue/Deque/PriorityQueue, Iterator/ListIterator, Comparable/Comparator and sorting.
- Threads: Thread and Runnable; `start`, `run`, `sleep`, `join`, `interrupt`; lifecycle states; daemon threads and priorities.
- Synchronization: race conditions, critical sections, synchronized methods/blocks, locks, atomicity/visibility awareness.
- Inter-thread communication: `wait`, `notify`, `notifyAll`, guarded blocks and producer-consumer coordination.
- Executor utilities: fixed thread pool, ExecutorService, shutdown/awaitTermination, Callable, Future and ScheduledExecutorService.
- JDBC: drivers, JDBC URL, DriverManager, Connection, Statement, PreparedStatement, `executeQuery`, `executeUpdate`, CRUD, ResultSet, typed getters, object mapping, metadata, transactions, commit/rollback and SQLException handling.
- Lambdas, functional interfaces, method references, Predicate, Function, Consumer and Supplier.
- Stream API: filter, map, sorted, distinct, limit, skip, count, min, max, findFirst, anyMatch, reduce and Collectors such as groupingBy, partitioningBy, joining, counting and summarizing.
- Generics: generic classes/methods, type safety, diamond operator and basic bounds/wildcards.
- File handling: byte/character streams, FileInputStream/FileOutputStream, FileReader/FileWriter, BufferedReader/BufferedWriter, text/CSV read-write, validation, collection import/export and try-with-resources.

### CA-3 and CA-4
The Java CHO states:
- **CA-3 — Project Milestone after Lecture 27.** Guided Java project planning and working prototype: problem definition, use cases, class/package structure, data model, collection/persistence choice and initial module; implementation/integration of core modules, collection-based logic, file/JDBC persistence, Stream-based reporting and concurrency where appropriate; testing/refinement, input validation, exception handling, debugging, code review, duplication removal/basic refactoring; documentation and viva preparation.
- **CA-4 — Final Project Evaluation + Viva (Lecture 30).**

No separate marks allocation for Java CA-3/CA-4 was supplied. Do not invent one.

### Java implementation requirements
- Keep Spring Boot as the main web backend, but add a clearly identifiable Java project module/package that demonstrates the Java CHO concepts in real Campus Harmony use cases.
- Provide a small direct JDBC repository/service demonstration using the local Campus Harmony MySQL database. Use PreparedStatement and try-with-resources. Include CRUD and a real transaction with commit/rollback. Document why JDBC is shown separately from the JPA application path.
- Implement useful collection-based processing (for example, student/course/marks reporting), comparator sorting, and unique-ID validation.
- Implement meaningful lambda/Stream reports (for example, pass/fail grouping, department/course summaries, attendance analytics).
- Implement a generic repository/helper class with a simple, understandable use case.
- Implement safe CSV import/export of appropriate records with validation and clear error reporting.
- Demonstrate concurrency only where it makes sense and is deterministic enough for viva. Suitable examples include asynchronous report generation or a bounded background task queue. Include a small, clearly documented lab demonstration for race condition vs synchronized correction and producer-consumer/executor utilities if those cannot naturally be part of the user-facing workflow.
- Do not create pointless threads for every API request. Do not use concurrency in a way that risks corrupting database data.
- Keep class names, methods and comments understandable. Add a Java concept map: concept → source file/class → method → how the student explains it.
- Add unit/integration tests and concise run instructions.

---

## 7. Functional scope to preserve and complete

Audit the existing screens and backend before deciding the final page list. The existing product concept is a college ERP / student management system. Keep the following core workflows where they exist or are appropriate:
- Login and role-aware access (teacher/admin and student roles as supported by the existing project).
- Dashboard with real metrics and recent activity.
- Student directory and full CRUD.
- Departments, teachers, courses and subjects management where appropriate.
- Attendance recording and student attendance history/summary.
- Marks/exam/subject results entry and student performance view.
- Student profile.
- Search, filtering, sorting, validation and useful empty/loading/error states.

You may improve the UI and add missing screens, but keep it recognizably Campus Harmony and ensure every feature is backed by real APIs/database operations. Do not add unrelated modules that increase viva burden without academic value.

### Authentication and authorization
- Audit the current authentication flow. A name + roll number/teacher ID check is not sufficient for production-like authentication.
- Use password hashing (e.g. BCrypt through Spring Security) if credentials are introduced.
- Protect backend routes, not only frontend pages. Enforce role/ownership checks server-side.
- Never store plaintext passwords or secrets in source control.
- Use safe validation and clear errors. Do not leak stack traces or database credentials to the browser.
- If the team intentionally keeps a clearly labelled local demonstration login because of time constraints, document its limitations honestly and still prevent unauthorized API writes.

---

## 8. Database safety, migration and seed data

1. Back up existing database data before schema changes.
2. Use versioned migration scripts or a carefully controlled initialization strategy.
3. First-run setup may create the database and apply schema/seed scripts only when needed.
4. Normal subsequent launches must **preserve all user data**. Never drop and recreate tables or reseed demo records on every launch.
5. Keep demo seed data distinguishable from user-created data. Make seed insertion idempotent.
6. Ensure foreign keys, indexes and constraints are real and tested.
7. Validate that application APIs and direct JDBC demonstrations use the same intended local database and schema.
8. Document reset/restore as a separate explicit developer action, never as the default launcher behavior.

---

## 9. Windows setup and launch scripts

Create and test:
- `RUN-CAMPUS-HARMONY.bat`
- `STOP-CAMPUS-HARMONY.bat`
- `README.md`

The run script should:
1. Change to the project root reliably regardless of the current working directory.
2. Check JDK 21, Node.js/npm and MySQL availability; show actionable setup instructions if missing.
3. Check the MySQL service/connection and start it only if necessary and permitted.
4. Create the database/schema only if it does not already exist; preserve existing records.
5. Install frontend dependencies only if missing, using the committed lockfile and reproducible install command.
6. Build/start the Java backend and wait for a real health/readiness endpoint before opening the UI.
7. Start the frontend and open the correct URL only after it is ready.
8. Print clear status, URLs and log locations.

The stop script should stop only processes started by the Campus Harmony launcher, using recorded process IDs/ports safely. Do not kill unrelated Java/Node processes and do not stop MySQL if it is a shared service or was already running before launch. Never delete database files or records.

The application must run locally after dependencies have been installed. State honestly that initial Maven/npm dependency downloads require internet unless all dependencies are already cached.

---

## 10. Testing and acceptance gates

Do not call the work complete until the following have been attempted and results recorded:

### Frontend
- Dependency installation from lockfile.
- Lint/check.
- Production build.
- Unit/component tests (Jest/React Testing Library as required by the FEE-II CHO).
- Tests for forms/validation, route protection, reusable components, dashboard rendering, loading/error states and important CRUD interactions.
- Responsive checks at desktop and mobile widths.
- Verify React re-render behavior and avoid unnecessary re-renders where practical.

### Backend
- Maven compile/test/package with JDK 21.
- API tests for authentication/authorization, validation and core CRUD.
- Verify error handling and HTTP status codes.
- Verify no fallback path reports success when MySQL/API operations fail.
- Verify that each successful create/update/delete is reflected after refresh/restart.

### Database
- Apply schema to a clean test database.
- Verify ER relationships, constraints and sample queries.
- Execute each stored procedure/function/trigger/cursor/control-flow use case.
- Test transaction commit and rollback.
- Verify attendance duplicate prevention and marks uniqueness/relationships.
- Verify indexes exist and are used where expected, where feasible.
- Verify restart preserves data.

### Java CHO
- Compile/run the direct JDBC examples.
- Verify PreparedStatement CRUD and transaction rollback.
- Run collection, lambda/Stream, generic and CSV import/export demonstrations.
- Run concurrency demonstrations and explain their output.
- Add tests for validation and important Java service behavior.

### End-to-end
- Start using `RUN-CAMPUS-HARMONY.bat`.
- Sign in with documented test credentials.
- Exercise the important workflows through the UI.
- Confirm the data persists in MySQL and survives a restart.
- Stop using `STOP-CAMPUS-HARMONY.bat`.
- Record actual outcomes; do not fabricate successful results.

---

## 11. Documentation and viva preparation deliverables

Create/update:
1. `README.md` — prerequisites, installation, database setup, run/stop, test commands, URLs, demo credentials (if any), troubleshooting and local-only deployment note.
2. `docs/ARCHITECTURE.md` — frontend/backend/database architecture and request/data flow.
3. `docs/ERD.md` or ERD image/source — entities, attributes, relationships, cardinalities and constraints.
4. `docs/DATABASE_DESIGN.md` — relational mapping, functional dependencies, normalization rationale, indexes and data dictionary.
5. `database/` scripts — schema, seed, queries, stored programs and migration scripts organized clearly.
6. `docs/DBMS_USE_CASES.md` — each use case's problem statement, SQL/procedural SQL, technique used and actual output evidence.
7. `docs/JAVA_CONCEPT_MAP.md` — each Java CHO topic mapped to actual class/method and viva explanation.
8. `docs/FEE2_CONCEPT_MAP.md` — HTML/CSS/JS/React/Context/API/testing/performance/build concepts mapped to source files.
9. Subject-specific project reports following the exact supplied report guidelines. Do not claim a single report automatically satisfies every subject's format.
10. `docs/TEST_EVIDENCE.md` — commands run, environment, pass/fail results and remaining limitations.

Prepare a simple viva guide:
- Project problem and why Campus Harmony solves it.
- Architecture and one complete request flow.
- ERD and normalization decisions.
- Why each key table exists and its relationships.
- One example each of procedure, function, cursor, trigger and transaction.
- React components, hooks, routing, Context API and API CRUD.
- Java OOP, collections, JDBC, streams, generics, files and concurrency.
- Testing and local production build.
- Honest limitations and future improvements.

All screenshots must come from the actual running application and real outputs. Never fabricate them.

---

## 12. Recommended execution order for Antigravity

Work in controlled stages. Do not attempt a giant destructive rewrite.

### Stage A — Repository and academic audit
- Read this entire file and all supplied course documents.
- Inspect the whole repository, excluding generated/dependency directories from source analysis.
- Run existing build/tests where possible before modifying anything.
- Produce an audit report with evidence, blockers and preservation list.
- Identify conflicts and ask before destructive/irreversible changes.

### Stage B — Architecture and data design
- Propose final React/Spring Boot/MySQL architecture.
- Produce ERD, relational mapping and normalization explanation.
- Plan migrations from the current schema without losing data.
- Map every required course concept to planned modules.

### Stage C — Backend and database
- Fix compile/runtime issues.
- Implement secure-enough local authentication/authorization, validation and reliable APIs.
- Normalize and migrate database schema safely.
- Add DBMS procedural SQL use cases.
- Add the direct JDBC Java module and Java CHO demonstrations.

### Stage D — React frontend
- Migrate/implement the actual user-facing Campus Harmony app in React.
- Preserve useful visual assets and core workflows.
- Implement routes, Context API, reusable components, forms, CRUD, API states and responsive behavior.
- Remove or retire static duplicate screens only after their functionality has been ported and verified.

### Stage E — Tests, scripts and docs
- Add and run tests.
- Build production frontend.
- Create safe Windows run/stop scripts.
- Write documentation and subject-specific concept maps.
- Capture real screenshots/output evidence.

### Stage F — Final verification and handover
- Run the entire acceptance checklist.
- Provide a concise completion report:
  - files created/modified/removed and why;
  - features completed;
  - database changes and migration safety;
  - tests actually run and exact results;
  - launch instructions;
  - known limitations and pending items;
  - where each FEE-II, DBMS and Java concept is demonstrated.
- Do not say “100% complete” if any acceptance gate is untested or failing.

---

## 13. Final instruction

The goal is **one coherent, working Campus Harmony college ERP project** that preserves earlier evaluated work and provides honest, demonstrable evidence for the remaining FEE-II final evaluation, DBMS project evaluation and Java CA-3/CA-4. Prioritize correctness, data safety, academic alignment, maintainability and student understanding over feature count or visual effects.
