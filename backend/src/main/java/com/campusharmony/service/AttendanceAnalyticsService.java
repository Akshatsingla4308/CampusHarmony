package com.campusharmony.service;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AttendanceAnalyticsService {

    private final JdbcTemplate db;

    public AttendanceAnalyticsService(JdbcTemplate db) {
        this.db = db;
    }

    public record DefaulterRecord(
        long enrollmentId,
        long studentId,
        String roll,
        String name,
        String email,
        String gender,
        String department,
        String section,
        int semester,
        long offeringId,
        String courseCode,
        String courseName,
        String teacherName,
        int conductedLectures,
        int attendedLectures,
        int missedLectures,
        Double attendancePercentage,
        boolean isDefaulter,
        int classesNeededForThreshold
    ) {}

    // -------------------------------------------------------------------------
    // Configurable Attendance Threshold
    // -------------------------------------------------------------------------
    public double getThreshold() {
        try {
            var rows = db.queryForList(
                "SELECT setting_value FROM academic_settings WHERE setting_key = 'attendance_defaulter_threshold'",
                String.class
            );
            if (!rows.isEmpty() && rows.get(0) != null) {
                return Double.parseDouble(rows.get(0));
            }
        } catch (Exception ignored) {}
        return 75.0;
    }

    @Transactional
    public void updateThreshold(double threshold) {
        if (threshold <= 0.0 || threshold > 100.0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attendance threshold must be between 1.0 and 100.0%");
        }
        db.update("""
            INSERT INTO academic_settings (setting_key, setting_value, description)
            VALUES ('attendance_defaulter_threshold', ?, 'Minimum attendance percentage required to maintain good academic standing')
            ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = CURRENT_TIMESTAMP
            """, String.valueOf(threshold), String.valueOf(threshold));
    }

    public static int calculateShortfall(int attended, int conducted, double threshold) {
        if (conducted <= 0 || threshold <= 0) {
            return 0;
        }
        double currentPct = (attended * 100.0) / conducted;
        if (currentPct >= threshold) {
            return 0;
        }
        if (threshold >= 100.0) {
            return -1; // Mathematically impossible to reach 100% after missing any lecture
        }
        // Formula: (attended + x) / (conducted + x) >= T / 100
        // => x >= (T*conducted - 100*attended) / (100 - T)
        double needed = (threshold * conducted - 100.0 * attended) / (100.0 - threshold);
        return Math.max(0, (int) Math.ceil(needed));
    }

    // -------------------------------------------------------------------------
    // Admin Institutional Overview & Analytics
    // -------------------------------------------------------------------------
    public Map<String, Object> getAdminOverview(
        Long periodId,
        Long departmentId,
        Integer semester,
        Long sectionId,
        Long offeringId
    ) {
        double threshold = getThreshold();

        StringBuilder sql = new StringBuilder("SELECT * FROM v_student_course_attendance WHERE enrollment_status = 'Enrolled'");
        List<Object> params = new ArrayList<>();

        if (periodId != null && periodId > 0) {
            sql.append(" AND academic_period_id = ?");
            params.add(periodId);
        }
        if (departmentId != null && departmentId > 0) {
            sql.append(" AND department_id = ?");
            params.add(departmentId);
        }
        if (semester != null && semester > 0) {
            sql.append(" AND semester = ?");
            params.add(semester);
        }
        if (sectionId != null && sectionId > 0) {
            sql.append(" AND section_id = ?");
            params.add(sectionId);
        }
        if (offeringId != null && offeringId > 0) {
            sql.append(" AND offering_id = ?");
            params.add(offeringId);
        }

        sql.append(" ORDER BY department_name, section_name, course_code, roll");

        List<Map<String, Object>> rows = db.queryForList(sql.toString(), params.toArray());

        // Transform rows to structured domain records using Java Streams
        List<DefaulterRecord> records = rows.stream().map(r -> {
            int conducted = ((Number) r.get("conducted_lectures")).intValue();
            int attended = ((Number) r.get("attended_lectures")).intValue();
            int missed = ((Number) r.get("missed_lectures")).intValue();
            Double pct = r.get("attendance_percentage") != null ? ((Number) r.get("attendance_percentage")).doubleValue() : null;
            boolean isDefaulter = conducted > 0 && pct != null && pct < threshold;
            int shortfall = isDefaulter ? calculateShortfall(attended, conducted, threshold) : 0;

            return new DefaulterRecord(
                ((Number) r.get("enrollment_id")).longValue(),
                ((Number) r.get("student_id")).longValue(),
                (String) r.get("roll"),
                (String) r.get("student_name"),
                (String) r.get("student_email"),
                (String) r.get("gender"),
                (String) r.get("department_name"),
                (String) r.get("section_name"),
                ((Number) r.get("semester")).intValue(),
                ((Number) r.get("offering_id")).longValue(),
                (String) r.get("course_code"),
                (String) r.get("course_name"),
                (String) r.get("teacher_name"),
                conducted,
                attended,
                missed,
                pct,
                isDefaulter,
                shortfall
            );
        }).toList();

        // 1. Overall Institutional Aggregation using Streams
        long totalEnrollments = records.size();
        long totalDistinctStudents = records.stream().map(DefaulterRecord::studentId).distinct().count();
        List<DefaulterRecord> conductedRecords = records.stream().filter(r -> r.conductedLectures() > 0 && r.attendancePercentage() != null).toList();
        
        DoubleSummaryStatistics stats = conductedRecords.stream()
            .mapToDouble(DefaulterRecord::attendancePercentage)
            .summaryStatistics();
        double avgAttendance = conductedRecords.isEmpty() ? 0.0 : Math.round(stats.getAverage() * 100.0) / 100.0;

        List<DefaulterRecord> defaulters = records.stream()
            .filter(DefaulterRecord::isDefaulter)
            .sorted(Comparator.comparingDouble((DefaulterRecord r) -> r.attendancePercentage() != null ? r.attendancePercentage() : 0.0))
            .toList();

        int totalDefaulters = defaulters.size();
        double defaulterRate = totalEnrollments > 0 ? Math.round((totalDefaulters * 100.0 / totalEnrollments) * 10.0) / 10.0 : 0.0;

        // Total conducted sessions across all course offerings in scope
        Integer totalConductedLectures = db.queryForObject("""
            SELECT COUNT(DISTINCT id) FROM attendance_sessions
            WHERE submitted_at IS NOT NULL AND status != 'Cancelled'
            """, Integer.class);

        // 2. Department Breakdown via Stream Grouping
        Map<String, List<DefaulterRecord>> byDept = records.stream().collect(Collectors.groupingBy(DefaulterRecord::department));
        List<Map<String, Object>> departmentStats = byDept.entrySet().stream().map(e -> {
            String deptName = e.getKey();
            List<DefaulterRecord> list = e.getValue();
            var cond = list.stream().filter(r -> r.conductedLectures() > 0 && r.attendancePercentage() != null).toList();
            double avg = cond.isEmpty() ? 0.0 : Math.round(cond.stream().mapToDouble(DefaulterRecord::attendancePercentage).average().orElse(0.0) * 10.0) / 10.0;
            long defCount = list.stream().filter(DefaulterRecord::isDefaulter).count();
            return Map.<String, Object>of(
                "department", deptName,
                "totalEnrollments", list.size(),
                "studentsCount", list.stream().map(DefaulterRecord::studentId).distinct().count(),
                "avgAttendance", avg,
                "defaultersCount", defCount
            );
        }).sorted(Comparator.comparing(m -> (String) m.get("department"))).toList();

        // 3. Section Breakdown via Stream Grouping
        Map<String, List<DefaulterRecord>> bySection = records.stream().collect(Collectors.groupingBy(DefaulterRecord::section));
        List<Map<String, Object>> sectionStats = bySection.entrySet().stream().map(e -> {
            String secName = e.getKey();
            List<DefaulterRecord> list = e.getValue();
            var cond = list.stream().filter(r -> r.conductedLectures() > 0 && r.attendancePercentage() != null).toList();
            double avg = cond.isEmpty() ? 0.0 : Math.round(cond.stream().mapToDouble(DefaulterRecord::attendancePercentage).average().orElse(0.0) * 10.0) / 10.0;
            long defCount = list.stream().filter(DefaulterRecord::isDefaulter).count();
            int sem = list.isEmpty() ? 1 : list.get(0).semester();
            return Map.<String, Object>of(
                "section", secName,
                "semester", sem,
                "totalEnrollments", list.size(),
                "studentsCount", list.stream().map(DefaulterRecord::studentId).distinct().count(),
                "avgAttendance", avg,
                "defaultersCount", defCount
            );
        }).sorted(Comparator.comparing(m -> (String) m.get("section"))).toList();

        // 4. Course Breakdown via Stream Grouping
        Map<String, List<DefaulterRecord>> byCourse = records.stream().collect(Collectors.groupingBy(DefaulterRecord::courseCode));
        List<Map<String, Object>> courseStats = byCourse.entrySet().stream().map(e -> {
            String cCode = e.getKey();
            List<DefaulterRecord> list = e.getValue();
            String cName = list.isEmpty() ? "" : list.get(0).courseName();
            var cond = list.stream().filter(r -> r.conductedLectures() > 0 && r.attendancePercentage() != null).toList();
            double avg = cond.isEmpty() ? 0.0 : Math.round(cond.stream().mapToDouble(DefaulterRecord::attendancePercentage).average().orElse(0.0) * 10.0) / 10.0;
            long defCount = list.stream().filter(DefaulterRecord::isDefaulter).count();
            int maxConducted = list.stream().mapToInt(DefaulterRecord::conductedLectures).max().orElse(0);
            return Map.<String, Object>of(
                "courseCode", cCode,
                "courseName", cName,
                "conductedLectures", maxConducted,
                "totalEnrollments", list.size(),
                "avgAttendance", avg,
                "defaultersCount", defCount
            );
        }).sorted(Comparator.comparing(m -> (String) m.get("courseCode"))).toList();

        return Map.of(
            "threshold", threshold,
            "overall", Map.of(
                "totalStudents", totalDistinctStudents,
                "totalEnrollments", totalEnrollments,
                "totalConductedLectures", totalConductedLectures != null ? totalConductedLectures : 0,
                "averageAttendance", avgAttendance,
                "defaultersCount", totalDefaulters,
                "defaulterRate", defaulterRate
            ),
            "departmentStats", departmentStats,
            "sectionStats", sectionStats,
            "courseStats", courseStats,
            "defaulters", defaulters
        );
    }

    // -------------------------------------------------------------------------
    // Admin CSV Export using Java File/Stream Handling
    // -------------------------------------------------------------------------
    public byte[] exportAdminDefaultersCsv(
        Long periodId,
        Long departmentId,
        Integer semester,
        Long sectionId,
        Long offeringId
    ) {
        var overview = getAdminOverview(periodId, departmentId, semester, sectionId, offeringId);
        @SuppressWarnings("unchecked")
        List<DefaulterRecord> defaulters = (List<DefaulterRecord>) overview.get("defaulters");
        double threshold = (double) overview.get("threshold");

        StringBuilder sb = new StringBuilder();
        sb.append("Roll Number,Student Name,Department,Section,Semester,Course Code,Course Name,Faculty,Conducted Lectures,Attended Lectures,Missed Lectures,Attendance %,Threshold,Status,Classes Needed for Threshold\n");

        for (DefaulterRecord d : defaulters) {
            sb.append(escapeCsv(d.roll())).append(",")
              .append(escapeCsv(d.name())).append(",")
              .append(escapeCsv(d.department())).append(",")
              .append(escapeCsv(d.section())).append(",")
              .append(d.semester()).append(",")
              .append(escapeCsv(d.courseCode())).append(",")
              .append(escapeCsv(d.courseName())).append(",")
              .append(escapeCsv(d.teacherName())).append(",")
              .append(d.conductedLectures()).append(",")
              .append(d.attendedLectures()).append(",")
              .append(d.missedLectures()).append(",")
              .append(d.attendancePercentage() != null ? d.attendancePercentage() : "N/A").append(",")
              .append(threshold).append("%,")
              .append("Defaulter").append(",")
              .append(d.classesNeededForThreshold()).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    // -------------------------------------------------------------------------
    // Teacher Attendance Analytics (Scoped to Teacher Offerings)
    // -------------------------------------------------------------------------
    public Map<String, Object> getTeacherAnalytics(
        String teacherId,
        Long offeringId,
        LocalDate startDate,
        LocalDate endDate
    ) {
        double threshold = getThreshold();

        // 1. Fetch teacher's assigned offerings
        var myOfferings = db.queryForList("""
            SELECT o.id, o.section_id, s.name section_name, c.name course_name, c.code course_code,
                   t.code term, d.code department, s.semester, o.teacher_id
            FROM course_offerings o 
            JOIN sections s ON s.id=o.section_id 
            JOIN departments d ON d.id=s.department_id
            JOIN courses c ON c.code=o.course_code 
            JOIN academic_periods t ON t.id=o.academic_period_id
            WHERE o.teacher_id = ?
            ORDER BY s.name, c.name
            """, teacherId);

        if (myOfferings.isEmpty()) {
            return Map.of(
                "threshold", threshold,
                "offerings", List.of(),
                "roster", List.of(),
                "history", List.of(),
                "summary", Map.of("conducted", 0, "enrolled", 0, "avgPercentage", 0.0, "defaulters", 0)
            );
        }

        // Determine target offering
        long targetOfferingId = (offeringId != null && offeringId > 0) ? offeringId : ((Number) myOfferings.get(0).get("id")).longValue();

        // Validate teacher ownership
        boolean owns = myOfferings.stream().anyMatch(o -> ((Number) o.get("id")).longValue() == targetOfferingId);
        if (!owns) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Offering is outside your teaching assignments");
        }

        // 2. Fetch student roster with live attendance counts
        var rosterRows = db.queryForList("""
            SELECT * FROM v_student_course_attendance
            WHERE offering_id = ? AND enrollment_status = 'Enrolled'
            ORDER BY roll
            """, targetOfferingId);

        List<Map<String, Object>> roster = rosterRows.stream().map(r -> {
            int conducted = ((Number) r.get("conducted_lectures")).intValue();
            int attended = ((Number) r.get("attended_lectures")).intValue();
            int missed = ((Number) r.get("missed_lectures")).intValue();
            Double pct = r.get("attendance_percentage") != null ? ((Number) r.get("attendance_percentage")).doubleValue() : null;
            boolean isDefaulter = conducted > 0 && pct != null && pct < threshold;
            int shortfall = isDefaulter ? calculateShortfall(attended, conducted, threshold) : 0;

            String statusStr = conducted == 0 ? "No Lectures Conducted" : isDefaulter ? "Defaulter" : "Good Standing";

            Map<String, Object> map = new HashMap<>(r);
            map.put("is_defaulter", isDefaulter);
            map.put("shortfall", shortfall);
            map.put("status_label", statusStr);
            return map;
        }).toList();

        // 3. Fetch lecture history for this offering
        StringBuilder histSql = new StringBuilder("""
            SELECT s.id, s.session_date, s.session_slot, s.session_type, s.session_topic, s.submitted_at, s.status,
                   COUNT(r.id) total_records,
                   COUNT(CASE WHEN r.status = 'Present' THEN 1 END) present_count,
                   ROUND(100.0 * COUNT(CASE WHEN r.status = 'Present' THEN 1 END) / NULLIF(COUNT(r.id), 0), 1) attendance_pct
            FROM attendance_sessions s
            LEFT JOIN attendance_records r ON r.session_id = s.id
            WHERE s.offering_id = ?
            """);
        List<Object> histParams = new ArrayList<>();
        histParams.add(targetOfferingId);

        if (startDate != null) {
            histSql.append(" AND s.session_date >= ?");
            histParams.add(startDate);
        }
        if (endDate != null) {
            histSql.append(" AND s.session_date <= ?");
            histParams.add(endDate);
        }

        histSql.append(" GROUP BY s.id, s.session_date, s.session_slot, s.session_type, s.session_topic, s.submitted_at, s.status");
        histSql.append(" ORDER BY s.session_date DESC, s.session_slot DESC");

        List<Map<String, Object>> history = db.queryForList(histSql.toString(), histParams.toArray());

        // 4. Offering summary
        int totalEnrolled = roster.size();
        int conductedLectures = (int) history.stream()
            .filter(h -> h.get("submitted_at") != null && !"Cancelled".equalsIgnoreCase((String) h.get("status")))
            .count();
        var condRoster = roster.stream().filter(r -> ((Number) r.get("conducted_lectures")).intValue() > 0 && r.get("attendance_percentage") != null).toList();
        double avgPct = condRoster.isEmpty() ? 0.0 : Math.round(condRoster.stream().mapToDouble(r -> ((Number) r.get("attendance_percentage")).doubleValue()).average().orElse(0.0) * 10.0) / 10.0;
        long defCount = roster.stream().filter(r -> Boolean.TRUE.equals(r.get("is_defaulter"))).count();

        return Map.of(
            "threshold", threshold,
            "selectedOfferingId", targetOfferingId,
            "offerings", myOfferings,
            "roster", roster,
            "history", history,
            "summary", Map.of(
                "totalEnrolled", totalEnrolled,
                "conductedLectures", conductedLectures,
                "avgPercentage", avgPct,
                "defaultersCount", defCount
            )
        );
    }

    // -------------------------------------------------------------------------
    // Teacher Course CSV Export
    // -------------------------------------------------------------------------
    public byte[] exportTeacherCourseCsv(String teacherId, long offeringId) {
        var analytics = getTeacherAnalytics(teacherId, offeringId, null, null);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> roster = (List<Map<String, Object>>) analytics.get("roster");
        double threshold = (double) analytics.get("threshold");

        StringBuilder sb = new StringBuilder();
        sb.append("Roll Number,Student Name,Email,Gender,Conducted Lectures,Attended Lectures,Missed Lectures,Attendance %,Threshold,Status,Classes Needed for Threshold\n");

        for (var r : roster) {
            sb.append(escapeCsv((String) r.get("roll"))).append(",")
              .append(escapeCsv((String) r.get("student_name"))).append(",")
              .append(escapeCsv((String) r.get("student_email"))).append(",")
              .append(escapeCsv((String) r.get("gender"))).append(",")
              .append(r.get("conducted_lectures")).append(",")
              .append(r.get("attended_lectures")).append(",")
              .append(r.get("missed_lectures")).append(",")
              .append(r.get("attendance_percentage") != null ? r.get("attendance_percentage") : "N/A").append(",")
              .append(threshold).append("%,")
              .append(r.get("status_label")).append(",")
              .append(r.get("shortfall")).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    // -------------------------------------------------------------------------
    // Student Personal Attendance Insights
    // -------------------------------------------------------------------------
    public Map<String, Object> getStudentInsights(long studentId) {
        double threshold = getThreshold();

        // 1. Fetch courses the student is actively enrolled in
        var courseRows = db.queryForList("""
            SELECT sa.* FROM v_student_course_attendance sa
            WHERE sa.student_id = ? AND sa.enrollment_status = 'Enrolled'
            ORDER BY sa.course_code
            """, studentId);

        List<Map<String, Object>> courses = new ArrayList<>();

        for (var row : courseRows) {
            long offeringId = ((Number) row.get("offering_id")).longValue();
            long enrollmentId = ((Number) row.get("enrollment_id")).longValue();
            int conducted = ((Number) row.get("conducted_lectures")).intValue();
            int attended = ((Number) row.get("attended_lectures")).intValue();
            int missed = ((Number) row.get("missed_lectures")).intValue();
            Double pct = row.get("attendance_percentage") != null ? ((Number) row.get("attendance_percentage")).doubleValue() : null;

            boolean isDefaulter = conducted > 0 && pct != null && pct < threshold;
            int shortfall = isDefaulter ? calculateShortfall(attended, conducted, threshold) : 0;
            String status = conducted == 0 ? "No Lectures Conducted" : isDefaulter ? "Defaulter" : "Good Standing";

            // 2. Fetch student's lecture-by-lecture history for this offering
            var lectureHistory = db.queryForList("""
                SELECT s.id, s.session_date, s.session_slot, s.session_type, s.session_topic,
                       r.status AS attendance_status, s.submitted_at
                FROM attendance_sessions s
                JOIN attendance_records r ON r.session_id = s.id AND r.enrollment_id = ?
                WHERE s.offering_id = ? AND s.submitted_at IS NOT NULL AND s.status != 'Cancelled'
                ORDER BY s.session_date DESC, s.session_slot DESC
                LIMIT 20
                """, enrollmentId, offeringId);

            Map<String, Object> courseCard = new HashMap<>(row);
            courseCard.put("threshold", threshold);
            courseCard.put("status_label", status);
            courseCard.put("is_defaulter", isDefaulter);
            courseCard.put("classes_needed_for_threshold", shortfall);
            courseCard.put("shortfall_note", shortfall == -1 
                ? "100% threshold cannot be mathematically achieved once a lecture has been missed" 
                : "Estimate assuming 100% attendance in future eligible lectures");
            courseCard.put("history", lectureHistory);
            courses.add(courseCard);
        }

        // Summary metrics
        int totalEnrolledCourses = courses.size();
        List<Map<String, Object>> activeCourses = courses.stream()
            .filter(c -> ((Number) c.get("conducted_lectures")).intValue() > 0 && c.get("attendance_percentage") != null)
            .toList();
        double overallPct = activeCourses.isEmpty() ? 0.0 :
            Math.round(activeCourses.stream().mapToDouble(c -> ((Number) c.get("attendance_percentage")).doubleValue()).average().orElse(0.0) * 10.0) / 10.0;
        long defaulterCount = courses.stream().filter(c -> Boolean.TRUE.equals(c.get("is_defaulter"))).count();

        return Map.of(
            "threshold", threshold,
            "overallPercentage", overallPct,
            "enrolledCoursesCount", totalEnrolledCourses,
            "defaulterCoursesCount", defaulterCount,
            "courses", courses
        );
    }

    private static String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n") || val.contains("\r")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}
