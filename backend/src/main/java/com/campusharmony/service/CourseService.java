package com.campusharmony.service;

import com.campusharmony.dto.CourseRequest;
import com.campusharmony.entity.Course;
import com.campusharmony.entity.Subject;

import java.util.List;

/**
 * CourseService - Business operations for curriculum courses.
 */
public interface CourseService {

    List<Course> getCourses(String teacherId);

    Course addCourse(CourseRequest request);

    List<Subject> getSubjects();
}
