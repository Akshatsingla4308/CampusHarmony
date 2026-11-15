package com.campusharmony.repository;

import com.campusharmony.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ActivityRepository - Data Access Layer for activity audit trail.
 */
@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    @Query("SELECT a FROM Activity a WHERE " +
           "(:teacherId IS NULL AND a.teacherId IS NULL) OR " +
           "(:teacherId IS NOT NULL AND (a.teacherId = :teacherId OR a.teacherId IS NULL)) " +
           "ORDER BY a.createdAt DESC")
    List<Activity> findRecentActivities(@Param("teacherId") String teacherId);
}
