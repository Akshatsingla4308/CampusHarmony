-- =============================================================================
-- Seed Data for Campus Harmony / Sunrise Institute Student ERP
-- Technology: MySQL 8.0+
-- Matches original frontend datasets exactly so existing UI looks identical.
-- =============================================================================

USE campus_harmony;

-- 1. Insert Departments
INSERT INTO departments (id, name, code) VALUES
(1, 'Computer Science', 'CS'),
(2, 'Information Technology', 'IT'),
(3, 'Electronics', 'EC'),
(4, 'Mechanical', 'ME'),
(5, 'Civil', 'CV')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert Subjects
INSERT INTO subjects (subject_key, label) VALUES
('mathematics', 'Mathematics'),
('physics', 'Physics'),
('chemistry', 'Chemistry'),
('english', 'English'),
('computerScience', 'Computer Science')
ON DUPLICATE KEY UPDATE label=VALUES(label);

-- 3. Insert Built-in Teachers
INSERT INTO teachers (id, name, subject, workspace) VALUES
('T-1001', 'Dr. Sudha Rao', 'computerScience', 'demo'),
('T-1002', 'Prof. Anil Kapoor', 'computerScience', 'demo'),
('T-1003', 'Dr. Neha Bansal', 'computerScience', 'demo'),
('T-1004', 'Prof. Rajeev Menon', 'computerScience', 'demo'),
('T-1005', 'Dr. Kiran Shetty', 'physics', 'demo'),
('T-1006', 'Prof. Manoj Tiwari', 'physics', 'demo'),
('T-1007', 'Dr. Vandana Pillai', 'mathematics', 'demo'),
('T-1008', 'Prof. Deepak Sinha', 'chemistry', 'demo'),
('T-1009', 'Dr. Farhan Ali', 'mathematics', 'demo'),
('T-1010', 'Prof. Meera Nambiar', 'english', 'demo')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Insert Students (20 demo students)
INSERT INTO students (id, roll, name, department, semester, email, phone, status, gender, address, teacher_id) VALUES
(101, 'CS-2101', 'Rahul Sharma', 'Computer Science', 5, 'rahul.sharma@college.edu', '9876543210', 'Active', 'Male', '12 Nehru Road, Pune', NULL),
(102, 'CS-2102', 'Ananya Iyer', 'Computer Science', 5, 'ananya.iyer@college.edu', '9812345678', 'Active', 'Female', '44 MG Road, Bengaluru', NULL),
(103, 'IT-2103', 'Mohammed Faiz', 'Information Technology', 3, 'm.faiz@college.edu', '9765432109', 'Active', 'Male', '7 Charminar Lane, Hyderabad', NULL),
(104, 'EC-2104', 'Sneha Kulkarni', 'Electronics', 7, 'sneha.k@college.edu', '9898989898', 'Active', 'Female', '9 FC Road, Pune', NULL),
(105, 'ME-2105', 'Arjun Nair', 'Mechanical', 1, 'arjun.nair@college.edu', '9700112233', 'Probation', 'Male', '21 Marine Drive, Kochi', NULL),
(106, 'CV-2106', 'Priya Deshmukh', 'Civil', 5, 'priya.d@college.edu', '9600445566', 'Active', 'Female', '3 Shivaji Nagar, Nagpur', NULL),
(107, 'CS-2107', 'Vikram Chauhan', 'Computer Science', 3, 'vikram.c@college.edu', '9555778899', 'Active', 'Male', '56 Civil Lines, Jaipur', NULL),
(108, 'IT-2108', 'Meera Joshi', 'Information Technology', 7, 'meera.joshi@college.edu', '9445566778', 'Active', 'Female', '18 Lake View, Bhopal', NULL),
(109, 'EC-2109', 'Rohan Bhatt', 'Electronics', 5, 'rohan.bhatt@college.edu', '9334455667', 'Probation', 'Male', '77 Ring Road, Surat', NULL),
(110, 'ME-2110', 'Kavya Menon', 'Mechanical', 3, 'kavya.menon@college.edu', '9223344556', 'Active', 'Female', '5 Temple Street, Thrissur', NULL),
(111, 'CV-2111', 'Aditya Rane', 'Civil', 1, 'aditya.rane@college.edu', '9112233445', 'Active', 'Male', '31 Hill Road, Mumbai', NULL),
(112, 'CS-2112', 'Nisha Verma', 'Computer Science', 7, 'nisha.verma@college.edu', '9001122334', 'Active', 'Female', '2 Park Avenue, Delhi', NULL),
(113, 'IT-2113', 'Sameer Qureshi', 'Information Technology', 5, 'sameer.q@college.edu', '9987654321', 'Active', 'Male', '64 Station Road, Lucknow', NULL),
(114, 'EC-2114', 'Divya Raghavan', 'Electronics', 1, 'divya.r@college.edu', '9876501234', 'Active', 'Female', '8 Anna Salai, Chennai', NULL),
(115, 'ME-2115', 'Karan Gill', 'Mechanical', 7, 'karan.gill@college.edu', '9765012345', 'Active', 'Male', '12 Mall Road, Amritsar', NULL),
(116, 'CV-2116', 'Ishita Bose', 'Civil', 3, 'ishita.bose@college.edu', '9654123456', 'Active', 'Female', '40 Salt Lake, Kolkata', NULL),
(117, 'CS-2117', 'Yash Patel', 'Computer Science', 1, 'yash.patel@college.edu', '9543210987', 'Probation', 'Male', '15 CG Road, Ahmedabad', NULL),
(118, 'IT-2118', 'Tanvi Hegde', 'Information Technology', 5, 'tanvi.h@college.edu', '9432109876', 'Active', 'Female', '22 Brigade Road, Bengaluru', NULL),
(119, 'EC-2119', 'Aman Saxena', 'Electronics', 3, 'aman.saxena@college.edu', '9321098765', 'Active', 'Male', '11 Taj Road, Agra', NULL),
(120, 'ME-2120', 'Ritu Choudhary', 'Mechanical', 5, 'ritu.c@college.edu', '9210987654', 'Active', 'Female', '88 Sector 17, Chandigarh', NULL)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 5. Insert Courses
INSERT INTO courses (code, name, faculty, credits, semester, status, teacher_id) VALUES
('CS501', 'Operating Systems', 'Dr. Sudha Rao', 4, 5, 'Ongoing', NULL),
('CS502', 'Computer Networks', 'Prof. Anil Kapoor', 4, 5, 'Ongoing', NULL),
('IT301', 'Database Management Systems', 'Dr. Neha Bansal', 3, 3, 'Ongoing', NULL),
('IT302', 'Web Technologies', 'Prof. Rajeev Menon', 3, 3, 'Ongoing', NULL),
('EC701', 'VLSI Design', 'Dr. Kiran Shetty', 4, 7, 'Ongoing', NULL),
('EC702', 'Embedded Systems', 'Prof. Manoj Tiwari', 3, 7, 'Completed', NULL),
('ME101', 'Engineering Mechanics', 'Dr. Vandana Pillai', 4, 1, 'Ongoing', NULL),
('ME102', 'Thermodynamics', 'Prof. Deepak Sinha', 4, 1, 'Upcoming', NULL),
('CV305', 'Structural Analysis', 'Dr. Farhan Ali', 4, 3, 'Ongoing', NULL),
('CS503', 'Machine Learning Basics', 'Dr. Sudha Rao', 3, 5, 'Upcoming', NULL),
('EN101', 'Technical Communication', 'Prof. Meera Nambiar', 2, 1, 'Ongoing', NULL)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 6. Insert Attendance Records (linked to Student IDs)
INSERT INTO attendance (student_id, total_days, present_days, absent_days, last_marked) VALUES
(101, 120, 110, 10, '2026-07-02'),
(102, 120, 115, 5, '2026-07-03'),
(103, 120, 97, 23, '2026-07-04'),
(104, 120, 89, 31, '2026-07-05'),
(105, 120, 82, 38, '2026-07-06'),
(106, 120, 106, 14, '2026-07-07'),
(107, 120, 95, 25, '2026-07-08'),
(108, 120, 113, 7, '2026-07-09'),
(109, 120, 74, 46, '2026-07-10'),
(110, 120, 108, 12, '2026-07-11'),
(111, 120, 102, 18, '2026-07-12'),
(112, 120, 118, 2, '2026-07-13'),
(113, 120, 85, 35, '2026-07-14'),
(114, 120, 100, 20, '2026-07-15'),
(115, 120, 92, 28, '2026-07-16'),
(116, 120, 107, 13, '2026-07-17'),
(117, 120, 49, 71, '2026-07-18'),
(118, 120, 108, 12, '2026-07-19'),
(119, 120, 95, 25, '2026-07-20'),
(120, 120, 104, 16, '2026-07-21')
ON DUPLICATE KEY UPDATE present_days=VALUES(present_days), absent_days=VALUES(absent_days);

-- 7. Insert Marks Records (5 subjects)
INSERT INTO marks (student_id, mathematics, physics, chemistry, english, computer_science) VALUES
(101, 88, 79, 84, 91, 95),
(102, 95, 92, 90, 88, 98),
(103, 68, 72, 65, 74, 80),
(104, 74, 66, 71, 69, 63),
(105, 52, 48, 55, 61, 50),
(106, 81, 77, 85, 80, 76),
(107, 70, 74, 68, 72, 84),
(108, 92, 89, 87, 94, 91),
(109, 44, 51, 47, 58, 49),
(110, 85, 83, 88, 79, 81),
(111, 78, 71, 74, 83, 70),
(112, 97, 94, 96, 92, 99),
(113, 64, 59, 67, 71, 73),
(114, 76, 80, 72, 78, 75),
(115, 69, 65, 70, 66, 62),
(116, 84, 86, 82, 87, 85),
(117, 41, 38, 45, 52, 44),
(118, 90, 88, 91, 89, 93),
(119, 79, 82, 77, 81, 86),
(120, 87, 85, 89, 84, 90)
ON DUPLICATE KEY UPDATE mathematics=VALUES(mathematics);

-- 8. Insert Activity Audit Log
INSERT INTO activities (text, type, teacher_id) VALUES
('Academic calendar updated for Semester 5', 'notice', NULL),
('Mid-term results declared for Computer Networks', 'marks', 'T-1002'),
('Campus placement drive scheduled for next week', 'notice', NULL),
('Attendance report generated for Electronics department', 'attendance', 'T-1005'),
('New course Machine Learning Basics added to curriculum', 'course', 'T-1001');
