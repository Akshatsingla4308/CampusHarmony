package com.campusharmony.controller;

import com.campusharmony.dto.LoginRequest;
import com.campusharmony.dto.RegisterStudentRequest;
import com.campusharmony.dto.RegisterTeacherRequest;
import com.campusharmony.entity.Student;
import com.campusharmony.entity.Teacher;
import com.campusharmony.service.TeacherService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * AuthController - REST endpoints for Authentication and Registration.
 * Demonstrates: Spring Web REST Controller and Request Validation.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final TeacherService teacherService;

    public AuthController(TeacherService teacherService) {
        this.teacherService = teacherService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        Map<String, Object> session = teacherService.authenticate(request);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/register-teacher")
    public ResponseEntity<Teacher> registerTeacher(@Valid @RequestBody RegisterTeacherRequest request) {
        Teacher teacher = teacherService.registerTeacher(request);
        return new ResponseEntity<>(teacher, HttpStatus.CREATED);
    }

    @PostMapping("/register-student")
    public ResponseEntity<Student> registerStudent(@Valid @RequestBody RegisterStudentRequest request) {
        Student student = teacherService.registerStudent(request);
        return new ResponseEntity<>(student, HttpStatus.CREATED);
    }

    @GetMapping("/teachers")
    public ResponseEntity<List<Teacher>> getAllTeachers() {
        return ResponseEntity.ok(teacherService.getAllTeachers());
    }
}
