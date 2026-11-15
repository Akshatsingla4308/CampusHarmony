package com.campusharmony.repository;

import com.campusharmony.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * CourseRepository - Data Access Layer for Course curriculum records.
 */
@Repository
public interface CourseRepository extends JpaRepository<Course, String> {

    @Query("SELECT c FROM Course c WHERE " +
           "(:teacherId IS NULL AND c.teacherId IS NULL) OR " +
           "(:teacherId IS NOT NULL AND c.teacherId = :teacherId)")
    List<Course> findByWorkspace(@Param("teacherId") String teacherId);

    List<Course> findBySemester(Integer semester);
}
