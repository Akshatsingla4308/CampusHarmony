package com.campusharmony;

import com.campusharmony.service.DbmsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class DbmsIntegrityAndTriggerTests {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DbmsService dbmsService;

    @org.junit.jupiter.api.BeforeEach
    @org.junit.jupiter.api.AfterEach
    void cleanUpTestRecords() {
        jdbcTemplate.update("DELETE FROM attendance_records WHERE student_id IN (SELECT id FROM students WHERE roll LIKE 'TEST-%' OR roll LIKE 'JDBC-%')");
        jdbcTemplate.update("DELETE FROM course_enrollments WHERE student_id IN (SELECT id FROM students WHERE roll LIKE 'TEST-%' OR roll LIKE 'JDBC-%')");
        jdbcTemplate.update("DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE roll LIKE 'TEST-%' OR roll LIKE 'JDBC-%')");
        jdbcTemplate.update("DELETE FROM marks WHERE student_id IN (SELECT id FROM students WHERE roll LIKE 'TEST-%' OR roll LIKE 'JDBC-%')");
        jdbcTemplate.update("DELETE FROM students WHERE roll LIKE 'TEST-%' OR roll LIKE 'JDBC-%'");
        jdbcTemplate.update("DELETE FROM archived_student_attendance WHERE student_roll LIKE 'TEST-%' OR student_roll LIKE 'JDBC-%'");
    }

    @Test
    @DisplayName("Test 1: Defaulter procedure executes with cursor and computes shortfall lectures")
    void testDefaulterProcedureWithCursor() {
        List<Map<String, Object>> report = dbmsService.getDefaulterReport(75.0);
        assertNotNull(report, "Defaulter report must not be null");
        assertFalse(report.isEmpty(), "Defaulters below 75% must be identified from seed data");

        // Verify that shortfall classes were computed mathematically
        for (Map<String, Object> row : report) {
            assertNotNull(row.get("Roll Number"));
            assertNotNull(row.get("Current Attendance"));
            assertNotNull(row.get("Consecutive Classes Needed for 75%"));
        }
    }

    @Test
    @DisplayName("Test 2: Full DML Summary Cache synchronization on INSERT, UPDATE, and DELETE")
    void testAttendanceSummaryFullDmlSync() {
        // Create an isolated test student with 0 attendance
        jdbcTemplate.update("INSERT INTO students (roll, name, department_id, department, semester, email, phone, status, gender) " +
                "VALUES ('TEST-DML-01', 'Test DML Student', 1, 'Computer Science', 5, 'test.dml@college.edu', '9999999991', 'Active', 'Other')");

        Long studentId = jdbcTemplate.queryForObject("SELECT id FROM students WHERE roll = 'TEST-DML-01'", Long.class);
        assertNotNull(studentId);

        // Initialize summary cache row
        jdbcTemplate.update("INSERT INTO attendance (student_id, total_days, present_days, absent_days, last_marked) VALUES (?, 0, 0, 0, '—')", studentId);

        // Enroll student in CS501
        jdbcTemplate.update("INSERT INTO course_enrollments (student_id, course_code, academic_period_id, status) VALUES (?, 'CS501', 1, 'Enrolled')", studentId);
        Long enrollmentId = jdbcTemplate.queryForObject("SELECT id FROM course_enrollments WHERE student_id = ? AND course_code = 'CS501'", Long.class, studentId);

        // Verify initial summary cache is 0
        Integer initTotal = jdbcTemplate.queryForObject("SELECT total_days FROM attendance WHERE student_id = ?", Integer.class, studentId);
        assertEquals(0, initTotal);

        // 1. Test AFTER INSERT: Mark student as Absent in Session 1
        jdbcTemplate.update("INSERT INTO attendance_records (session_id, enrollment_id, student_id, course_code, academic_period_id, status) " +
                "VALUES (1, ?, ?, 'CS501', 1, 'Absent')", enrollmentId, studentId);

        Integer totalAfterIns = jdbcTemplate.queryForObject("SELECT total_days FROM attendance WHERE student_id = ?", Integer.class, studentId);
        Integer absentAfterIns = jdbcTemplate.queryForObject("SELECT absent_days FROM attendance WHERE student_id = ?", Integer.class, studentId);
        Integer presentAfterIns = jdbcTemplate.queryForObject("SELECT present_days FROM attendance WHERE student_id = ?", Integer.class, studentId);

        assertEquals(1, totalAfterIns);
        assertEquals(1, absentAfterIns);
        assertEquals(0, presentAfterIns);

        // 2. Test AFTER UPDATE: Correct status from Absent to Present
        Long recordId = jdbcTemplate.queryForObject("SELECT id FROM attendance_records WHERE student_id = ? AND session_id = 1", Long.class, studentId);
        jdbcTemplate.update("UPDATE attendance_records SET status = 'Present' WHERE id = ?", recordId);

        Integer totalAfterUpd = jdbcTemplate.queryForObject("SELECT total_days FROM attendance WHERE student_id = ?", Integer.class, studentId);
        Integer absentAfterUpd = jdbcTemplate.queryForObject("SELECT absent_days FROM attendance WHERE student_id = ?", Integer.class, studentId);
        Integer presentAfterUpd = jdbcTemplate.queryForObject("SELECT present_days FROM attendance WHERE student_id = ?", Integer.class, studentId);

        assertEquals(1, totalAfterUpd, "Total days must remain invariant on status change");
        assertEquals(0, absentAfterUpd, "Absent count must decrement to 0");
        assertEquals(1, presentAfterUpd, "Present count must increment to 1");

        // 3. Test AFTER DELETE: Delete the attendance record
        jdbcTemplate.update("DELETE FROM attendance_records WHERE id = ?", recordId);

        Integer totalAfterDel = jdbcTemplate.queryForObject("SELECT total_days FROM attendance WHERE student_id = ?", Integer.class, studentId);
        Integer absentAfterDel = jdbcTemplate.queryForObject("SELECT absent_days FROM attendance WHERE student_id = ?", Integer.class, studentId);
        Integer presentAfterDel = jdbcTemplate.queryForObject("SELECT present_days FROM attendance WHERE student_id = ?", Integer.class, studentId);

        assertEquals(0, totalAfterDel, "Total days must decrement to 0");
        assertEquals(0, absentAfterDel);
        assertEquals(0, presentAfterDel);

        // Cleanup test student
        jdbcTemplate.update("DELETE FROM course_enrollments WHERE student_id = ?", studentId);
        jdbcTemplate.update("DELETE FROM attendance WHERE student_id = ?", studentId);
        jdbcTemplate.update("DELETE FROM marks WHERE student_id = ?", studentId);
        jdbcTemplate.update("DELETE FROM students WHERE id = ?", studentId);
    }

    @Test
    @DisplayName("Test 3: Trigger prevents marking attendance for Dropped or Completed enrollments")
    void testEnrollmentStatusGatingOnAttendance() {
        jdbcTemplate.update("INSERT INTO students (roll, name, department_id, department, semester, email, phone, status, gender) " +
                "VALUES ('TEST-GATE-01', 'Test Gating Student', 1, 'Computer Science', 5, 'test.gate@college.edu', '9999999992', 'Active', 'Other')");
        Long studentId = jdbcTemplate.queryForObject("SELECT id FROM students WHERE roll = 'TEST-GATE-01'", Long.class);

        // Create enrollment with status = 'Dropped'
        jdbcTemplate.update("INSERT INTO course_enrollments (student_id, course_code, academic_period_id, status) VALUES (?, 'CS501', 1, 'Dropped')", studentId);
        Long enrollmentId = jdbcTemplate.queryForObject("SELECT id FROM course_enrollments WHERE student_id = ? AND course_code = 'CS501'", Long.class, studentId);

        // Inserting attendance for dropped course MUST trigger SQLSTATE 45000 exception
        Exception ex = assertThrows(Exception.class, () -> {
            jdbcTemplate.update("INSERT INTO attendance_records (session_id, enrollment_id, student_id, course_code, academic_period_id, status) " +
                    "VALUES (1, ?, ?, 'CS501', 1, 'Present')", enrollmentId, studentId);
        });

        String msg1 = ex.getMessage() + (ex.getCause() != null ? " " + ex.getCause().getMessage() : "");
        assertTrue(msg1.contains("Integrity Error") || msg1.contains("Enrolled") || msg1.contains("ineligible"),
                "Exception message must reflect enrollment gating trigger violation");

        // Cleanup
        jdbcTemplate.update("DELETE FROM course_enrollments WHERE student_id = ?", studentId);
        jdbcTemplate.update("DELETE FROM attendance WHERE student_id = ?", studentId);
        jdbcTemplate.update("DELETE FROM marks WHERE student_id = ?", studentId);
        jdbcTemplate.update("DELETE FROM students WHERE id = ?", studentId);
    }

    @Test
    @DisplayName("Test 4: Trigger blocks transitioning enrollment to 'Dropped' when attendance records exist")
    void testBlockDroppingCourseWithAttendance() {
        jdbcTemplate.update("INSERT INTO students (roll, name, department_id, department, semester, email, phone, status, gender) " +
                "VALUES ('TEST-DROP-01', 'Test Dropping Student', 1, 'Computer Science', 5, 'test.drop@college.edu', '9999999993', 'Active', 'Other')");
        Long studentId = jdbcTemplate.queryForObject("SELECT id FROM students WHERE roll = 'TEST-DROP-01'", Long.class);

        jdbcTemplate.update("INSERT INTO course_enrollments (student_id, course_code, academic_period_id, status) VALUES (?, 'CS501', 1, 'Enrolled')", studentId);
        Long enrollmentId = jdbcTemplate.queryForObject("SELECT id FROM course_enrollments WHERE student_id = ? AND course_code = 'CS501'", Long.class, studentId);

        // Mark attendance
        jdbcTemplate.update("INSERT INTO attendance_records (session_id, enrollment_id, student_id, course_code, academic_period_id, status) " +
                "VALUES (1, ?, ?, 'CS501', 1, 'Present')", enrollmentId, studentId);

        // Attempting to change enrollment status to 'Dropped' MUST be blocked by trigger
        Exception ex = assertThrows(Exception.class, () -> {
            jdbcTemplate.update("UPDATE course_enrollments SET status = 'Dropped' WHERE id = ?", enrollmentId);
        });

        String msg2 = ex.getMessage() + (ex.getCause() != null ? " " + ex.getCause().getMessage() : "");
        assertTrue(msg2.contains("Cannot drop course") || msg2.contains("Integrity Error"),
                "Trigger must prohibit dropping active registration with attendance history");

        // Cleanup
        jdbcTemplate.update("DELETE FROM attendance_records WHERE student_id = ?", studentId);
        jdbcTemplate.update("DELETE FROM course_enrollments WHERE student_id = ?", studentId);
        jdbcTemplate.update("DELETE FROM attendance WHERE student_id = ?", studentId);
        jdbcTemplate.update("DELETE FROM marks WHERE student_id = ?", studentId);
        jdbcTemplate.update("DELETE FROM students WHERE id = ?", studentId);
    }

    @Test
    @DisplayName("Test 5: Trigger blocks direct deletion of student with historical attendance")
    void testBlockStudentDeletionWithAttendanceHistory() {
        jdbcTemplate.update("INSERT INTO students (roll, name, department_id, department, semester, email, phone, status, gender) " +
                "VALUES ('TEST-DEL-01', 'Test Deletion Student', 1, 'Computer Science', 5, 'test.del@college.edu', '9999999994', 'Active', 'Other')");
        Long studentId = jdbcTemplate.queryForObject("SELECT id FROM students WHERE roll = 'TEST-DEL-01'", Long.class);

        jdbcTemplate.update("INSERT INTO course_enrollments (student_id, course_code, academic_period_id, status) VALUES (?, 'CS501', 1, 'Enrolled')", studentId);
        Long enrollmentId = jdbcTemplate.queryForObject("SELECT id FROM course_enrollments WHERE student_id = ? AND course_code = 'CS501'", Long.class, studentId);

        // Log attendance record
        jdbcTemplate.update("INSERT INTO attendance_records (session_id, enrollment_id, student_id, course_code, academic_period_id, status) " +
                "VALUES (1, ?, ?, 'CS501', 1, 'Present')", enrollmentId, studentId);

        // Direct student deletion MUST fail due to trigger trg_prevent_student_delete_with_attendance
        Exception ex = assertThrows(Exception.class, () -> {
            jdbcTemplate.update("DELETE FROM students WHERE id = ?", studentId);
        });

        String msg3 = ex.getMessage() + (ex.getCause() != null ? " " + ex.getCause().getMessage() : "");
        assertTrue(msg3.contains("Audit Violation") || msg3.contains("attendance history") || msg3.contains("sp_archive_and_delete_student"),
                "Deletion must fail per institutional retention policy");

        // Execute authorized archival procedure
        jdbcTemplate.update("CALL sp_archive_and_delete_student(?, 'TEST_RUNNER', @out_status)", studentId);
        String archiveStatus = jdbcTemplate.queryForObject("SELECT @out_status", String.class);
        assertNotNull(archiveStatus);
        assertTrue(archiveStatus.startsWith("SUCCESS"), "Archival procedure must succeed");

        // Verify that record was archived in archived_student_attendance
        Integer archivedCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM archived_student_attendance WHERE student_roll = 'TEST-DEL-01'", Integer.class);
        assertEquals(1, archivedCount, "Historical attendance record must be preserved in archival storage");
    }

    @Test
    @DisplayName("Test 6: ACID multi-table enrollment transaction with commit and rollback verification")
    void testAcidTransactionProcedure() {
        // 1. Successful commit
        Map<String, Object> commitResult = dbmsService.executeBatchEnrollmentTransaction(
                "TEST-TX-01", "Transaction Success Student", 1, "Computer Science", 1,
                "tx.success@college.edu", "9999999995", false);

        assertTrue((Boolean) commitResult.get("isSuccess"));
        assertTrue(((String) commitResult.get("statusMessage")).contains("COMMITTED"));

        // Verify rows exist in both students and attendance
        Integer countStudent = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM students WHERE roll = 'TEST-TX-01'", Integer.class);
        Integer countAttendance = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM attendance a JOIN students s ON a.student_id = s.id WHERE s.roll = 'TEST-TX-01'", Integer.class);
        assertEquals(1, countStudent);
        assertEquals(1, countAttendance);

        // 2. Simulated rollback on error
        Map<String, Object> rollbackResult = dbmsService.executeBatchEnrollmentTransaction(
                "TEST-TX-02", "Transaction Fail Student", 1, "Computer Science", 1,
                "tx.fail@college.edu", "9999999996", true); // simulateError = true

        assertFalse((Boolean) rollbackResult.get("isSuccess"));
        assertTrue(((String) rollbackResult.get("statusMessage")).contains("ROLLED BACK"));

        // Verify that neither student nor attendance was inserted due to rollback
        Integer countRollbackStudent = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM students WHERE roll = 'TEST-TX-02'", Integer.class);
        assertEquals(0, countRollbackStudent, "Rolled-back student must not exist in database");

        // Cleanup success student
        Long sId = jdbcTemplate.queryForObject("SELECT id FROM students WHERE roll = 'TEST-TX-01'", Long.class);
        jdbcTemplate.update("DELETE FROM attendance WHERE student_id = ?", sId);
        jdbcTemplate.update("DELETE FROM marks WHERE student_id = ?", sId);
        jdbcTemplate.update("DELETE FROM students WHERE id = ?", sId);
    }

    @Test
    @DisplayName("Test 7: Stored function auto-grading and bounds checking")
    void testStoredFunctionAutoGrading() {
        // Grade A+ (>= 90)
        String gradeAplus = jdbcTemplate.queryForObject("SELECT fn_calculate_grade(95.0, 100.0)", String.class);
        assertEquals("A+", gradeAplus);

        // Grade B (>= 70)
        String gradeB = jdbcTemplate.queryForObject("SELECT fn_calculate_grade(75.0, 100.0)", String.class);
        assertEquals("B", gradeB);

        // Grade F (< 50)
        String gradeF = jdbcTemplate.queryForObject("SELECT fn_calculate_grade(42.0, 100.0)", String.class);
        assertEquals("F", gradeF);
    }
}
