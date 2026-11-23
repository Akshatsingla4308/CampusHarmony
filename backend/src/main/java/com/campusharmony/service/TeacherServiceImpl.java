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
    public Teacher createTeacher(Teacher teacher) {
        if (teacher.getId() == null || teacher.getId().isBlank()) {
            teacher.setId("T-" + (teacherRepository.count() + 1001));
        }
        if (teacher.getWorkspace() == null) {
            teacher.setWorkspace("demo");
        }
        return teacherRepository.save(teacher);
    }

    @Override
    public Teacher updateTeacher(String id, Teacher updated) {
        Teacher existing = getTeacherById(id);
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getDepartmentId() != null) existing.setDepartmentId(updated.getDepartmentId());
        if (updated.getSubject() != null) existing.setSubject(updated.getSubject());
        return teacherRepository.save(existing);
    }

    @Override
    public void deleteTeacher(String id) {
        Teacher existing = getTeacherById(id);
        teacherRepository.delete(existing);
    }

    private String normalizeName(String input) {
        if (input == null) return "";
        return input.toLowerCase()
                .replaceAll("^(dr|prof)\\.?\\s+", "")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
