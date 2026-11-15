package com.campusharmony.service;

import com.campusharmony.dto.StudentRequest;
import com.campusharmony.entity.Student;

import java.util.List;

/**
 * StudentService - Business operations for Student management.
 * Demonstrates: OOP Abstraction and Service Layer separation.
 */
public interface StudentService {

    List<Student> getStudents(String teacherId, String department, Integer semester, String search);

    Student getStudentById(Long id);

    Student createStudent(StudentRequest request);

    Student updateStudent(Long id, StudentRequest request);

    void deleteStudent(Long id);

    List<String> getDepartments();
}
