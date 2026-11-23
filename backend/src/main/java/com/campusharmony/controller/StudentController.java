package com.campusharmony.controller;

import com.campusharmony.dto.ApiResponse;
import com.campusharmony.dto.StudentRequest;
import com.campusharmony.entity.Student;
import com.campusharmony.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * StudentController - REST endpoints for Student CRUD operations.
 * Demonstrates: GET, POST, PUT, DELETE mappings and parameter handling.
 */
@RestController
@RequestMapping("/api")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping("/students")
    public ResponseEntity<List<Student>> getStudents(
            @RequestParam(required = false) String teacherId,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String search) {
        List<Student> students = studentService.getStudents(teacherId, department, semester, search);
        return ResponseEntity.ok(students);
    }

    @GetMapping("/students/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Long id) {
        Student student = studentService.getStudentById(id);
        return ResponseEntity.ok(student);
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<Student> updateStudent(
            @PathVariable Long id,
            @Valid @RequestBody StudentRequest request) {
        Student updated = studentService.updateStudent(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/students/{id}")
    public ResponseEntity<ApiResponse> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        ApiResponse response = new ApiResponse(true, "Student removed successfully", id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/departments")
    public ResponseEntity<List<String>> getDepartments() {
        return ResponseEntity.ok(studentService.getDepartments());
    }
}
