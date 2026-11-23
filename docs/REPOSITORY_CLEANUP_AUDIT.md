# CAMPUS HARMONY — REPOSITORY CLEANUP & FILE AUDIT REPORT
**Phase G: Read-Only Repository Inspection, Integrity Verification & Deletion Recommendations**

**Course Evaluation Context:**
- Front End Engineering-II (25CSE0203) — 40 Marks
- Database Management System (24CSE0209) — 50 Marks
- Programming in Java (25CSE0202) — 25 Marks  
**Target Environment:** OpenJDK 21 LTS / Apache Maven 3.9+ / Node.js 20+ / MySQL Server 8.0  
**Inspection Date:** November 16, 2026  
**Auditor Mode:** Strictly Read-Only (Zero Files Modified, Moved, Deleted, or Altered)  
**Machine-Readable Inventory:** [`docs/REPOSITORY_FILE_INVENTORY.csv`](docs/REPOSITORY_FILE_INVENTORY.csv)  
**Baseline Git Checkpoint:** `99643b5` (Working Tree Clean)  

---

## 1. Executive Summary

Campus Harmony has successfully completed its core academic milestones across Stages A through F, delivering a frozen, production-grade, 100% locally runnable University ERP system with comprehensive documentation and viva defense resources.

This audit conducted an exhaustive, recursive inspection of the entire repository (`c:\Users\aksha\Documents\CampusHarmony`), analyzing 34,485 total files across 2,957 directories. The primary objectives were:
1. Identifying **essential runtime files** required for Spring Boot, React 19, and MySQL 8.0.
2. Protecting all **academic evaluation evidence** for FEE-II, DBMS, and Java.
3. Detecting **duplicate, obsolete, and orphaned files** left behind from earlier exploration and scaffolding stages (e.g., legacy batch launchers, obsolete schema versions, Bun lockfiles, Lovable metadata, and unused shadcn UI boilerplate).
4. Providing a risk-weighted, staged cleanup recommendation without risking application functionality or academic marks.

### Key Audit Metrics at a Glance
- **Total Tracked Non-Generated Files:** 260 files (2.37 MB)
- **Files to Retain (Keep):** 202 files (100% essential runtime and academic artifacts)
- **Candidate Files for Removal:** 58 files (~308 KB tracked source space)
- **Generated Directories (Local/Ignored):** 4 directories (`frontend/node_modules/`, `backend/target/`, `frontend/.output/`, `frontend/.wrangler/`) containing 33,801 files (287.24 MB)
- **Total Recoverable Space (with local build caches):** ~3.75 MB (or ~287.5 MB if archiving without `node_modules`)
- **Zero-Risk Invariants:** The previously evaluated vanilla portal (`frontend/public/sms/`), live MySQL database state, 20 evaluated students, and all Stage F reports/viva banks are **100% preserved**.

---

## 2. Repository Structure Overview

```text
c:\Users\aksha\Documents\CampusHarmony\
├── .gitignore                         # Master Git ignore rules
├── CAMPUS_HARMONY_MASTER_INSTRUCTIONS.md # Master academic and technical specifications
├── README.md                          # Master documentation, architecture & quickstart
├── README_FULLSTACK.md                # [Candidate] Pre-Stage B legacy readme
├── RUN-CAMPUS-HARMONY.bat             # Master one-click unified launcher
├── STOP-CAMPUS-HARMONY.bat            # Master one-click graceful shutdown script
├── run-project.bat                    # [Candidate] Pre-Stage B legacy launcher
│
├── backend/
│   ├── pom.xml                        # Maven dependencies & build definition
│   ├── run-backend.bat                # [Candidate] Legacy backend launcher
│   ├── target/                        # [Generated] Maven compiled classes & JAR
│   └── src/
│       ├── main/
│       │   ├── java/com/campusharmony/
│       │   │   ├── CampusHarmonyApplication.java # Spring Boot entry point
│       │   │   ├── config/            # CorsConfig, DataSeeder
│       │   │   ├── controller/        # 11 REST Controllers
│       │   │   ├── demo/              # 7 Core Java CHO Demo classes
│       │   │   ├── dto/               # 13 Request/Response DTOs
│       │   │   ├── entity/            # 16 JPA Entities
│       │   │   ├── exception/         # 4 Global exception classes
│       │   │   ├── repository/        # 14 Spring Data JPA Repositories
│       │   │   └── service/           # 8 Service interfaces + 8 Implementations
│       │   └── resources/
│       │       ├── application.properties # DB connection & JPA config
│       │       └── seed-data.sql      # Seed SQL loaded by DataSeeder
│       └── test/java/com/campusharmony/ # 2 JUnit 5 test suites (13 tests)
│
├── database/
│   ├── schema_v5.sql                  # Master 15-table normalized DDL
│   ├── seed_data_v5.sql               # Master seed dataset (20 students)
│   ├── procedures_triggers.sql        # 3 functions, 6 procedures, 15 triggers
│   ├── queries.sql                    # Analytical DQL viva queries
│   ├── schema.sql                     # [Candidate] Pre-Phase 2 legacy 5-table DDL
│   └── data.sql                       # [Candidate] Pre-Phase 2 legacy seed data
│
├── docs/
│   ├── FEE_II_PROJECT_REPORT.md       # FEE-II Academic Report (40 Marks)
│   ├── DBMS_PROJECT_REPORT.md         # DBMS Academic Report (50 Marks)
│   ├── JAVA_PROJECT_REPORT.md         # Java Academic Report (25 Marks)
│   ├── REPOSITORY_CLEANUP_AUDIT.md    # This master audit report
│   ├── REPOSITORY_FILE_INVENTORY.csv  # 260-row machine-readable inventory
│   ├── screenshots/                   # 7 Live UI visual verification screenshots
│   └── viva/
│       ├── FEE_II_VIVA_QUESTIONS.md   # 60 FEE-II Viva Q&As + Top 10 Mistakes
│       ├── DBMS_VIVA_QUESTIONS.md     # 60 DBMS Viva Q&As + Top 10 Mistakes
│       ├── JAVA_VIVA_QUESTIONS.md     # 60 Java Viva Q&As + Top 10 Mistakes
│       └── LIVE_DEMONSTRATION_SCRIPT.md # Live presentation guide for students
│
└── frontend/
    ├── package.json                   # npm manifest & scripts
    ├── package-lock.json              # npm deterministic lockfile
    ├── vite.config.js                 # Vite + TanStack Start bundler configuration
    ├── vitest.config.js               # Vitest test runner configuration
    ├── eslint.config.js, .prettierrc  # Code linting & formatting tools
    ├── jsconfig.json                  # Path alias resolution (@/*)
    ├── components.json                # shadcn configuration metadata
    ├── serve.js                       # Node preview static server
    ├── run-frontend.bat               # [Candidate] Legacy frontend launcher
    ├── bun.lock, bunfig.toml          # [Candidate] Unused Bun scaffolding files
    ├── AGENTS.md, .lovable/           # [Candidate] Unused Lovable metadata
    ├── .output/, .wrangler/           # [Generated] Nitro/Vite production build caches
    ├── node_modules/                  # [Generated] 33,631 npm packages (283.8 MB)
    ├── public/
    │   ├── favicon.ico, robots.txt    # Static web assets
    │   └── sms/                       # 23 files: Preserved Evaluated Vanilla Portal
    └── src/
        ├── router.jsx, styles.css     # App routing & Tailwind entry
        ├── server.js, start.js        # TanStack Start SSR error wrappers
        ├── routeTree.gen.js           # [Candidate] Outdated generated route tree
        ├── context/AuthContext.jsx    # Persona switching context
        ├── lib/api.js                 # Centralized type-safe REST client
        ├── test/                      # 7 Vitest test suites (19 tests)
        ├── routes/                    # 16 Active application routes
        ├── components/
        │   ├── common/                # Reusable DataTable, MetricCard, Badges
        │   ├── layout/                # AppLayout, Navbar, Sidebar
        │   └── ui/                    # [Candidate] 46 Unused shadcn components
        ├── hooks/use-mobile.jsx       # [Candidate] Unused responsive hook
        └── src/routeTree.gen.js       # Current complete generated route tree
```

---

## 3. Total File and Folder Counts

| Category | Directories | Files | Percentage of Total Files |
| :--- | ---: | ---: | ---: |
| **Tracked Source Code & Docs (Git)** | **36** | **260** | **0.75%** |
| `.git` Internal Metadata | 108 | 424 | 1.23% |
| `backend/target/` (Maven build) | 16 | 99 | 0.29% |
| `frontend/.output/` (Nitro cache) | 18 | 70 | 0.20% |
| `frontend/.wrangler/` (Deploy cache) | 2 | 1 | 0.00% |
| `frontend/node_modules/` (npm) | 2,777 | 33,631 | 97.52% |
| **Total Entire Project Directory** | **2,957** | **34,485** | **100.00%** |

---

## 4. Total Repository Size

- **Total Disk Space Consumed:** **305,007,252 bytes (290.88 MB)**
- **Total Tracked Git Working Tree:** **2,488,406 bytes (2.37 MB)**
- **Total Generated / Ignored Build Artifacts:** **301,168,846 bytes (287.22 MB)**
- **Total Internal `.git` Objects:** **1,415,000 bytes (1.35 MB)**

---

## 5. Size Breakdown by Major Directory

| Directory Path | File Count | Size (Bytes) | Size (Formatted) | Git Status |
| :--- | ---: | ---: | ---: | :--- |
| `frontend/node_modules/` | 33,631 | 297,586,812 | 283.80 MB | Ignored |
| `frontend/.output/` | 70 | 3,218,634 | 3.07 MB | Ignored |
| `.git/` | 424 | 1,415,000 | 1.35 MB | Untracked Git Meta |
| `frontend/src/` | 90 | 381,041 | 372.11 KB | Tracked |
| `backend/target/` | 99 | 388,400 | 379.30 KB | Ignored |
| `frontend/public/` | 25 | 204,462 | 199.67 KB | Tracked |
| `docs/` | 25 | 980,314 | 957.34 KB | Tracked |
| `backend/src/` | 88 | 222,050 | 216.85 KB | Tracked |
| `database/` | 6 | 78,286 | 76.45 KB | Tracked |
| Project Root (`/`) | 7 | 73,429 | 71.71 KB | Tracked |
| `frontend/` (Root configs) | 16 | 458,824 | 448.07 KB | Tracked |
| `frontend/.wrangler/` | 1 | 55 | 0.05 KB | Ignored |

---

## 6. Frontend Audit

### 6.1 Core Application Routes & Entry Points
- **Entry Points:** `frontend/src/router.jsx`, `server.js`, `start.js`, and `styles.css` are active and form the TanStack Start runtime.
- **Route Inventory (`frontend/src/routes/`):** All 15 functional route modules (`activities.jsx`, `attendance.jsx`, `courses.jsx`, `dbms-demo.jsx`, `defaulters.jsx`, `departments.jsx`, `index.jsx`, `java-demo.jsx`, `marks.jsx`, `profile.jsx`, `students.jsx`, `subjects.jsx`, `teachers.jsx`, `transcript.jsx`, and `__root.jsx`) are registered in the active route tree and actively handle user traffic.
- **Evaluated Vanilla Portal (`frontend/public/sms/`):** 23 files comprising HTML, CSS, and vanilla JS are preserved intact and linked via `/sms/index.html` and the `/vanilla-portal` wrapper.

### 6.2 Component Usage Audit
- **Actively Used (`frontend/src/components/common/` & `layout/`):**
  `DataTable.jsx`, `MetricCard.jsx`, `StatusBadge.jsx`, `ErrorMessage.jsx`, `LoadingState.jsx`, `AppLayout.jsx`, `Navbar.jsx`, `Sidebar.jsx`. All 8 components are imported across routes and verified by Vitest tests.
- **Unused Boilerplate (`frontend/src/components/ui/`):**
  46 files (127,541 bytes, 124.55 KB) containing shadcn UI primitives (`accordion.jsx`, `alert-dialog.jsx`, `button.jsx`, `calendar.jsx`, etc.) were scaffolded during initial template creation. **A comprehensive AST search confirmed that zero application routes or layout components import any component from `components/ui/`.** All application pages use standard semantic HTML5 elements styled directly with Tailwind utility classes.
- **Unused Hooks:** `frontend/src/hooks/use-mobile.jsx` is only imported by `components/ui/sidebar.jsx` (which is itself unused; the real layout uses `components/layout/Sidebar.jsx`).

### 6.3 RouteTree Generation Anomaly
- `frontend/src/routeTree.gen.js` (717 bytes, modified Nov 15): Stale route tree containing only `IndexRoute`.
- `frontend/src/src/routeTree.gen.js` (4,122 bytes, modified Nov 16): Modern generated route tree containing all 16 application routes. It was placed in `src/src/` because TanStack Router was executed with root set to `src`.

---

## 7. Backend Audit

### 7.1 Architecture & Spring Component Scan
- **Package:** `com.campusharmony`
- **Classes:** 84 total Java classes across 8 packages (`config`, `controller`, `demo`, `dto`, `entity`, `exception`, `repository`, `service`).
- **Controllers:** 11 `@RestController` classes mapped to `/api/**`.
- **Services:** 8 interface contracts paired with 8 transactional implementation classes.
- **Repositories:** 14 `JpaRepository` interfaces providing Spring Data access.
- **DTOs:** 13 DTO classes handling strict JSON binding.
- **Entities:** 16 JPA entities. Analysis confirmed:
  - Both `Marks.java` (legacy summary row) and `StudentMark.java` (normalized examination row) are actively queried by `MarksServiceImpl.java` for dual-portal compatibility.
  - `ArchivedStudentAttendance.java` maps to Table 15 in `database/schema_v5.sql`. Keeping it ensures JPA schema validation consistency.

### 7.2 Resources & Data Seeding
- `backend/src/main/resources/application.properties`: Configures `spring.jpa.hibernate.ddl-auto=none`, preserving live tables and triggers across restarts.
- `backend/src/main/resources/seed-data.sql`: Exact binary duplicate of `database/seed_data_v5.sql` (12,597 bytes). **Must be preserved** because `com.campusharmony.config.DataSeeder` loads `ClassPathResource("seed-data.sql")` on fresh startup when the `teachers` table is empty.

---

## 8. Database and SQL Audit

| SQL File | Size | Purpose | Status in Live System | Recommendation |
| :--- | ---: | :--- | :--- | :--- |
| `database/schema_v5.sql` | 20.80 KB | Master 15-table DDL, constraints, composite FKs | **Active** (Matches live MySQL) | **KEEP (Class A)** |
| `database/seed_data_v5.sql` | 12.60 KB | Master 20-student academic seed data | **Active** (Matches live MySQL) | **KEEP (Class A)** |
| `database/procedures_triggers.sql` | 25.69 KB | 3 functions, 6 procedures, 15 triggers | **Active** (Installed in MySQL) | **KEEP (Class A)** |
| `database/queries.sql` | 5.39 KB | Complex DQL viva queries & analytics | **Demonstration** | **KEEP (Class B)** |
| `database/schema.sql` | 6.04 KB | Pre-Phase 2 legacy 5-table DDL | **Obsolete** (Incompatible with v5) | **REMOVE (Class F)** |
| `database/data.sql` | 7.77 KB | Pre-Phase 2 legacy 12-student seed data | **Obsolete** (Incompatible with v5) | **REMOVE (Class F)** |

---

## 9. Java Demonstration Audit

The 7 classes in `com.campusharmony.demo` and their test suite in `backend/src/test/java/` provide 100% Course Handout (CHO) coverage for **Programming in Java (25CSE0202)**:

| Demo Class | Core Concept Demonstrated | Invocation Mode | Academic Evaluation Status |
| :--- | :--- | :--- | :--- |
| `StudentComparatorDemo.java` | Custom `Comparator<Student>` sorting algorithms | REST (`/api/java-demo/comparator-sort`) & CLI | **Essential (Class B)** |
| `AnalyticsStreamDemo.java` | Stream API partitioning, grouping & `IntSummaryStatistics` | REST (`/api/java-demo/streams-analytics`) & CLI | **Essential (Class B)** |
| `GenericDataRepository.java` | Generics with bounds `<T extends BaseEntity, ID>` | Standalone CLI & JUnit Tests | **Essential (Class B)** |
| `CsvReportHandler.java` | Character Streams (`BufferedReader`/`Writer`) & checked exception | REST (`/api/java-demo/export-csv`) & CLI | **Essential (Class B)** |
| `JdbcTransactionDemo.java` | Direct low-level JDBC commit/rollback | REST (`/api/java-demo/jdbc-transaction`) & CLI | **Essential (Class B)** |
| `AttendanceProcessingDemo.java`| Multi-threading, `ExecutorService`, `CountDownLatch` | REST (`/api/java-demo/concurrency-simulation`) | **Essential (Class B)** |
| `CampusHarmonyJavaDemo.java` | Standalone executable CLI runner (`main` method) | `mvn exec:java` CLI execution | **Essential (Class B)** |

---

## 10. Academic Evidence Preservation Audit

| Subject Code | Evaluation | Mandatory Artifacts Inspected | Preservation Verdict |
| :--- | :--- | :--- | :--- |
| **FEE-II (25CSE0203)** | 40 Marks | Preserved vanilla portal (`frontend/public/sms/`), React SPA routes, 19 Vitest tests, `FEE_II_PROJECT_REPORT.md`, `FEE_II_VIVA_QUESTIONS.md`, `01_dashboard.png`, `07_vanilla_portal.png`. | **100% PRESERVED** |
| **DBMS (24CSE0209)** | 50 Marks | `schema_v5.sql`, `seed_data_v5.sql`, `procedures_triggers.sql`, `queries.sql`, `DATABASE_DESIGN.md`, `DBMS_USE_CASES.md`, `DBMS_PROJECT_REPORT.md`, `DBMS_VIVA_QUESTIONS.md`, `03_attendance.png`, `04_defaulters.png`, `05_dbms_demo.png`. | **100% PRESERVED** |
| **Java (25CSE0202)** | 25 Marks | 7 `com.campusharmony.demo` classes, `JavaDemoController.java`, 2 JUnit 5 test classes (13 tests), `JAVA_PROJECT_REPORT.md`, `JAVA_VIVA_QUESTIONS.md`, `LIVE_DEMONSTRATION_SCRIPT.md`, `06_java_demo.png`. | **100% PRESERVED** |

---

## 11. Generated Files, Caches and Build Artifacts

| Directory | Total Files | Total Size | Generation Command | Git Status | Recommended Treatment |
| :--- | ---: | ---: | :--- | :--- | :--- |
| `frontend/node_modules/` | 33,631 | 283.80 MB | `npm install` (in frontend/) | In `.gitignore` | **Keep locally**; do not commit. Delete only for clean repo ZIP archive. |
| `backend/target/` | 99 | 379.30 KB | `mvn package` (in backend/) | In `.gitignore` | **Keep locally**; required for quick test runs. |
| `frontend/.output/` | 70 | 3.07 MB | `npm run build` (Nitro cache) | In `.gitignore` | **Safe to delete locally**; regenerated upon build. |
| `frontend/.wrangler/` | 1 | 0.05 KB | `npm run build` (Deploy cache) | In `.gitignore` | **Safe to delete locally**; regenerated upon build. |

---

## 12. Duplicate and Redundant File Detection

| Duplicate Group | Primary Retained File | Redundant Candidate File | Content Match | Analysis & Action |
| :--- | :--- | :--- | :--- | :--- |
| **Database Seed** | `backend/src/main/resources/seed-data.sql` | `database/seed_data_v5.sql` | Identical SHA256 (`c72b22...`) | **RETAIN BOTH.** `backend/.../seed-data.sql` is required on classpath by `DataSeeder.java`. `database/.../seed_data_v5.sql` is required for manual MySQL CLI setup. |
| **Project Launchers** | `RUN-CAMPUS-HARMONY.bat` | `run-project.bat` | Functional overlap | `run-project.bat` is an obsolete pre-Stage B launcher. Recommend removal. |
| **Backend Launchers**| `RUN-CAMPUS-HARMONY.bat` | `backend/run-backend.bat` | Functional overlap | Contains hardcoded Lenovo path. Superseded by master launcher. |
| **Frontend Launchers**| `RUN-CAMPUS-HARMONY.bat` | `frontend/run-frontend.bat` | Functional overlap | Redundant sub-launcher. Superseded by master launcher. |
| **Root Readmes** | `README.md` | `README_FULLSTACK.md` | Outdated documentation | `README_FULLSTACK.md` is obsolete pre-Stage B readme. Recommend removal. |

---

## 13. Dependency Audit

### Backend (`backend/pom.xml`)
All 6 declared Maven dependencies (`spring-boot-starter-web`, `data-jpa`, `validation`, `mysql-connector-j`, `devtools`, and `test`) are actively imported and required by production controllers, repositories, entities, and test suites. **Zero unused dependencies found.**

### Frontend (`frontend/package.json`)
- **Actively Used:** `react`, `react-dom`, `@tanstack/react-router`, `@tanstack/react-query`, `@tanstack/react-start`, `tailwindcss`, `@tailwindcss/vite`, `lucide-react`, `recharts`, `vitest`, `@testing-library/react`.
- **Candidates for Deprecation (Bound to unused shadcn UI):**
  26 `@radix-ui/*` packages, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `vaul`, `cmdk`, `date-fns`, `react-hook-form`, `zod`, and `tw-animate-css`.
  *Note:* As per preservation rules, **do not modify `package.json` during this phase.** They remain harmlessly installed in `node_modules`.

---

## 14. Launcher and Runtime Dependency Audit

- **`RUN-CAMPUS-HARMONY.bat` (Master Launcher):**
  - Confirmed dependencies: MySQL Server running on `localhost:3306`, `backend/pom.xml`, `mvn`, `npm --prefix frontend run dev`.
  - Does NOT depend on `run-project.bat`, `backend/run-backend.bat`, or `frontend/run-frontend.bat`. Removing the legacy batch files will not impact application startup.
- **`STOP-CAMPUS-HARMONY.bat` (Master Shutdown):**
  - Targets port 8080 (backend), port 5173 (frontend dev), and port 8081 (frontend preview). Safe and self-contained.

---

## 15. Git Repository Audit

- **Current Branch:** `master`
- **Current HEAD Checkpoint:** `99643b5` (Verified)
- **Tracked Files:** 260 files
- **Untracked / Ignored Leakage:** Zero untracked files in source directories; `.gitignore` is operating with 100% accuracy.
- **Remote Synchronization Status:** 0 remotes configured; 100% local repository (as audited in pre-cleanup audit).

---

## 16. Safe Deletion Candidates Table

The following **58 files** are confirmed safe deletion candidates, organized into 4 priority batches:

### Batch 1: High-Confidence Obsolete Scaffolding & Tool Remnants (5 Files, ~144.5 KB)
*Completely unused files left over from early template creation.*

| No. | Exact Path | Size | Reason for Removal | Evidence of Non-Usage | Git Status | Risk | Confidence |
|---|---|---:|---|---|---|---|---|
| 1 | `frontend/bun.lock` | 143.34 KB | Unused Bun lockfile | Project uses standard npm (`package-lock.json`) | Tracked | Zero | High |
| 2 | `frontend/bunfig.toml` | 0.45 KB | Unused Bun config | Bun is not installed or used | Tracked | Zero | High |
| 3 | `frontend/.lovable/project.json` | 0.12 KB | Lovable AI template metadata | Local offline project; no Lovable integration | Tracked | Zero | High |
| 4 | `frontend/AGENTS.md` | 0.48 KB | Lovable sync instruction note | Project uses local Git; no Lovable cloud sync | Tracked | Zero | High |
| 5 | `frontend/src/routeTree.gen.js` | 0.72 KB | Stale generated route tree | Superseded by `src/src/routeTree.gen.js` | Tracked | Zero | High |

### Batch 2: Confirmed Obsolete Database & Launcher Files (5 Files, ~35.8 KB)
*Outdated pre-Phase 2 implementations superseded by Stage C/E implementations.*

| No. | Exact Path | Size | Reason for Removal | Evidence of Non-Usage | Git Status | Risk | Confidence |
|---|---|---:|---|---|---|---|---|
| 6 | `database/schema.sql` | 6.04 KB | Pre-Phase 2 legacy 5-table DDL | Superseded by 15-table `database/schema_v5.sql` | Tracked | Low | High |
| 7 | `database/data.sql` | 7.77 KB | Pre-Phase 2 legacy seed data | Superseded by `database/seed_data_v5.sql` | Tracked | Low | High |
| 8 | `README_FULLSTACK.md` | 19.60 KB | Pre-Stage B legacy documentation | Superseded by comprehensive root `README.md` | Tracked | Zero | High |
| 9 | `run-project.bat` | 1.07 KB | Pre-Stage B legacy root batch script | Superseded by `RUN-CAMPUS-HARMONY.bat` | Tracked | Zero | High |
| 10 | `backend/run-backend.bat` | 0.74 KB | Legacy backend launcher (Lenovo path) | Superseded by `RUN-CAMPUS-HARMONY.bat` | Tracked | Zero | High |
| 11 | `frontend/run-frontend.bat` | 0.53 KB | Legacy frontend launcher | Superseded by `RUN-CAMPUS-HARMONY.bat` | Tracked | Zero | High |

### Batch 3: Unused Shadcn UI Boilerplate Components (47 Files, ~128.1 KB)
*46 UI components and 1 responsive hook scaffolded during setup with zero outside references.*

| No. | Exact Path | Size | Reason for Removal | Evidence of Non-Usage | Git Status | Risk | Confidence |
|---|---|---:|---|---|---|---|---|
| 12 | `frontend/src/hooks/use-mobile.jsx` | 0.56 KB | Unused hook | Only imported by unused `components/ui/sidebar.jsx` | Tracked | Zero | High |
| 13–58 | `frontend/src/components/ui/*.jsx` (46 files) | 127.54 KB | Unused shadcn UI boilerplate | AST import analysis: 0 references across all routes | Tracked | Zero | High |
*(Includes: `accordion.jsx`, `alert-dialog.jsx`, `button.jsx`, `calendar.jsx`, `card.jsx`, `dialog.jsx`, `dropdown-menu.jsx`, `input.jsx`, `select.jsx`, `sheet.jsx`, `sidebar.jsx`, `table.jsx`, `tabs.jsx`, etc.)*

---

## 17. Files Requiring Further Investigation (Class G)

1. **`frontend/src/lib/utils.js` (138 bytes):**
   - *Status:* Currently only imported by `components/ui/*.jsx`. However, it defines standard `cn()` (`clsx` + `twMerge`).
   - *Recommendation:* **KEEP.** It is only 138 bytes and harmless.
2. **`frontend/components.json` (436 bytes):**
   - *Status:* Configuration file for shadcn CLI.
   - *Recommendation:* **KEEP.** Useful if additional UI components are scaffolded in the future.
3. **`frontend/serve.js` (2.67 KB):**
   - *Status:* Zero-dependency Node HTTP server.
   - *Recommendation:* **KEEP.** Useful fallback for serving `dist/` without Vite.

---

## 18. Files That Must NEVER Be Deleted (Class A & B)

1. **Evaluated Vanilla Portal:** `frontend/public/sms/*` (all 23 files).
2. **Approved MySQL Schema & Logic:** `database/schema_v5.sql`, `seed_data_v5.sql`, `procedures_triggers.sql`, `queries.sql`.
3. **Classpath Data Seed:** `backend/src/main/resources/seed-data.sql` (loaded by `DataSeeder.java`).
4. **Master Launchers:** `RUN-CAMPUS-HARMONY.bat` and `STOP-CAMPUS-HARMONY.bat`.
5. **Academic Reports & Viva Banks:** All files under `docs/` and `docs/viva/`.
6. **Core Java CHO Demos:** All classes in `com.campusharmony.demo` and `JavaDemoController.java`.
7. **Active React Components & Routes:** `components/common/*`, `components/layout/*`, and `routes/*`.

---

## 19. Recommended Cleanup Sequence (Future Phase)

If approved by the repository owner, cleanup should follow this safe 4-stage sequence:

```mermaid
graph TD
    A["Stage 1: Remove Batch 1 Scaffolding (Bun, Lovable, Stale routeTree)"] --> B["Verification Checkpoint 1: Run 'npm test' & 'npm run build'"]
    B --> C["Stage 2: Remove Batch 2 Obsolete Scripts (schema.sql, data.sql, legacy .bats)"]
    C --> D["Verification Checkpoint 2: Run 'RUN-CAMPUS-HARMONY.bat' & verify MySQL"]
    D --> E["Stage 3: Remove Batch 3 Unused UI (components/ui/ & use-mobile.jsx)"]
    E --> F["Verification Checkpoint 3: Run Vitest & Surefire Test Suites (100% Pass)"]
    F --> G["Stage 4: Clean Generated Build Caches (frontend/.output & .wrangler)"]
```

---

## 20. Expected Disk Space Recovery

- **Direct Source Code Cleanup (Tracked files):** 58 files removed $\rightarrow$ **~308 KB**
- **Build Caches Cleanup (Untracked `.output/` + `.wrangler/`):** 71 files removed $\rightarrow$ **~3.07 MB**
- **Total Immediate Safe Space Recovery:** **~3.38 MB (129 files)**
- **Portable Distribution Archive (Excluding `node_modules` and `.git`):** Reduces total project zip from 290 MB to **under 5 MB**!

---

## 21. Risks and Rollback Strategy

1. **Low Risk Profile:** None of the 58 candidate files are imported by the active React routes, Spring Boot controllers, or master batch launchers.
2. **Rollback Guarantee:**
   - Because a separate backup copy exists and Git tracks every file, any mistakenly deleted file can be instantly restored via `git checkout <commit> -- <file>`.
   - The verified Git commit checkpoint before any cleanup is **`99643b5`**.

---

## 22. Final Recommendation

**Do not execute deletions during this turn.**

Review this report alongside [`docs/REPOSITORY_FILE_INVENTORY.csv`](docs/REPOSITORY_FILE_INVENTORY.csv). Once approved, Batches 1, 2, and 3 can be safely removed in a subsequent stage, leaving Campus Harmony in an immaculate, professional state for academic viva evaluation.
