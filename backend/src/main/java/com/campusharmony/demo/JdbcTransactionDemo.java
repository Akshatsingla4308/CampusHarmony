package com.campusharmony.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Demonstrates Core Java JDBC & ACID Transaction Management:
 * - Connection, PreparedStatement, ResultSet
 * - Explicit Transaction Control: setAutoCommit(false), commit(), rollback()
 * - Savepoints for partial rollbacks
 * - Deterministic error simulation and rollback verification
 */
@Component
public class JdbcTransactionDemo {

    private static final Logger log = LoggerFactory.getLogger(JdbcTransactionDemo.class);
    private final DataSource dataSource;

    public JdbcTransactionDemo(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Executes an atomic multi-table student enrollment with direct JDBC.
     * If shouldFail is true, intentionally simulates an invalid SQL statement to verify rollback.
     */
    public Map<String, Object> executeDirectJdbcTransaction(
            String roll, String name, int deptId, int semester, String email, String phone, boolean shouldFail) {

        Map<String, Object> result = new LinkedHashMap<>();
        Connection conn = null;

        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false); // Step 1: Begin manual transaction

            long newStudentId;

            // Step 2: Insert into students
            String sqlStudent = "INSERT INTO students (roll, name, department_id, department, semester, email, phone, status, gender, created_at) " +
                                "VALUES (?, ?, ?, 'Computer Science', ?, ?, ?, 'Active', 'Other', NOW())";
            try (PreparedStatement ps = conn.prepareStatement(sqlStudent, Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, roll);
                ps.setString(2, name);
                ps.setInt(3, deptId);
                ps.setInt(4, semester);
                ps.setString(5, email);
                ps.setString(6, phone);
                ps.executeUpdate();

                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) {
                        newStudentId = rs.getLong(1);
                    } else {
                        throw new SQLException("Failed to obtain generated student ID.");
                    }
                }
            }

            // Step 3: Insert initial attendance summary row
            String sqlAtt = "INSERT INTO attendance (student_id, total_days, present_days, absent_days, last_marked) VALUES (?, 0, 0, 0, '—')";
            try (PreparedStatement ps = conn.prepareStatement(sqlAtt)) {
                ps.setLong(1, newStudentId);
                ps.executeUpdate();
            }

            // Step 4: Insert initial marks row
            String sqlMarks = "INSERT INTO marks (student_id, mathematics, physics, chemistry, english, computer_science) VALUES (?, NULL, NULL, NULL, NULL, NULL)";
            try (PreparedStatement ps = conn.prepareStatement(sqlMarks)) {
                ps.setLong(1, newStudentId);
                ps.executeUpdate();
            }

            // Step 5: Intentional error simulation for viva verification
            if (shouldFail) {
                log.info("Simulating intentional SQL constraint violation for transaction rollback...");
                String sqlBad = "INSERT INTO students (roll, name, department_id, department, semester, email, phone, status, gender) " +
                                "VALUES ('ERR-FAIL', 'Ghost', 99999, 'NonExistent', 99, 'bad@email', '000', 'Active', 'Other')";
                try (PreparedStatement ps = conn.prepareStatement(sqlBad)) {
                    ps.executeUpdate(); // Will fail foreign key or check constraint
                }
            }

            // Step 6: Commit transaction
            conn.commit();
            result.put("status", "SUCCESS");
            result.put("message", "Direct JDBC transaction successfully committed all dependent tables.");
            result.put("studentId", newStudentId);
            result.put("roll", roll);

        } catch (SQLException e) {
            log.warn("JDBC Transaction Exception caught: {}. Rolling back...", e.getMessage());
            if (conn != null) {
                try {
                    conn.rollback(); // Safe rollback
                    result.put("status", "ROLLED_BACK");
                    result.put("message", "Transaction safely rolled back on error: " + e.getMessage());
                } catch (SQLException ex) {
                    log.error("Failed to rollback JDBC transaction", ex);
                }
            }
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException e) {
                    log.error("Error closing JDBC connection", e);
                }
            }
        }

        return result;
    }

    /**
     * Demonstrates direct JDBC DQL query execution with PreparedStatement and ResultSet mapping.
     */
    public List<Map<String, Object>> queryStudentsByDepartment(String deptName) {
        List<Map<String, Object>> rows = new ArrayList<>();
        String sql = "SELECT s.id, s.roll, s.name, s.department, s.semester, s.email, a.total_days, a.present_days " +
                     "FROM students s " +
                     "LEFT JOIN attendance a ON s.id = a.student_id " +
                     "WHERE s.department = ? " +
                     "ORDER BY s.roll ASC";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, deptName);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getLong("id"));
                    map.put("roll", rs.getString("roll"));
                    map.put("name", rs.getString("name"));
                    map.put("department", rs.getString("department"));
                    map.put("semester", rs.getInt("semester"));
                    map.put("email", rs.getString("email"));
                    map.put("totalDays", rs.getInt("total_days"));
                    map.put("presentDays", rs.getInt("present_days"));
                    rows.add(map);
                }
            }
        } catch (SQLException e) {
            log.error("Error executing direct JDBC query", e);
        }

        return rows;
    }
}
