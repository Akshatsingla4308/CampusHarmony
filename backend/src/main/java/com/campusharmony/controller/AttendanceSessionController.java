package com.campusharmony.controller;

import com.campusharmony.dto.ApiResponse;
import com.campusharmony.dto.SessionAttendanceRequest;
import com.campusharmony.entity.AttendanceRecord;
import com.campusharmony.entity.AttendanceSession;
import com.campusharmony.service.AttendanceSessionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance/sessions")
public class AttendanceSessionController {

    private final AttendanceSessionService sessionService;

    public AttendanceSessionController(AttendanceSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AttendanceSession>> createSession(@Valid @RequestBody AttendanceSession session) {
        AttendanceSession created = sessionService.createSession(session);
        return ResponseEntity.ok(ApiResponse.success("Attendance session created successfully", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AttendanceSession>>> getSessionsByCourse(
            @RequestParam String courseCode) {
        List<AttendanceSession> sessions = sessionService.getSessionsByCourse(courseCode);
        return ResponseEntity.ok(ApiResponse.success("Attendance sessions retrieved", sessions));
    }

    @GetMapping("/{sessionId}/records")
    public ResponseEntity<ApiResponse<List<AttendanceRecord>>> getRecordsBySession(
            @PathVariable Long sessionId) {
        List<AttendanceRecord> records = sessionService.getRecordsBySession(sessionId);
        return ResponseEntity.ok(ApiResponse.success("Session attendance records retrieved", records));
    }

    @PostMapping("/mark-batch")
    public ResponseEntity<ApiResponse<List<AttendanceRecord>>> markSessionAttendance(
            @Valid @RequestBody SessionAttendanceRequest request) {
        List<AttendanceRecord> saved = sessionService.markSessionAttendance(request);
        return ResponseEntity.ok(ApiResponse.success(
                "Session attendance marked successfully and summary cache synchronized via engine triggers", saved));
    }
}
