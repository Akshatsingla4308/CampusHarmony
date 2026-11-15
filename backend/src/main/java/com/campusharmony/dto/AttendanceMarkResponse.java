package com.campusharmony.dto;

import com.campusharmony.entity.Attendance;
import com.campusharmony.entity.Student;

/**
 * DTO returned after marking attendance.
 * Contains the saved Attendance record and the updated Student profile
 * (including the calculated attendance percentage).
 */
public class AttendanceMarkResponse {
    private Attendance attendance;
    private Student student;

    public AttendanceMarkResponse() {}

    public AttendanceMarkResponse(Attendance attendance, Student student) {
        this.attendance = attendance;
        this.student = student;
    }

    public Attendance getAttendance() {
        return attendance;
    }

    public void setAttendance(Attendance attendance) {
        this.attendance = attendance;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }
}
