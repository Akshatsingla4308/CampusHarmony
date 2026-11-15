package com.campusharmony.controller;

import com.campusharmony.entity.Activity;
import com.campusharmony.repository.ActivityRepository;
import com.campusharmony.service.DashboardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ActivityController - REST endpoint for campus activities and audit records at /api/activities.
 */
@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    private final DashboardService dashboardService;
    private final ActivityRepository activityRepository;

    public ActivityController(DashboardService dashboardService, ActivityRepository activityRepository) {
        this.dashboardService = dashboardService;
        this.activityRepository = activityRepository;
    }

    @GetMapping
    public ResponseEntity<List<Activity>> getAllActivities(@RequestParam(required = false) String teacherId) {
        return ResponseEntity.ok(dashboardService.getRecentActivities(teacherId));
    }

    @PostMapping
    public ResponseEntity<Activity> createActivity(@RequestBody Map<String, Object> payload) {
        String text = (String) payload.getOrDefault("title", payload.getOrDefault("text", "Activity logged"));
        String type = (String) payload.getOrDefault("type", "Technical");
        String teacherId = (String) payload.get("teacherId");
        Activity saved = dashboardService.logActivity(text, type, teacherId);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivity(@PathVariable Long id) {
        activityRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
