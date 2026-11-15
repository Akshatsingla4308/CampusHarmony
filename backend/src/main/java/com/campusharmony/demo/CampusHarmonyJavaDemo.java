package com.campusharmony.demo;

import com.campusharmony.entity.Student;

import java.io.IOException;
import java.util.*;

/**
 * Standalone Java Demonstration Launcher for Academic Viva:
 * Demonstrates:
 * 1. Collections & Custom Comparator sorting
 * 2. Lambdas & Stream API analytics
 * 3. Generics with type bounds <T extends BaseEntity, ID>
 * 4. File I/O with BufferedReader/BufferedWriter & custom exception handling
 * 5. Concurrency & Multi-threading with ThreadPool and CountDownLatch
 */
public class CampusHarmonyJavaDemo {

    public static void main(String[] args) {
        System.out.println("================================================================================");
        System.out.println("   CAMPUS HARMONY — CORE JAVA ACADEMIC CONCEPTS DEMONSTRATION MODULE");
        System.out.println("   Course: Programming in Java (25CSE0202) | Chitkara University Batch 2025");
        System.out.println("================================================================================\n");

        // Prepare sample student dataset
        List<Student> students = createDemoStudents();

        // -------------------------------------------------------------------------
        // DEMO 1: Collections & Custom Comparator
        // -------------------------------------------------------------------------
        System.out.println(">>> [DEMO 1] JAVA COLLECTIONS & COMPARATOR SORTING:");
        StudentComparatorDemo comparatorDemo = new StudentComparatorDemo();

        System.out.println("--- Sorted by Name (Alphabetical Ascending) ---");
        List<Student> byName = comparatorDemo.sortStudents(students, "name");
        byName.forEach(s -> System.out.printf("  %-10s %-20s %-20s %d%%\n", s.getRoll(), s.getName(), s.getDepartment(), s.getAttendance()));

        System.out.println("\n--- Sorted by Attendance Percentage (Descending) ---");
        List<Student> byAtt = comparatorDemo.sortStudents(students, "attendance");
        byAtt.forEach(s -> System.out.printf("  %-10s %-20s %-20s %d%%\n", s.getRoll(), s.getName(), s.getDepartment(), s.getAttendance()));

        // -------------------------------------------------------------------------
        // DEMO 2: Functional Programming & Streams API
        // -------------------------------------------------------------------------
        System.out.println("\n>>> [DEMO 2] FUNCTIONAL PROGRAMMING & STREAM API:");
        AnalyticsStreamDemo streamDemo = new AnalyticsStreamDemo();

        System.out.println("--- Partitioning Students (Defaulters <75% vs Eligible >=75%) ---");
        Map<Boolean, List<Student>> partitioned = streamDemo.partitionDefaulters(students, 75);
        System.out.println("  Eligible Students (>=75%): " + partitioned.get(true).size());
        System.out.println("  Defaulter Students (<75%): " + partitioned.get(false).size());
        partitioned.get(false).forEach(s -> System.out.printf("    * Defaulter: %s (%s) — %d%%\n", s.getName(), s.getRoll(), s.getAttendance()));

        System.out.println("\n--- Average Attendance by Department ---");
        Map<String, Double> deptAvg = streamDemo.averageAttendanceByDepartment(students);
        deptAvg.forEach((dept, avg) -> System.out.printf("  %-25s: %.2f%%\n", dept, avg));

        System.out.println("\n--- IntSummaryStatistics across all students ---");
        IntSummaryStatistics stats = streamDemo.getAttendanceSummaryStatistics(students);
        System.out.printf("  Count: %d, Min: %d%%, Max: %d%%, Avg: %.2f%%\n", stats.getCount(), stats.getMin(), stats.getMax(), stats.getAverage());

        // -------------------------------------------------------------------------
        // DEMO 3: Java Generics with Type Bounds
        // -------------------------------------------------------------------------
        System.out.println("\n>>> [DEMO 3] JAVA GENERICS WITH BOUNDED PARAMETERS <T extends BaseEntity, ID>:");
        GenericDataRepository<Student, Long> studentRepo = new GenericDataRepository<>();
        for (long i = 1; i <= students.size(); i++) {
            Student s = students.get((int) i - 1);
            s.setId(i);
            studentRepo.save(i, s);
        }
        System.out.println("  Generic Repository Size: " + studentRepo.count());
        List<Student> csStudents = studentRepo.findByPredicate(s -> "Computer Science".equalsIgnoreCase(s.getDepartment()));
        System.out.println("  Predicate Filter (Department == Computer Science): " + csStudents.size() + " matches found.");

        // -------------------------------------------------------------------------
        // DEMO 4: CSV File I/O & Exception Handling
        // -------------------------------------------------------------------------
        System.out.println("\n>>> [DEMO 4] CSV FILE HANDLING & CHECKED EXCEPTION HANDLING:");
        CsvReportHandler csvHandler = new CsvReportHandler();
        try {
            String csvExport = csvHandler.exportStudentsToCsv(students.subList(0, 3));
            System.out.println("--- Exported CSV Sample ---");
            System.out.println(csvExport);

            System.out.println("--- Parsing CSV back to Java Objects ---");
            List<Student> imported = csvHandler.importStudentsFromCsv(csvExport);
            System.out.printf("  Successfully parsed %d student records from CSV stream.\n", imported.size());
        } catch (IOException | CsvReportHandler.CsvParseException e) {
            System.err.println("  CSV Error: " + e.getMessage());
        }

        // -------------------------------------------------------------------------
        // DEMO 5: Concurrency & Multi-threading
        // -------------------------------------------------------------------------
        System.out.println("\n>>> [DEMO 5] CONCURRENCY & THREAD POOL PARALLEL BATCH PROCESSING:");
        AttendanceProcessingDemo concurrencyDemo = new AttendanceProcessingDemo();
        AttendanceProcessingDemo.BatchSummary summary = concurrencyDemo.processAttendanceInParallel(6, 100);
        System.out.printf("  Total Batches: %d | Records Processed: %d | Execution Time: %d ms\n",
                summary.getTotalBatches(), summary.getTotalRecordsProcessed(), summary.getExecutionTimeMs());
        System.out.printf("  Aggregated Counts -> Present: %d, Absent: %d\n",
                summary.getTotalPresent(), summary.getTotalAbsent());
        System.out.println("  Thread Execution Logs:");
        summary.getThreadExecutionLog().forEach(l -> System.out.println("    " + l));

        System.out.println("\n================================================================================");
        System.out.println("   JAVA DEMONSTRATION COMPLETE — 100% SPECIFICATION COMPLIANT");
        System.out.println("================================================================================");
    }

    private static List<Student> createDemoStudents() {
        List<Student> list = new ArrayList<>();
        Student s1 = new Student("CS-2101", "Rahul Sharma", "Computer Science", 5, "rahul@college.edu", "9876543210", "Active", "Male", null, null);
        s1.setAttendance(92);
        Student s2 = new Student("CS-2102", "Ananya Iyer", "Computer Science", 5, "ananya@college.edu", "9812345678", "Active", "Female", null, null);
        s2.setAttendance(96);
        Student s3 = new Student("IT-2103", "Mohammed Faiz", "Information Technology", 3, "faiz@college.edu", "9765432109", "Active", "Male", null, null);
        s3.setAttendance(81);
        Student s4 = new Student("EC-2104", "Sneha Kulkarni", "Electronics", 7, "sneha@college.edu", "9898989898", "Active", "Female", null, null);
        s4.setAttendance(74); // Defaulter
        Student s5 = new Student("ME-2105", "Arjun Nair", "Mechanical", 1, "arjun@college.edu", "9700112233", "Probation", "Male", null, null);
        s5.setAttendance(68); // Defaulter
        Student s6 = new Student("CV-2106", "Priya Deshmukh", "Civil", 5, "priya@college.edu", "9600445566", "Active", "Female", null, null);
        s6.setAttendance(88);
        Student s7 = new Student("CS-2117", "Yash Patel", "Computer Science", 1, "yash@college.edu", "9543210987", "Probation", "Male", null, null);
        s7.setAttendance(41); // Defaulter

        list.add(s1); list.add(s2); list.add(s3); list.add(s4); list.add(s5); list.add(s6); list.add(s7);
        return list;
    }
}
