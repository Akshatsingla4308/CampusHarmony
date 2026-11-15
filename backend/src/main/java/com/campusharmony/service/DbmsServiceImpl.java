package com.campusharmony.service;

import org.springframework.jdbc.core.CallableStatementCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.CallableStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Types;
import java.util.*;

@Service
public class DbmsServiceImpl implements DbmsService {

    private final JdbcTemplate jdbcTemplate;

    public DbmsServiceImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<Map<String, Object>> getDefaulterReport(Double threshold) {
        double thresh = threshold != null ? threshold : 75.0;
        return jdbcTemplate.execute("{CALL sp_generate_attendance_defaulter_report(?)}",
                (CallableStatementCallback<List<Map<String, Object>>>) cs -> {
                    cs.setDouble(1, thresh);
                    boolean hasResults = cs.execute();
                    List<Map<String, Object>> list = new ArrayList<>();
                    if (hasResults) {
                        try (ResultSet rs = cs.getResultSet()) {
                            ResultSetMetaData meta = rs.getMetaData();
                            int colCount = meta.getColumnCount();
                            while (rs.next()) {
                                Map<String, Object> row = new LinkedHashMap<>();
                                for (int i = 1; i <= colCount; i++) {
                                    row.put(meta.getColumnLabel(i), rs.getObject(i));
                                }
                                list.add(row);
                            }
                        }
                    }
                    return list;
                });
    }

    @Override
    public Map<String, Object> reconcileStudentAttendance(Long studentId) {
        return jdbcTemplate.execute("{CALL sp_reconcile_attendance_cache(?)}",
                (CallableStatementCallback<Map<String, Object>>) cs -> {
                    cs.setLong(1, studentId);
                    boolean hasResults = cs.execute();
                    Map<String, Object> map = new LinkedHashMap<>();
                    if (hasResults) {
                        try (ResultSet rs = cs.getResultSet()) {
                            if (rs.next()) {
                                ResultSetMetaData meta = rs.getMetaData();
                                for (int i = 1; i <= meta.getColumnCount(); i++) {
                                    map.put(meta.getColumnLabel(i), rs.getObject(i));
                                }
                            }
                        }
                    }
                    return map;
                });
    }

    @Override
    public Map<String, Object> reconcileAllAttendance() {
        return jdbcTemplate.execute("{CALL sp_reconcile_all_attendance_caches()}",
                (CallableStatementCallback<Map<String, Object>>) cs -> {
                    boolean hasResults = cs.execute();
                    Map<String, Object> map = new LinkedHashMap<>();
                    if (hasResults) {
                        try (ResultSet rs = cs.getResultSet()) {
                            if (rs.next()) {
                                map.put("summary", rs.getString(1));
                            }
                        }
                    }
                    return map;
                });
    }

    @Override
    public Map<String, Object> executeBatchEnrollmentTransaction(
            String roll, String name, Integer departmentId, String department,
            Integer semester, String email, String phone, Boolean simulateError) {

        return jdbcTemplate.execute(
                "{CALL sp_batch_enroll_student_with_transaction(?, ?, ?, ?, ?, ?, ?, ?, ?)}",
                (CallableStatementCallback<Map<String, Object>>) cs -> {
                    cs.setString(1, roll);
                    cs.setString(2, name);
                    cs.setInt(3, departmentId != null ? departmentId : 1);
                    cs.setString(4, department != null ? department : "Computer Science");
                    cs.setInt(5, semester != null ? semester : 1);
                    cs.setString(6, email);
                    cs.setString(7, phone);
                    cs.setBoolean(8, simulateError != null ? simulateError : false);
                    cs.registerOutParameter(9, Types.VARCHAR);

                    cs.execute();
                    String statusMessage = cs.getString(9);

                    Map<String, Object> response = new LinkedHashMap<>();
                    response.put("roll", roll);
                    response.put("name", name);
                    response.put("simulateError", simulateError);
                    response.put("statusMessage", statusMessage);
                    response.put("isSuccess", statusMessage != null && statusMessage.startsWith("TRANSACTION COMMITTED"));
                    return response;
                });
    }

    @Override
    public List<Map<String, Object>> getAttendanceSummaryView() {
        return jdbcTemplate.queryForList("SELECT * FROM v_student_attendance_summary ORDER BY roll ASC");
    }

    @Override
    public List<Map<String, Object>> getEnrollmentRosterView() {
        return jdbcTemplate.queryForList("SELECT * FROM v_course_enrollment_roster ORDER BY period_code, course_code, student_roll ASC");
    }

    @Override
    public List<Map<String, Object>> getAcademicTranscriptView(Long studentId) {
        if (studentId != null) {
            return jdbcTemplate.queryForList(
                    "SELECT t.* FROM v_student_academic_transcript t " +
                    "JOIN students s ON t.student_roll = s.roll " +
                    "WHERE s.id = ? ORDER BY t.academic_period, t.subject_name", studentId);
        }
        return jdbcTemplate.queryForList("SELECT * FROM v_student_academic_transcript ORDER BY student_roll, academic_period, subject_name");
    }

    @Override
    public List<Map<String, Object>> getCacheDiscrepancyView() {
        return jdbcTemplate.queryForList("SELECT * FROM v_attendance_cache_discrepancy ORDER BY student_id ASC");
    }
}
