package com.campusharmony.controller;

import com.campusharmony.security.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/academic")
@Transactional
public class AcademicMarksController {

    private final JdbcTemplate db;

    public AcademicMarksController(JdbcTemplate db) {
        this.db = db;
    }

    public record AssessmentCreateRequest(
        @NotBlank @Size(max = 100) String title,
        @NotBlank @Size(max = 50) String assessmentType,
        @Positive @NotNull BigDecimal maxMarks,
        @NotNull LocalDate assessmentDate
    ) {}

    public record MarkEntry(
        @Positive long enrollmentId,
        @NotNull @DecimalMin("0.0") BigDecimal marksObtained,
        @Size(max = 100) String remarks
    ) {}

    public record MarksBatchSubmission(
        @NotEmpty List<@Valid @NotNull MarkEntry> records,
        @Size(max = 255) String reason
    ) {}

    private void require(boolean condition, HttpStatus status, String message) {
        if (!condition) {
            throw new ResponseStatusException(status, message);
        }
    }

    private Map<String, Object> verifyOfferingAccess(long offeringId, Identity user) {
        var rows = db.queryForList("SELECT * FROM course_offerings WHERE id = ? FOR UPDATE", offeringId);
        require(!rows.isEmpty(), HttpStatus.NOT_FOUND, "Course offering not found");
        var offering = rows.get(0);
        if ("teacher".equals(user.role())) {
            require(user.teacherId().equals(offering.get("teacher_id")), HttpStatus.FORBIDDEN, "Offering is outside your assigned scope");
        }
        return offering;
    }

    private Map<String, Object> verifyAssessmentAccess(long assessmentId, Identity user) {
        var rows = db.queryForList("""
            SELECT a.*, o.section_id, c.name AS course_name, s.name AS section_name
            FROM assessments a
            JOIN course_offerings o ON o.id = a.offering_id
            JOIN courses c ON c.code = a.course_code
            JOIN sections s ON s.id = o.section_id
            WHERE a.id = ? FOR UPDATE
            """, assessmentId);
        require(!rows.isEmpty(), HttpStatus.NOT_FOUND, "Assessment not found");
        var assessment = rows.get(0);
        if ("teacher".equals(user.role())) {
            require(user.teacherId().equals(assessment.get("teacher_id")), HttpStatus.FORBIDDEN, "Assessment is outside your assigned scope");
        }
        return assessment;
    }

    @GetMapping("/offerings/{offeringId}/assessments")
    @Access({"teacher", "admin"})
    public List<Map<String, Object>> getAssessments(
        @PathVariable long offeringId,
        @SessionAttribute Identity user
    ) {
        verifyOfferingAccess(offeringId, user);
        return db.queryForList("""
            SELECT a.id, a.offering_id, a.academic_period_id, a.course_code, a.teacher_id,
                   a.title, a.assessment_type, a.max_marks, a.assessment_date,
                   a.created_at, a.updated_at,
                   COUNT(am.id) AS submissions_count,
                   ROUND(AVG(am.marks_obtained), 2) AS avg_marks
            FROM assessments a
            LEFT JOIN assessment_marks am ON am.assessment_id = a.id
            WHERE a.offering_id = ?
            GROUP BY a.id, a.offering_id, a.academic_period_id, a.course_code, a.teacher_id,
                     a.title, a.assessment_type, a.max_marks, a.assessment_date,
                     a.created_at, a.updated_at
            ORDER BY a.assessment_date DESC, a.id DESC
            """, offeringId);
    }

    @PostMapping("/offerings/{offeringId}/assessments")
    @Access({"teacher", "admin"})
    public Map<String, Object> createAssessment(
        @PathVariable long offeringId,
        @Valid @RequestBody AssessmentCreateRequest req,
        @SessionAttribute Identity user
    ) {
        var offering = verifyOfferingAccess(offeringId, user);

        // Check for duplicate title within the same offering
        int existing = db.queryForObject(
            "SELECT COUNT(*) FROM assessments WHERE offering_id = ? AND title = ?",
            Integer.class, offeringId, req.title().trim()
        );
        require(existing == 0, HttpStatus.CONFLICT, "An assessment with title '" + req.title().trim() + "' already exists for this course offering");

        db.update("""
            INSERT INTO assessments(offering_id, academic_period_id, course_code, teacher_id, title, assessment_type, max_marks, assessment_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            offeringId,
            offering.get("academic_period_id"),
            offering.get("course_code"),
            offering.get("teacher_id"),
            req.title().trim(),
            req.assessmentType().trim(),
            req.maxMarks(),
            req.assessmentDate()
        );

        Long newId = db.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return Map.of("id", newId, "message", "Assessment created successfully");
    }

    @GetMapping("/assessments/{assessmentId}/roster")
    @Access({"teacher", "admin"})
    public Map<String, Object> getAssessmentRoster(
        @PathVariable long assessmentId,
        @SessionAttribute Identity user
    ) {
        var assessment = verifyAssessmentAccess(assessmentId, user);
        long offeringId = ((Number) assessment.get("offering_id")).longValue();

        var roster = db.queryForList("""
            SELECT e.id AS enrollment_id, s.id AS student_id, s.roll, s.name,
                   am.id AS mark_id, am.marks_obtained, am.grade, am.remarks,
                   (am.id IS NOT NULL) AS is_saved
            FROM course_enrollments e
            JOIN students s ON s.id = e.student_id
            LEFT JOIN assessment_marks am ON am.assessment_id = ? AND am.enrollment_id = e.id
            WHERE e.offering_id = ? AND e.status = 'Enrolled'
            ORDER BY s.roll
            """, assessmentId, offeringId);

        return Map.of(
            "assessment", assessment,
            "roster", roster
        );
    }

    @PostMapping("/assessments/{assessmentId}/marks")
    @Access({"teacher", "admin"})
    public Map<String, Object> saveMarks(
        @PathVariable long assessmentId,
        @Valid @RequestBody MarksBatchSubmission batch,
        @SessionAttribute Identity user
    ) {
        var assessment = verifyAssessmentAccess(assessmentId, user);
        BigDecimal maxMarks = (BigDecimal) assessment.get("max_marks");
        long offeringId = ((Number) assessment.get("offering_id")).longValue();

        // Validate duplicates within incoming payload
        Set<Long> seenEnrollments = new HashSet<>();
        for (var entry : batch.records()) {
            require(seenEnrollments.add(entry.enrollmentId()), HttpStatus.BAD_REQUEST, "Duplicate enrollment ID " + entry.enrollmentId() + " in marks submission");
            require(entry.marksObtained().compareTo(BigDecimal.ZERO) >= 0, HttpStatus.BAD_REQUEST, "Marks obtained cannot be negative");
            require(entry.marksObtained().compareTo(maxMarks) <= 0, HttpStatus.BAD_REQUEST, "Marks obtained (" + entry.marksObtained() + ") cannot exceed maximum marks (" + maxMarks + ")");
        }

        int updatedCount = 0;
        int insertedCount = 0;

        for (var entry : batch.records()) {
            // Verify enrollment belongs to offering
            var enrollRows = db.queryForList(
                "SELECT student_id FROM course_enrollments WHERE id = ? AND offering_id = ?",
                entry.enrollmentId(), offeringId
            );
            require(!enrollRows.isEmpty(), HttpStatus.BAD_REQUEST, "Enrollment ID " + entry.enrollmentId() + " does not belong to this course offering");
            long studentId = ((Number) enrollRows.get(0).get("student_id")).longValue();

            // Check if existing mark exists
            var existingMarks = db.queryForList(
                "SELECT id, marks_obtained FROM assessment_marks WHERE assessment_id = ? AND student_id = ? FOR UPDATE",
                assessmentId, studentId
            );

            if (!existingMarks.isEmpty()) {
                // UPDATE existing mark
                long markId = ((Number) existingMarks.get(0).get("id")).longValue();
                BigDecimal oldScore = (BigDecimal) existingMarks.get(0).get("marks_obtained");

                db.update("""
                    UPDATE assessment_marks 
                    SET marks_obtained = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """,
                    entry.marksObtained(), entry.remarks(), markId
                );

                db.update("""
                    INSERT INTO assessment_marks_audit(mark_id, assessment_id, student_id, old_marks, new_marks, changed_by, action_type, reason)
                    VALUES(?, ?, ?, ?, ?, ?, 'UPDATE', ?)
                    """,
                    markId, assessmentId, studentId, oldScore, entry.marksObtained(), user.login(), batch.reason()
                );
                updatedCount++;
            } else {
                // INSERT new mark
                db.update("""
                    INSERT INTO assessment_marks(assessment_id, enrollment_id, student_id, marks_obtained, max_marks, remarks)
                    VALUES(?, ?, ?, ?, ?, ?)
                    """,
                    assessmentId, entry.enrollmentId(), studentId, entry.marksObtained(), maxMarks, entry.remarks()
                );

                Long markId = db.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

                db.update("""
                    INSERT INTO assessment_marks_audit(mark_id, assessment_id, student_id, old_marks, new_marks, changed_by, action_type, reason)
                    VALUES(?, ?, ?, NULL, ?, ?, 'INSERT', ?)
                    """,
                    markId, assessmentId, studentId, entry.marksObtained(), user.login(), batch.reason()
                );
                insertedCount++;
            }
        }

        return Map.of(
            "message", "Marks saved successfully",
            "inserted", insertedCount,
            "updated", updatedCount
        );
    }

    @GetMapping("/assessments/{assessmentId}/stats")
    @Access({"teacher", "admin"})
    public Map<String, Object> getAssessmentStats(
        @PathVariable long assessmentId,
        @SessionAttribute Identity user
    ) {
        verifyAssessmentAccess(assessmentId, user);

        var overview = db.queryForList("""
            SELECT 
                COUNT(am.id) AS submitted_count,
                ROUND(AVG(am.marks_obtained), 2) AS avg_marks,
                ROUND(MIN(am.marks_obtained), 2) AS min_marks,
                ROUND(MAX(am.marks_obtained), 2) AS max_marks_obtained,
                ROUND(AVG(am.marks_obtained / a.max_marks * 100), 1) AS avg_percentage
            FROM assessments a
            LEFT JOIN assessment_marks am ON am.assessment_id = a.id
            WHERE a.id = ?
            GROUP BY a.id, a.max_marks
            """, assessmentId);

        var gradeDistribution = db.queryForList("""
            SELECT COALESCE(grade, 'N/A') AS grade, COUNT(*) AS count
            FROM assessment_marks
            WHERE assessment_id = ?
            GROUP BY grade
            ORDER BY grade
            """, assessmentId);

        return Map.of(
            "summary", overview.isEmpty() ? Map.of() : overview.get(0),
            "grades", gradeDistribution
        );
    }

    @GetMapping("/my-marks")
    @Access("student")
    public List<Map<String, Object>> getMyMarks(@SessionAttribute Identity user) {
        return db.queryForList("""
            SELECT 
                am.id AS mark_id,
                a.id AS assessment_id,
                a.title AS assessment_title,
                a.assessment_type,
                a.assessment_date,
                am.marks_obtained,
                am.max_marks,
                ROUND((am.marks_obtained / am.max_marks) * 100, 1) AS percentage,
                am.grade,
                am.remarks,
                c.code AS course_code,
                c.name AS course_name,
                s.name AS section_name,
                s.semester,
                p.name AS period_name,
                p.code AS period_code,
                t.name AS teacher_name
            FROM assessment_marks am
            JOIN assessments a ON a.id = am.assessment_id
            JOIN course_offerings o ON a.offering_id = o.id
            JOIN courses c ON a.course_code = c.code
            JOIN sections s ON o.section_id = s.id
            JOIN academic_periods p ON a.academic_period_id = p.id
            JOIN teachers t ON a.teacher_id = t.id
            WHERE am.student_id = ?
            ORDER BY s.semester DESC, c.code, a.assessment_date DESC, a.id DESC
            """, user.studentId());
    }

    @GetMapping("/admin/marks-reports")
    @Access("admin")
    public List<Map<String, Object>> getAdminMarksReports() {
        return db.queryForList("""
            SELECT * FROM v_course_assessment_performance
            ORDER BY academic_period, course_code, section_name, assessment_date DESC
            """);
    }
}
