# StudentHub Nexus

Student Management System (HTML, CSS & JavaScript Only)

You are a senior frontend developer.

Build a complete Student Management System using ONLY HTML, CSS, and Vanilla JavaScript.

Important Constraints
❌ Do NOT use React.
❌ Do NOT use Vue.
❌ Do NOT use Angular.
❌ Do NOT use Bootstrap.
❌ Do NOT use Tailwind.
❌ Do NOT use jQuery.
❌ Do NOT use any frontend framework.
❌ Do NOT use any backend.
❌ Do NOT use Node.js.
❌ Do NOT use Express.
❌ Do NOT use PHP.
❌ Do NOT use any database.
❌ Do NOT use Firebase.

Only use:

HTML5
CSS3
Vanilla JavaScript (ES6)

The application should be designed in such a way that later a backend API and database can easily replace the hardcoded data.

Project Theme

Create a modern, responsive Student Management System Dashboard.

The UI should look like a real college ERP rather than a beginner project.

Use:

Glassmorphism
Soft shadows
Modern cards
Nice typography
Smooth transitions
Responsive design
Sidebar navigation
Professional color palette

Avoid looking AI-generated or overly flashy.

Folder Structure
StudentManagementSystem/

│
├── index.html
├── students.html
├── attendance.html
├── courses.html
├── marks.html
├── profile.html
│
├── css/
│     style.css
│     dashboard.css
│     students.css
│     attendance.css
│
├── js/
│     app.js
│     dashboard.js
│     students.js
│     attendance.js
│     courses.js
│     marks.js
│
├── assets/
│      images/
│      icons/
│
└── data/
       data.js
Sidebar

Include navigation for:

Dashboard
Students
Attendance
Courses
Marks
Student Profile
Settings
Logout
Dashboard

Show cards like:

Total Students

250

Teachers

18

Courses

12

Average Attendance

91%

Pending Assignments

15

Recent Activity

Example:

John enrolled

Attendance updated

Marks uploaded

Course added

Everything should come from hardcoded JavaScript arrays.

Student Module

Show a professional student table.

Columns:

Student ID
Name
Department
Semester
Email
Phone
Attendance
Status
Actions

Include:

Search Bar

Filter by department

Filter by semester

Sorting

Pagination (client side)

Buttons

View
Edit
Delete

Do not actually delete.

Instead show:

Student removed successfully

using a custom toast.

Add Student

Open a modal.

Fields:

Name
Student ID
Email
Phone
Department
Semester
Address
Gender

When submitted:

Store inside the JavaScript array.

Refresh table.

No page reload.

Edit Student

Open modal.

Populate all fields.

Update JavaScript array.

Refresh UI.

View Student

Open a profile modal.

Display:

Photo

Student ID

Department

Semester

Attendance

Courses

Marks

Email

Phone

Address

Status

Attendance Module

Hardcoded attendance records.

Show:

Student Name

Roll Number

Attendance %

Status

Present Days

Absent Days

Allow:

Mark Present

Mark Absent

Update percentage dynamically.

Courses Module

Display cards.

Each card contains:

Course Name

Faculty

Credits

Semester

Total Students

Status

Button

View Students
Marks Module

Display marks table.

Subjects:

Mathematics
Physics
Chemistry
English
Computer Science

Calculate automatically:

Total
Percentage
Grade
Pass/Fail

Grades:

90+  A+

80+  A

70+  B

60+  C

50+  D

Below 50 F
Student Profile Page

Display

Student photo

Personal details

Course details

Attendance

Performance

Progress bar

Recent activity

Badges

Search

Searching should work instantly using JavaScript.

Notifications

Create beautiful custom toast notifications.

Examples:

Student Added

Student Updated

Attendance Updated

Marks Saved

Course Added

No browser alerts.

Dark Mode

Add a switch.

Remember theme using Local Storage.

Local Storage

Use Local Storage for:

Theme

Recently added students

Recent activity

User preferences

This simulates persistence.

Charts

Without external libraries.

Create CSS/JavaScript charts.

Example:

Attendance

█████████ 90%

Marks

Math ████████

Physics █████

Chem ███████

Use div bars.

Data

Create separate data.js

Example:

const students = [
{
id:101,
name:"Rahul Sharma",
department:"Computer Science",
semester:5,
attendance:92,
phone:"9876543210",
email:"rahul@example.com"
},
...
];

Create around:

20 Students
10 Courses
20 Attendance Records
20 Marks Records

Everything hardcoded.

Animations

Use:

Fade In

Slide Up

Hover Effects

Card Lift

Button Ripple

Smooth Sidebar

Smooth Modal

Smooth Table Loading

Responsiveness

Fully responsive.

Desktop

Tablet

Mobile

Sidebar becomes hamburger menu.

Code Quality

Separate HTML, CSS, and JS.

No inline CSS.

No inline JavaScript.

Use reusable functions.

Use modules/files.

Comment major sections.

Readable variable names.

Future Backend Compatibility

Structure the JavaScript so that replacing:

const students = [...]

with

fetch("/api/students")

would require minimal changes.

Keep all CRUD operations inside dedicated functions.

Bonus Features

Include:

Loading screen
Dashboard statistics
Recent activities
User avatar
Breadcrumb navigation
Confirmation modal
Custom dropdowns
Empty state screens
Smooth scrolling
Keyboard accessibility
Form validation
Search highlighting
Professional icons (SVG or Unicode)
Clean documentation (README)
Deliverables

Generate the complete project with:

All HTML pages
All CSS files
All JavaScript files
Organized folder structure
Hardcoded datasets
Fully working navigation
CRUD using JavaScript arrays
Responsive UI
Professional design
No placeholders or incomplete sections
No backend dependencies
No frameworks of any kind

The final result should look like a polished college ERP/student management system that is fully functional with hardcoded data and can later be connected to a real database with minimal code changes.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/48b440c3-1cc3-4882-b21d-cecf762204c3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
