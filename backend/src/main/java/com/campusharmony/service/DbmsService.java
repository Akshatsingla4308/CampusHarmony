package com.campusharmony.service;

import java.util.List;
import java.util.Map;

public interface DbmsService {
    List<Map<String, Object>> getDefaulterReport(Double threshold);
    Map<String, Object> reconcileStudentAttendance(Long studentId);
    Map<String, Object> reconcileAllAttendance();
    Map<String, Object> executeBatchEnrollmentTransaction(
            String roll, String name, Integer departmentId, String department,
            Integer semester, String email, String phone, Boolean simulateError);
    List<Map<String, Object>> getAttendanceSummaryView();
    List<Map<String, Object>> getEnrollmentRosterView();
    List<Map<String, Object>> getAcademicTranscriptView(Long studentId);
    List<Map<String, Object>> getCacheDiscrepancyView();
}
