package com.campusharmony.service;

import com.campusharmony.dto.StatCardResponse;
import com.campusharmony.entity.Activity;

import java.util.List;

/**
 * DashboardService - Analytics and activity feed for teacher dashboard.
 */
public interface DashboardService {

    List<StatCardResponse> getStats(String teacherId);

    List<Activity> getRecentActivities(String teacherId);

    Activity logActivity(String text, String type, String teacherId);
}
