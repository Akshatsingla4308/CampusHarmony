package com.campusharmony.service;

import com.campusharmony.entity.Activity;
import com.campusharmony.entity.Attendance;
import com.campusharmony.entity.Student;
import com.campusharmony.exception.ResourceNotFoundException;
import com.campusharmony.repository.ActivityRepository;
import com.campusharmony.repository.AttendanceRepository;
import com.campusharmony.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * AttendanceServiceImpl - Business implementation for Attendance operations.
 */
@Service
@Transactional
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final ActivityRepository activityRepository;

    public AttendanceServiceImpl(AttendanceRepository attendanceRepository,
                                 StudentRepository studentRepository,
                                 ActivityRepository activityRepository) {
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
        this.activityRepository = activityRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Attendance> getAttendance(String teacherId) {
        List<Student> students = teacherId != null && !teacherId.isBlank()
                ? studentRepository.findByTeacherId(teacherId.trim())
                : studentRepository.findByTeacherIdIsNull();

        List<Attendance> result = new ArrayList<>();
        for (Student s : students) {
            Attendance att = attendanceRepository.findByStudentId(s.getId())
                    .orElseGet(() -> {
                        Attendance fresh = new Attendance(s.getId(), 0, 0, 0, "—");
                        return attendanceRepository.save(fresh);
                    });
            att.setName(s.getName());
            att.setRoll(s.getRoll());
            att.setDepartment(s.getDepartment());
            result.add(att);
        }

        return result;
    }

    @Override
    public com.campusharmony.dto.AttendanceMarkResponse markAttendance(Long studentId, boolean present) {
        // Find student
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        // Find or create attendance record
        Attendance att = attendanceRepository.findByStudentId(studentId)
                .orElseGet(() -> new Attendance(studentId, 0, 0, 0, "—"));

        // Update counters
        att.setTotalDays(att.getTotalDays() + 1);
        if (present) {
            att.setPresentDays(att.getPresentDays() + 1);
        } else {
            att.setAbsentDays(att.getAbsentDays() + 1);
        }

        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        att.setLastMarked(today);

        Attendance saved = attendanceRepository.save(att);
        saved.setName(student.getName());
        saved.setRoll(student.getRoll());
        saved.setDepartment(student.getDepartment());

        // Log activity
        activityRepository.save(new Activity(
                "Attendance updated for " + student.getName(),
                "attendance",
                student.getTeacherId()
        ));

        // Compute attendance percentage for student (transient field)
        if (saved.getTotalDays() != null && saved.getTotalDays() > 0) {
            int pct = Math.round((saved.getPresentDays() * 100.0f) / saved.getTotalDays());
            student.setAttendance(pct);
        } else {
            student.setAttendance(null);
        }

        return new com.campusharmony.dto.AttendanceMarkResponse(saved, student);
    }
}
