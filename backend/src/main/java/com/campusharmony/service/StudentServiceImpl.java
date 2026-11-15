package com.campusharmony.service;

import com.campusharmony.dto.StudentRequest;
import com.campusharmony.entity.*;
import com.campusharmony.exception.BadRequestException;
import com.campusharmony.exception.ResourceNotFoundException;
import com.campusharmony.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * StudentServiceImpl - Business logic implementation for Student management.
 */
@Service
@Transactional
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    private final MarksRepository marksRepository;
    private final ActivityRepository activityRepository;
    private final DepartmentRepository departmentRepository;
    private final com.campusharmony.repository.AttendanceRecordRepository attendanceRecordRepository;

    public StudentServiceImpl(StudentRepository studentRepository,
                              AttendanceRepository attendanceRepository,
                              MarksRepository marksRepository,
                              ActivityRepository activityRepository,
                              DepartmentRepository departmentRepository,
                              com.campusharmony.repository.AttendanceRecordRepository attendanceRecordRepository) {
        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
        this.marksRepository = marksRepository;
        this.activityRepository = activityRepository;
        this.departmentRepository = departmentRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Student> getStudents(String teacherId, String department, Integer semester, String search) {
        List<Student> list;
        if (teacherId != null && !teacherId.isBlank()) {
            list = studentRepository.findByTeacherId(teacherId.trim());
        } else {
            list = studentRepository.findByTeacherIdIsNull();
        }

        // Apply filters in memory or via repository
        if (department != null && !department.isBlank()) {
            list = list.stream()
                    .filter(s -> department.equalsIgnoreCase(s.getDepartment()))
                    .collect(Collectors.toList());
        }

        if (semester != null) {
            list = list.stream()
                    .filter(s -> Objects.equals(s.getSemester(), semester))
                    .collect(Collectors.toList());
        }

        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            list = list.stream()
                    .filter(s -> (s.getName() != null && s.getName().toLowerCase().contains(q)) ||
                                 (s.getRoll() != null && s.getRoll().toLowerCase().contains(q)) ||
                                 (s.getEmail() != null && s.getEmail().toLowerCase().contains(q)) ||
                                 (s.getDepartment() != null && s.getDepartment().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        // Attach computed attendance percentage to each student
        for (Student s : list) {
            attendanceRepository.findByStudentId(s.getId()).ifPresent(att -> {
                if (att.getTotalDays() != null && att.getTotalDays() > 0) {
                    int pct = Math.round((att.getPresentDays() * 100.0f) / att.getTotalDays());
                    s.setAttendance(pct);
                } else {
                    s.setAttendance(null);
                }
            });
        }

        return list;
    }

    @Override
    @Transactional(readOnly = true)
    public Student getStudentById(Long id) {
        Student s = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));

        attendanceRepository.findByStudentId(s.getId()).ifPresent(att -> {
            if (att.getTotalDays() != null && att.getTotalDays() > 0) {
                int pct = Math.round((att.getPresentDays() * 100.0f) / att.getTotalDays());
                s.setAttendance(pct);
            }
        });

        return s;
    }

    @Override
    public Student createStudent(StudentRequest request) {
        // Roll number generation if not provided
        String roll = request.getRoll();
        if (roll == null || roll.isBlank()) {
            roll = generateRollNumber(request.getDepartment(), request.getSemester());
        }

        // Check uniqueness of roll and email
        if (studentRepository.findByRollIgnoreCase(roll).isPresent()) {
            throw new BadRequestException("Student with roll number " + roll + " already exists.");
        }
        if (studentRepository.findByEmailIgnoreCase(request.getEmail().trim()).isPresent()) {
            throw new BadRequestException("Student with email " + request.getEmail() + " already exists.");
        }

        Student student = new Student(
                roll.toUpperCase(),
                request.getName().trim(),
                request.getDepartment().trim(),
                request.getSemester(),
                request.getEmail().trim().toLowerCase(),
                request.getPhone().trim(),
                request.getStatus() != null ? request.getStatus() : "Active",
                request.getGender(),
                request.getAddress(),
                request.getTeacherId()
        );

        departmentRepository.findByNameIgnoreCase(request.getDepartment().trim())
                .ifPresentOrElse(d -> student.setDepartmentId(d.getId()), () -> student.setDepartmentId(1));

        Student saved = studentRepository.save(student);

        // Auto-create initial Attendance entry (0 days)
        Attendance attendance = new Attendance(saved.getId(), 0, 0, 0, "—");
        attendanceRepository.save(attendance);

        // Auto-create initial Marks entry (null scores)
        Marks marks = new Marks(saved.getId());
        marksRepository.save(marks);

        // Log ERP activity
        activityRepository.save(new Activity(
                saved.getName() + " enrolled in " + saved.getDepartment(),
                "enroll",
                saved.getTeacherId()
        ));

        return saved;
    }

    @Override
    public Student updateStudent(Long id, StudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));

        student.setName(request.getName().trim());
        student.setDepartment(request.getDepartment().trim());
        departmentRepository.findByNameIgnoreCase(request.getDepartment().trim())
                .ifPresent(d -> student.setDepartmentId(d.getId()));
        student.setSemester(request.getSemester());
        student.setEmail(request.getEmail().trim().toLowerCase());
        student.setPhone(request.getPhone().trim());
        if (request.getStatus() != null) student.setStatus(request.getStatus());
        if (request.getGender() != null) student.setGender(request.getGender());
        if (request.getAddress() != null) student.setAddress(request.getAddress());

        Student updated = studentRepository.save(student);

        activityRepository.save(new Activity(
                updated.getName() + "'s profile details updated",
                "edit",
                updated.getTeacherId()
        ));

        return updated;
    }

    @Override
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));

        // Academic retention check: Prevent silent cascading of historical attendance
        if (!attendanceRecordRepository.findByStudentId(id).isEmpty()) {
            throw new BadRequestException(
                    "Regulatory Compliance Violation: Cannot delete student with active historical attendance records. " +
                    "Academic audit policy requires archiving student history via sp_archive_and_delete_student prior to purge.");
        }

        // Cascade delete attendance and marks records
        attendanceRepository.deleteByStudentId(id);
        marksRepository.deleteByStudentId(id);

        activityRepository.save(new Activity(
                student.getName() + " was removed from the class list",
                "notice",
                student.getTeacherId()
        ));

        studentRepository.delete(student);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getDepartments() {
        List<Department> list = departmentRepository.findAll();
        if (!list.isEmpty()) {
            return list.stream().map(Department::getName).collect(Collectors.toList());
        }
        return Arrays.asList("Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil");
    }

    private String generateRollNumber(String department, Integer semester) {
        String prefix = "CS";
        if (department != null) {
            String lower = department.toLowerCase();
            if (lower.contains("info")) prefix = "IT";
            else if (lower.contains("elec")) prefix = "EC";
            else if (lower.contains("mech")) prefix = "ME";
            else if (lower.contains("civ")) prefix = "CV";
        }
        int randomNum = 2100 + (int) (Math.random() * 800) + 21;
        return prefix + "-" + randomNum;
    }
}
