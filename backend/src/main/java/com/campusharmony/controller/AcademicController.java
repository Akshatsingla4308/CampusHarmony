package com.campusharmony.controller;

import com.campusharmony.security.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
@Transactional
public class AcademicController {
    private final JdbcTemplate db;
    public AcademicController(JdbcTemplate db) { this.db=db; }

    public record Section(@NotBlank String name,@Positive int departmentId,@Positive int termId,@Min(1) @Max(8) int semester) {}
    public record Faculty(@NotBlank String login,@NotBlank String name,@NotBlank String password,@Positive int departmentId,@NotBlank String subject) {}
    public record Offering(@Positive long sectionId,@NotBlank String courseCode,@NotBlank String teacherId) {}
    public record Lecture(@Positive long offeringId,@NotNull LocalDate date,@Min(1) @Max(10) int period) {}
    public record Registration(@Positive long sectionId,@NotBlank String roll,@NotBlank String name,@Email @NotBlank String email,
                               @NotBlank String phone,@Pattern(regexp="Male|Female|Other") @NotNull String gender,@NotBlank String password) {}
    public record Mark(@Positive long enrollmentId,@Pattern(regexp="Present|Absent") @NotNull String status) {}
    public record Submission(@NotEmpty List<@NotNull @Valid Mark> records) {}

    private void require(boolean ok,HttpStatus status,String message) {
        if(!ok) throw new ResponseStatusException(status,message);
    }
    private Map<String,Object> section(long sectionId) {
        var rows=db.queryForList("SELECT * FROM sections WHERE id=? FOR UPDATE",sectionId);
        require(!rows.isEmpty(),HttpStatus.NOT_FOUND,"Unknown section");
        return rows.get(0);
    }
    @GetMapping("/academic/catalog")
    public Map<String,Object> catalog(){
        List<Map<String,Object>> programs = List.of();
        try {
            programs = db.queryForList("SELECT id, department_id, code, name, degree, duration_years FROM academic_programs ORDER BY id");
        } catch (Exception ignored) {}

        List<Map<String,Object>> sections;
        try {
            sections = db.queryForList("""
                SELECT s.*, d.code department, t.code term,
                       COALESCE(m.name, 'Unassigned') AS mentor_name,
                       COALESCE(p.name, 'CSE Core') AS program_name
                FROM sections s
                JOIN departments d ON d.id=s.department_id
                JOIN academic_periods t ON t.id=s.academic_period_id
                LEFT JOIN teachers m ON m.id=s.mentor_teacher_id
                LEFT JOIN academic_programs p ON p.id=s.program_id
                ORDER BY s.id
                """);
        } catch (Exception ex) {
            sections = db.queryForList("SELECT s.*,d.code department,t.code term FROM sections s JOIN departments d ON d.id=s.department_id JOIN academic_periods t ON t.id=s.academic_period_id ORDER BY s.id");
        }

        Map<String,Object> res = new HashMap<>();
        res.put("departments", db.queryForList("SELECT id,name FROM departments ORDER BY name"));
        res.put("terms", db.queryForList("SELECT id,name FROM academic_periods ORDER BY id DESC"));
        res.put("subjects", db.queryForList("SELECT subject_key,label FROM subjects ORDER BY label"));
        res.put("courses", db.queryForList("SELECT code,name,semester,department_id FROM courses ORDER BY name"));
        res.put("teachers", db.queryForList("SELECT teacher_id,name FROM accounts JOIN teachers ON teacher_id=teachers.id ORDER BY name"));
        res.put("programs", programs);
        res.put("sections", sections);
        return res;
    }
    @PostMapping("/academic/sections")
    public void createSection(@Valid @RequestBody Section s){
        db.update("INSERT INTO sections(name,department_id,academic_period_id,semester) VALUES(?,?,?,?)",s.name(),s.departmentId(),s.termId(),s.semester());
    }
    @PostMapping({"/academic/teachers","/teachers","/auth/register-teacher"})
    public void createTeacher(@Valid @RequestBody Faculty t){
        db.update("INSERT INTO teachers(id,name,department_id,subject,workspace) VALUES(?,?,?,?,'own')",t.login(),t.name(),t.departmentId(),t.subject());
        db.update("INSERT INTO accounts(login,display_name,role,password_hash,teacher_id) VALUES(?,?,'teacher',?,?)",t.login(),t.name(),Passwords.hash(t.password()),t.login());
    }
    @PostMapping("/academic/offerings")
    public void assign(@Valid @RequestBody Offering o){
        section(o.sectionId()); // serialize registration and assignment in either order
        int added=db.update("""
            INSERT INTO course_offerings(section_id,academic_period_id,course_code,teacher_id)
            SELECT s.id,s.academic_period_id,c.code,a.teacher_id FROM sections s
            JOIN courses c ON c.department_id=s.department_id AND c.semester=s.semester
            JOIN accounts a ON a.teacher_id=? WHERE s.id=? AND c.code=?
            """,o.teacherId(),o.sectionId(),o.courseCode());
        require(added==1,HttpStatus.BAD_REQUEST,"Choose a matching course and provisioned teacher");
        db.update("""
            INSERT INTO course_enrollments(student_id,course_code,academic_period_id,offering_id)
            SELECT m.student_id,o.course_code,o.academic_period_id,o.id FROM course_offerings o
            JOIN section_members m ON m.section_id=o.section_id WHERE o.section_id=? AND o.course_code=?
            """,o.sectionId(),o.courseCode());
    }
    @GetMapping("/academic/offerings") @Access({"admin","teacher"})
    public List<Map<String,Object>> offerings(@SessionAttribute Identity user){
        return db.queryForList("""
            SELECT o.id,o.section_id,s.name section_name,c.name course_name,c.code,t.code term,d.code department,s.semester,o.teacher_id
            FROM course_offerings o JOIN sections s ON s.id=o.section_id JOIN departments d ON d.id=s.department_id
            JOIN courses c ON c.code=o.course_code JOIN academic_periods t ON t.id=o.academic_period_id
            WHERE (?='admin' OR o.teacher_id=?) ORDER BY d.code,t.code,s.name,c.name
            """,user.role(),user.teacherId());
    }
    @PostMapping({"/academic/students","/students","/auth/register-student"}) @Access({"teacher","admin"})
    public void register(@Valid @RequestBody Registration r,@SessionAttribute Identity user){
        var s=section(r.sectionId());
        if(user.role().equals("teacher"))
            require(db.queryForObject("SELECT COUNT(*) FROM course_offerings WHERE section_id=? AND teacher_id=?",Integer.class,r.sectionId(),user.teacherId())>0,HttpStatus.FORBIDDEN,"Section is outside your assignments");
        db.update("""
            INSERT INTO students(roll,name,email,phone,gender,department_id,department,semester)
            SELECT ?,?,?,?,?,id,name,? FROM departments WHERE id=?
            """,r.roll(),r.name(),r.email(),r.phone(),r.gender(),s.get("semester"),s.get("department_id"));
        Long id=db.queryForObject("SELECT id FROM students WHERE roll=?",Long.class,r.roll());
        db.update("INSERT INTO section_members(student_id,academic_period_id,section_id) VALUES(?,?,?)",id,s.get("academic_period_id"),r.sectionId());
        db.update("INSERT INTO accounts(login,display_name,role,password_hash,student_id) VALUES(?,?,'student',?,?)",r.roll(),r.name(),Passwords.hash(r.password()),id);
        db.update("""
            INSERT INTO course_enrollments(student_id,course_code,academic_period_id,offering_id)
            SELECT ?,course_code,academic_period_id,id FROM course_offerings WHERE section_id=?
            """,id,r.sectionId());
    }
    @PostMapping("/academic/lectures") @Access({"admin","teacher"})
    public void schedule(@Valid @RequestBody Lecture lecture,@SessionAttribute Identity user){
        var assignment=db.queryForList("""
            SELECT o.section_id,o.teacher_id FROM course_offerings o
            JOIN sections s ON s.id=o.section_id JOIN teachers t ON t.id=o.teacher_id
            WHERE o.id=? FOR UPDATE
            """,lecture.offeringId());
        require(!assignment.isEmpty(),HttpStatus.NOT_FOUND,"Unknown offering");
        var assigned=assignment.get(0);
        if(user.role().equals("teacher"))
            require(user.teacherId().equals(assigned.get("teacher_id")),HttpStatus.FORBIDDEN,"Offering is outside your assignments");
        var overlaps=db.queryForList("""
            SELECT l.id FROM attendance_sessions l LEFT JOIN course_offerings o ON o.id=l.offering_id
            WHERE l.session_date=? AND l.session_slot=? AND (l.teacher_id=? OR o.section_id=?) FOR UPDATE
            """,lecture.date(),lecture.period(),assigned.get("teacher_id"),assigned.get("section_id"));
        require(overlaps.isEmpty(),HttpStatus.CONFLICT,"This class or teacher already has a lecture in this period");
        int count=db.update("""
            INSERT INTO attendance_sessions(course_code,academic_period_id,teacher_id,offering_id,session_date,session_slot)
            SELECT course_code,academic_period_id,teacher_id,id,?,? FROM course_offerings WHERE id=?
            """,lecture.date(),lecture.period(),lecture.offeringId());
        require(count==1,HttpStatus.NOT_FOUND,"Unknown offering");
    }
    @GetMapping("/academic/lectures") @Access("teacher")
    public List<Map<String,Object>> lectures(@RequestParam long offeringId,@RequestParam LocalDate date,@SessionAttribute Identity user){
        return db.queryForList("""
            SELECT l.id,l.session_slot,l.submitted_at FROM attendance_sessions l JOIN course_offerings o ON l.offering_id=o.id
            WHERE o.id=? AND o.teacher_id=? AND l.session_date=? ORDER BY session_slot
            """,offeringId,user.teacherId(),date);
    }
    private Map<String,Object> assignedLecture(long id,Identity user){
        var rows=db.queryForList("""
            SELECT l.* FROM attendance_sessions l JOIN course_offerings o ON o.id=l.offering_id
            WHERE l.id=? AND o.teacher_id=? FOR UPDATE
            """,id,user.teacherId());
        require(!rows.isEmpty(),HttpStatus.FORBIDDEN,"Lecture is outside your assignments");
        return rows.get(0);
    }
    private List<Map<String,Object>> eligible(Map<String,Object> lecture){
        return db.queryForList("""
            SELECT e.id enrollment_id,e.student_id,s.roll,s.name,r.status FROM course_enrollments e
            JOIN students s ON s.id=e.student_id LEFT JOIN attendance_records r ON r.enrollment_id=e.id AND r.session_id=?
            WHERE e.offering_id=? AND e.enrollment_date<=? AND e.status='Enrolled' ORDER BY s.roll FOR UPDATE
            """,lecture.get("id"),lecture.get("offering_id"),lecture.get("session_date"));
    }
    @GetMapping("/academic/lectures/{id}/roster") @Access("teacher")
    public List<Map<String,Object>> roster(@PathVariable long id,@SessionAttribute Identity user){
        var lecture=assignedLecture(id,user);
        if(lecture.get("submitted_at")!=null)
            return db.queryForList("""
                SELECT r.enrollment_id,r.student_id,s.roll,s.name,r.status FROM attendance_records r
                JOIN students s ON s.id=r.student_id WHERE r.session_id=? ORDER BY s.roll
                """,id);
        return eligible(lecture);
    }
    @PostMapping("/academic/lectures/{id}/attendance") @Access("teacher")
    public void submit(@PathVariable long id,@Valid @RequestBody Submission data,@SessionAttribute Identity user){
        var lecture=assignedLecture(id,user);
        require(lecture.get("submitted_at")==null,HttpStatus.CONFLICT,"Lecture already submitted");
        require(!((java.sql.Date)lecture.get("session_date")).toLocalDate().isAfter(LocalDate.now()),HttpStatus.BAD_REQUEST,"Cannot mark a future lecture");
        var statuses=new HashMap<Long,String>();
        for(var mark:data.records()) require(statuses.put(mark.enrollmentId(),mark.status())==null,HttpStatus.BAD_REQUEST,"Repeated enrollment");
        var roster=eligible(lecture);
        require(roster.size()==statuses.size(),HttpStatus.CONFLICT,"Roster changed. Reload before submitting");
        for(var entry:roster){
            long enrollment=((Number)entry.get("enrollment_id")).longValue();
            require(statuses.containsKey(enrollment),HttpStatus.BAD_REQUEST,"Invalid enrollment for this lecture");
            db.update("INSERT INTO attendance_records(session_id,enrollment_id,student_id,course_code,academic_period_id,offering_id,status) VALUES(?,?,?,?,?,?,?)",
                id,enrollment,entry.get("student_id"),lecture.get("course_code"),lecture.get("academic_period_id"),lecture.get("offering_id"),statuses.get(enrollment));
        }
        db.update("UPDATE attendance_sessions SET submitted_at=CURRENT_TIMESTAMP, status='Completed' WHERE id=?",id);
    }
    @PutMapping("/academic/lectures/{id}/attendance") @Access("teacher")
    public void correctAttendance(@PathVariable long id,@Valid @RequestBody Submission data,@SessionAttribute Identity user){
        var lecture=assignedLecture(id,user);
        require(lecture.get("submitted_at")!=null,HttpStatus.BAD_REQUEST,"Lecture has not been submitted yet; use initial submit");
        var statuses=new HashMap<Long,String>();
        for(var mark:data.records()) require(statuses.put(mark.enrollmentId(),mark.status())==null,HttpStatus.BAD_REQUEST,"Repeated enrollment");
        var roster=eligible(lecture);
        require(roster.size()==statuses.size(),HttpStatus.CONFLICT,"Roster mismatch. Reload before submitting");
        for(var entry:roster){
            long enrollment=((Number)entry.get("enrollment_id")).longValue();
            require(statuses.containsKey(enrollment),HttpStatus.BAD_REQUEST,"Invalid enrollment for this lecture");
            String newStatus = statuses.get(enrollment);
            var prevList = db.queryForList("SELECT status FROM attendance_records WHERE session_id=? AND enrollment_id=?", id, enrollment);
            String oldStatus = prevList.isEmpty() ? null : (String) prevList.get(0).get("status");
            int rowsUpdated=db.update("UPDATE attendance_records SET status=? WHERE session_id=? AND enrollment_id=?",
                newStatus,id,enrollment);
            if(rowsUpdated==0){
                db.update("INSERT INTO attendance_records(session_id,enrollment_id,student_id,course_code,academic_period_id,offering_id,status) VALUES(?,?,?,?,?,?,?)",
                    id,enrollment,entry.get("student_id"),lecture.get("course_code"),lecture.get("academic_period_id"),lecture.get("offering_id"),newStatus);
                db.update("""
                    INSERT INTO attendance_corrections_audit(session_id,enrollment_id,student_id,old_status,new_status,corrected_by,reason)
                    VALUES(?,?,?,?,?,?,?)
                    """, id, enrollment, entry.get("student_id"), "None", newStatus, user.name(), "Initial correction insertion");
            } else if(oldStatus != null && !oldStatus.equals(newStatus)) {
                db.update("""
                    INSERT INTO attendance_corrections_audit(session_id,enrollment_id,student_id,old_status,new_status,corrected_by,reason)
                    VALUES(?,?,?,?,?,?,?)
                    """, id, enrollment, entry.get("student_id"), oldStatus, newStatus, user.name(), "Attendance status updated");
            }
        }
        db.update("UPDATE attendance_sessions SET submitted_at=CURRENT_TIMESTAMP, status='Completed' WHERE id=?",id);
    }
    @GetMapping("/academic/my-attendance") @Access("student")
    public List<Map<String,Object>> myAttendance(@SessionAttribute Identity user){
        return db.queryForList("""
            SELECT c.code,c.name,s.name section_name,t.code term,
                   COUNT(CASE WHEN ses.id IS NOT NULL THEN r.id END) lectures,
                   COUNT(CASE WHEN ses.id IS NOT NULL AND r.status='Present' THEN 1 END) present,
                   ROUND(100.0*COUNT(CASE WHEN ses.id IS NOT NULL AND r.status='Present' THEN 1 END)/NULLIF(COUNT(CASE WHEN ses.id IS NOT NULL THEN r.id END),0),1) percentage
            FROM course_enrollments e JOIN courses c ON c.code=e.course_code
            JOIN academic_periods t ON t.id=e.academic_period_id LEFT JOIN course_offerings o ON o.id=e.offering_id
            LEFT JOIN sections s ON s.id=o.section_id 
            LEFT JOIN attendance_records r ON r.enrollment_id=e.id
            LEFT JOIN attendance_sessions ses ON ses.id=r.session_id AND ses.status != 'Cancelled' AND ses.submitted_at IS NOT NULL AND ses.session_date >= e.enrollment_date
            WHERE e.student_id=? GROUP BY e.id,c.code,c.name,s.name,t.code ORDER BY t.code,c.code
            """,user.studentId());
    }
}
