package com.campusharmony.service;

import com.campusharmony.dto.LoginRequest;
import com.campusharmony.dto.RegisterStudentRequest;
import com.campusharmony.dto.RegisterTeacherRequest;
import com.campusharmony.entity.Student;
import com.campusharmony.entity.Teacher;

import java.util.List;
import java.util.Map;

/**
 * TeacherService - Service Interface defining business operations for Teachers and Auth.
 * Demonstrates: OOP Abstraction.
 */
public interface TeacherService {

    List<Teacher> getAllTeachers();

    Teacher getTeacherById(String id);

    Teacher registerTeacher(RegisterTeacherRequest request);

    Teacher createTeacher(Teacher teacher);

    Teacher updateTeacher(String id, Teacher teacher);

    void deleteTeacher(String id);

    Student registerStudent(RegisterStudentRequest request);

    Map<String, Object> authenticate(LoginRequest request);
}
