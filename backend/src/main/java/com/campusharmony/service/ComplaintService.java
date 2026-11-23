package com.campusharmony.service;

import com.campusharmony.security.Identity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDate;
import java.time.Year;
import java.util.*;

@Service
public class ComplaintService {

    public static final Set<String> VALID_CATEGORIES = Set.of(
        "Academic",
        "Attendance",
        "Examination / Marks",
        "Faculty / Teaching",
        "Infrastructure",
        "Administrative",
        "Other"
    );

    public static final Set<String> VALID_STATUSES = Set.of(
        "Open",
        "In Progress",
        "Resolved",
        "Closed"
    );

    private final JdbcTemplate db;

    public ComplaintService(JdbcTemplate db) {
        this.db = db;
    }

    public record ComplaintSubmissionRequest(
        String category,
        String subject,
        String description,
        Long relatedOfferingId
    ) {}

    public record StatusUpdateRequest(
        String status,
        String responseText
    ) {}

    public record ResponseRequest(
        String responseText
    ) {}

    // -------------------------------------------------------------------------
    // Student Actions
    // -------------------------------------------------------------------------

    @Transactional
    public Map<String, Object> submitComplaint(long studentId, Identity user, ComplaintSubmissionRequest req) {
        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Complaint payload cannot be empty");
        }
        if (req.category() == null || !VALID_CATEGORIES.contains(req.category().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid complaint category. Must be one of: " + VALID_CATEGORIES);
        }
        if (req.subject() == null || req.subject().trim().length() < 3 || req.subject().trim().length() > 150) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject must be between 3 and 150 characters");
        }
        if (req.description() == null || req.description().trim().length() < 10 || req.description().trim().length() > 4000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description must be between 10 and 4000 characters");
        }

        // Validate offering if provided: student MUST be enrolled in it
        if (req.relatedOfferingId() != null) {
            var enrollments = db.queryForList("""
                SELECT id FROM course_enrollments
                WHERE offering_id = ? AND student_id = ? AND status = 'Enrolled'
                """, req.relatedOfferingId(), studentId);
            if (enrollments.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected course offering is not in your active enrolled courses");
            }
        }

        // Generate unique reference number: GRV-YYYY-XXXXXX
        String ref = generateUniqueReference();

        KeyHolder keyHolder = new GeneratedKeyHolder();
        db.update(con -> {
            var ps = con.prepareStatement(
                "INSERT INTO complaints (reference_number, student_id, category, subject, description, related_offering_id, status) VALUES (?, ?, ?, ?, ?, ?, 'Open')",
                Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, ref);
            ps.setLong(2, studentId);
            ps.setString(3, req.category().trim());
            ps.setString(4, req.subject().trim());
            ps.setString(5, req.description().trim());
            if (req.relatedOfferingId() != null) {
                ps.setLong(6, req.relatedOfferingId());
            } else {
                ps.setNull(6, Types.BIGINT);
            }
            return ps;
        }, keyHolder);

        long complaintId = Objects.requireNonNull(keyHolder.getKey()).longValue();

        db.update("""
            INSERT INTO complaint_activity (complaint_id, actor_login, actor_name, actor_role, action, new_status, response_text)
            VALUES (?, ?, ?, 'student', 'CREATED', 'Open', 'Grievance submitted by student.')
            """, complaintId, user.login(), user.name());

        return Map.of(
            "id", complaintId,
            "referenceNumber", ref,
            "status", "Open",
            "category", req.category().trim(),
            "subject", req.subject().trim()
        );
    }

    public List<Map<String, Object>> getMyComplaints(long studentId, String status, String search) {
        StringBuilder sql = new StringBuilder("SELECT * FROM v_student_complaints WHERE student_id = ?");
        List<Object> params = new ArrayList<>();
        params.add(studentId);

        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            sql.append(" AND status = ?");
            params.add(status.trim());
        }

        if (search != null && !search.isBlank()) {
            sql.append(" AND (LOWER(reference_number) LIKE ? OR LOWER(subject) LIKE ? OR LOWER(category) LIKE ?)");
            String term = "%" + search.trim().toLowerCase() + "%";
            params.add(term);
            params.add(term);
            params.add(term);
        }

        sql.append(" ORDER BY created_at DESC");
        return db.queryForList(sql.toString(), params.toArray());
    }

    public List<Map<String, Object>> getMyEnrolledCourses(long studentId) {
        return db.queryForList("""
            SELECT o.id AS offering_id, c.code AS course_code, c.name AS course_name, sec.name AS section_name
            FROM course_enrollments e
            JOIN course_offerings o ON o.id = e.offering_id
            JOIN courses c ON c.code = o.course_code
            JOIN sections sec ON sec.id = o.section_id
            WHERE e.student_id = ? AND e.status = 'Enrolled'
            ORDER BY c.code
            """, studentId);
    }

    // -------------------------------------------------------------------------
    // Shared Details Action (Student ownership check or Admin)
    // -------------------------------------------------------------------------

    public Map<String, Object> getComplaintDetails(long complaintId, Identity user) {
        var complaints = db.queryForList("SELECT * FROM v_student_complaints WHERE id = ?", complaintId);
        if (complaints.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found");
        }

        var complaint = new HashMap<>(complaints.get(0));

        // Privacy & Ownership verification
        if ("student".equalsIgnoreCase(user.role())) {
            Long ownerStudentId = ((Number) complaint.get("student_id")).longValue();
            if (user.studentId() == null || !user.studentId().equals(ownerStudentId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to view this complaint");
            }
        } else if (!"admin".equalsIgnoreCase(user.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the complaint owner or administrators can view complaint details");
        }

        var activities = db.queryForList("""
            SELECT id, action, actor_name, actor_role, previous_status, new_status, response_text, created_at
            FROM complaint_activity
            WHERE complaint_id = ?
            ORDER BY created_at ASC, id ASC
            """, complaintId);

        complaint.put("activities", activities);
        return complaint;
    }

    // -------------------------------------------------------------------------
    // Administrator Actions
    // -------------------------------------------------------------------------

    public List<Map<String, Object>> getAdminComplaints(String status, String category, String search, LocalDate fromDate, LocalDate toDate) {
        StringBuilder sql = new StringBuilder("SELECT * FROM v_student_complaints WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            sql.append(" AND status = ?");
            params.add(status.trim());
        }

        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("ALL")) {
            sql.append(" AND category = ?");
            params.add(category.trim());
        }

        if (search != null && !search.isBlank()) {
            sql.append(" AND (LOWER(reference_number) LIKE ? OR LOWER(student_roll) LIKE ? OR LOWER(student_name) LIKE ? OR LOWER(subject) LIKE ?)");
            String term = "%" + search.trim().toLowerCase() + "%";
            params.add(term);
            params.add(term);
            params.add(term);
            params.add(term);
        }

        if (fromDate != null) {
            sql.append(" AND DATE(created_at) >= ?");
            params.add(fromDate);
        }

        if (toDate != null) {
            sql.append(" AND DATE(created_at) <= ?");
            params.add(toDate);
        }

        sql.append(" ORDER BY created_at DESC");
        return db.queryForList(sql.toString(), params.toArray());
    }

    public Map<String, Object> getAdminComplaintStats() {
        int total = Optional.ofNullable(db.queryForObject("SELECT COUNT(*) FROM complaints", Integer.class)).orElse(0);
        int open = Optional.ofNullable(db.queryForObject("SELECT COUNT(*) FROM complaints WHERE status = 'Open'", Integer.class)).orElse(0);
        int inProgress = Optional.ofNullable(db.queryForObject("SELECT COUNT(*) FROM complaints WHERE status = 'In Progress'", Integer.class)).orElse(0);
        int resolved = Optional.ofNullable(db.queryForObject("SELECT COUNT(*) FROM complaints WHERE status = 'Resolved'", Integer.class)).orElse(0);
        int closed = Optional.ofNullable(db.queryForObject("SELECT COUNT(*) FROM complaints WHERE status = 'Closed'", Integer.class)).orElse(0);

        var categoryList = db.queryForList("SELECT category, COUNT(*) AS cnt FROM complaints GROUP BY category");
        Map<String, Integer> byCategory = new LinkedHashMap<>();
        for (String cat : VALID_CATEGORIES) {
            byCategory.put(cat, 0);
        }
        for (var row : categoryList) {
            byCategory.put((String) row.get("category"), ((Number) row.get("cnt")).intValue());
        }

        var recent = db.queryForList("SELECT * FROM v_student_complaints ORDER BY created_at DESC LIMIT 5");

        return Map.of(
            "total", total,
            "open", open,
            "inProgress", inProgress,
            "resolved", resolved,
            "closed", closed,
            "byCategory", byCategory,
            "recent", recent
        );
    }

    @Transactional
    public void updateStatus(long complaintId, StatusUpdateRequest req, Identity adminUser) {
        if (req == null || req.status() == null || !VALID_STATUSES.contains(req.status().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status. Must be one of: " + VALID_STATUSES);
        }

        var existing = db.queryForList("SELECT * FROM complaints WHERE id = ? FOR UPDATE", complaintId);
        if (existing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found");
        }

        var complaint = existing.get(0);
        String oldStatus = (String) complaint.get("status");
        String newStatus = req.status().trim();

        Timestamp resolvedAt = null;
        if ("Resolved".equalsIgnoreCase(newStatus)) {
            resolvedAt = new Timestamp(System.currentTimeMillis());
        } else if (!"Open".equalsIgnoreCase(newStatus)) {
            resolvedAt = (Timestamp) complaint.get("resolved_at");
        }

        db.update("""
            UPDATE complaints
            SET status = ?, resolved_at = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """, newStatus, resolvedAt, complaintId);

        String action = "STATUS_CHANGE";
        if ("Resolved".equalsIgnoreCase(newStatus)) {
            action = "RESOLVED";
        } else if ("Closed".equalsIgnoreCase(newStatus)) {
            action = "CLOSED";
        }

        String note = (req.responseText() != null && !req.responseText().trim().isEmpty())
            ? req.responseText().trim()
            : "Status updated from " + oldStatus + " to " + newStatus;

        db.update("""
            INSERT INTO complaint_activity (complaint_id, actor_login, actor_name, actor_role, action, previous_status, new_status, response_text)
            VALUES (?, ?, ?, 'admin', ?, ?, ?, ?)
            """, complaintId, adminUser.login(), adminUser.name(), action, oldStatus, newStatus, note);
    }

    @Transactional
    public void addAdminResponse(long complaintId, ResponseRequest req, Identity adminUser) {
        if (req == null || req.responseText() == null || req.responseText().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Response text cannot be empty");
        }

        var existing = db.queryForList("SELECT * FROM complaints WHERE id = ? FOR UPDATE", complaintId);
        if (existing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found");
        }

        db.update("UPDATE complaints SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", complaintId);

        db.update("""
            INSERT INTO complaint_activity (complaint_id, actor_login, actor_name, actor_role, action, response_text)
            VALUES (?, ?, ?, 'admin', 'RESPONSE_ADDED', ?)
            """, complaintId, adminUser.login(), adminUser.name(), req.responseText().trim());
    }

    // -------------------------------------------------------------------------
    // Helper Methods
    // -------------------------------------------------------------------------

    private String generateUniqueReference() {
        int year = Year.now().getValue();
        for (int i = 0; i < 15; i++) {
            String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
            String candidate = "GRV-" + year + "-" + suffix;
            Integer count = db.queryForObject("SELECT COUNT(*) FROM complaints WHERE reference_number = ?", Integer.class, candidate);
            if (count == null || count == 0) {
                return candidate;
            }
        }
        return "GRV-" + year + "-" + System.currentTimeMillis();
    }
}
