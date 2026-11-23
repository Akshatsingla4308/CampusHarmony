-- Disposable fixture. Roll back all rows so the HTTP scenario starts with an empty catalog.
START TRANSACTION;
INSERT INTO departments(code,name) VALUES('CHECK','Constraint fixture');
SET @dep=LAST_INSERT_ID();
INSERT INTO academic_periods(code,name,academic_year,semester_term) VALUES('CHECK','Constraint term','2026','Odd');
SET @term=LAST_INSERT_ID();
INSERT INTO subjects(subject_key,label) VALUES('check','Constraint subject');
INSERT INTO teachers(id,name,department_id,subject,workspace) VALUES('check-a','A',@dep,'check','own'),('check-b','B',@dep,'check','own');
INSERT INTO courses(code,name,department_id,subject_key,credits,semester) VALUES('CHECK','Constraint course',@dep,'check',4,3);
INSERT INTO sections(name,department_id,academic_period_id,semester) VALUES('A',@dep,@term,3);
SET @a=LAST_INSERT_ID();
INSERT INTO sections(name,department_id,academic_period_id,semester) VALUES('B',@dep,@term,3);
SET @b=LAST_INSERT_ID();
INSERT INTO course_offerings(section_id,academic_period_id,course_code,teacher_id) VALUES(@a,@term,'CHECK','check-a');
SET @offer=LAST_INSERT_ID();
INSERT INTO course_offerings(section_id,academic_period_id,course_code,teacher_id) VALUES(@b,@term,'CHECK','check-b');
SET @other=LAST_INSERT_ID();
INSERT INTO attendance_sessions(course_code,academic_period_id,teacher_id,offering_id,session_date,session_slot)
VALUES('CHECK',@term,'check-a',@offer,CURRENT_DATE,1),('CHECK',@term,'check-b',@other,CURRENT_DATE,1);
SET @lecture=LAST_INSERT_ID();
INSERT INTO students(roll,name,email,phone,gender,department_id,department,semester)
VALUES('CHECK','Constraint fixture','check@example.invalid','000','Other',@dep,'Constraint fixture',3);
SET @student=LAST_INSERT_ID();
INSERT INTO section_members VALUES(@student,@term,@a);
INSERT INTO course_enrollments(student_id,course_code,academic_period_id,offering_id)
SELECT @student,course_code,academic_period_id,id FROM course_offerings WHERE section_id=@a;
SET @enrollment=LAST_INSERT_ID();
INSERT INTO attendance_records(session_id,enrollment_id,student_id,course_code,academic_period_id,offering_id,status)
VALUES(@lecture,@enrollment,@student,'CHECK',@term,@offer,'Present');
SELECT CONCAT('DB_FIXTURE ',COUNT(*),' ',SUM(status='Present'),' ',(SELECT present_days FROM attendance WHERE student_id=@student))
FROM attendance_records WHERE enrollment_id=@enrollment;
ROLLBACK;
