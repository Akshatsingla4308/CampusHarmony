package com.campusharmony.controller;

import com.campusharmony.security.*;
import com.campusharmony.service.AttendanceAnalyticsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/academic/analytics")
public class AcademicAnalyticsController {

    private final AttendanceAnalyticsService analyticsService;

    public AcademicAnalyticsController(AttendanceAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    public record ThresholdUpdateRequest(
        @Positive @DecimalMin("1.0") @DecimalMax("100.0") double threshold
    ) {}

    // -------------------------------------------------------------------------
    // Threshold Configuration Endpoints
    // -------------------------------------------------------------------------
    @GetMapping("/threshold")
    @Access({"admin", "teacher", "student"})
    public Map<String, Object> getThreshold() {
        return Map.of("threshold", analyticsService.getThreshold());
    }

    @PutMapping("/threshold")
    @Access("admin")
    public Map<String, Object> updateThreshold(@Valid @RequestBody ThresholdUpdateRequest req) {
        analyticsService.updateThreshold(req.threshold());
        return Map.of("threshold", req.threshold(), "message", "Attendance threshold updated successfully");
    }

    // -------------------------------------------------------------------------
    // Admin Dashboard Endpoints
    // -------------------------------------------------------------------------
    @GetMapping("/admin/overview")
    @Access("admin")
    public Map<String, Object> getAdminOverview(
        @RequestParam(required = false) Long periodId,
        @RequestParam(required = false) Long departmentId,
        @RequestParam(required = false) Integer semester,
        @RequestParam(required = false) Long sectionId,
        @RequestParam(required = false) Long offeringId
    ) {
        return analyticsService.getAdminOverview(periodId, departmentId, semester, sectionId, offeringId);
    }

    @GetMapping("/admin/export-csv")
    @Access("admin")
    public ResponseEntity<byte[]> exportAdminDefaultersCsv(
        @RequestParam(required = false) Long periodId,
        @RequestParam(required = false) Long departmentId,
        @RequestParam(required = false) Integer semester,
        @RequestParam(required = false) Long sectionId,
        @RequestParam(required = false) Long offeringId
    ) {
        byte[] csvBytes = analyticsService.exportAdminDefaultersCsv(periodId, departmentId, semester, sectionId, offeringId);
        String filename = "attendance_defaulters_" + LocalDate.now() + ".csv";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csvBytes);
    }

    // -------------------------------------------------------------------------
    // Teacher Analytics Endpoints (Scoped to Authenticated Faculty)
    // -------------------------------------------------------------------------
    @GetMapping("/teacher/summary")
    @Access("teacher")
    public Map<String, Object> getTeacherAnalytics(
        @RequestParam(required = false) Long offeringId,
        @RequestParam(required = false) LocalDate startDate,
        @RequestParam(required = false) LocalDate endDate,
        @SessionAttribute Identity user
    ) {
        return analyticsService.getTeacherAnalytics(user.teacherId(), offeringId, startDate, endDate);
    }

    @GetMapping("/teacher/export-csv")
    @Access("teacher")
    public ResponseEntity<byte[]> exportTeacherCourseCsv(
        @RequestParam long offeringId,
        @SessionAttribute Identity user
    ) {
        byte[] csvBytes = analyticsService.exportTeacherCourseCsv(user.teacherId(), offeringId);
        String filename = "course_attendance_roster_" + offeringId + "_" + LocalDate.now() + ".csv";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csvBytes);
    }

    // -------------------------------------------------------------------------
    // Student Personal Attendance Insights Endpoints
    // -------------------------------------------------------------------------
    @GetMapping("/student/insights")
    @Access("student")
    public Map<String, Object> getStudentInsights(@SessionAttribute Identity user) {
        return analyticsService.getStudentInsights(user.studentId());
    }
}
