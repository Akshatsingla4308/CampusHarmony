# Student Management System (HTML, CSS & Vanilla JS)

A college ERP style Student Management System built with **HTML5, CSS3 and vanilla ES6 JavaScript only** — no frameworks, no build step, no backend.

## Run

Open `index.html` in a browser, or serve the folder statically. In this project it is served at `/sms/index.html`.

## Structure

```
sms/
├── login.html        Sign-in / teacher registration
├── index.html        Dashboard
├── students.html     Student CRUD table
├── attendance.html   Attendance register
├── courses.html      Course catalogue
├── marks.html        Marks & results
├── profile.html      Student profile
├── css/   style.css dashboard.css students.css attendance.css
├── js/    app.js dashboard.js students.js attendance.js courses.js marks.js profile.js
├── data/  data.js   (all hardcoded datasets)
└── assets/ images/ icons/
```

## Login, roles and data

- `login.html` lets you sign in as **Teacher** (name + teacher ID) or **Student** (name + roll no.).
- **Every teacher teaches one subject.** The subject is shown at the top of every teacher page, and a teacher
  sees and enters marks **only for their own subject** (Marks page, dashboard charts, student quick view).
- **Built-in teachers** (`TEACHERS` in `data/data.js`, e.g. `T-1001` / Dr. Sudha Rao) work on the college data (20 students).
- A **new teacher** can click **Register here**, choose a Teacher ID and a subject, then sign in. They get their
  **own empty workspace**: 0 students, 0 courses, no marks. They add their own students, take attendance and enter marks.
- A **student** sees only their own profile. The name must match the roll number.
- Everything is kept in `localStorage` (`js/auth.js` handles sessions and workspaces). Sessions expire after 12 hours.
  This is browser-only; for real security, verify credentials on a server.

## Features

- Sidebar navigation (Dashboard, Students, Attendance, Courses, Marks, Profile, Settings, Logout), collapses to a hamburger drawer on small screens
- Dashboard stats, CSS/JS bar, column and donut charts, recent activity feed
- Students: instant search with highlighting, department/semester filters, sortable columns, client-side pagination, add/edit modals with validation, view profile modal, soft delete with confirmation modal + toast
- Attendance: mark present/absent with live percentage recalculation, band filter, summary cards
- Courses: card grid, add course, view enrolled students
- Marks: 5 subjects with auto total, percentage, grade (A+/A/B/C/D/F) and pass/fail
- Profile: photo/avatar, details, courses, attendance, performance bars, badges, activity
- Dark mode toggle, custom toasts (no `alert`), loading screen, empty states, keyboard accessible controls
- Local Storage persists theme, newly added students, attendance changes, recent activity and preferences

## Swapping in a real backend

All reads and writes go through `SMS.api` in `js/app.js`:

```js
async getStudents() { return clone(store.students); }
// becomes
async getStudents() { return (await fetch("/api/students")).json(); }
```

No page or render code needs to change — `data/data.js` simply stops being loaded.
