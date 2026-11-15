package com.campusharmony.controller;

import com.campusharmony.dto.CourseRequest;
import com.campusharmony.entity.Course;
import com.campusharmony.entity.Subject;
import com.campusharmony.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CourseController - REST endpoints for courses and subjects.
 */
@RestController
@RequestMapping("/api")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping("/courses")
    public ResponseEntity<List<Course>> getCourses(@RequestParam(required = false) String teacherId) {
        List<Course> courses = courseService.getCourses(teacherId);
        return ResponseEntity.ok(courses);
    }

    @PostMapping("/courses")
    public ResponseEntity<Course> addCourse(@Valid @RequestBody CourseRequest request) {
        Course course = courseService.addCourse(request);
        return new ResponseEntity<>(course, HttpStatus.CREATED);
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<Subject>> getSubjects() {
        return ResponseEntity.ok(courseService.getSubjects());
    }
}
