-- =============================================================================
-- CAMPUS HARMONY — PRODUCTION SEED DATA (VERSION 5.0)
-- Matches evaluated frontend datasets & seeds normalized relational structures
-- Target DBMS: MySQL Server 8.0+
-- =============================================================================

USE campus_harmony;

-- Disable FK checks during initial batch insert
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Departments
INSERT INTO departments (id, name, code) VALUES
(1, 'Computer Science', 'CS'),
(2, 'Information Technology', 'IT'),
(3, 'Electronics', 'EC'),
(4, 'Mechanical', 'ME'),
(5, 'Civil', 'CV')
ON DUPLICATE KEY UPDATE name=VALUES(name), code=VALUES(code);

-- 2. Curricular Subjects
INSERT INTO subjects (subject_key, label) VALUES
('mathematics', 'Mathematics'),
('physics', 'Physics'),
('chemistry', 'Chemistry'),
('english', 'English'),
('computerScience', 'Computer Science')
ON DUPLICATE KEY UPDATE label=VALUES(label);

-- 3. Academic Periods
INSERT INTO academic_periods (id, code, name, academic_year, semester_term, is_current) VALUES
(1, '2026-ODD', 'Autumn Semester 2026', '2026-2027', 'Odd', TRUE),
(2, '2026-EVEN', 'Spring Semester 2026', '2025-2026', 'Even', FALSE),
(3, '2025-ODD', 'Autumn Semester 2025', '2025-2026', 'Odd', FALSE)
ON DUPLICATE KEY UPDATE name=VALUES(name), is_current=VALUES(is_current);

-- 4. Teachers
INSERT INTO teachers (id, name, department_id, subject, workspace) VALUES
('T-1001', 'Dr. Sudha Rao', 1, 'computerScience', 'demo'),
('T-1002', 'Prof. Anil Kapoor', 1, 'computerScience', 'demo'),
('T-1003', 'Dr. Neha Bansal', 2, 'computerScience', 'demo'),
('T-1004', 'Prof. Rajeev Menon', 2, 'computerScience', 'demo'),
('T-1005', 'Dr. Kiran Shetty', 3, 'physics', 'demo'),
('T-1006', 'Prof. Manoj Tiwari', 3, 'physics', 'demo'),
('T-1007', 'Dr. Vandana Pillai', 4, 'mathematics', 'demo'),
('T-1008', 'Prof. Deepak Sinha', 4, 'chemistry', 'demo'),
('T-1009', 'Dr. Farhan Ali', 5, 'mathematics', 'demo'),
('T-1010', 'Prof. Meera Nambiar', 1, 'english', 'demo')
ON DUPLICATE KEY UPDATE name=VALUES(name), department_id=VALUES(department_id), subject=VALUES(subject);

-- 5. Students (20 Evaluated Demo Students)
INSERT INTO students (id, roll, name, department_id, department, semester, email, phone, status, gender, address, teacher_id) VALUES
(101, 'CS-2101', 'Rahul Sharma', 1, 'Computer Science', 5, 'rahul.sharma@college.edu', '9876543210', 'Active', 'Male', '12 Nehru Road, Pune', NULL),
(102, 'CS-2102', 'Ananya Iyer', 1, 'Computer Science', 5, 'ananya.iyer@college.edu', '9812345678', 'Active', 'Female', '44 MG Road, Bengaluru', NULL),
(103, 'IT-2103', 'Mohammed Faiz', 2, 'Information Technology', 3, 'm.faiz@college.edu', '9765432109', 'Active', 'Male', '7 Charminar Lane, Hyderabad', NULL),
(104, 'EC-2104', 'Sneha Kulkarni', 3, 'Electronics', 7, 'sneha.k@college.edu', '9898989898', 'Active', 'Female', '9 FC Road, Pune', NULL),
(105, 'ME-2105', 'Arjun Nair', 4, 'Mechanical', 1, 'arjun.nair@college.edu', '9700112233', 'Probation', 'Male', '21 Marine Drive, Kochi', NULL),
(106, 'CV-2106', 'Priya Deshmukh', 5, 'Civil', 5, 'priya.d@college.edu', '9600445566', 'Active', 'Female', '3 Shivaji Nagar, Nagpur', NULL),
(107, 'CS-2107', 'Vikram Chauhan', 1, 'Computer Science', 3, 'vikram.c@college.edu', '9555778899', 'Active', 'Male', '56 Civil Lines, Jaipur', NULL),
(108, 'IT-2108', 'Meera Joshi', 2, 'Information Technology', 7, 'meera.joshi@college.edu', '9445566778', 'Active', 'Female', '18 Lake View, Bhopal', NULL),
(109, 'EC-2109', 'Rohan Bhatt', 3, 'Electronics', 5, 'rohan.bhatt@college.edu', '9334455667', 'Probation', 'Male', '77 Ring Road, Surat', NULL),
(110, 'ME-2110', 'Kavya Menon', 4, 'Mechanical', 3, 'kavya.menon@college.edu', '9223344556', 'Active', 'Female', '5 Temple Street, Thrissur', NULL),
(111, 'CV-2111', 'Aditya Rane', 5, 'Civil', 1, 'aditya.rane@college.edu', '9112233445', 'Active', 'Male', '31 Hill Road, Mumbai', NULL),
(112, 'CS-2112', 'Nisha Verma', 1, 'Computer Science', 7, 'nisha.verma@college.edu', '9001122334', 'Active', 'Female', '2 Park Avenue, Delhi', NULL),
(113, 'IT-2113', 'Sameer Qureshi', 2, 'Information Technology', 5, 'sameer.q@college.edu', '9987654321', 'Active', 'Male', '64 Station Road, Lucknow', NULL),
(114, 'EC-2114', 'Divya Raghavan', 3, 'Electronics', 1, 'divya.r@college.edu', '9876501234', 'Active', 'Female', '8 Anna Salai, Chennai', NULL),
(115, 'ME-2115', 'Karan Gill', 4, 'Mechanical', 7, 'karan.gill@college.edu', '9765012345', 'Active', 'Male', '12 Mall Road, Amritsar', NULL),
(116, 'CV-2116', 'Ishita Bose', 5, 'Civil', 3, 'ishita.bose@college.edu', '9654123456', 'Active', 'Female', '40 Salt Lake, Kolkata', NULL),
(117, 'CS-2117', 'Yash Patel', 1, 'Computer Science', 1, 'yash.patel@college.edu', '9543210987', 'Probation', 'Male', '15 CG Road, Ahmedabad', NULL),
(118, 'IT-2118', 'Tanvi Hegde', 2, 'Information Technology', 5, 'tanvi.h@college.edu', '9432109876', 'Active', 'Female', '22 Brigade Road, Bengaluru', NULL),
(119, 'EC-2119', 'Aman Saxena', 3, 'Electronics', 3, 'aman.saxena@college.edu', '9321098765', 'Active', 'Male', '11 Taj Road, Agra', NULL),
(120, 'ME-2120', 'Ritu Choudhary', 4, 'Mechanical', 5, 'ritu.c@college.edu', '9210987654', 'Active', 'Female', '88 Sector 17, Chandigarh', NULL)
ON DUPLICATE KEY UPDATE name=VALUES(name), department_id=VALUES(department_id), department=VALUES(department);

-- 6. Courses
INSERT INTO courses (code, name, department_id, subject_key, credits, semester, status, teacher_id, faculty) VALUES
('CS501', 'Operating Systems', 1, 'computerScience', 4, 5, 'Ongoing', 'T-1001', 'Dr. Sudha Rao'),
('CS502', 'Computer Networks', 1, 'computerScience', 4, 5, 'Ongoing', 'T-1002', 'Prof. Anil Kapoor'),
('IT301', 'Database Management Systems', 2, 'computerScience', 3, 3, 'Ongoing', 'T-1003', 'Dr. Neha Bansal'),
('IT302', 'Web Technologies', 2, 'computerScience', 3, 3, 'Ongoing', 'T-1004', 'Prof. Rajeev Menon'),
('EC701', 'VLSI Design', 3, 'physics', 4, 7, 'Ongoing', 'T-1005', 'Dr. Kiran Shetty'),
('EC702', 'Embedded Systems', 3, 'physics', 3, 7, 'Completed', 'T-1006', 'Prof. Manoj Tiwari'),
('ME101', 'Engineering Mechanics', 4, 'mathematics', 4, 1, 'Ongoing', 'T-1007', 'Dr. Vandana Pillai'),
('ME102', 'Thermodynamics', 4, 'chemistry', 4, 1, 'Upcoming', 'T-1008', 'Prof. Deepak Sinha'),
('CV305', 'Structural Analysis', 5, 'mathematics', 4, 3, 'Ongoing', 'T-1009', 'Dr. Farhan Ali'),
('CS503', 'Machine Learning Basics', 1, 'computerScience', 3, 5, 'Upcoming', 'T-1001', 'Dr. Sudha Rao'),
('EN101', 'Technical Communication', 1, 'english', 2, 1, 'Ongoing', 'T-1010', 'Prof. Meera Nambiar')
ON DUPLICATE KEY UPDATE name=VALUES(name), faculty=VALUES(faculty);

-- 7. Course Enrollments (Linking Students to Relevant Semester Courses)
INSERT INTO course_enrollments (id, student_id, course_code, academic_period_id, enrollment_date, status) VALUES
(1, 101, 'CS501', 1, '2026-07-01', 'Enrolled'),
(2, 101, 'CS502', 1, '2026-07-01', 'Enrolled'),
(3, 102, 'CS501', 1, '2026-07-01', 'Enrolled'),
(4, 102, 'CS502', 1, '2026-07-01', 'Enrolled'),
(5, 103, 'IT301', 1, '2026-07-01', 'Enrolled'),
(6, 103, 'IT302', 1, '2026-07-01', 'Enrolled'),
(7, 107, 'CS501', 1, '2026-07-01', 'Enrolled'),
(8, 107, 'IT301', 1, '2026-07-01', 'Enrolled'),
(9, 109, 'EC701', 1, '2026-07-01', 'Enrolled'),
(10, 117, 'ME101', 1, '2026-07-01', 'Enrolled')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 8. Attendance Sessions
INSERT INTO attendance_sessions (id, course_code, academic_period_id, teacher_id, session_date, session_slot, session_type, session_topic) VALUES
(1, 'CS501', 1, 'T-1001', '2026-07-02', 1, 'Lecture', 'Process Scheduling Algorithms'),
(2, 'CS501', 1, 'T-1001', '2026-07-09', 1, 'Lecture', 'Inter-process Communication & Shared Memory'),
(3, 'CS502', 1, 'T-1002', '2026-07-03', 2, 'Lecture', 'OSI Reference Model & TCP/IP Protocol Suite'),
(4, 'IT301', 1, 'T-1003', '2026-07-04', 1, 'Lecture', 'Relational Algebra & Normalization (1NF..BCNF)'),
(5, 'IT301', 1, 'T-1003', '2026-07-11', 2, 'Lab', 'Hands-on MySQL DDL & DML Integrity Constraints')
ON DUPLICATE KEY UPDATE session_topic=VALUES(session_topic);

-- 9. Attendance Records (Sample event-level dated marks)
INSERT INTO attendance_records (id, session_id, enrollment_id, student_id, course_code, academic_period_id, status, remarks) VALUES
(1, 1, 1, 101, 'CS501', 1, 'Present', 'Attended morning lecture'),
(2, 2, 1, 101, 'CS501', 1, 'Present', 'Participated in discussion'),
(3, 1, 3, 102, 'CS501', 1, 'Present', 'Attended'),
(4, 2, 3, 102, 'CS501', 1, 'Present', 'Attended'),
(5, 4, 5, 103, 'IT301', 1, 'Present', 'Attended lecture'),
(6, 5, 5, 103, 'IT301', 1, 'Absent', 'Unexcused medical absence')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 10. Attendance Summary Cache (Preserving historical evaluated counters for all 20 students)
INSERT INTO attendance (id, student_id, total_days, present_days, absent_days, last_marked) VALUES
(1, 101, 120, 110, 10, '2026-07-02'),
(2, 102, 120, 115, 5, '2026-07-03'),
(3, 103, 120, 97, 23, '2026-07-04'),
(4, 104, 120, 89, 31, '2026-07-05'),
(5, 105, 120, 82, 38, '2026-07-06'),
(6, 106, 120, 106, 14, '2026-07-07'),
(7, 107, 120, 95, 25, '2026-07-08'),
(8, 108, 120, 113, 7, '2026-07-09'),
(9, 109, 120, 74, 46, '2026-07-10'),
(10, 110, 120, 108, 12, '2026-07-11'),
(11, 111, 120, 102, 18, '2026-07-12'),
(12, 112, 120, 118, 2, '2026-07-13'),
(13, 113, 120, 85, 35, '2026-07-14'),
(14, 114, 120, 100, 20, '2026-07-15'),
(15, 115, 120, 92, 28, '2026-07-16'),
(16, 116, 120, 107, 13, '2026-07-17'),
(17, 117, 120, 49, 71, '2026-07-18'),
(18, 118, 120, 108, 12, '2026-07-19'),
(19, 119, 120, 95, 25, '2026-07-20'),
(20, 120, 120, 101, 19, '2026-07-21')
ON DUPLICATE KEY UPDATE total_days=VALUES(total_days), present_days=VALUES(present_days), absent_days=VALUES(absent_days);

-- 11. Student Marks (Normalized Subject-Level Evaluations)
INSERT INTO student_marks (student_id, subject_key, academic_period_id, semester, exam_type, marks_obtained, max_marks, grade, remarks) VALUES
(101, 'mathematics', 1, 5, 'Endterm', 85.00, 100.00, 'A', 'Strong analytical performance'),
(101, 'physics', 1, 5, 'Endterm', 78.00, 100.00, 'B', 'Good lab work'),
(101, 'chemistry', 1, 5, 'Endterm', 92.00, 100.00, 'A+', 'Outstanding theoretical depth'),
(101, 'english', 1, 5, 'Endterm', 88.00, 100.00, 'A', 'Effective presentation'),
(101, 'computerScience', 1, 5, 'Endterm', 95.00, 100.00, 'A+', 'Top of the class'),
(102, 'mathematics', 1, 5, 'Endterm', 90.00, 100.00, 'A+', 'Excellent'),
(102, 'physics', 1, 5, 'Endterm', 86.00, 100.00, 'A', 'Great performance'),
(102, 'chemistry', 1, 5, 'Endterm', 89.00, 100.00, 'A', 'Consistent work'),
(102, 'english', 1, 5, 'Endterm', 94.00, 100.00, 'A+', 'Exceptional writing'),
(102, 'computerScience', 1, 5, 'Endterm', 92.00, 100.00, 'A+', 'Outstanding code design')
ON DUPLICATE KEY UPDATE marks_obtained=VALUES(marks_obtained), grade=VALUES(grade);

-- 12. Marks (Physical 5-Subject Summary Table for Evaluated Spring Boot JPA)
INSERT INTO marks (id, student_id, mathematics, physics, chemistry, english, computer_science) VALUES
(1, 101, 85, 78, 92, 88, 95),
(2, 102, 90, 86, 89, 94, 92),
(3, 103, 72, 68, 74, 80, 85),
(4, 104, 88, 91, 84, 86, 90),
(5, 105, 54, 48, 62, 58, 55),
(6, 106, 76, 82, 79, 85, 80),
(7, 107, 65, 70, 68, 72, 75),
(8, 108, 92, 89, 95, 90, 94),
(9, 109, 45, 52, 48, 55, 50),
(10, 110, 81, 75, 83, 79, 88),
(11, 111, 70, 72, 69, 74, 71),
(12, 112, 95, 94, 92, 96, 98),
(13, 113, 62, 58, 65, 70, 68),
(14, 114, 84, 80, 82, 88, 85),
(15, 115, 78, 74, 76, 82, 80),
(16, 116, 83, 85, 80, 87, 84),
(17, 117, 40, 42, 38, 50, 45),
(18, 118, 89, 86, 91, 88, 92),
(19, 119, 73, 76, 71, 78, 75),
(20, 120, 80, 78, 82, 84, 81)
ON DUPLICATE KEY UPDATE mathematics=VALUES(mathematics), physics=VALUES(physics);

-- 13. Activities Feed
INSERT INTO activities (id, text, type, teacher_id, created_at) VALUES
(1, 'End-semester practical examination timetable published.', 'notice', 'T-1001', '2026-07-01 10:00:00'),
(2, 'Attendance registers updated for Semester V Computer Science.', 'attendance', 'T-1001', '2026-07-02 11:30:00'),
(3, 'Midterm evaluation scores posted for Operating Systems.', 'grade', 'T-1001', '2026-07-03 14:15:00'),
(4, 'Library book return deadline announced for Semester VII students.', 'notice', NULL, '2026-07-04 09:00:00'),
(5, 'Campus Placement Orientation scheduled for final year students.', 'notice', 'T-1002', '2026-07-05 16:00:00'),
(6, 'System maintenance completed; student ERP online.', 'system', NULL, '2026-07-06 08:00:00')
ON DUPLICATE KEY UPDATE text=VALUES(text);

SET FOREIGN_KEY_CHECKS = 1;
