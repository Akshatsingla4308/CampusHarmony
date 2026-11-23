-- Apply once to an independently backed-up v5 schema. No inferred assignments.
CREATE TABLE sections (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 department_id INT NOT NULL,
 academic_period_id INT NOT NULL,
 semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
 name VARCHAR(60) NOT NULL,
 UNIQUE(department_id,academic_period_id,semester,name),
 FOREIGN KEY(department_id) REFERENCES departments(id),
 FOREIGN KEY(academic_period_id) REFERENCES academic_periods(id),
 UNIQUE(id,academic_period_id)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE section_members (
 student_id BIGINT NOT NULL, academic_period_id INT NOT NULL, section_id BIGINT NOT NULL,
 PRIMARY KEY(student_id,academic_period_id),
 FOREIGN KEY(student_id) REFERENCES students(id),
 FOREIGN KEY(section_id,academic_period_id) REFERENCES sections(id,academic_period_id)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE course_offerings (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, section_id BIGINT NOT NULL, academic_period_id INT NOT NULL,
 course_code VARCHAR(20) NOT NULL, teacher_id VARCHAR(30) NOT NULL,
 UNIQUE(section_id,course_code), UNIQUE(id,course_code,academic_period_id),
 FOREIGN KEY(section_id,academic_period_id) REFERENCES sections(id,academic_period_id),
 FOREIGN KEY(course_code) REFERENCES courses(code), FOREIGN KEY(teacher_id) REFERENCES teachers(id)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE course_enrollments ADD offering_id BIGINT NULL,
 ADD UNIQUE(id,offering_id),
 ADD FOREIGN KEY(offering_id,course_code,academic_period_id) REFERENCES course_offerings(id,course_code,academic_period_id);
ALTER TABLE attendance_sessions ADD offering_id BIGINT NULL, ADD submitted_at TIMESTAMP NULL,
 ADD UNIQUE(id,offering_id),
 ADD FOREIGN KEY(offering_id,course_code,academic_period_id) REFERENCES course_offerings(id,course_code,academic_period_id),
 ADD UNIQUE KEY uk_offering_lecture(course_code,academic_period_id,session_date,session_slot,(COALESCE(offering_id,0))),
 DROP INDEX uk_course_period_session_slot;
ALTER TABLE attendance_records ADD offering_id BIGINT NULL,
 ADD FOREIGN KEY(enrollment_id,offering_id) REFERENCES course_enrollments(id,offering_id),
 ADD FOREIGN KEY(session_id,offering_id) REFERENCES attendance_sessions(id,offering_id);
CREATE TABLE accounts (
 login VARCHAR(80) PRIMARY KEY, role ENUM('admin','teacher','student') NOT NULL,
 display_name VARCHAR(100) NOT NULL, password_hash VARCHAR(200) NOT NULL,
 teacher_id VARCHAR(30) UNIQUE, student_id BIGINT UNIQUE,
 FOREIGN KEY(teacher_id) REFERENCES teachers(id), FOREIGN KEY(student_id) REFERENCES students(id),
 CHECK ((role='admin' AND teacher_id IS NULL AND student_id IS NULL)
 OR (role='teacher' AND teacher_id IS NOT NULL AND student_id IS NULL)
 OR (role='student' AND student_id IS NOT NULL AND teacher_id IS NULL))
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

