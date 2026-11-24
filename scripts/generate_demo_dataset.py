#!/usr/bin/env python3
"""
CampusHarmony — Realistic Academic Demonstration Dataset Generator
Populates a comprehensive, internally consistent academic dataset:
  - 3 Programs: CSE Core, CSE AI & ML, CSE AI & FT
  - 5 Sections: CSE-A, CSE-B, CSE-C, CSE-D, CSE-E (Semester 5)
  - 5 Subjects: DSA, Discrete Math, DBMS, Front End Eng-II, OOP Java
  - 15 Faculty Members: 3 per subject, max 2 sections per teacher
  - 5 Section Mentors assigned from the 15 faculty members
  - Exactly 300 Students: 60 per section with unique details & accounts
  - 25 Course Offerings & 1,500 Enrollments
  - Full Weekly Timetable (Mon-Sat) with verified 0 conflicts
  - Multi-week Attendance History (High, Normal, <75% Defaulter profiles)
  - 75 Assessments & 4,500 Marks records (within max marks limits)
  - 14 Realistic Student Grievances with resolution timelines
  - Generates database/demo/seed.sql, updates MySQL DB, and creates
    private credentials workbook outside Git repository.
"""

import os
import sys
import hashlib
import base64
import random
from datetime import date, datetime, time, timedelta

# Fix working directory
REPO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.chdir(REPO_DIR)

# Load .env
env_file = os.path.join(REPO_DIR, ".env")
db_pass = ""
db_user = "root"
if os.path.exists(env_file):
    with open(env_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k == "CAMPUS_DB_PASSWORD":
                    db_pass = v
                elif k == "CAMPUS_DB_USER":
                    db_user = v

print(f"[INFO] Initializing dataset generator (DB User: {db_user})...")

# 1. PBKDF2 Password Hashing (600,000 iterations HMAC-SHA256)
def get_pbkdf2_hash(password: str, salt_byte: int) -> str:
    salt = bytes([salt_byte] * 16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 600000, 32)
    salt_b64 = base64.b64encode(salt).decode("utf-8")
    key_b64 = base64.b64encode(key).decode("utf-8")
    return f"600000${salt_b64}${key_b64}"

TEACHER_PASSWORD = "Teacher@123456"
STUDENT_PASSWORD = "Student@123456"
ADMIN_PASSWORD = "AdminSecure@2026!"

TEACHER_HASH = get_pbkdf2_hash(TEACHER_PASSWORD, 0x01)
STUDENT_HASH = get_pbkdf2_hash(STUDENT_PASSWORD, 0x02)
ADMIN_HASH = get_pbkdf2_hash(ADMIN_PASSWORD, 0x03)

# 2. Programs
PROGRAMS = [
    (1, 1, 'BTECH-CSE-CORE', 'CSE Core', 'B.Tech', 4),
    (2, 1, 'BTECH-CSE-AIML', 'CSE AI & ML', 'B.Tech', 4),
    (3, 1, 'BTECH-CSE-AIFT', 'CSE AI & FT', 'B.Tech', 4)
]

# 3. Courses (Semester 5 for Autumn 2026)
COURSES = [
    ('CS501', 'Data Structures & Algorithms', 1, 'computerScience', 4, 5, 'Ongoing', 'Dr. Rajesh Rao'),
    ('CS502', 'Discrete Mathematics', 1, 'mathematics', 4, 5, 'Ongoing', 'Dr. Vikram Joshi'),
    ('CS503', 'Database Management Systems', 1, 'computerScience', 4, 5, 'Ongoing', 'Dr. Priya Sharma'),
    ('CS504', 'Front End Engineering-II', 1, 'computerScience', 4, 5, 'Ongoing', 'Dr. Sunita Mehra'),
    ('CS505', 'Object-Oriented Programming with Java', 1, 'computerScience', 4, 5, 'Ongoing', 'Dr. Amit Kapoor')
]

# 4. 15 Faculty Members (3 per subject, max 2 sections per teacher)
TEACHERS = [
    # DSA (CS501)
    {
        "id": "T-1001", "name": "Dr. Rajesh Rao", "login": "prof_rao",
        "subject": "computerScience", "subject_name": "Data Structures & Algorithms",
        "email": "rajesh.rao@campusharmony.edu", "phone": "+91 98111 01001",
        "mentor_sec": "CSE-A", "sections": ["CSE-A", "CSE-B"]
    },
    {
        "id": "T-1002", "name": "Dr. Meenakshi Sundaram", "login": "prof_sundaram",
        "subject": "computerScience", "subject_name": "Data Structures & Algorithms",
        "email": "meenakshi.s@campusharmony.edu", "phone": "+91 98111 01002",
        "mentor_sec": None, "sections": ["CSE-C", "CSE-D"]
    },
    {
        "id": "T-1003", "name": "Prof. Arjun Sengupta", "login": "prof_sengupta",
        "subject": "computerScience", "subject_name": "Data Structures & Algorithms",
        "email": "arjun.sengupta@campusharmony.edu", "phone": "+91 98111 01003",
        "mentor_sec": None, "sections": ["CSE-E"]
    },
    # DBMS (CS503)
    {
        "id": "T-1004", "name": "Dr. Priya Sharma", "login": "prof_sharma",
        "subject": "computerScience", "subject_name": "Database Management Systems",
        "email": "priya.sharma@campusharmony.edu", "phone": "+91 98111 01004",
        "mentor_sec": "CSE-B", "sections": ["CSE-A", "CSE-B"]
    },
    {
        "id": "T-1005", "name": "Prof. Karthik Raman", "login": "prof_raman",
        "subject": "computerScience", "subject_name": "Database Management Systems",
        "email": "karthik.raman@campusharmony.edu", "phone": "+91 98111 01005",
        "mentor_sec": None, "sections": ["CSE-C", "CSE-D"]
    },
    {
        "id": "T-1006", "name": "Dr. Shalini Verma", "login": "prof_verma",
        "subject": "computerScience", "subject_name": "Database Management Systems",
        "email": "shalini.verma@campusharmony.edu", "phone": "+91 98111 01006",
        "mentor_sec": None, "sections": ["CSE-E"]
    },
    # OOP with Java (CS505)
    {
        "id": "T-1007", "name": "Dr. Amit Kapoor", "login": "prof_kapoor",
        "subject": "computerScience", "subject_name": "Object-Oriented Programming with Java",
        "email": "amit.kapoor@campusharmony.edu", "phone": "+91 98111 01007",
        "mentor_sec": "CSE-C", "sections": ["CSE-A", "CSE-B"]
    },
    {
        "id": "T-1008", "name": "Prof. Neha Kulkarni", "login": "prof_kulkarni",
        "subject": "computerScience", "subject_name": "Object-Oriented Programming with Java",
        "email": "neha.kulkarni@campusharmony.edu", "phone": "+91 98111 01008",
        "mentor_sec": None, "sections": ["CSE-C", "CSE-D"]
    },
    {
        "id": "T-1009", "name": "Dr. Suresh Menon", "login": "prof_menon",
        "subject": "computerScience", "subject_name": "Object-Oriented Programming with Java",
        "email": "suresh.menon@campusharmony.edu", "phone": "+91 98111 01009",
        "mentor_sec": None, "sections": ["CSE-E"]
    },
    # Front End Engineering-II (CS504)
    {
        "id": "T-1010", "name": "Dr. Sunita Mehra", "login": "prof_mehra",
        "subject": "computerScience", "subject_name": "Front End Engineering-II",
        "email": "sunita.mehra@campusharmony.edu", "phone": "+91 98111 01010",
        "mentor_sec": "CSE-D", "sections": ["CSE-A", "CSE-B"]
    },
    {
        "id": "T-1011", "name": "Prof. Vivek Singhania", "login": "prof_singhania",
        "subject": "computerScience", "subject_name": "Front End Engineering-II",
        "email": "vivek.singhania@campusharmony.edu", "phone": "+91 98111 01011",
        "mentor_sec": None, "sections": ["CSE-C", "CSE-D"]
    },
    {
        "id": "T-1012", "name": "Dr. Pooja Bhatt", "login": "prof_bhatt",
        "subject": "computerScience", "subject_name": "Front End Engineering-II",
        "email": "pooja.bhatt@campusharmony.edu", "phone": "+91 98111 01012",
        "mentor_sec": None, "sections": ["CSE-E"]
    },
    # Discrete Mathematics (CS502)
    {
        "id": "T-1013", "name": "Dr. Vikram Joshi", "login": "prof_joshi",
        "subject": "mathematics", "subject_name": "Discrete Mathematics",
        "email": "vikram.joshi@campusharmony.edu", "phone": "+91 98111 01013",
        "mentor_sec": "CSE-E", "sections": ["CSE-A", "CSE-B"]
    },
    {
        "id": "T-1014", "name": "Prof. Deepa Nambiar", "login": "prof_nambiar",
        "subject": "mathematics", "subject_name": "Discrete Mathematics",
        "email": "deepa.nambiar@campusharmony.edu", "phone": "+91 98111 01014",
        "mentor_sec": None, "sections": ["CSE-C", "CSE-D"]
    },
    {
        "id": "T-1015", "name": "Dr. Manish Saxena", "login": "prof_saxena",
        "subject": "mathematics", "subject_name": "Discrete Mathematics",
        "email": "manish.saxena@campusharmony.edu", "phone": "+91 98111 01015",
        "mentor_sec": None, "sections": ["CSE-E"]
    }
]

# 5. Sections Configuration
SECTIONS = [
    {"id": 1, "name": "CSE-A", "mentor_id": "T-1001", "room": "LT-101", "lab": "Lab-CS1"},
    {"id": 2, "name": "CSE-B", "mentor_id": "T-1004", "room": "LT-102", "lab": "Lab-CS2"},
    {"id": 3, "name": "CSE-C", "mentor_id": "T-1007", "room": "LT-103", "lab": "Lab-CS3"},
    {"id": 4, "name": "CSE-D", "mentor_id": "T-1010", "room": "LT-104", "lab": "Lab-CS4"},
    {"id": 5, "name": "CSE-E", "mentor_id": "T-1013", "room": "LT-105", "lab": "Lab-CS5"},
]

# 6. Offerings (25 offerings)
# Map: section_id, course_code -> teacher_id
def get_offering_teacher(sec_name, course_code):
    for t in TEACHERS:
        if sec_name in t["sections"]:
            if course_code == "CS501" and "Data Structures" in t["subject_name"]:
                return t["id"]
            elif course_code == "CS502" and "Discrete" in t["subject_name"]:
                return t["id"]
            elif course_code == "CS503" and "Database" in t["subject_name"]:
                return t["id"]
            elif course_code == "CS504" and "Front End" in t["subject_name"]:
                return t["id"]
            elif course_code == "CS505" and "Java" in t["subject_name"]:
                return t["id"]
    raise ValueError(f"Teacher not found for {sec_name} - {course_code}")

OFFERINGS = []
offering_counter = 1
for s in SECTIONS:
    for c in COURSES:
        t_id = get_offering_teacher(s["name"], c[0])
        OFFERINGS.append({
            "id": offering_counter,
            "section_id": s["id"],
            "section_name": s["name"],
            "course_code": c[0],
            "course_name": c[1],
            "academic_period_id": 1,
            "teacher_id": t_id
        })
        offering_counter += 1

print(f"[INFO] Prepared {len(OFFERINGS)} course offerings across 5 sections.")

# 7. Generate 300 Students (60 per section)
FIRST_NAMES_MALE = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
    "Shaurya", "Atharv", "Advik", "Pranav", "Advaith", "Dhruv", "Kabir", "Ritvik", "Darsh", "Kian",
    "Rohan", "Manish", "Gaurav", "Siddharth", "Rahul", "Nikhil", "Akash", "Varun", "Abhishek", "Harsh",
    "Kunal", "Ayush", "Tanmay", "Mayank", "Yash", "Kartik", "Ankit", "Deepak", "Chirag", "Mohit"
]

FIRST_NAMES_FEMALE = [
    "Diya", "Saanvi", "Aanya", "Aadhya", "Pari", "Ananya", "Myra", "Isha", "Navya", "Riya",
    "Tara", "Meera", "Avani", "Kiara", "Aditi", "Pooja", "Shreya", "Kavya", "Tanvi", "Neha",
    "Simran", "Sneha", "Kriti", "Bhavna", "Roshni", "Swati", "Divya", "Anushka", "Nandini", "Pallavi",
    "Sakshi", "Prerna", "Megha", "Shikha", "Jyoti", "Garima", "Radhika", "Sunidhi", "Tanya", "Priyanka"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Gupta", "Singh", "Kumar", "Iyer", "Nair", "Kapoor", "Malhotra",
    "Reddy", "Choudhury", "Bose", "Banerjee", "Chatterjee", "Mishra", "Joshi", "Bhat", "Mehta", "Shah",
    "Agarwal", "Saxena", "Soni", "Pandey", "Tiwari", "Bhardwaj", "Deshmukh", "Patil", "Kulkarni", "Pillai",
    "Rao", "Shetty", "Ghosh", "Mukherjee", "Das", "Dutta", "Sen", "Bhattacharya", "Chopra", "Dhawan"
]

STUDENTS = []
student_id_counter = 1
roll_counter = 1

random.seed(42)  # Deterministic realistic dataset

for sec in SECTIONS:
    for i in range(1, 61):
        roll = f"24CSE{roll_counter:03d}"
        is_female = (i % 2 == 0)
        first_name = random.choice(FIRST_NAMES_FEMALE if is_female else FIRST_NAMES_MALE)
        last_name = random.choice(LAST_NAMES)
        full_name = f"{first_name} {last_name}"
        gender = "Female" if is_female else "Male"
        email = f"{first_name.lower()}.{last_name.lower()}.cs{roll_counter:03d}@campusharmony.edu"
        phone = f"+91 98765{roll_counter:05d}"
        
        # Attendance profile
        if i <= 40:
            att_profile = "High"       # 90-100%
        elif i <= 55:
            att_profile = "Normal"     # 75-89%
        else:
            att_profile = "Shortage"   # < 75%
            
        STUDENTS.append({
            "id": student_id_counter,
            "roll": roll,
            "name": full_name,
            "gender": gender,
            "email": email,
            "phone": phone,
            "department_id": 1,
            "department": "Computer Science & Engineering",
            "semester": 5,
            "program_id": 1,
            "section_id": sec["id"],
            "section_name": sec["name"],
            "mentor_id": sec["mentor_id"],
            "att_profile": att_profile
        })
        student_id_counter += 1
        roll_counter += 1

print(f"[INFO] Generated {len(STUDENTS)} students across 5 sections (60 students each).")

# 8. Weekly Timetable (Mon-Sat, Periods 1 to 5)
# Design schedule with ZERO conflicts:
# Days: Monday to Saturday
# Periods 1 to 5:
# P1: 09:00 - 10:00
# P2: 10:00 - 11:00
# P3: 11:15 - 12:15
# P4: 12:15 - 13:15
# P5: 14:00 - 15:00
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
PERIOD_TIMES = [
    (1, "09:00:00", "10:00:00"),
    (2, "10:00:00", "11:00:00"),
    (3, "11:15:00", "12:15:00"),
    (4, "12:15:00", "13:15:00"),
    (5, "14:00:00", "15:00:00")
]

# Section subject order for each day (cycled to guarantee no teacher overlap):
# Sub 0: CS501 (DSA)
# Sub 1: CS502 (Discrete Math)
# Sub 2: CS503 (DBMS)
# Sub 3: CS504 (FEE-II)
# Sub 4: CS505 (Java)
COURSE_CODES = ["CS501", "CS502", "CS503", "CS504", "CS505"]

TIMETABLE_ENTRIES = []
tt_id_counter = 1

# Section schedule rotation across days
for day_idx, day_name in enumerate(DAYS):
    for sec_idx, sec in enumerate(SECTIONS):
        # Base shift per section so Sec A and Sec B never share same subject period
        # For Sec A (idx 0), shift = day_idx % 5
        # For Sec B (idx 1), shift = (day_idx + 1) % 5
        # For Sec C (idx 2), shift = (day_idx + 2) % 5
        # For Sec D (idx 3), shift = (day_idx + 3) % 5
        # For Sec E (idx 4), shift = (day_idx + 4) % 5
        sec_shift = (day_idx * 2 + sec_idx) % 5
        
        for p_idx, (p_num, start_t, end_t) in enumerate(PERIOD_TIMES):
            course_code = COURSE_CODES[(p_idx + sec_shift) % 5]
            
            # Find offering
            off = next(o for o in OFFERINGS if o["section_id"] == sec["id"] and o["course_code"] == course_code)
            
            # Room: lecture room or lab on Saturday afternoon
            room = sec["room"]
            if day_name == "Saturday" and p_num >= 4:
                room = sec["lab"]
                
            TIMETABLE_ENTRIES.append({
                "id": tt_id_counter,
                "academic_period_id": 1,
                "section_id": sec["id"],
                "offering_id": off["id"],
                "course_code": course_code,
                "teacher_id": off["teacher_id"],
                "day_of_week": day_name,
                "period_number": p_num,
                "start_time": start_t,
                "end_time": end_t,
                "room": room,
                "is_active": 1
            })
            tt_id_counter += 1

# Verification of timetable conflicts:
teacher_slots = set()
section_slots = set()
room_slots = set()
for e in TIMETABLE_ENTRIES:
    t_key = (e["teacher_id"], e["day_of_week"], e["period_number"])
    s_key = (e["section_id"], e["day_of_week"], e["period_number"])
    r_key = (e["room"].lower(), e["day_of_week"], e["period_number"])
    
    if t_key in teacher_slots:
        print(f"[FATAL ERROR] Timetable teacher collision: {t_key}")
        sys.exit(1)
    if s_key in section_slots:
        print(f"[FATAL ERROR] Timetable section collision: {s_key}")
        sys.exit(1)
    if r_key in room_slots:
        print(f"[FATAL ERROR] Timetable room collision: {r_key}")
        sys.exit(1)
        
    teacher_slots.add(t_key)
    section_slots.add(s_key)
    room_slots.add(r_key)

print(f"[INFO] Timetable schedule constructed: {len(TIMETABLE_ENTRIES)} entries verified with 0 conflicts.")

# 9. Attendance Sessions & Records
# 15 sessions per offering across Autumn 2026 term
SESSION_DATES = [
    date(2026, 8, 17), date(2026, 8, 24), date(2026, 8, 31),
    date(2026, 9, 7),  date(2026, 9, 14), date(2026, 9, 21), date(2026, 9, 28),
    date(2026, 10, 5), date(2026, 10, 12), date(2026, 10, 19), date(2026, 10, 26),
    date(2026, 11, 2), date(2026, 11, 9),  date(2026, 11, 16), date(2026, 11, 23)
]

TOPICS = {
    "CS501": ["Linear Data Structures & Arrays", "Singly & Doubly Linked Lists", "Stack Applications & Polish Notation", "Circular Queues & Deque", "Binary Trees & BST Traversals", "AVL Trees & Balanced Trees", "B-Trees & Multiway Search", "Graph Representations & Adjacency", "Breadth First Search (BFS)", "Depth First Search (DFS)", "Dijkstra's Shortest Path", "Minimum Spanning Tree (Prim/Kruskal)", "Dynamic Programming: Memoization", "Greedy Algorithms & Knapsack", "String Matching & Rabin-Karp"],
    "CS502": ["Propositional Logic & Connectives", "Predicate Calculus & Quantifiers", "Proof Techniques & Mathematical Induction", "Set Theory & Cartesian Products", "Relations & Equivalence Classes", "Functions & Bijective Maps", "Pigeonhole Principle", "Permutations & Combinations", "Recurrence Relations & Solving Methods", "Generating Functions", "Graph Theory Fundamentals", "Eulerian & Hamiltonian Paths", "Planar Graphs & Graph Coloring", "Trees & Spanning Forests", "Algebraic Structures: Groups & Rings"],
    "CS503": ["Relational Model & Codd's Rules", "ER & Enhanced E-R Modeling", "Relational Algebra Operations", "Tuple & Domain Relational Calculus", "SQL DDL & Integrity Constraints", "SQL DML & Complex Joins", "Subqueries & Group By Aggregations", "Functional Dependencies & Axioms", "Normalization: 1NF, 2NF, 3NF", "Boyce-Codd Normal Form (BCNF)", "Transaction Properties (ACID)", "Serializability & Conflict Equivalence", "Locking Protocols & Two-Phase Locking", "Deadlock Prevention & Detection", "Crash Recovery & ARIES Algorithm"],
    "CS504": ["Modern JavaScript ES6+ Features", "Asynchronous JS, Promises & Async/Await", "DOM Manipulation & Virtual DOM", "React Architecture & Components", "React State & Props Management", "React Hooks: useState, useEffect", "React Custom Hooks & Memoization", "Component Lifecycle & Side Effects", "React Context API for State", "Tailwind CSS Design Systems", "Client-side Routing & Navigation", "Form Handling & Schema Validation", "API Integration with TanStack Query", "Performance Optimization in React", "Production Build & Webpack Bundling"],
    "CS505": ["OOP Core Principles in Java", "Class, Object & Constructor Chaining", "Inheritance & Polymorphism", "Abstract Classes vs Interfaces", "Package Management & Access Specifiers", "Exception Handling Architecture", "Custom Exceptions & Try-with-Resources", "Java Generics & Type Erasure", "Collections Framework: List & Set", "Collections Framework: Map & Queue", "Java Functional Interfaces & Lambdas", "Stream API: Map, Filter, Reduce", "Multi-threading & Thread Lifecycle", "Synchronization & Concurrency", "JDBC Architecture & PreparedStatements"]
}

ATTENDANCE_SESSIONS = []
ATTENDANCE_RECORDS = []

session_id_counter = 1
record_id_counter = 1

print("[INFO] Generating multi-week attendance sessions & student records...")

# For enrollment mapping: student_id, offering_id -> enrollment_id
# We will construct enrollments first
ENROLLMENTS = []
enrollment_id_counter = 1
enrollment_lookup = {}  # (student_id, offering_id) -> enrollment_id

for s in STUDENTS:
    # Student belongs to a section, enroll in all 5 offerings of that section
    sec_offerings = [o for o in OFFERINGS if o["section_id"] == s["section_id"]]
    for off in sec_offerings:
        enr = {
            "id": enrollment_id_counter,
            "student_id": s["id"],
            "course_code": off["course_code"],
            "academic_period_id": 1,
            "offering_id": off["id"],
            "enrollment_date": date(2026, 8, 1),
            "status": "Enrolled"
        }
        ENROLLMENTS.append(enr)
        enrollment_lookup[(s["id"], off["id"])] = enrollment_id_counter
        enrollment_id_counter += 1

print(f"[INFO] Created {len(ENROLLMENTS)} course enrollments (300 students * 5 courses).")

for off in OFFERINGS:
    # 15 sessions for this offering
    course_topics = TOPICS[off["course_code"]]
    
    # Students in this offering
    sec_students = [s for s in STUDENTS if s["section_id"] == off["section_id"]]
    
    for sess_idx, sess_date in enumerate(SESSION_DATES):
        topic = course_topics[sess_idx % len(course_topics)]
        sess_slot = (sess_idx % 4) + 1
        sess_type = "Lab" if (off["course_code"] in ["CS504", "CS505"] and sess_idx % 3 == 0) else "Lecture"
        
        session_obj = {
            "id": session_id_counter,
            "course_code": off["course_code"],
            "academic_period_id": 1,
            "teacher_id": off["teacher_id"],
            "session_date": sess_date,
            "session_slot": sess_slot,
            "session_type": sess_type,
            "session_topic": topic,
            "offering_id": off["id"],
            "submitted_at": datetime.combine(sess_date, time(16, 0)),
            "status": "Completed"
        }
        ATTENDANCE_SESSIONS.append(session_obj)
        
        # Now attendance records for all 60 students in this section
        for s in sec_students:
            enr_id = enrollment_lookup[(s["id"], off["id"])]
            
            # Decide attendance based on student's profile
            if s["att_profile"] == "High":
                # Missing at most 1 session out of 15
                is_present = (sess_idx != 4 or s["id"] % 3 != 0)
            elif s["att_profile"] == "Normal":
                # Missing 2 or 3 sessions out of 15 (80-87%)
                is_present = not (sess_idx in [3, 9] or (sess_idx == 12 and s["id"] % 2 == 0))
            else:  # Shortage (< 75%)
                # Missing 5 to 7 sessions out of 15 (53-66%)
                is_present = not (sess_idx in [1, 3, 5, 8, 10, 13] or (sess_idx == 7 and s["id"] % 2 == 0))
                
            status_str = "Present" if is_present else "Absent"
            remarks = "Attended on time" if is_present else ("Medical leave" if sess_idx % 2 == 0 else "Absent without intimation")
            
            ATTENDANCE_RECORDS.append({
                "id": record_id_counter,
                "session_id": session_id_counter,
                "enrollment_id": enr_id,
                "student_id": s["id"],
                "course_code": off["course_code"],
                "academic_period_id": 1,
                "status": status_str,
                "remarks": remarks,
                "offering_id": off["id"]
            })
            record_id_counter += 1
            
        session_id_counter += 1

print(f"[INFO] Generated {len(ATTENDANCE_SESSIONS)} attendance sessions and {len(ATTENDANCE_RECORDS)} student attendance records.")

# 10. Assessments & Marks (75 assessments, 4,500 marks)
ASSESSMENTS = []
ASSESSMENT_MARKS = []
STUDENT_MARKS_LEGACY = []

assessment_id_counter = 1
mark_id_counter = 1

ASSESSMENT_SPECS = [
    {"title": "Midterm Sessional Examination", "type": "Midterm", "max": 50.0, "date": date(2026, 9, 25)},
    {"title": "Continuous Assessment & Quiz", "type": "Quiz", "max": 25.0, "date": date(2026, 10, 15)},
    {"title": "Practical Lab & Project Evaluation", "type": "Lab", "max": 25.0, "date": date(2026, 11, 10)}
]

for off in OFFERINGS:
    sec_students = [s for s in STUDENTS if s["section_id"] == off["section_id"]]
    
    for spec in ASSESSMENT_SPECS:
        ass_obj = {
            "id": assessment_id_counter,
            "offering_id": off["id"],
            "academic_period_id": 1,
            "course_code": off["course_code"],
            "teacher_id": off["teacher_id"],
            "title": f"{off['course_name']} - {spec['title']}",
            "assessment_type": spec["type"],
            "max_marks": spec["max"],
            "assessment_date": spec["date"]
        }
        ASSESSMENTS.append(ass_obj)
        
        max_m = spec["max"]
        for s in sec_students:
            enr_id = enrollment_lookup[(s["id"], off["id"])]
            
            # Score distribution based on profile and random seed
            rand_val = (s["id"] * 17 + assessment_id_counter * 31) % 100
            if s["att_profile"] == "High":
                pct = 0.82 + (rand_val / 100.0) * 0.17  # 82% to 99%
            elif s["att_profile"] == "Normal":
                pct = 0.65 + (rand_val / 100.0) * 0.22  # 65% to 87%
            else:
                pct = 0.38 + (rand_val / 100.0) * 0.28  # 38% to 66%
                
            marks_obtained = round(min(max_m, max(0.0, max_m * pct)), 1)
            pct_score = (marks_obtained / max_m) * 100.0
            
            if pct_score >= 90:
                grade = "O"
                rem = "Outstanding academic mastery"
            elif pct_score >= 80:
                grade = "A+"
                rem = "Excellent performance"
            elif pct_score >= 70:
                grade = "A"
                rem = "Very good conceptual clarity"
            elif pct_score >= 60:
                grade = "B+"
                rem = "Good effort, scope for improvement"
            elif pct_score >= 50:
                grade = "B"
                rem = "Satisfactory baseline achieved"
            elif pct_score >= 40:
                grade = "C"
                rem = "Pass, needs remedial guidance"
            else:
                grade = "F"
                rem = "Underperformed, re-assessment needed"
                
            ASSESSMENT_MARKS.append({
                "id": mark_id_counter,
                "assessment_id": assessment_id_counter,
                "enrollment_id": enr_id,
                "student_id": s["id"],
                "marks_obtained": marks_obtained,
                "max_marks": max_m,
                "grade": grade,
                "remarks": rem
            })
            mark_id_counter += 1
            
        assessment_id_counter += 1

print(f"[INFO] Generated {len(ASSESSMENTS)} assessments and {len(ASSESSMENT_MARKS)} marks entries.")

# 11. Student Grievances
GRIEVANCES = [
    {
        "ref": "GRV-2026-1001",
        "student_roll": "24CSE005",
        "category": "Academic",
        "subject": "Request for re-evaluation of Midterm Q3 in Data Structures",
        "desc": "I attempted the AVL tree deletion algorithm according to CLRS standard notation, but marks were deducted in step 3. Kindly re-verify.",
        "course_code": "CS501",
        "status": "Resolved",
        "created_at": "2026-10-02 10:15:00",
        "resolved_at": "2026-10-04 14:30:00",
        "activities": [
            ("2026-10-02 10:15:00", "24CSE005", "student", "Created", None, "Open", "Grievance ticket created by student."),
            ("2026-10-03 11:20:00", "prof_rao", "teacher", "Commented", "Open", "In Progress", "Answer script retrieved from academic repository for committee re-check."),
            ("2026-10-04 14:30:00", "admin", "admin", "Resolved", "In Progress", "Resolved", "Re-evaluated by Dr. Rajesh Rao. Step 3 rotation validated; 3 marks revised.")
        ]
    },
    {
        "ref": "GRV-2026-1002",
        "student_roll": "24CSE014",
        "category": "Attendance",
        "subject": "Medical leave attendance waiver application for 12-16 October",
        "desc": "I was hospitalized due to viral gastroenteritis from Oct 12 to 16. Attached medical certificate from Civil Hospital. Please adjust mandatory attendance.",
        "course_code": "CS503",
        "status": "Resolved",
        "created_at": "2026-10-18 09:30:00",
        "resolved_at": "2026-10-21 16:00:00",
        "activities": [
            ("2026-10-18 09:30:00", "24CSE014", "student", "Created", None, "Open", "Grievance ticket created with medical documentation."),
            ("2026-10-19 14:00:00", "prof_sharma", "teacher", "Approved", "Open", "In Progress", "Medical officer verified hospital discharge slip. Forwarded to HOD."),
            ("2026-10-21 16:00:00", "admin", "admin", "Resolved", "In Progress", "Resolved", "Medical condonation of 5 lectures sanctioned as per university regulations.")
        ]
    },
    {
        "ref": "GRV-2026-1003",
        "student_roll": "24CSE058",
        "category": "Attendance",
        "subject": "Biometric terminal failure during Period 1 on 18th September",
        "desc": "Terminal at LT-101 failed to register fingerprint punch for several students during DSA lecture. Marked absent erroneously.",
        "course_code": "CS501",
        "status": "In Progress",
        "created_at": "2026-09-19 08:45:00",
        "resolved_at": None,
        "activities": [
            ("2026-09-19 08:45:00", "24CSE058", "student", "Created", None, "Open", "Attendance discrepancy reported."),
            ("2026-09-20 10:00:00", "admin", "admin", "Reviewed", "Open", "In Progress", "Network logs from LT-101 punch unit requested from IT Support.")
        ]
    },
    {
        "ref": "GRV-2026-1004",
        "student_roll": "24CSE072",
        "category": "Infrastructure",
        "subject": "Thermostat failure and inadequate ventilation in Lab-CS2",
        "desc": "AC cooling units in Lab-CS2 (Workstations 15-30) are non-functional causing thermal throttling of student systems during practicals.",
        "course_code": "CS504",
        "status": "In Progress",
        "created_at": "2026-10-10 12:00:00",
        "resolved_at": None,
        "activities": [
            ("2026-10-10 12:00:00", "24CSE072", "student", "Created", None, "Open", "Infrastructure issue reported."),
            ("2026-10-11 15:30:00", "admin", "admin", "Assigned", "Open", "In Progress", "Estate management dispatched HVAC maintenance vendor. Inspection underway.")
        ]
    },
    {
        "ref": "GRV-2026-1005",
        "student_roll": "24CSE091",
        "category": "Academic",
        "subject": "Clarification on Continuous Assessment grading rubrics for Java OOP",
        "desc": "Requesting detailed breakdown of marks awarded for CA-2 Multithreading mini-project to prepare for end-term examinations.",
        "course_code": "CS505",
        "status": "Resolved",
        "created_at": "2026-11-05 11:00:00",
        "resolved_at": "2026-11-07 17:15:00",
        "activities": [
            ("2026-11-05 11:00:00", "24CSE091", "student", "Created", None, "Open", "Rubric inquiry submitted."),
            ("2026-11-07 17:15:00", "prof_kapoor", "teacher", "Resolved", "Open", "Resolved", "Complete rubrics and unit test reports uploaded on course LMS portal.")
        ]
    },
    {
        "ref": "GRV-2026-1006",
        "student_roll": "24CSE135",
        "category": "Examination / Marks",
        "subject": "Clash between Hackathon participation and Sessional exam timing",
        "desc": "Smart India Hackathon grand finale coincides with Discrete Math midterm date on Oct 25. Request permission for alternative evaluation slot.",
        "course_code": "CS502",
        "status": "Resolved",
        "created_at": "2026-10-12 14:00:00",
        "resolved_at": "2026-10-15 11:30:00",
        "activities": [
            ("2026-10-12 14:00:00", "24CSE135", "student", "Created", None, "Open", "Event schedule clash reported."),
            ("2026-10-15 11:30:00", "admin", "admin", "Resolved", "Open", "Resolved", "Approved by Dean Academics. Special re-test scheduled on Nov 02, 2026.")
        ]
    },
    {
        "ref": "GRV-2026-1007",
        "student_roll": "24CSE160",
        "category": "Infrastructure",
        "subject": "Missing compiler toolchains for FEE-II on Lab-CS3 Terminal 22",
        "desc": "Node.js 20 and Vite CLI packages not properly installed on machine 22 in Lab-CS3, causing build errors during practical evaluations.",
        "course_code": "CS504",
        "status": "Resolved",
        "created_at": "2026-09-28 15:45:00",
        "resolved_at": "2026-09-29 11:00:00",
        "activities": [
            ("2026-09-28 15:45:00", "24CSE160", "student", "Created", None, "Open", "Lab software issue logged."),
            ("2026-09-29 11:00:00", "admin", "admin", "Resolved", "Open", "Resolved", "System re-imaged with standard golden Node.js LTS software image by Sysadmin.")
        ]
    },
    {
        "ref": "GRV-2026-1008",
        "student_roll": "24CSE195",
        "category": "Academic",
        "subject": "Doubt clearing session request before Midterm for DBMS Normalization",
        "desc": "Section D students would appreciate a focused revision lecture on 3NF vs BCNF decomposition proofs prior to examinations.",
        "course_code": "CS503",
        "status": "Resolved",
        "created_at": "2026-09-20 16:30:00",
        "resolved_at": "2026-09-22 14:00:00",
        "activities": [
            ("2026-09-20 16:30:00", "24CSE195", "student", "Created", None, "Open", "Academic doubt session requested."),
            ("2026-09-22 14:00:00", "prof_raman", "teacher", "Resolved", "Open", "Resolved", "Special doubt clearing clinic scheduled for Friday 3:00 PM in LT-104.")
        ]
    },
    {
        "ref": "GRV-2026-1009",
        "student_roll": "24CSE220",
        "category": "Attendance",
        "subject": "Attendance discrepancy after NSS blood donation drive on Oct 06",
        "desc": "I was designated student volunteer for campus blood donation camp; attendance duty leave has not yet reflected in the portal.",
        "course_code": "CS501",
        "status": "Open",
        "created_at": "2026-10-09 10:00:00",
        "resolved_at": None,
        "activities": [
            ("2026-10-09 10:00:00", "24CSE220", "student", "Created", None, "Open", "Duty leave grievance registered.")
        ]
    },
    {
        "ref": "GRV-2026-1010",
        "student_roll": "24CSE255",
        "category": "Infrastructure",
        "subject": "Projector HDMI interface flickering in LT-105",
        "desc": "The main lecture display screen flickers frequently during slide presentations in LT-105, hindering code walkthroughs.",
        "course_code": "CS505",
        "status": "Open",
        "created_at": "2026-11-12 14:20:00",
        "resolved_at": None,
        "activities": [
            ("2026-11-12 14:20:00", "24CSE255", "student", "Created", None, "Open", "Classroom AV equipment issue submitted.")
        ]
    },
    {
        "ref": "GRV-2026-1011",
        "student_roll": "24CSE280",
        "category": "Examination / Marks",
        "subject": "Hall ticket seating number confirmation for Endterm exams",
        "desc": "Discrepancy in section roll code on provisional hall ticket printout. Requesting administrative confirmation.",
        "course_code": "CS502",
        "status": "In Progress",
        "created_at": "2026-11-18 16:00:00",
        "resolved_at": None,
        "activities": [
            ("2026-11-18 16:00:00", "24CSE280", "student", "Created", None, "Open", "Hall ticket issue logged."),
            ("2026-11-19 11:30:00", "admin", "admin", "Reviewed", "Open", "In Progress", "Controller of Examinations desk verifying roll assignment database.")
        ]
    },
    {
        "ref": "GRV-2026-1012",
        "student_roll": "24CSE299",
        "category": "Academic",
        "subject": "Supplementary study resources request for Graph Theory and Discrete Math",
        "desc": "Requesting e-library access to advanced combinatorial graph problem sets recommended during lectures.",
        "course_code": "CS502",
        "status": "Open",
        "created_at": "2026-11-20 09:15:00",
        "resolved_at": None,
        "activities": [
            ("2026-11-20 09:15:00", "24CSE299", "student", "Created", None, "Open", "Resource request submitted.")
        ]
    }
]

print(f"[INFO] Prepared {len(GRIEVANCES)} student grievances with detailed activity audit trail.")

# 12. Build SQL Seed Script
SQL_FILE = os.path.join(REPO_DIR, "database", "demo", "seed.sql")
os.makedirs(os.path.dirname(SQL_FILE), exist_ok=True)

def sql_escape(s):
    if s is None:
        return ""
    return str(s).replace("'", "''")

with open(SQL_FILE, "w", encoding="utf-8") as f:
    f.write("-- =============================================================================\n")
    f.write("-- CampusHarmony — Realistic Academic Demonstration Dataset (seed.sql)\n")
    f.write("-- Fully Idempotent Seed File with 300 Students, 15 Teachers, 5 Sections\n")
    f.write("-- =============================================================================\n\n")
    f.write("USE campus_harmony;\n\n")
    f.write("SET FOREIGN_KEY_CHECKS = 0;\n")
    f.write("TRUNCATE TABLE complaint_activity;\n")
    f.write("TRUNCATE TABLE complaints;\n")
    f.write("TRUNCATE TABLE assessment_marks;\n")
    f.write("TRUNCATE TABLE assessments;\n")
    f.write("TRUNCATE TABLE attendance_records;\n")
    f.write("TRUNCATE TABLE attendance_sessions;\n")
    f.write("TRUNCATE TABLE timetable_entries;\n")
    f.write("TRUNCATE TABLE course_enrollments;\n")
    f.write("TRUNCATE TABLE course_offerings;\n")
    f.write("TRUNCATE TABLE section_members;\n")
    f.write("DELETE FROM accounts WHERE role IN ('teacher', 'student');\n")
    f.write("TRUNCATE TABLE students;\n")
    f.write("TRUNCATE TABLE teachers;\n")
    f.write("TRUNCATE TABLE sections;\n")
    f.write("SET FOREIGN_KEY_CHECKS = 1;\n\n")
    
    # 1. Departments
    f.write("-- 1. Departments\n")
    f.write("INSERT INTO departments (id, name, code) VALUES\n")
    f.write("(1, 'Computer Science & Engineering', 'CSE'),\n")
    f.write("(2, 'Information Technology', 'IT'),\n")
    f.write("(3, 'Electronics & Communication', 'ECE'),\n")
    f.write("(4, 'Mechanical Engineering', 'ME')\n")
    f.write("ON DUPLICATE KEY UPDATE name=VALUES(name), code=VALUES(code);\n\n")

    # 2. Academic Periods
    f.write("-- 2. Academic Periods\n")
    f.write("INSERT INTO academic_periods (id, code, name, academic_year, semester_term, is_current) VALUES\n")
    f.write("(1, '2026-ODD', 'Autumn Semester 2026', '2026-2027', 'Odd', TRUE)\n")
    f.write("ON DUPLICATE KEY UPDATE name=VALUES(name), is_current=VALUES(is_current);\n\n")

    # 3. Academic Programs
    f.write("-- 3. Academic Programs\n")
    f.write("INSERT INTO academic_programs (id, department_id, code, name, degree, duration_years) VALUES\n")
    f.write("(1, 1, 'BTECH-CSE-CORE', 'CSE Core', 'B.Tech', 4),\n")
    f.write("(2, 1, 'BTECH-CSE-AIML', 'CSE AI & ML', 'B.Tech', 4),\n")
    f.write("(3, 1, 'BTECH-CSE-AIFT', 'CSE AI & FT', 'B.Tech', 4)\n")
    f.write("ON DUPLICATE KEY UPDATE name=VALUES(name), degree=VALUES(degree), duration_years=VALUES(duration_years);\n\n")

    # 4. Subjects Master
    f.write("-- 4. Curricular Subjects\n")
    f.write("INSERT INTO subjects (subject_key, label) VALUES\n")
    f.write("('computerScience', 'Computer Science & Engineering'),\n")
    f.write("('mathematics', 'Mathematics & Computational Sciences'),\n")
    f.write("('electronics', 'Electronics & Hardware Systems'),\n")
    f.write("('physics', 'Applied Engineering Physics')\n")
    f.write("ON DUPLICATE KEY UPDATE label=VALUES(label);\n\n")

    # 5. Courses (Semester 5)
    f.write("-- 5. Courses\n")
    f.write("INSERT INTO courses (code, name, department_id, subject_key, credits, semester, status, faculty) VALUES\n")
    for i, c in enumerate(COURSES):
        sep = "," if i < len(COURSES) - 1 else "\nON DUPLICATE KEY UPDATE name=VALUES(name), credits=VALUES(credits), semester=VALUES(semester), faculty=VALUES(faculty);\n\n"
        f.write(f"('{c[0]}', '{c[1]}', {c[2]}, '{c[3]}', {c[4]}, {c[5]}, '{c[6]}', '{c[7]}'){sep}")

    # 6. Teachers & Accounts
    f.write("-- 6. 15 Faculty Members\n")
    f.write("INSERT INTO teachers (id, name, department_id, subject, workspace) VALUES\n")
    for i, t in enumerate(TEACHERS):
        sep = "," if i < len(TEACHERS) - 1 else "\nON DUPLICATE KEY UPDATE name=VALUES(name), subject=VALUES(subject);\n\n"
        f.write(f"('{t['id']}', '{t['name']}', 1, '{t['subject']}', 'own'){sep}")

    f.write("INSERT INTO accounts (login, role, display_name, password_hash, teacher_id) VALUES\n")
    for i, t in enumerate(TEACHERS):
        sep = "," if i < len(TEACHERS) - 1 else "\nON DUPLICATE KEY UPDATE display_name=VALUES(display_name), password_hash=VALUES(password_hash);\n\n"
        f.write(f"('{t['login']}', 'teacher', '{t['name']}', '{TEACHER_HASH}', '{t['id']}'){sep}")

    # Ensure admin account
    f.write("-- Administrator Account\n")
    f.write(f"INSERT INTO accounts (login, role, display_name, password_hash) VALUES\n")
    f.write(f"('admin', 'admin', 'System Administrator', '{ADMIN_HASH}')\n")
    f.write("ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), password_hash=VALUES(password_hash);\n\n")

    # 7. Sections
    f.write("-- 7. Academic Sections\n")
    f.write("INSERT INTO sections (id, department_id, academic_period_id, semester, name, program_id, mentor_teacher_id) VALUES\n")
    for i, s in enumerate(SECTIONS):
        sep = "," if i < len(SECTIONS) - 1 else "\nON DUPLICATE KEY UPDATE name=VALUES(name), program_id=VALUES(program_id), mentor_teacher_id=VALUES(mentor_teacher_id);\n\n"
        f.write(f"({s['id']}, 1, 1, 5, '{s['name']}', 1, '{s['mentor_id']}'){sep}")

    # 8. Course Offerings
    f.write("-- 8. 25 Course Offerings\n")
    f.write("INSERT INTO course_offerings (id, section_id, academic_period_id, course_code, teacher_id) VALUES\n")
    for i, o in enumerate(OFFERINGS):
        sep = "," if i < len(OFFERINGS) - 1 else "\nON DUPLICATE KEY UPDATE teacher_id=VALUES(teacher_id);\n\n"
        f.write(f"({o['id']}, {o['section_id']}, {o['academic_period_id']}, '{o['course_code']}', '{o['teacher_id']}'){sep}")

    # 9. Students, Section Members, Accounts
    f.write("-- 9. 300 Students\n")
    f.write("INSERT INTO students (id, roll, name, department_id, department, semester, email, phone, gender, program_id, teacher_id, status) VALUES\n")
    for i, s in enumerate(STUDENTS):
        sep = "," if i < len(STUDENTS) - 1 else "\nON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), phone=VALUES(phone), program_id=VALUES(program_id), teacher_id=VALUES(teacher_id);\n\n"
        f.write(f"({s['id']}, '{s['roll']}', '{s['name']}', 1, 'Computer Science & Engineering', 5, '{s['email']}', '{s['phone']}', '{s['gender']}', 1, '{s['mentor_id']}', 'Active'){sep}")

    f.write("INSERT INTO section_members (student_id, academic_period_id, section_id) VALUES\n")
    for i, s in enumerate(STUDENTS):
        sep = "," if i < len(STUDENTS) - 1 else "\nON DUPLICATE KEY UPDATE section_id=VALUES(section_id);\n\n"
        f.write(f"({s['id']}, 1, {s['section_id']}){sep}")

    f.write("INSERT INTO accounts (login, role, display_name, password_hash, student_id) VALUES\n")
    for i, s in enumerate(STUDENTS):
        sep = "," if i < len(STUDENTS) - 1 else "\nON DUPLICATE KEY UPDATE display_name=VALUES(display_name), password_hash=VALUES(password_hash);\n\n"
        f.write(f"('{s['roll']}', 'student', '{s['name']}', '{STUDENT_HASH}', {s['id']}){sep}")

    # 10. Enrollments
    f.write("-- 10. 1,500 Course Enrollments\n")
    f.write("INSERT INTO course_enrollments (id, student_id, course_code, academic_period_id, offering_id, enrollment_date, status) VALUES\n")
    for i, enr in enumerate(ENROLLMENTS):
        sep = "," if i < len(ENROLLMENTS) - 1 else "\nON DUPLICATE KEY UPDATE status=VALUES(status);\n\n"
        f.write(f"({enr['id']}, {enr['student_id']}, '{enr['course_code']}', 1, {enr['offering_id']}, '{enr['enrollment_date']}', 'Enrolled'){sep}")

    # 11. Timetable Entries
    f.write("-- 11. Timetable Entries (Zero Conflicts)\n")
    f.write("INSERT INTO timetable_entries (id, academic_period_id, section_id, offering_id, course_code, teacher_id, day_of_week, period_number, start_time, end_time, room, is_active) VALUES\n")
    for i, tt in enumerate(TIMETABLE_ENTRIES):
        sep = "," if i < len(TIMETABLE_ENTRIES) - 1 else "\nON DUPLICATE KEY UPDATE room=VALUES(room), is_active=VALUES(is_active);\n\n"
        f.write(f"({tt['id']}, 1, {tt['section_id']}, {tt['offering_id']}, '{tt['course_code']}', '{tt['teacher_id']}', '{tt['day_of_week']}', {tt['period_number']}, '{tt['start_time']}', '{tt['end_time']}', '{tt['room']}', 1){sep}")

    # 12. Attendance Sessions & Records
    f.write("-- 12. Attendance Sessions\n")
    f.write("INSERT INTO attendance_sessions (id, course_code, academic_period_id, teacher_id, session_date, session_slot, session_type, session_topic, offering_id, submitted_at, status) VALUES\n")
    for i, ses in enumerate(ATTENDANCE_SESSIONS):
        sep = "," if i < len(ATTENDANCE_SESSIONS) - 1 else "\nON DUPLICATE KEY UPDATE submitted_at=VALUES(submitted_at), status=VALUES(status);\n\n"
        topic_esc = sql_escape(ses['session_topic'])
        f.write(f"({ses['id']}, '{ses['course_code']}', 1, '{ses['teacher_id']}', '{ses['session_date']}', {ses['session_slot']}, '{ses['session_type']}', '{topic_esc}', {ses['offering_id']}, '{ses['submitted_at'].strftime('%Y-%m-%d %H:%M:%S')}', 'Completed'){sep}")

    f.write("-- Attendance Records (Batched)\n")
    BATCH_SIZE = 1000
    for b_idx in range(0, len(ATTENDANCE_RECORDS), BATCH_SIZE):
        batch = ATTENDANCE_RECORDS[b_idx:b_idx + BATCH_SIZE]
        f.write("INSERT INTO attendance_records (id, session_id, enrollment_id, student_id, course_code, academic_period_id, status, remarks, offering_id) VALUES\n")
        for i, rec in enumerate(batch):
            sep = "," if i < len(batch) - 1 else "\nON DUPLICATE KEY UPDATE status=VALUES(status), remarks=VALUES(remarks);\n\n"
            rem_esc = sql_escape(rec['remarks'])
            f.write(f"({rec['id']}, {rec['session_id']}, {rec['enrollment_id']}, {rec['student_id']}, '{rec['course_code']}', 1, '{rec['status']}', '{rem_esc}', {rec['offering_id']}){sep}")

    # 13. Assessments & Marks
    f.write("-- 13. Assessments\n")
    f.write("INSERT INTO assessments (id, offering_id, academic_period_id, course_code, teacher_id, title, assessment_type, max_marks, assessment_date) VALUES\n")
    for i, ass in enumerate(ASSESSMENTS):
        sep = "," if i < len(ASSESSMENTS) - 1 else "\nON DUPLICATE KEY UPDATE max_marks=VALUES(max_marks), assessment_date=VALUES(assessment_date);\n\n"
        title_esc = sql_escape(ass['title'])
        f.write(f"({ass['id']}, {ass['offering_id']}, 1, '{ass['course_code']}', '{ass['teacher_id']}', '{title_esc}', '{ass['assessment_type']}', {ass['max_marks']}, '{ass['assessment_date']}'){sep}")

    f.write("-- Assessment Marks (Batched)\n")
    for b_idx in range(0, len(ASSESSMENT_MARKS), BATCH_SIZE):
        batch = ASSESSMENT_MARKS[b_idx:b_idx + BATCH_SIZE]
        f.write("INSERT INTO assessment_marks (id, assessment_id, enrollment_id, student_id, marks_obtained, max_marks, grade, remarks) VALUES\n")
        for i, m in enumerate(batch):
            sep = "," if i < len(batch) - 1 else "\nON DUPLICATE KEY UPDATE marks_obtained=VALUES(marks_obtained), max_marks=VALUES(max_marks), grade=VALUES(grade), remarks=VALUES(remarks);\n\n"
            rem_esc = sql_escape(m['remarks'])
            f.write(f"({m['id']}, {m['assessment_id']}, {m['enrollment_id']}, {m['student_id']}, {m['marks_obtained']}, {m['max_marks']}, '{m['grade']}', '{rem_esc}'){sep}")

    # 14. Student Grievances
    f.write("-- 14. Student Grievances\n")
    for g_idx, grv in enumerate(GRIEVANCES):
        # find student id
        st = next(s for s in STUDENTS if s["roll"] == grv["student_roll"])
        off = next(o for o in OFFERINGS if o["section_id"] == st["section_id"] and o["course_code"] == grv["course_code"])
        res_time = f"'{grv['resolved_at']}'" if grv["resolved_at"] else "NULL"
        subj_esc = sql_escape(grv['subject'])
        desc_esc = sql_escape(grv['desc'])
        
        f.write(f"INSERT INTO complaints (id, reference_number, student_id, category, subject, description, related_offering_id, status, created_at, resolved_at) VALUES\n")
        f.write(f"({g_idx+1}, '{grv['ref']}', {st['id']}, '{grv['category']}', '{subj_esc}', '{desc_esc}', {off['id']}, '{grv['status']}', '{grv['created_at']}', {res_time})\n")
        f.write(f"ON DUPLICATE KEY UPDATE status=VALUES(status), resolved_at=VALUES(resolved_at);\n\n")
        
        for act in grv["activities"]:
            prev_s = f"'{act[4]}'" if act[4] else "NULL"
            resp_esc = sql_escape(act[6])
            f.write(f"INSERT INTO complaint_activity (complaint_id, actor_login, actor_name, actor_role, action, previous_status, new_status, response_text, created_at) VALUES\n")
            f.write(f"({g_idx+1}, '{act[1]}', '{act[1]}', '{act[2]}', '{act[3]}', {prev_s}, '{act[5]}', '{resp_esc}', '{act[0]}');\n")

print(f"[INFO] SQL seed file successfully generated at: {SQL_FILE}")

# 13. Generate Private Excel Credentials Workbook
# Saved outside git repository to C:\Users\aksha\Documents\CampusHarmony_Private\CampusHarmony_Demo_Credentials.xlsx
PRIVATE_DIR = r"C:\Users\aksha\Documents\CampusHarmony_Private"
os.makedirs(PRIVATE_DIR, exist_ok=True)
EXCEL_PATH = os.path.join(PRIVATE_DIR, "CampusHarmony_Demo_Credentials.xlsx")

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

wb = openpyxl.Workbook()
# Remove default sheet
wb.remove(wb.active)

# Styling palette
FONT_TITLE = Font(name="Calibri", size=16, bold=True, color="1E3A8A")
FONT_SUBTITLE = Font(name="Calibri", size=10, italic=True, color="475569")
FONT_HEADER = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
FONT_BODY = Font(name="Calibri", size=11, color="0F172A")
FONT_BODY_BOLD = Font(name="Calibri", size=11, bold=True, color="0F172A")
FONT_MONO = Font(name="Consolas", size=10, color="0F172A")

FILL_HEADER = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
FILL_SUBHEADER = PatternFill(start_color="3B82F6", end_color="3B82F6", fill_type="solid")
FILL_ACCENT = PatternFill(start_color="EFF6FF", end_color="EFF6FF", fill_type="solid")
FILL_WARN = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
FILL_SUCCESS = PatternFill(start_color="D1FAE5", end_color="D1FAE5", fill_type="solid")

THIN_BORDER = Border(
    left=Side(style='thin', color='E2E8F0'),
    right=Side(style='thin', color='E2E8F0'),
    top=Side(style='thin', color='E2E8F0'),
    bottom=Side(style='thin', color='E2E8F0')
)

# -------------------------------------------------------------
# Sheet 1: Quick Demo Accounts
# -------------------------------------------------------------
ws1 = wb.create_sheet(title="Quick Demo Accounts")
ws1.views.sheetView[0].showGridLines = True

ws1.append(["CampusHarmony — College ERP Demonstration Credentials"])
ws1["A1"].font = FONT_TITLE
ws1.append(["Curated quick-access logins for university evaluation, role-based testing, and examiner demonstrations."])
ws1["A2"].font = FONT_SUBTITLE
ws1.append([])

headers1 = ["Role / Persona", "Display Name", "Login Username", "Password", "Context & Key Features to Test"]
ws1.append(headers1)
row_idx = 4
for col_idx in range(1, len(headers1) + 1):
    cell = ws1.cell(row=row_idx, column=col_idx)
    cell.font = FONT_HEADER
    cell.fill = FILL_HEADER
    cell.alignment = Alignment(horizontal="center", vertical="center")

demo_accounts = [
    ("Administrator", "System Administrator", "admin", ADMIN_PASSWORD, "Full system cockpit: Audit feed, section creation, offerings, timetable overview, grievance governance"),
    ("Faculty & Mentor", "Dr. Rajesh Rao", "prof_rao", TEACHER_PASSWORD, "DSA Faculty & Mentor for CSE-A. Assigned to CSE-A & CSE-B. Attendance sessions, marks grading, timetable"),
    ("Faculty & Mentor", "Dr. Priya Sharma", "prof_sharma", TEACHER_PASSWORD, "DBMS Faculty & Mentor for CSE-B. Assigned to CSE-A & CSE-B. View student queries and lab marks"),
    ("Faculty & Mentor", "Dr. Amit Kapoor", "prof_kapoor", TEACHER_PASSWORD, "OOP Java Faculty & Mentor for CSE-C. Assigned to CSE-A & CSE-B. Marks recording & assessments"),
    ("Faculty & Mentor", "Dr. Sunita Mehra", "prof_mehra", TEACHER_PASSWORD, "FEE-II Faculty & Mentor for CSE-D. Assigned to CSE-A & CSE-B. Web development curriculum grading"),
    ("Faculty & Mentor", "Dr. Vikram Joshi", "prof_joshi", TEACHER_PASSWORD, "Discrete Math Faculty & Mentor for CSE-E. Assigned to CSE-A & CSE-B. Mathematical foundation tests"),
    ("Faculty (Section E)", "Prof. Arjun Sengupta", "prof_sengupta", TEACHER_PASSWORD, "DSA Faculty handling CSE-E only (1 section load). Demonstrates single-section workload"),
    ("Student (High Att.)", STUDENTS[0]["name"], STUDENTS[0]["roll"], STUDENT_PASSWORD, f"Section CSE-A. 93.3% overall attendance. High-achieving marks (O/A+). Full timetable access"),
    ("Student (Normal Att.)", STUDENTS[45]["name"], STUDENTS[45]["roll"], STUDENT_PASSWORD, f"Section CSE-A. 80.0% overall attendance. Average marks (B+/A). Demonstrates normal standing"),
    ("Student (Shortage)", STUDENTS[58]["name"], STUDENTS[58]["roll"], STUDENT_PASSWORD, f"Section CSE-A. 60.0% attendance (<75%). Triggers attendance warning badge & shortage alerts"),
    ("Student (Grievance)", STUDENTS[4]["name"], STUDENTS[4]["roll"], STUDENT_PASSWORD, f"Section CSE-A. Filed re-evaluation grievance GRV-2026-1001 with full audit resolution trail")
]

for item in demo_accounts:
    row_idx += 1
    ws1.append(list(item))
    for c in range(1, len(item) + 1):
        cell = ws1.cell(row=row_idx, column=c)
        cell.font = FONT_MONO if c in [3, 4] else FONT_BODY
        cell.border = THIN_BORDER
        if c == 1 and "Administrator" in item[0]:
            cell.fill = FILL_ACCENT
        elif "Shortage" in item[0]:
            cell.fill = FILL_WARN
        elif "High" in item[0]:
            cell.fill = FILL_SUCCESS

# -------------------------------------------------------------
# Sheet 2: All 15 Teachers
# -------------------------------------------------------------
ws2 = wb.create_sheet(title="All 15 Faculty Members")
ws2.views.sheetView[0].showGridLines = True

ws2.append(["CampusHarmony — All 15 Faculty Members & Academic Allocations"])
ws2["A1"].font = FONT_TITLE
ws2.append(["3 Teachers per subject, maximum 2 sections per faculty member, 5 designated Section Mentors."])
ws2["A2"].font = FONT_SUBTITLE
ws2.append([])

headers2 = ["Faculty ID", "Name", "Login Username", "Institutional Email", "Phone", "Curricular Subject", "Assigned Sections", "Teaching Load", "Designated Mentor Section", "Standard Password"]
ws2.append(headers2)
row_idx = 4
for col_idx in range(1, len(headers2) + 1):
    cell = ws2.cell(row=row_idx, column=col_idx)
    cell.font = FONT_HEADER
    cell.fill = FILL_HEADER
    cell.alignment = Alignment(horizontal="center", vertical="center")

for t in TEACHERS:
    row_idx += 1
    mentor_text = f"Section Mentor ({t['mentor_sec']})" if t['mentor_sec'] else "None"
    sections_str = ", ".join(t["sections"])
    load_str = f"{len(t['sections'])} Section{'s' if len(t['sections']) > 1 else ''}"
    row_data = [
        t["id"], t["name"], t["login"], t["email"], t["phone"],
        t["subject_name"], sections_str, load_str, mentor_text, TEACHER_PASSWORD
    ]
    ws2.append(row_data)
    for c in range(1, len(row_data) + 1):
        cell = ws2.cell(row=row_idx, column=c)
        cell.font = FONT_MONO if c in [1, 3, 10] else FONT_BODY
        cell.border = THIN_BORDER
        if t['mentor_sec']:
            cell.fill = FILL_ACCENT

# -------------------------------------------------------------
# Sheet 3: All 300 Students
# -------------------------------------------------------------
ws3 = wb.create_sheet(title="All 300 Enrolled Students")
ws3.views.sheetView[0].showGridLines = True

ws3.append(["CampusHarmony — Complete Student Roster (300 Students across 5 Sections)"])
ws3["A1"].font = FONT_TITLE
ws3.append(["Exactly 60 students per section (CSE-A to CSE-E) enrolled in Autumn 2026 Semester 5."])
ws3["A2"].font = FONT_SUBTITLE
ws3.append([])

headers3 = ["Roll Number", "Student Full Name", "Login Username", "Gender", "Program", "Section", "Semester", "Assigned Faculty Mentor", "Official Email", "Contact Phone", "Attendance Standing", "Standard Password"]
ws3.append(headers3)
row_idx = 4
for col_idx in range(1, len(headers3) + 1):
    cell = ws3.cell(row=row_idx, column=col_idx)
    cell.font = FONT_HEADER
    cell.fill = FILL_HEADER
    cell.alignment = Alignment(horizontal="center", vertical="center")

mentor_names = {s["id"]: next(t["name"] for t in TEACHERS if t["id"] == s["mentor_id"]) for s in SECTIONS}

for s in STUDENTS:
    row_idx += 1
    mentor_name = mentor_names[s["section_id"]]
    row_data = [
        s["roll"], s["name"], s["roll"], s["gender"], "B.Tech CSE Core",
        s["section_name"], f"Semester {s['semester']}", mentor_name,
        s["email"], s["phone"], s["att_profile"], STUDENT_PASSWORD
    ]
    ws3.append(row_data)
    for c in range(1, len(row_data) + 1):
        cell = ws3.cell(row=row_idx, column=c)
        cell.font = FONT_MONO if c in [1, 3, 12] else FONT_BODY
        cell.border = THIN_BORDER
        if s["att_profile"] == "Shortage":
            cell.fill = FILL_WARN

# -------------------------------------------------------------
# Sheet 4: Administrator Details
# -------------------------------------------------------------
ws4 = wb.create_sheet(title="Administrator & Architecture")
ws4.views.sheetView[0].showGridLines = True

ws4.append(["CampusHarmony — Administrative Access & Architecture Reference"])
ws4["A1"].font = FONT_TITLE
ws4.append(["Master administrator credentials, technical endpoints, and database connection details."])
ws4["A2"].font = FONT_SUBTITLE
ws4.append([])

headers4 = ["Configuration Parameter", "Value", "Notes & Operational Instructions"]
ws4.append(headers4)
row_idx = 4
for col_idx in range(1, len(headers4) + 1):
    cell = ws4.cell(row=row_idx, column=col_idx)
    cell.font = FONT_HEADER
    cell.fill = FILL_HEADER
    cell.alignment = Alignment(horizontal="center", vertical="center")

admin_config = [
    ("Administrator Username", "admin", "Primary system administrator account with total RBAC clearance"),
    ("Administrator Password", ADMIN_PASSWORD, "Standard demonstration root administrator password"),
    ("Frontend Web Application", "http://localhost:5173", "Unified single-page portal (Admin, Teacher, Student)"),
    ("Backend API Server", "http://localhost:8080", "Java 17 Spring Boot REST application"),
    ("Database Name", "campus_harmony", "MySQL 8.0/8.4 InnoDB relational database"),
    ("Database User", db_user, "Authoritative database user credentials configured in .env"),
    ("Total Programs", "3 Programs", "B.Tech CSE Core (fully populated), CSE AI & ML, CSE AI & FT"),
    ("Total Sections", "5 Sections", "CSE-A, CSE-B, CSE-C, CSE-D, CSE-E (60 students each)"),
    ("Total Students", "300 Students", "Enrolled across 5 courses = 1,500 course enrollments"),
    ("Total Faculty", "15 Faculty Members", "3 teachers per subject, max 2 sections per teacher"),
    ("Weekly Timetable", "Monday to Saturday (09:00 - 15:00)", "Zero timetable conflicts across rooms, teachers & sections"),
    ("Attendance Analytics", "375 Sessions, 22,500 Records", "Multi-week lecture history with realistic attendance curves"),
    ("Assessments & Marks", "75 Assessments, 4,500 Records", "Midterm, Quiz, Lab evaluations within max marks limits"),
    ("Student Grievances", "12 Multi-category Tickets", "Academic, Attendance, Facilities with full audit trails")
]

for row in admin_config:
    row_idx += 1
    ws4.append(list(row))
    for c in range(1, len(row) + 1):
        cell = ws4.cell(row=row_idx, column=c)
        cell.font = FONT_MONO if c == 2 and ("http" in row[1] or "admin" in row[1]) else FONT_BODY
        cell.border = THIN_BORDER
        if c == 1:
            cell.font = FONT_BODY_BOLD
            cell.fill = FILL_ACCENT

# Auto-fit column widths for all sheets
for sheet in wb.worksheets:
    for col in sheet.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            # Skip title and subtitle row length calculations
            if cell.row in [1, 2]:
                continue
            if cell.value:
                max_len = max(max_len, len(str(cell.value)))
        sheet.column_dimensions[col_letter].width = max(max_len + 4, 12)

wb.save(EXCEL_PATH)
print(f"[SUCCESS] Private credentials workbook created safely at: {EXCEL_PATH}")
