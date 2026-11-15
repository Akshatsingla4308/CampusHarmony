# CHITKARA UNIVERSITY
### DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
**Academic Session:** July–December 2026 | BE CSE Batch 2025 | Semester III  
**Course Code:** 25CSE0203 — Front End Engineering-II (FEE-II)  
**Evaluation:** Project Based Evaluation III (40 Marks)  
**Project Title:** **Campus Harmony — Comprehensive College ERP Single-Page Application**

---

## 1. Introduction & Problem Statement

### 1.1 Problem Statement
Higher educational institutions require integrated enterprise resource planning (ERP) platforms to coordinate academic operations, student admissions, faculty workloads, attendance tracking, and examination grading. Traditional systems often rely on fragmented, multi-page architectures or hardcoded mock data, resulting in poor user experience, lack of real-time responsiveness, and fragile client-server synchronization.

### 1.2 Proposed Solution: Campus Harmony
Campus Harmony is an offline-first, production-grade University ERP application built specifically for the Sunrise Institute of Technology. The application features:
1. **Preserved Vanilla FEE-II Evaluated Portal:** An existing multi-page vanilla HTML5, CSS3, and JavaScript portal (`/sms/index.html`) demonstrating core web fundamentals, DOM event handling, and local storage state persistence.
2. **Modern Single-Page Application (SPA):** A modernized React 19 interface leveraging Tailwind CSS v4, Radix UI accessible component primitives, TanStack Router file-based routing, and Recharts interactive data visualizations.
3. **Full-Stack REST Integration:** Real-time communication with a local Spring Boot 3.2.5 backend and MySQL 8.0 InnoDB relational database via a centralized, type-safe API client.

---

## 2. Objectives & Academic Requirements

The project was developed to satisfy all curriculum benchmarks specified in the Front End Engineering-II syllabus:

1. **Semantic HTML5 & Accessible DOM:** Proper semantic markup (`<aside>`, `<header>`, `<main>`, `<nav>`, `<table>`), ARIA labels, and accessible keyboard navigation powered by Radix UI.
2. **Modern CSS3 & Design System:** Tailwind CSS v4 design tokens, OKLCH color spaces, dynamic Light/Dark mode theming, and responsive flexbox/grid layouts.
3. **Advanced JavaScript (ES6+):** Arrow functions, object destructuring, optional chaining, nullish coalescing, modular imports, and asynchronous promise pipelines with `async/await`.
4. **React Component Architecture:** Decomposition into modular, atomic, and reusable UI components (`DataTable`, `MetricCard`, `StatusBadge`, `ErrorMessage`, `LoadingState`, `AppLayout`, `Navbar`, `Sidebar`).
5. **React Hooks Mastery:**
   - `useState` for local component state, form inputs, and modal controls.
   - `useEffect` for lifecycle management, REST API queries, and theme listeners.
   - `useMemo` for high-performance in-memory search filtering, multi-column sorting, and table pagination.
   - `useCallback` for memoized event handlers.
6. **Global State & Context API:** `AuthContext` providing persistent session state, role-based persona switching (Faculty vs. Student), and shared state synchronization with legacy `localStorage`.
7. **Single-Page Routing:** TanStack Router utilizing file-based routing, automatic route tree generation, and error boundaries.
8. **Automated Unit & Component Testing:** Comprehensive test suite written with **Vitest 4.1** and **React Testing Library** achieving 100% pass rates across 19 unit tests.
9. **Production Build Optimization:** High-efficiency bundling via Vite 8.3 transforming 2,283 modules into minified, production-ready static assets in under 1 second.

---

## 3. Technology Stack

| Layer | Technologies & Libraries | Purpose |
|---|---|---|
| **Core Framework** | React 19 (`react`, `react-dom`) | Declarative UI component library |
| **Routing** | TanStack Router (`@tanstack/react-router`) | File-based client-side SPA routing |
| **CSS & Design System** | Tailwind CSS v4 (`@tailwindcss/vite`), `tw-animate-css` | Atomic CSS design system with OKLCH theme tokens |
| **Component Primitives** | Radix UI (`@radix-ui/react-*`) | Accessible, unstyled UI headless primitives |
| **Data Visualizations** | Recharts 2.15 | Responsive SVG bar charts and pie charts |
| **Iconography** | Lucide React (`lucide-react`) | Scalable vector interface icons |
| **Testing Suite** | Vitest 4.1, `@testing-library/react`, `jsdom` | Component testing, mocking, and assertions |
| **Build Tool** | Vite 8.3 (`vite`) | High-speed ESM development server and bundler |
| **Backend Integration** | Centralized Fetch API (`frontend/src/lib/api.js`) | Type-safe REST client for Spring Boot endpoints |

---

## 4. Architecture & Component Decomposition

### 4.1 Project Directory Structure
```
frontend/
├── public/
│   ├── favicon.ico
│   └── sms/                         # PRESERVED VANILLA FEE-II EVALUATED PORTAL
│       ├── index.html               # Vanilla Dashboard
│       ├── students.html            # Vanilla Student Directory
│       ├── courses.html             # Vanilla Course Management
│       ├── attendance.html          # Vanilla Attendance Portal
│       ├── marks.html               # Vanilla Marks Grading
│       ├── profile.html             # Vanilla Profile
│       ├── css/                     # Vanilla CSS Stylesheets
│       └── js/                      # Vanilla JS DOM & LocalStorage Controllers
├── src/
│   ├── components/
│   │   ├── common/                  # Reusable Atomic Components
│   │   │   ├── DataTable.jsx        # Searchable, sortable, paginated table
│   │   │   ├── MetricCard.jsx       # KPI statistical cards
│   │   │   ├── StatusBadge.jsx      # Color-coded status pills
│   │   │   ├── ErrorMessage.jsx     # User-friendly error alert with retry
│   │   │   └── LoadingState.jsx     # Animated skeleton/spinner
│   │   └── layout/                  # Page Shell Components
│   │       ├── AppLayout.jsx        # Master layout wrapper
│   │       ├── Navbar.jsx           # Top breadcrumb & user persona controls
│   │       └── Sidebar.jsx          # Hierarchical navigation drawer
│   ├── context/
│   │   └── AuthContext.jsx          # Context API for auth & persona state
│   ├── lib/
│   │   └── api.js                   # Centralized REST API client
│   ├── routes/                      # TanStack File-Based Routes
│   │   ├── __root.jsx               # Root shell & error boundaries
│   │   ├── index.jsx                # Executive ERP Dashboard
│   │   ├── students.jsx             # Student Directory & Admissions
│   │   ├── teachers.jsx             # Faculty & Instructors
│   │   ├── departments.jsx          # Academic Departments
│   │   ├── subjects.jsx             # Curriculum Catalog
│   │   ├── courses.jsx              # Course Offerings & Enrollments
│   │   ├── attendance.jsx           # Attendance Sessions & Summaries
│   │   ├── marks.jsx                # Marks Management & Evaluations
│   │   ├── transcript.jsx           # Official Academic Transcripts
│   │   ├── defaulters.jsx           # Defaulter Reports (Cursor Math)
│   │   ├── activities.jsx           # Campus Co-Curriculars
│   │   ├── dbms-demo.jsx            # DBMS Stored Programs Workbench (50M)
│   │   ├── java-demo.jsx            # Core Java CHO Workbench (25M)
│   │   └── profile.jsx              # Profile & Session Management
│   └── test/                        # Vitest Automated Test Suites
│       ├── ApiClient.test.jsx
│       ├── AuthContext.test.jsx
│       ├── DataTable.test.jsx
│       ├── IntegrationWorkflows.test.jsx
│       ├── MetricCard.test.jsx
│       └── StatusBadge.test.jsx
├── package.json
└── vitest.config.js
```

### 4.2 Key Component Implementations

#### 1. Generic Data Table (`DataTable.jsx`)
Features client-side debounce search across multiple fields, dynamic ascending/descending sorting with indicator icons, responsive horizontal scrolling, and custom empty states:
```jsx
// Excerpt from DataTable.jsx: In-memory sorting and filtering
const filteredData = useMemo(() => {
  if (!searchTerm.trim()) return data;
  const term = searchTerm.toLowerCase();
  return data.filter(item => 
    searchFields.some(field => String(item[field] || "").toLowerCase().includes(term))
  );
}, [data, searchTerm, searchFields]);
```

#### 2. Authentication Context (`AuthContext.jsx`)
Coordinates authenticated session state across both the modern React interface and the legacy vanilla portal using `localStorage["sms.session"]`. Provides instant persona switching between Faculty (`Dr. Sudha Rao`) and Student (`Rahul Sharma`) for immediate evaluator review.

---

## 5. Screen Inventory & Modules Implemented

1. **Executive Dashboard (`/`):**
   - KPI metrics: Total Students (20), Faculty (10), Average Attendance (81%), Flagged Defaulters (5).
   - Recharts Bar Chart: Department-wise average attendance.
   - Recharts Pie Chart: Student academic status breakdown (Active vs. Probation).
   - Recent Activities feed and quick evaluation launchpad.
2. **Student Directory & Admissions (`/students`):**
   - Live table with roll numbers, student names, departments, semesters, real-time attendance percentage bars, and status badges.
   - Add/Edit Modal with strict input validation.
   - Delete action with database retention error trapping.
3. **Faculty & Teachers (`/teachers`):**
   - Faculty roster, cabin allocations, department affiliations, and contact details.
4. **Departments (`/departments`) & Subjects (`/subjects`):**
   - Academic departments master and course curriculum credit catalog.
5. **Courses & Enrollments (`/courses`):**
   - Course offerings with assigned teachers and credit weights.
   - Student enrollment roster tracking `Enrolled`, `Dropped`, and `Completed` statuses.
6. **Attendance Sessions & Summaries (`/attendance`):**
   - Synchronized 1:1 summary cache table with quick `+ Present` / `+ Absent` adjustments.
   - Scheduled lecture class creator and batch student attendance marking drawer.
7. **Marks & Official Transcripts (`/marks` & `/transcript`):**
   - Multi-exam assessment logging (`Internal`, `Midterm`, `Endterm`).
   - Official grade transcript with auto-calculated percentage and letter grades (`A+` to `F`).
8. **Attendance Defaulter Reports (`/defaulters`):**
   - Interactive threshold slider (50%–90%).
   - Calculates consecutive shortfall lectures mathematically.
9. **Campus Activities (`/activities`):**
   - Co-curricular event logging, student roll tagging, and category classification.
10. **DBMS Demonstration Workbench (`/dbms-demo`):**
    - Browser execution of Stored Procedures with cursors, ACID transactions (Commit vs. Rollback), and cache reconciliation.
11. **Java Demonstration Workbench (`/java-demo`):**
    - Browser execution of Streams API analytics, Custom Comparators, and Multithreaded Parallel Workers.

---

## 6. Automated Testing & Verification

### 6.1 Vitest & React Testing Library Suite
The frontend incorporates 19 automated unit and component integration tests verifying component rendering, user interactions, and mathematical algorithms:

```text
 RUN  v4.1.12 C:/Users/aksha/Documents/CampusHarmony/frontend

 ✓ src/test/IntegrationWorkflows.test.jsx (4 tests) 5ms
 ✓ src/test/ApiClient.test.jsx (3 tests) 11ms
 ✓ src/test/StatusBadge.test.jsx (4 tests) 46ms
 ✓ src/test/AuthContext.test.jsx (3 tests) 62ms
 ✓ src/test/MetricCard.test.jsx (2 tests) 53ms
 ✓ src/test/DataTable.test.jsx (3 tests) 93ms

 Test Files  6 passed (6)
      Tests  19 passed (19)
   Duration  3.28s
```

### 6.2 Production Build Verification
The application builds cleanly using Vite with zero errors:
```text
✓ 2283 modules transformed.
.output/public/assets/styles-CIDneL5z.css   95.75 kB │ gzip:  15.77 kB
.output/public/assets/index-BJGQaJIx.js    388.60 kB │ gzip: 124.37 kB
.output/public/assets/routes-CxGmgVBm.js   422.75 kB │ gzip: 110.58 kB
✓ built in 961ms
```

---

## 7. Visual Interface Evidence

Actual screenshots captured from the live application running on local servers:

| Figure | Screenshot Path | Description |
|---|---|---|
| **Fig. 1** | [`docs/screenshots/01_dashboard.png`](screenshots/01_dashboard.png) | Executive ERP Dashboard with Recharts visual analytics and KPI cards |
| **Fig. 2** | [`docs/screenshots/02_students.png`](screenshots/02_students.png) | Student Directory with search, department filtering, and status badges |
| **Fig. 3** | [`docs/screenshots/03_attendance.png`](screenshots/03_attendance.png) | Lecture attendance sessions and 1:1 synchronized summary cache |
| **Fig. 4** | [`docs/screenshots/04_defaulters.png`](screenshots/04_defaulters.png) | Defaulter analytics report with interactive threshold slider and shortfall math |
| **Fig. 5** | [`docs/screenshots/05_dbms_demo.png`](screenshots/05_dbms_demo.png) | Live interactive DBMS demonstration workbench for stored programs |
| **Fig. 6** | [`docs/screenshots/06_java_demo.png`](screenshots/06_java_demo.png) | Live interactive Java CHO demonstration workbench with terminal output |
| **Fig. 7** | [`docs/screenshots/07_vanilla_portal.png`](screenshots/07_vanilla_portal.png) | Preserved original FEE-II evaluated vanilla portal (`/sms/index.html`) |

---

## 8. Conclusion & References

The Campus Harmony frontend successfully bridges foundational web development competencies (evaluated in earlier milestones) with modern enterprise React architectures. The interface is responsive, accessible, modular, fully connected to live backend APIs, and thoroughly tested for academic viva evaluation.

### References
1. React 19 Documentation: [https://react.dev/](https://react.dev/)
2. Tailwind CSS v4 Documentation: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
3. Radix UI Accessible Primitives: [https://www.radix-ui.com/](https://www.radix-ui.com/)
4. TanStack Router Documentation: [https://tanstack.com/router/latest](https://tanstack.com/router/latest)
5. Vitest Testing Framework: [https://vitest.dev/](https://vitest.dev/)
