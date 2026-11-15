package com.campusharmony.service;

import com.campusharmony.entity.Attendance;

import java.util.List;

/**
 * AttendanceService - Interface for managing student attendance registers.
 */
public interface AttendanceService {

    List<Attendance> getAttendance(String teacherId);

    com.campusharmony.dto.AttendanceMarkResponse markAttendance(Long studentId, boolean present);
}
