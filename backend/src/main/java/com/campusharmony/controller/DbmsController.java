package com.campusharmony.controller;

import com.campusharmony.dto.ApiResponse;
import com.campusharmony.service.DbmsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * DbmsController - Exposes REST endpoints to demonstrate and verify:
 * - Stored Procedures (Cursors & Batch Reports)
 * - Stored Functions (Grading & Averages)
 * - ACID Transactions (Multi-table Atomic Enrollment with rollback)
 * - Cache Reconciliation (Atomic Records vs Summary Cache)
 * - Academic Views (Summary, Roster, Transcript, Discrepancy)
 */
@RestController
@RequestMapping("/api/dbms")
public class DbmsController {

    private final DbmsService dbmsService;

    public DbmsController(DbmsService dbmsService) {
        this.dbmsService = dbmsService;
    }

    @GetMapping("/defaulters")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDefaulterReport(
            @RequestParam(defaultValue = "75.0") Double threshold) {
        List<Map<String, Object>> report = dbmsService.getDefaulterReport(threshold);
        return ResponseEntity.ok(ApiResponse.success(
                "Attendance defaulter audit report generated via stored procedure with cursor", report));
    }

    @PostMapping("/reconcile-attendance/{studentId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reconcileStudentAttendance(
            @PathVariable Long studentId) {
        Map<String, Object> result = dbmsService.reconcileStudentAttendance(studentId);
        return ResponseEntity.ok(ApiResponse.success(
                "Student attendance summary cache reconciled from atomic records", result));
    }

    @PostMapping("/reconcile-attendance/all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reconcileAllAttendance() {
        Map<String, Object> result = dbmsService.reconcileAllAttendance();
        return ResponseEntity.ok(ApiResponse.success(
                "All student attendance summary caches reconciled via cursor procedure", result));
    }

    @PostMapping("/transaction-enroll-demo")
    public ResponseEntity<ApiResponse<Map<String, Object>>> transactionEnrollDemo(
            @RequestParam String roll,
            @RequestParam String name,
            @RequestParam(defaultValue = "1") Integer departmentId,
            @RequestParam(defaultValue = "Computer Science") String department,
            @RequestParam(defaultValue = "1") Integer semester,
            @RequestParam String email,
            @RequestParam String phone,
            @RequestParam(defaultValue = "false") Boolean simulateError) {
        Map<String, Object> result = dbmsService.executeBatchEnrollmentTransaction(
                roll, name, departmentId, department, semester, email, phone, simulateError);
        return ResponseEntity.ok(ApiResponse.success(
                "Multi-table atomic enrollment executed", result));
    }

    @GetMapping("/views/attendance-summary")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAttendanceSummaryView() {
        return ResponseEntity.ok(ApiResponse.success(
                "Live attendance summary view retrieved", dbmsService.getAttendanceSummaryView()));
    }

    @GetMapping("/views/enrollment-roster")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getEnrollmentRosterView() {
        return ResponseEntity.ok(ApiResponse.success(
                "Course enrollment roster view retrieved", dbmsService.getEnrollmentRosterView()));
    }

    @GetMapping("/views/transcripts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAcademicTranscriptView(
            @RequestParam(required = false) Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Academic transcripts view retrieved", dbmsService.getAcademicTranscriptView(studentId)));
    }

    @GetMapping("/views/discrepancy-monitor")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCacheDiscrepancyView() {
        return ResponseEntity.ok(ApiResponse.success(
                "Attendance summary cache discrepancy diagnostic view retrieved", dbmsService.getCacheDiscrepancyView()));
    }
}
