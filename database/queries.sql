-- =============================================================================
-- Demonstration SQL Queries for BE CSE College Viva & Project Presentation
-- Subject: Database Management Systems (DBMS)
-- Project: Campus Harmony / Student Management System (Full-Stack)
-- =============================================================================

USE campus_harmony;

-- -----------------------------------------------------------------------------
-- 1. INNER JOIN: Student Profile with Attendance and Marks
-- Retrieves student basic info along with attendance % and subject scores.
-- -----------------------------------------------------------------------------
SELECT 
    s.roll,
    s.name,
    s.department,
    s.semester,
    ROUND((a.present_days / a.total_days) * 100, 1) AS attendance_percentage,
    m.mathematics,
    m.physics,
    m.chemistry,
    m.english,
    m.computer_science,
    (m.mathematics + m.physics + m.chemistry + m.english + m.computer_science) AS total_marks,
    ROUND((m.mathematics + m.physics + m.chemistry + m.english + m.computer_science) / 5.0, 2) AS average_percentage
FROM students s
INNER JOIN attendance a ON s.id = a.student_id
INNER JOIN marks m ON s.id = m.student_id
ORDER BY s.roll ASC;

-- -----------------------------------------------------------------------------
-- 2. LEFT OUTER JOIN: Courses and Assigned Faculty
-- Shows all courses even if no teacher is explicitly mapped.
-- -----------------------------------------------------------------------------
SELECT 
    c.code AS course_code,
    c.name AS course_name,
    c.credits,
    c.semester,
    c.status,
    COALESCE(t.name, c.faculty) AS instructor_name,
    t.subject AS instructor_specialization
FROM courses c
LEFT JOIN teachers t ON c.teacher_id = t.id
ORDER BY c.semester, c.code;

-- -----------------------------------------------------------------------------
-- 3. AGGREGATE FUNCTIONS: Department-wise Academic Performance
-- Demonstrates COUNT(), AVG(), MIN(), MAX() with GROUP BY.
-- -----------------------------------------------------------------------------
SELECT 
    s.department,
    COUNT(s.id) AS total_enrolled_students,
    ROUND(AVG((a.present_days / a.total_days) * 100), 2) AS avg_department_attendance,
    ROUND(AVG(m.computer_science), 1) AS avg_cs_marks,
    MAX(m.computer_science) AS highest_cs_marks,
    MIN(m.computer_science) AS lowest_cs_marks
FROM students s
JOIN attendance a ON s.id = a.student_id
JOIN marks m ON s.id = m.student_id
GROUP BY s.department
ORDER BY avg_department_attendance DESC;

-- -----------------------------------------------------------------------------
-- 4. CONDITIONAL AGGREGATE & HAVING CLAUSE: Defaulter / Low Attendance List
-- Finds students whose attendance is below 75% (eligibility criterion).
-- -----------------------------------------------------------------------------
SELECT 
    s.roll,
    s.name,
    s.department,
    s.semester,
    a.present_days,
    a.total_days,
    ROUND((a.present_days / a.total_days) * 100, 2) AS attendance_percentage,
    CASE 
        WHEN (a.present_days / a.total_days) * 100 < 75 THEN 'Defaulter / Low Attendance'
        ELSE 'Eligible'
    END AS eligibility_status
FROM students s
JOIN attendance a ON s.id = a.student_id
WHERE ROUND((a.present_days / a.total_days) * 100, 2) < 75
ORDER BY attendance_percentage ASC;

-- -----------------------------------------------------------------------------
-- 5. SUBQUERY: Top Performers in Computer Science
-- Students whose Computer Science score is strictly above the class average.
-- -----------------------------------------------------------------------------
SELECT 
    s.roll,
    s.name,
    s.department,
    m.computer_science
FROM students s
JOIN marks m ON s.id = m.student_id
WHERE m.computer_science > (
    SELECT AVG(computer_science) FROM marks WHERE computer_science IS NOT NULL
)
ORDER BY m.computer_science DESC;

-- -----------------------------------------------------------------------------
-- 6. FULL GRADE & RESULT COMPUTATION (Demonstrating Business Logic in SQL)
-- -----------------------------------------------------------------------------
SELECT 
    s.roll,
    s.name,
    (m.mathematics + m.physics + m.chemistry + m.english + m.computer_science) AS total_marks,
    ROUND((m.mathematics + m.physics + m.chemistry + m.english + m.computer_science) / 5.0, 1) AS percentage,
    CASE 
        WHEN ((m.mathematics + m.physics + m.chemistry + m.english + m.computer_science) / 5.0) >= 90 THEN 'A+'
        WHEN ((m.mathematics + m.physics + m.chemistry + m.english + m.computer_science) / 5.0) >= 80 THEN 'A'
        WHEN ((m.mathematics + m.physics + m.chemistry + m.english + m.computer_science) / 5.0) >= 70 THEN 'B'
        WHEN ((m.mathematics + m.physics + m.chemistry + m.english + m.computer_science) / 5.0) >= 60 THEN 'C'
        WHEN ((m.mathematics + m.physics + m.chemistry + m.english + m.computer_science) / 5.0) >= 50 THEN 'D'
        ELSE 'F'
    END AS final_grade,
    CASE 
        WHEN m.mathematics < 40 OR m.physics < 40 OR m.chemistry < 40 OR m.english < 40 OR m.computer_science < 40 THEN 'Fail'
        WHEN ((m.mathematics + m.physics + m.chemistry + m.english + m.computer_science) / 5.0) < 50 THEN 'Fail'
        ELSE 'Pass'
    END AS pass_fail_status
FROM students s
JOIN marks m ON s.id = m.student_id
ORDER BY total_marks DESC;
