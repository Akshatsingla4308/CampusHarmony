package com.campusharmony.controller;

import com.campusharmony.security.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.sql.Time;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/academic/timetable")
@Transactional
public class AcademicTimetableController {

    private final JdbcTemplate db;

    public AcademicTimetableController(JdbcTemplate db) {
        this.db = db;
    }

    private static final Set<String> VALID_DAYS = Set.of(
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    );

    public record TimetableSlotRequest(
        @Positive long offeringId,
        @NotBlank String dayOfWeek,
        @Min(1) @Max(10) int periodNumber,
        @NotBlank String startTime,
        @NotBlank String endTime,
        String room
    ) {}

    public record TimetableSlotUpdateRequest(
        @NotBlank String dayOfWeek,
        @Min(1) @Max(10) int periodNumber,
        @NotBlank String startTime,
        @NotBlank String endTime,
        String room,
        Boolean isActive
    ) {}

    public record ConductRequest(LocalDate date) {}

    public record CancelLectureRequest(
        @Positive long offeringId,
        @NotNull LocalDate date,
        @Min(1) @Max(10) int period,
        String reason
    ) {}

    private void require(boolean ok, HttpStatus status, String message) {
        if (!ok) throw new ResponseStatusException(status, message);
    }

    private String normalizeDay(String rawDay) {
        if (rawDay == null || rawDay.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Day of week is required");
        }
        String day = rawDay.trim();
        String normalized = day.substring(0, 1).toUpperCase() + day.substring(1).toLowerCase();
        require(VALID_DAYS.contains(normalized), HttpStatus.BAD_REQUEST,
            "Invalid day of week: " + rawDay + ". Expected Monday to Saturday.");
        return normalized;
    }

    private LocalTime parseTime(String timeStr, String fieldName) {
        try {
            if (timeStr.length() == 5) {
                return LocalTime.parse(timeStr + ":00");
            }
            return LocalTime.parse(timeStr);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid time format for " + fieldName + ": " + timeStr);
        }
    }

    private String getTodayDayName() {
        DayOfWeek dow = LocalDate.now().getDayOfWeek();
        if (dow == DayOfWeek.SUNDAY) {
            return "Sunday";
        }
        return dow.name().substring(0, 1).toUpperCase() + dow.name().substring(1).toLowerCase();
    }

    // -------------------------------------------------------------------------
    // ADMIN: Create Timetable Entry with Comprehensive Conflict Engine
    // -------------------------------------------------------------------------
    @PostMapping
    @Access("admin")
    public Map<String, Object> createEntry(@Valid @RequestBody TimetableSlotRequest req) {
        String day = normalizeDay(req.dayOfWeek());
        LocalTime start = parseTime(req.startTime(), "startTime");
        LocalTime end = parseTime(req.endTime(), "endTime");
        require(start.isBefore(end), HttpStatus.BAD_REQUEST, "Start time must be before end time");

        // Verify offering exists
        var offeringRows = db.queryForList("""
            SELECT o.id, o.section_id, o.academic_period_id, o.course_code, o.teacher_id,
                   s.name AS section_name, c.name AS course_name, t.name AS teacher_name
            FROM course_offerings o
            JOIN sections s ON s.id = o.section_id
            JOIN courses c ON c.code = o.course_code
            JOIN teachers t ON t.id = o.teacher_id
            WHERE o.id = ? FOR UPDATE
            """, req.offeringId());
        require(!offeringRows.isEmpty(), HttpStatus.NOT_FOUND, "Unknown course offering");
        var offering = offeringRows.get(0);

        long academicPeriodId = ((Number) offering.get("academic_period_id")).longValue();
        long sectionId = ((Number) offering.get("section_id")).longValue();
        String courseCode = (String) offering.get("course_code");
        String teacherId = (String) offering.get("teacher_id");
        String sectionName = (String) offering.get("section_name");
        String teacherName = (String) offering.get("teacher_name");

        // 1. Conflict Check: Section overlap (by period number OR overlapping clock time)
        var sectionOverlaps = db.queryForList("""
            SELECT te.id, te.course_code, c.name AS course_name, t.name AS teacher_name, te.start_time, te.end_time
            FROM timetable_entries te
            JOIN courses c ON c.code = te.course_code
            JOIN teachers t ON t.id = te.teacher_id
            WHERE te.academic_period_id = ? AND te.section_id = ? AND te.day_of_week = ?
              AND (te.period_number = ? OR (te.start_time < ? AND te.end_time > ?))
              AND te.is_active = 1
            FOR UPDATE
            """, academicPeriodId, sectionId, day, req.periodNumber(), Time.valueOf(end), Time.valueOf(start));
        if (!sectionOverlaps.isEmpty()) {
            var overlap = sectionOverlaps.get(0);
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Section conflict: Section '" + sectionName + "' already has " + overlap.get("course_code") +
                " (" + overlap.get("course_name") + ") scheduled on " + day + " Period " + req.periodNumber() +
                " (" + overlap.get("start_time") + " - " + overlap.get("end_time") + ")");
        }

        // 2. Conflict Check: Teacher overlap (by period number OR overlapping clock time)
        var teacherOverlaps = db.queryForList("""
            SELECT te.id, te.course_code, c.name AS course_name, s.name AS section_name, te.start_time, te.end_time
            FROM timetable_entries te
            JOIN courses c ON c.code = te.course_code
            JOIN sections s ON s.id = te.section_id
            WHERE te.academic_period_id = ? AND te.teacher_id = ? AND te.day_of_week = ?
              AND (te.period_number = ? OR (te.start_time < ? AND te.end_time > ?))
              AND te.is_active = 1
            FOR UPDATE
            """, academicPeriodId, teacherId, day, req.periodNumber(), Time.valueOf(end), Time.valueOf(start));
        if (!teacherOverlaps.isEmpty()) {
            var overlap = teacherOverlaps.get(0);
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Teacher conflict: Faculty " + teacherName + " is already assigned to " + overlap.get("course_code") +
                " in Section '" + overlap.get("section_name") + "' on " + day + " Period " + req.periodNumber() +
                " (" + overlap.get("start_time") + " - " + overlap.get("end_time") + ")");
        }

        // 3. Conflict Check: Room overlap (by period number OR overlapping clock time)
        String room = (req.room() != null && !req.room().trim().isEmpty()) ? req.room().trim() : null;
        if (room != null) {
            var roomOverlaps = db.queryForList("""
                SELECT te.id, te.course_code, c.name AS course_name, s.name AS section_name, t.name AS teacher_name, te.start_time, te.end_time
                FROM timetable_entries te
                JOIN courses c ON c.code = te.course_code
                JOIN sections s ON s.id = te.section_id
                JOIN teachers t ON t.id = te.teacher_id
                WHERE te.academic_period_id = ? AND LOWER(TRIM(te.room)) = LOWER(TRIM(?))
                  AND te.day_of_week = ?
                  AND (te.period_number = ? OR (te.start_time < ? AND te.end_time > ?))
                  AND te.is_active = 1
                FOR UPDATE
                """, academicPeriodId, room, day, req.periodNumber(), Time.valueOf(end), Time.valueOf(start));
            if (!roomOverlaps.isEmpty()) {
                var overlap = roomOverlaps.get(0);
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Room conflict: Room '" + room + "' is already occupied by Section '" + overlap.get("section_name") +
                    "' on " + day + " Period " + req.periodNumber() + " (" + overlap.get("start_time") + " - " + overlap.get("end_time") + ")");
            }
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        db.update(con -> {
            var ps = con.prepareStatement("""
                INSERT INTO timetable_entries(academic_period_id, section_id, offering_id, course_code, teacher_id, day_of_week, period_number, start_time, end_time, room, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                """, new String[]{"id"});
            ps.setLong(1, academicPeriodId);
            ps.setLong(2, sectionId);
            ps.setLong(3, req.offeringId());
            ps.setString(4, courseCode);
            ps.setString(5, teacherId);
            ps.setString(6, day);
            ps.setInt(7, req.periodNumber());
            ps.setTime(8, Time.valueOf(start));
            ps.setTime(9, Time.valueOf(end));
            ps.setString(10, room);
            return ps;
        }, keyHolder);

        Number newId = keyHolder.getKey();
        return Map.of("id", newId != null ? newId.longValue() : 0L, "message", "Timetable entry created successfully");
    }

    // -------------------------------------------------------------------------
    // ADMIN: Update Timetable Entry
    // -------------------------------------------------------------------------
    @PutMapping("/{id}")
    @Access("admin")
    public Map<String, Object> updateEntry(@PathVariable long id, @Valid @RequestBody TimetableSlotUpdateRequest req) {
        var existingRows = db.queryForList("SELECT * FROM timetable_entries WHERE id = ? FOR UPDATE", id);
        require(!existingRows.isEmpty(), HttpStatus.NOT_FOUND, "Timetable entry not found");
        var existing = existingRows.get(0);

        String day = normalizeDay(req.dayOfWeek());
        LocalTime start = parseTime(req.startTime(), "startTime");
        LocalTime end = parseTime(req.endTime(), "endTime");
        require(start.isBefore(end), HttpStatus.BAD_REQUEST, "Start time must be before end time");

        long academicPeriodId = ((Number) existing.get("academic_period_id")).longValue();
        long sectionId = ((Number) existing.get("section_id")).longValue();
        String teacherId = (String) existing.get("teacher_id");
        boolean active = req.isActive() != null ? req.isActive() : true;
        String room = (req.room() != null && !req.room().trim().isEmpty()) ? req.room().trim() : null;

        if (active) {
            // Check section conflict (period or overlapping clock times)
            var sOverlaps = db.queryForList("""
                SELECT te.id, te.course_code, c.name course_name FROM timetable_entries te
                JOIN courses c ON c.code = te.course_code
                WHERE te.id <> ? AND te.academic_period_id = ? AND te.section_id = ?
                  AND te.day_of_week = ?
                  AND (te.period_number = ? OR (te.start_time < ? AND te.end_time > ?))
                  AND te.is_active = 1
                """, id, academicPeriodId, sectionId, day, req.periodNumber(), Time.valueOf(end), Time.valueOf(start));
            if (!sOverlaps.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Section conflict: Section already has " + sOverlaps.get(0).get("course_code") + " at an overlapping time slot");
            }

            // Check teacher conflict (period or overlapping clock times)
            var tOverlaps = db.queryForList("""
                SELECT te.id, te.course_code FROM timetable_entries te
                WHERE te.id <> ? AND te.academic_period_id = ? AND te.teacher_id = ?
                  AND te.day_of_week = ?
                  AND (te.period_number = ? OR (te.start_time < ? AND te.end_time > ?))
                  AND te.is_active = 1
                """, id, academicPeriodId, teacherId, day, req.periodNumber(), Time.valueOf(end), Time.valueOf(start));
            if (!tOverlaps.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Teacher conflict: Faculty already assigned to a lecture at an overlapping time slot");
            }

            // Check room conflict (period or overlapping clock times)
            if (room != null) {
                var rOverlaps = db.queryForList("""
                    SELECT te.id FROM timetable_entries te
                    WHERE te.id <> ? AND te.academic_period_id = ? AND LOWER(TRIM(te.room)) = LOWER(TRIM(?))
                      AND te.day_of_week = ?
                      AND (te.period_number = ? OR (te.start_time < ? AND te.end_time > ?))
                      AND te.is_active = 1
                    """, id, academicPeriodId, room, day, req.periodNumber(), Time.valueOf(end), Time.valueOf(start));
                if (!rOverlaps.isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Room conflict: Room '" + room + "' is already occupied at an overlapping time slot");
                }
            }
        }

        db.update("""
            UPDATE timetable_entries 
            SET day_of_week = ?, period_number = ?, start_time = ?, end_time = ?, room = ?, is_active = ?
            WHERE id = ?
            """, day, req.periodNumber(), Time.valueOf(start), Time.valueOf(end), room, active ? 1 : 0, id);

        return Map.of("message", "Timetable entry updated successfully");
    }

    // -------------------------------------------------------------------------
    // ADMIN: Delete / Deactivate Timetable Entry
    // -------------------------------------------------------------------------
    @DeleteMapping("/{id}")
    @Access("admin")
    public Map<String, Object> deleteEntry(@PathVariable long id) {
        int deleted = db.update("DELETE FROM timetable_entries WHERE id = ?", id);
        require(deleted == 1, HttpStatus.NOT_FOUND, "Timetable entry not found");
        return Map.of("message", "Timetable entry deleted successfully");
    }

    // -------------------------------------------------------------------------
    // SECTION TIMETABLE (Admin, Faculty, Student in section)
    // -------------------------------------------------------------------------
    @GetMapping("/section/{sectionId}")
    @Access({"admin", "teacher", "student"})
    public List<Map<String, Object>> getSectionTimetable(@PathVariable long sectionId, @SessionAttribute Identity user) {
        if ("student".equals(user.role())) {
            var member = db.queryForList("""
                SELECT 1 FROM section_members sm
                JOIN course_enrollments ce ON ce.academic_period_id = sm.academic_period_id AND ce.student_id = sm.student_id
                JOIN course_offerings co ON co.id = ce.offering_id AND co.section_id = sm.section_id
                WHERE sm.student_id = ? AND sm.section_id = ? AND ce.status = 'Enrolled'
                """, user.studentId(), sectionId);
            require(!member.isEmpty(), HttpStatus.FORBIDDEN, "Access denied: Section is outside your active enrollment");

            return db.queryForList("""
                SELECT v.* FROM v_weekly_timetable v
                JOIN course_enrollments e ON e.offering_id = v.offering_id AND e.student_id = ? AND e.status = 'Enrolled'
                WHERE v.section_id = ? AND v.is_active = 1
                ORDER BY FIELD(v.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), v.period_number
                """, user.studentId(), sectionId);
        }

        return db.queryForList("""
            SELECT * FROM v_weekly_timetable
            WHERE section_id = ? AND is_active = 1
            ORDER BY FIELD(day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), period_number
            """, sectionId);
    }

    // -------------------------------------------------------------------------
    // ADMIN: Teacher-wise Timetable View
    // -------------------------------------------------------------------------
    @GetMapping("/teacher-schedule/{teacherId}")
    @Access("admin")
    public List<Map<String, Object>> getTeacherScheduleAdmin(@PathVariable String teacherId) {
        return db.queryForList("""
            SELECT * FROM v_weekly_timetable
            WHERE teacher_id = ? AND is_active = 1
            ORDER BY FIELD(day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), period_number
            """, teacherId);
    }

    // -------------------------------------------------------------------------
    // TEACHER & STUDENT: My Personal Schedule
    // -------------------------------------------------------------------------
    @GetMapping("/my-schedule")
    @Access({"teacher", "student"})
    public List<Map<String, Object>> getMySchedule(@SessionAttribute Identity user) {
        if ("teacher".equals(user.role())) {
            return db.queryForList("""
                SELECT * FROM v_weekly_timetable
                WHERE teacher_id = ? AND is_active = 1
                ORDER BY FIELD(day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), period_number
                """, user.teacherId());
        } else {
            return db.queryForList("""
                SELECT v.* FROM v_weekly_timetable v
                JOIN course_enrollments e ON e.offering_id = v.offering_id AND e.student_id = ? AND e.status = 'Enrolled'
                WHERE v.is_active = 1
                ORDER BY FIELD(v.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), v.period_number
                """, user.studentId());
        }
    }

    // -------------------------------------------------------------------------
    // TODAY'S SCHEDULE (Teacher & Student) with Live Conduction / Attendance Status
    // -------------------------------------------------------------------------
    @GetMapping("/today")
    @Access({"teacher", "student"})
    public Map<String, Object> getTodaySchedule(@SessionAttribute Identity user) {
        String today = getTodayDayName();
        LocalDate todayDate = LocalDate.now();

        List<Map<String, Object>> slots;
        if ("teacher".equals(user.role())) {
            slots = db.queryForList("""
                SELECT v.*,
                       s.id AS session_id,
                       s.submitted_at,
                       COALESCE(s.status, IF(s.id IS NOT NULL, 'Scheduled', 'Not Started')) AS attendance_status
                FROM v_weekly_timetable v
                LEFT JOIN attendance_sessions s ON s.offering_id = v.offering_id
                                                AND s.session_date = ?
                                                AND s.session_slot = v.period_number
                WHERE v.teacher_id = ? AND v.day_of_week = ? AND v.is_active = 1
                ORDER BY v.period_number
                """, todayDate, user.teacherId(), today);
        } else {
            slots = db.queryForList("""
                SELECT v.*,
                       s.id AS session_id,
                       s.submitted_at,
                       COALESCE(s.status, IF(s.id IS NOT NULL, 'Scheduled', 'Not Started')) AS attendance_status
                FROM v_weekly_timetable v
                JOIN course_enrollments e ON e.offering_id = v.offering_id AND e.student_id = ? AND e.status = 'Enrolled'
                LEFT JOIN attendance_sessions s ON s.offering_id = v.offering_id
                                                AND s.session_date = ?
                                                AND s.session_slot = v.period_number
                WHERE v.day_of_week = ? AND v.is_active = 1
                ORDER BY v.period_number
                """, todayDate, user.studentId(), today);
        }

        return Map.of(
            "dayOfWeek", today,
            "date", todayDate.toString(),
            "lectures", slots
        );
    }

    // -------------------------------------------------------------------------
    // TEACHER: Conduct Lecture directly from Timetable Slot
    // Connects recurring timetable slot -> live attendance session
    // -------------------------------------------------------------------------
    @PostMapping("/{id}/conduct")
    @Access("teacher")
    public Map<String, Object> conductLecture(
        @PathVariable long id,
        @RequestBody(required = false) ConductRequest req,
        @SessionAttribute Identity user
    ) {
        var slotRows = db.queryForList("""
            SELECT te.*, s.name AS section_name, c.name AS course_name
            FROM timetable_entries te
            JOIN sections s ON s.id = te.section_id
            JOIN courses c ON c.code = te.course_code
            WHERE te.id = ? AND te.is_active = 1
            FOR UPDATE
            """, id);
        require(!slotRows.isEmpty(), HttpStatus.NOT_FOUND, "Timetable slot not found or inactive");
        var slot = slotRows.get(0);

        require(user.teacherId().equals(slot.get("teacher_id")), HttpStatus.FORBIDDEN,
            "Unauthorized: This timetable lecture is outside your teaching assignments");

        LocalDate sessionDate = (req != null && req.date() != null) ? req.date() : LocalDate.now();
        int periodNumber = ((Number) slot.get("period_number")).intValue();
        long offeringId = ((Number) slot.get("offering_id")).longValue();
        String courseCode = (String) slot.get("course_code");
        long academicPeriodId = ((Number) slot.get("academic_period_id")).longValue();

        // Check if an attendance session already exists for this offering, date and slot
        var existingSessions = db.queryForList("""
            SELECT id, session_date, session_slot, submitted_at, status
            FROM attendance_sessions
            WHERE offering_id = ? AND session_date = ? AND session_slot = ?
            FOR UPDATE
            """, offeringId, sessionDate, periodNumber);

        long sessionId;
        Object submittedAt = null;
        String status = "Scheduled";

        if (!existingSessions.isEmpty()) {
            var existing = existingSessions.get(0);
            sessionId = ((Number) existing.get("id")).longValue();
            submittedAt = existing.get("submitted_at");
            status = (String) existing.get("status");
        } else {
            KeyHolder kh = new GeneratedKeyHolder();
            db.update(con -> {
                var ps = con.prepareStatement("""
                    INSERT INTO attendance_sessions(course_code, academic_period_id, teacher_id, offering_id, session_date, session_slot, session_type, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'Lecture', 'Scheduled')
                    """, new String[]{"id"});
                ps.setString(1, courseCode);
                ps.setLong(2, academicPeriodId);
                ps.setString(3, user.teacherId());
                ps.setLong(4, offeringId);
                ps.setDate(5, java.sql.Date.valueOf(sessionDate));
                ps.setInt(6, periodNumber);
                return ps;
            }, kh);
            Number generatedId = kh.getKey();
            sessionId = generatedId != null ? generatedId.longValue() : 0L;
        }

        return Map.of(
            "sessionId", sessionId,
            "offeringId", offeringId,
            "courseCode", courseCode,
            "periodNumber", periodNumber,
            "date", sessionDate.toString(),
            "submittedAt", submittedAt != null ? submittedAt.toString() : "",
            "status", status
        );
    }

    // -------------------------------------------------------------------------
    // TEACHER & ADMIN: Cancel a scheduled lecture instance
    // -------------------------------------------------------------------------
    @PostMapping("/cancel-lecture")
    @Access({"teacher", "admin"})
    public Map<String, Object> cancelLecture(@Valid @RequestBody CancelLectureRequest req, @SessionAttribute Identity user) {
        var offeringRows = db.queryForList("SELECT * FROM course_offerings WHERE id = ?", req.offeringId());
        require(!offeringRows.isEmpty(), HttpStatus.NOT_FOUND, "Unknown course offering");
        var offering = offeringRows.get(0);

        if ("teacher".equals(user.role())) {
            require(user.teacherId().equals(offering.get("teacher_id")), HttpStatus.FORBIDDEN,
                "Offering is outside your teaching assignments");
        }

        var existing = db.queryForList("""
            SELECT id, submitted_at, status FROM attendance_sessions
            WHERE offering_id = ? AND session_date = ? AND session_slot = ?
            FOR UPDATE
            """, req.offeringId(), req.date(), req.period());

        if (existing.isEmpty()) {
            db.update("""
                INSERT INTO attendance_sessions(course_code, academic_period_id, teacher_id, offering_id, session_date, session_slot, session_type, session_topic, status)
                VALUES (?, ?, ?, ?, ?, ?, 'Lecture', ?, 'Cancelled')
                """, offering.get("course_code"), offering.get("academic_period_id"), offering.get("teacher_id"),
                req.offeringId(), req.date(), req.period(), req.reason());
        } else {
            var session = existing.get(0);
            require(session.get("submitted_at") == null, HttpStatus.CONFLICT,
                "Cannot cancel a lecture that has already been conducted and submitted");
            db.update("UPDATE attendance_sessions SET status = 'Cancelled', session_topic = ? WHERE id = ?",
                req.reason(), session.get("id"));
        }

        return Map.of("message", "Lecture marked as cancelled successfully");
    }
}
