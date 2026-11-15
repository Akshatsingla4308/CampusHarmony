package com.campusharmony.service;

import com.campusharmony.dto.SessionAttendanceRequest;
import com.campusharmony.entity.AttendanceRecord;
import com.campusharmony.entity.AttendanceSession;

import java.util.List;

public interface AttendanceSessionService {
    AttendanceSession createSession(AttendanceSession session);
    List<AttendanceSession> getSessionsByCourse(String courseCode);
    List<AttendanceRecord> getRecordsBySession(Long sessionId);
    List<AttendanceRecord> markSessionAttendance(SessionAttendanceRequest request);
}
