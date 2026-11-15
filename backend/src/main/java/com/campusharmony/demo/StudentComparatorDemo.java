package com.campusharmony.demo;

import com.campusharmony.entity.Student;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Demonstrates Core Java Collections & Comparator Framework:
 * - List<Student>, ArrayList
 * - Custom Comparator implementations
 * - Comparator chaining: comparing().thenComparing()
 * - Anonymous inner classes vs Lambda expressions vs Method references
 */
@Component
public class StudentComparatorDemo {

    // 1. Comparator by Name (Alphabetical ascending)
    public static final Comparator<Student> BY_NAME_ASC = Comparator.comparing(
            Student::getName, String.CASE_INSENSITIVE_ORDER);

    // 2. Comparator by Roll Number
    public static final Comparator<Student> BY_ROLL_ASC = Comparator.comparing(Student::getRoll);

    // 3. Comparator by Semester descending, then Name ascending
    public static final Comparator<Student> BY_SEMESTER_DESC_THEN_NAME = Comparator
            .comparing(Student::getSemester, Comparator.reverseOrder())
            .thenComparing(Student::getName, String.CASE_INSENSITIVE_ORDER);

    // 4. Custom Comparator by Attendance Percentage descending (handling nulls)
    public static final Comparator<Student> BY_ATTENDANCE_DESC = (s1, s2) -> {
        int a1 = s1.getAttendance() != null ? s1.getAttendance() : 0;
        int a2 = s2.getAttendance() != null ? s2.getAttendance() : 0;
        return Integer.compare(a2, a1); // descending
    };

    /**
     * Sorts a list of students using the specified strategy.
     */
    public List<Student> sortStudents(List<Student> students, String strategy) {
        List<Student> copy = new ArrayList<>(students);

        if (strategy == null) {
            copy.sort(BY_ROLL_ASC);
            return copy;
        }

        switch (strategy.toLowerCase().trim()) {
            case "name":
                copy.sort(BY_NAME_ASC);
                break;
            case "roll":
                copy.sort(BY_ROLL_ASC);
                break;
            case "semester":
                copy.sort(BY_SEMESTER_DESC_THEN_NAME);
                break;
            case "attendance":
                copy.sort(BY_ATTENDANCE_DESC);
                break;
            default:
                copy.sort(BY_ROLL_ASC);
                break;
        }

        return copy;
    }
}
