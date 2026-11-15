package com.campusharmony.demo;

import com.campusharmony.entity.Student;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Demonstrates Core Java Functional Programming & Streams API:
 * - filter, map, sorted, collect
 * - Collectors: groupingBy, partitioningBy, averagingDouble, summarizingInt
 * - Stream pipelines producing multi-dimensional academic analytics
 */
@Component
public class AnalyticsStreamDemo {

    /**
     * Partitions students into Defaulters (< threshold) and Eligible (>= threshold)
     * using Collectors.partitioningBy.
     */
    public Map<Boolean, List<Student>> partitionDefaulters(List<Student> students, int thresholdPct) {
        return students.stream()
                .collect(Collectors.partitioningBy(
                        s -> (s.getAttendance() != null && s.getAttendance() >= thresholdPct)
                ));
    }

    /**
     * Groups students by Department and counts students per department
     * using Collectors.groupingBy and Collectors.counting.
     */
    public Map<String, Long> countStudentsByDepartment(List<Student> students) {
        return students.stream()
                .filter(s -> s.getDepartment() != null)
                .collect(Collectors.groupingBy(
                        Student::getDepartment,
                        TreeMap::new, // Sorted by department name
                        Collectors.counting()
                ));
    }

    /**
     * Computes the average attendance percentage per department
     * using Collectors.groupingBy and Collectors.averagingDouble.
     */
    public Map<String, Double> averageAttendanceByDepartment(List<Student> students) {
        return students.stream()
                .filter(s -> s.getDepartment() != null && s.getAttendance() != null)
                .collect(Collectors.groupingBy(
                        Student::getDepartment,
                        TreeMap::new,
                        Collectors.averagingDouble(Student::getAttendance)
                ));
    }

    /**
     * Computes IntSummaryStatistics (count, sum, min, max, average) for attendance
     * using Collectors.summarizingInt.
     */
    public IntSummaryStatistics getAttendanceSummaryStatistics(List<Student> students) {
        return students.stream()
                .filter(s -> s.getAttendance() != null)
                .collect(Collectors.summarizingInt(Student::getAttendance));
    }

    /**
     * Extracts distinct sorted list of institutional domains from student emails
     * using map, distinct, sorted, and joining.
     */
    public String extractDistinctEmailDomains(List<Student> students) {
        return students.stream()
                .map(Student::getEmail)
                .filter(Objects::nonNull)
                .filter(e -> e.contains("@"))
                .map(e -> e.substring(e.indexOf("@") + 1))
                .distinct()
                .sorted()
                .collect(Collectors.joining(", "));
    }
}
