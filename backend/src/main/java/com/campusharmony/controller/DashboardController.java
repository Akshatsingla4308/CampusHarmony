package com.campusharmony.controller;

import com.campusharmony.dto.StatCardResponse;
import com.campusharmony.entity.Activity;
import com.campusharmony.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * DashboardController - REST endpoints for dashboard metrics and activity audit log.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public ResponseEntity<List<StatCardResponse>> getStats(@RequestParam(required = false) String teacherId) {
        List<StatCardResponse> stats = dashboardService.getStats(teacherId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/activity")
    public ResponseEntity<List<Activity>> getActivity(@RequestParam(required = false) String teacherId) {
        List<Activity> activity = dashboardService.getRecentActivities(teacherId);
        return ResponseEntity.ok(activity);
    }

    @PostMapping("/activity")
    public ResponseEntity<Activity> logActivity(@RequestBody Map<String, String> payload) {
        String text = payload.getOrDefault("text", "Activity recorded");
        String type = payload.getOrDefault("type", "notice");
        String teacherId = payload.get("teacherId");
        Activity saved = dashboardService.logActivity(text, type, teacherId);
        return ResponseEntity.ok(saved);
    }
}
