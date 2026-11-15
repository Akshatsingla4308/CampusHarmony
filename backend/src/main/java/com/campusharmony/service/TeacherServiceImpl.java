package com.campusharmony.service;

import com.campusharmony.dto.LoginRequest;
import com.campusharmony.dto.RegisterStudentRequest;
import com.campusharmony.dto.RegisterTeacherRequest;
import com.campusharmony.entity.Activity;
import com.campusharmony.entity.Student;
import com.campusharmony.entity.Teacher;
import com.campusharmony.exception.BadRequestException;
import com.campusharmony.exception.ResourceNotFoundException;
import com.campusharmony.repository.ActivityRepository;
import com.campusharmony.repository.SubjectRepository;
import com.campusharmony.repository.StudentRepository;
import com.campusharmony.repository.TeacherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * TeacherServiceImpl - Implementation of TeacherService.
 * Demonstrates: OOP Polymorphism and Implementation of Abstraction.
 */
@Service
@Transactional
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final ActivityRepository activityRepository;
    private final SubjectRepository subjectRepository;

    public TeacherServiceImpl(TeacherRepository teacherRepository,
                              StudentRepository studentRepository,
                              ActivityRepository activityRepository,
                              SubjectRepository subjectRepository) {
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.activityRepository = activityRepository;
        this.subjectRepository = subjectRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Teacher> getAllTeachers() {
        return teacherRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Teacher getTeacherById(String id) {
        return teacherRepository.findByIdIgnoreCase(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", "id", id));
    }

    @Override
    public Teacher registerTeacher(RegisterTeacherRequest request) {
        String cleanId = request.getId().trim().toUpperCase();
        if (teacherRepository.findByIdIgnoreCase(cleanId).isPresent()) {
            throw new BadRequestException("This teacher ID is already registered. Please sign in or pick another ID.");
        }

        String subjectKey = request.getSubject().trim();
        if (!subjectRepository.existsById(subjectKey)) {
            throw new BadRequestException("Unknown subject. Please choose a subject from the list.");
        }

        Teacher teacher = new Teacher(
                cleanId,
                request.getName().trim(),
                subjectKey,
                "own"
        );
        Teacher saved = teacherRepository.save(teacher);

        activityRepository.save(new Activity(
                "New teacher registered: " + saved.getName() + " (" + saved.getId() + ")",
                "notice",
                saved.getId()
        ));

        return saved;
    }

    @Override
    public Student registerStudent(RegisterStudentRequest request) {
        String cleanRoll = request.getRoll().trim().toUpperCase();
        if (studentRepository.findByRollIgnoreCase(cleanRoll).isPresent()) {
            throw new BadRequestException("This roll number is already registered. Please sign in.");
        }

        String email = cleanRoll.toLowerCase().replaceAll("[^a-z0-9]", "") + "@campus.local";
        Student student = new Student(
                cleanRoll,
                request.getName().trim().replaceAll("\\s+", " "),
                request.getDepartment().trim(),
                request.getSemester(),
                email,
                "-",
                "Active",
                "Other",
                null,
                null
        );
        Student saved = studentRepository.save(student);

        activityRepository.save(new Activity(
                "New student registered: " + saved.getName() + " (" + saved.getRoll() + ")",
                "enroll",
                null
        ));

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> authenticate(LoginRequest request) {
        String role = request.getRole().trim().toLowerCase();
        String name = request.getName().trim();
        String roll = request.getRoll().trim().toUpperCase();

        Map<String, Object> session = new HashMap<>();

        if ("teacher".equals(role)) {
            Teacher teacher = teacherRepository.findByIdIgnoreCase(roll)
                    .orElseThrow(() -> new BadRequestException("Teacher ID not found. New teacher? Use \"Register here\" below."));

            if (!normalizeName(teacher.getName()).equals(normalizeName(name))) {
                throw new BadRequestException("Name does not match this teacher ID.");
            }

            session.put("role", "teacher");
            session.put("name", teacher.getName());
            session.put("roll", teacher.getId());
            session.put("subject", teacher.getSubject());
            session.put("workspace", teacher.getWorkspace());
            session.put("loggedInAt", new Date().toInstant().toString());
            return session;

        } else if ("student".equals(role)) {
            Student s = studentRepository.findByRollIgnoreCase(roll)
                    .orElseThrow(() -> new BadRequestException("Roll number not found. New student? Use \"Register here\" below."));

            if (!normalizeName(s.getName()).equals(normalizeName(name))) {
                throw new BadRequestException("Name does not match this roll number.");
            }
            session.put("id", s.getId());
            session.put("department", s.getDepartment());
            session.put("semester", s.getSemester());

            session.put("role", "student");
            session.put("name", s.getName());
            session.put("roll", s.getRoll());
            session.put("workspace", "demo");
            session.put("loggedInAt", new Date().toInstant().toString());
            return session;

        } else {
            throw new BadRequestException("Invalid role specified. Must be 'teacher' or 'student'.");
        }
    }

    private String normalizeName(String input) {
        if (input == null) return "";
        return input.toLowerCase()
                .replaceAll("^(dr|prof)\\.?\\s+", "")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
