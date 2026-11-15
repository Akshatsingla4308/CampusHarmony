package com.campusharmony.controller;

import com.campusharmony.demo.*;
import com.campusharmony.dto.ApiResponse;
import com.campusharmony.entity.Student;
import com.campusharmony.service.StudentService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.*;

/**
 * JavaDemoController - Exposes REST endpoints to test and evaluate:
 * - Direct JDBC Transactions (Commit & Rollback)
 * - Collections & Custom Comparator Sorting
 * - Lambdas & Streams API Multi-dimensional Analytics
 * - CSV Export & Import with Checked Exception Handling
 * - Concurrency & ThreadPool Parallel Processing
 */
@RestController
@RequestMapping("/api/java-demo")
public class JavaDemoController {

    private final JdbcTransactionDemo jdbcTransactionDemo;
    private final StudentComparatorDemo studentComparatorDemo;
    private final AnalyticsStreamDemo analyticsStreamDemo;
    private final CsvReportHandler csvReportHandler;
    private final AttendanceProcessingDemo attendanceProcessingDemo;
    private final StudentService studentService;

    public JavaDemoController(JdbcTransactionDemo jdbcTransactionDemo,
                              StudentComparatorDemo studentComparatorDemo,
                              AnalyticsStreamDemo analyticsStreamDemo,
                              CsvReportHandler csvReportHandler,
                              AttendanceProcessingDemo attendanceProcessingDemo,
                              StudentService studentService) {
        this.jdbcTransactionDemo = jdbcTransactionDemo;
        this.studentComparatorDemo = studentComparatorDemo;
        this.analyticsStreamDemo = analyticsStreamDemo;
        this.csvReportHandler = csvReportHandler;
        this.attendanceProcessingDemo = attendanceProcessingDemo;
        this.studentService = studentService;
    }

    @PostMapping("/jdbc-transaction")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testJdbcTransaction(
            @RequestParam String roll,
            @RequestParam String name,
            @RequestParam(defaultValue = "1") int deptId,
            @RequestParam(defaultValue = "1") int semester,
            @RequestParam String email,
            @RequestParam String phone,
            @RequestParam(defaultValue = "false") boolean shouldFail) {

        Map<String, Object> result = jdbcTransactionDemo.executeDirectJdbcTransaction(
                roll, name, deptId, semester, email, phone, shouldFail);
        return ResponseEntity.ok(ApiResponse.success("Direct JDBC transaction executed", result));
    }

    @GetMapping("/comparator-sort")
    public ResponseEntity<ApiResponse<List<Student>>> testComparatorSort(
            @RequestParam(defaultValue = "name") String strategy) {

        List<Student> students = studentService.getStudents(null, null, null, null);
        List<Student> sorted = studentComparatorDemo.sortStudents(students, strategy);
        return ResponseEntity.ok(ApiResponse.success(
                "Students sorted using strategy: " + strategy, sorted));
    }

    @GetMapping("/streams-analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testStreamsAnalytics() {
        List<Student> students = studentService.getStudents(null, null, null, null);

        Map<String, Object> analytics = new LinkedHashMap<>();
        analytics.put("studentsPerDepartment", analyticsStreamDemo.countStudentsByDepartment(students));
        analytics.put("averageAttendancePerDepartment", analyticsStreamDemo.averageAttendanceByDepartment(students));

        Map<Boolean, List<Student>> partitioned = analyticsStreamDemo.partitionDefaulters(students, 75);
        analytics.put("eligibleCount", partitioned.get(true).size());
        analytics.put("defaulterCount", partitioned.get(false).size());
        analytics.put("defaulters", partitioned.get(false));

        IntSummaryStatistics stats = analyticsStreamDemo.getAttendanceSummaryStatistics(students);
        Map<String, Object> statsMap = new LinkedHashMap<>();
        statsMap.put("count", stats.getCount());
        statsMap.put("min", stats.getMin());
        statsMap.put("max", stats.getMax());
        statsMap.put("average", stats.getAverage());
        analytics.put("attendanceStatistics", statsMap);

        analytics.put("emailDomains", analyticsStreamDemo.extractDistinctEmailDomains(students));

        return ResponseEntity.ok(ApiResponse.success("Streams API academic analytics computed", analytics));
    }

    @GetMapping("/export-csv")
    public ResponseEntity<String> exportCsv() throws IOException {
        List<Student> students = studentService.getStudents(null, null, null, null);
        String csv = csvReportHandler.exportStudentsToCsv(students);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"students_roster.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }

    @PostMapping("/concurrency-simulation")
    public ResponseEntity<ApiResponse<AttendanceProcessingDemo.BatchSummary>> testConcurrency(
            @RequestParam(defaultValue = "4") int batchCount,
            @RequestParam(defaultValue = "50") int recordsPerBatch) {

        AttendanceProcessingDemo.BatchSummary summary =
                attendanceProcessingDemo.processAttendanceInParallel(batchCount, recordsPerBatch);

        return ResponseEntity.ok(ApiResponse.success(
                "Parallel attendance batch processing completed across worker threads", summary));
    }
}
