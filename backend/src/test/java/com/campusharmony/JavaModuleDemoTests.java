package com.campusharmony;

import com.campusharmony.demo.*;
import com.campusharmony.entity.Student;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class JavaModuleDemoTests {

    @Autowired
    private JdbcTransactionDemo jdbcTransactionDemo;

    @Autowired
    private StudentComparatorDemo studentComparatorDemo;

    @Autowired
    private AnalyticsStreamDemo analyticsStreamDemo;

    @Autowired
    private CsvReportHandler csvReportHandler;

    @Autowired
    private AttendanceProcessingDemo attendanceProcessingDemo;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @org.junit.jupiter.api.BeforeEach
    @org.junit.jupiter.api.AfterEach
    void cleanUpTestRecords() {
        jdbcTemplate.update("DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE roll LIKE 'JDBC-%')");
        jdbcTemplate.update("DELETE FROM marks WHERE student_id IN (SELECT id FROM students WHERE roll LIKE 'JDBC-%')");
        jdbcTemplate.update("DELETE FROM students WHERE roll LIKE 'JDBC-%'");
    }

    @Test
    @DisplayName("Test 1: Direct JDBC Transaction Commit and Rollback Verification")
    void testDirectJdbcTransaction() {
        // 1. Success case: Commit
        Map<String, Object> commitRes = jdbcTransactionDemo.executeDirectJdbcTransaction(
                "JDBC-OK-01", "JDBC Success", 1, 3, "jdbc.ok@college.edu", "9123456789", false);
        assertEquals("SUCCESS", commitRes.get("status"));
        assertNotNull(commitRes.get("studentId"));

        // 2. Failure case: Rollback
        Map<String, Object> rollbackRes = jdbcTransactionDemo.executeDirectJdbcTransaction(
                "JDBC-FAIL-01", "JDBC Fail", 1, 3, "jdbc.fail@college.edu", "9123456780", true);
        assertEquals("ROLLED_BACK", rollbackRes.get("status"));
    }

    @Test
    @DisplayName("Test 2: Java Collections & Custom Comparator Sorting Strategies")
    void testComparatorStrategies() {
        Student s1 = new Student("CS-10", "Zack", "CS", 1, "zack@test.com", "111", "Active", "Male", null, null);
        s1.setAttendance(80);
        Student s2 = new Student("CS-01", "Alice", "CS", 1, "alice@test.com", "222", "Active", "Female", null, null);
        s2.setAttendance(95);

        List<Student> list = Arrays.asList(s1, s2);

        // Sort by Name Ascending
        List<Student> byName = studentComparatorDemo.sortStudents(list, "name");
        assertEquals("Alice", byName.get(0).getName());
        assertEquals("Zack", byName.get(1).getName());

        // Sort by Attendance Descending
        List<Student> byAtt = studentComparatorDemo.sortStudents(list, "attendance");
        assertEquals("Alice", byAtt.get(0).getName()); // 95% > 80%
    }

    @Test
    @DisplayName("Test 3: Functional Programming & Stream API Multi-dimensional Analytics")
    void testStreamAnalytics() {
        Student s1 = new Student("CS-101", "Rahul", "Computer Science", 5, "rahul@college.edu", "111", "Active", "Male", null, null);
        s1.setAttendance(90);
        Student s2 = new Student("CS-102", "Yash", "Computer Science", 1, "yash@college.edu", "222", "Probation", "Male", null, null);
        s2.setAttendance(40); // Defaulter
        Student s3 = new Student("IT-103", "Faiz", "Information Technology", 3, "faiz@college.edu", "333", "Active", "Male", null, null);
        s3.setAttendance(85);

        List<Student> students = Arrays.asList(s1, s2, s3);

        // 1. Defaulter partitioning (< 75%)
        Map<Boolean, List<Student>> partitioned = analyticsStreamDemo.partitionDefaulters(students, 75);
        assertEquals(2, partitioned.get(true).size()); // Rahul, Faiz
        assertEquals(1, partitioned.get(false).size()); // Yash

        // 2. Average attendance by department
        Map<String, Double> avgByDept = analyticsStreamDemo.averageAttendanceByDepartment(students);
        assertEquals(65.0, avgByDept.get("Computer Science"), 0.01); // (90 + 40)/2 = 65
        assertEquals(85.0, avgByDept.get("Information Technology"), 0.01);

        // 3. IntSummaryStatistics
        IntSummaryStatistics stats = analyticsStreamDemo.getAttendanceSummaryStatistics(students);
        assertEquals(3, stats.getCount());
        assertEquals(40, stats.getMin());
        assertEquals(90, stats.getMax());
    }

    @Test
    @DisplayName("Test 4: Java Generics with Bounded Parameters <T extends BaseEntity, ID>")
    void testGenericDataRepository() {
        GenericDataRepository<Student, Long> repo = new GenericDataRepository<>();
        Student s = new Student("GEN-01", "Generic Student", "Mechanical", 1, "gen@college.edu", "555", "Active", "Male", null, null);
        s.setId(1001L);

        repo.save(1001L, s);
        assertEquals(1, repo.count());

        Optional<Student> found = repo.findById(1001L);
        assertTrue(found.isPresent());
        assertEquals("Generic Student", found.get().getName());

        List<Student> meStudents = repo.findByPredicate(st -> "Mechanical".equals(st.getDepartment()));
        assertEquals(1, meStudents.size());
    }

    @Test
    @DisplayName("Test 5: CSV File Export and Import with Custom Checked Exception Handling")
    void testCsvHandling() throws IOException, CsvReportHandler.CsvParseException {
        Student s1 = new Student("CSV-01", "CSV Alice", "Civil", 3, "alice@csv.com", "777", "Active", "Female", null, null);
        s1.setAttendance(88);
        List<Student> list = Collections.singletonList(s1);

        // Export
        String csv = csvReportHandler.exportStudentsToCsv(list);
        assertNotNull(csv);
        assertTrue(csv.contains("CSV-01"));
        assertTrue(csv.contains("CSV Alice"));

        // Import
        List<Student> imported = csvReportHandler.importStudentsFromCsv(csv);
        assertEquals(1, imported.size());
        assertEquals("CSV-01", imported.get(0).getRoll());
        assertEquals("CSV Alice", imported.get(0).getName());

        // Malformed CSV throws checked exception
        assertThrows(CsvReportHandler.CsvParseException.class, () -> {
            csvReportHandler.importStudentsFromCsv("Invalid,CSV\nMissing,Cols");
        });
    }

    @Test
    @DisplayName("Test 6: Multi-threaded Concurrency and Parallel Batch Processing")
    void testParallelAttendanceProcessing() {
        AttendanceProcessingDemo.BatchSummary summary =
                attendanceProcessingDemo.processAttendanceInParallel(4, 50);

        assertEquals(4, summary.getTotalBatches());
        assertEquals(200, summary.getTotalRecordsProcessed());
        assertEquals(200, summary.getTotalPresent() + summary.getTotalAbsent());
        assertEquals(4, summary.getThreadExecutionLog().size());
    }
}
