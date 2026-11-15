package com.campusharmony.controller;

import com.campusharmony.dto.MarkAttendanceRequest;
import com.campusharmony.dto.AttendanceMarkResponse;
import com.campusharmony.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AttendanceController - REST endpoints for attendance registers.
 */
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    public ResponseEntity<List<Attendance>> getAttendance(@RequestParam(required = false) String teacherId) {
        List<Attendance> records = attendanceService.getAttendance(teacherId);
        return ResponseEntity.ok(records);
    }

    @PostMapping("/mark")
    public ResponseEntity<com.campusharmony.dto.AttendanceMarkResponse> markAttendance(@Valid @RequestBody MarkAttendanceRequest request) {
        com.campusharmony.dto.AttendanceMarkResponse resp = attendanceService.markAttendance(request.getStudentId(), request.getPresent());
        return ResponseEntity.ok(resp);
    }
}
