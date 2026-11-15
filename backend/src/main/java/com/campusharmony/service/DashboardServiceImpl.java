package com.campusharmony.service;

import com.campusharmony.dto.StatCardResponse;
import com.campusharmony.entity.*;
import com.campusharmony.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * DashboardServiceImpl - Implementation of DashboardService.
 */
@Service
@Transactional
public class DashboardServiceImpl implements DashboardService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final AttendanceRepository attendanceRepository;
    private final TeacherRepository teacherRepository;
    private final ActivityRepository activityRepository;
    private final SubjectRepository subjectRepository;

    public DashboardServiceImpl(StudentRepository studentRepository,
                                CourseRepository courseRepository,
                                AttendanceRepository attendanceRepository,
                                TeacherRepository teacherRepository,
                                ActivityRepository activityRepository,
                                SubjectRepository subjectRepository) {
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.attendanceRepository = attendanceRepository;
        this.teacherRepository = teacherRepository;
        this.activityRepository = activityRepository;
        this.subjectRepository = subjectRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StatCardResponse> getStats(String teacherId) {
        List<Student> students = teacherId != null && !teacherId.isBlank()
                ? studentRepository.findByTeacherId(teacherId.trim())
                : studentRepository.findByTeacherIdIsNull();

        List<Course> courses = courseRepository.findByWorkspace(teacherId != null && !teacherId.isBlank() ? teacherId.trim() : null);

        // Compute attendance metrics
        int totalPercent = 0;
        int countWithAttendance = 0;
        int lowAttendanceCount = 0;

        for (Student s : students) {
            Optional<Attendance> attOpt = attendanceRepository.findByStudentId(s.getId());
            if (attOpt.isPresent()) {
                Attendance att = attOpt.get();
                if (att.getTotalDays() != null && att.getTotalDays() > 0) {
                    int pct = Math.round((att.getPresentDays() * 100.0f) / att.getTotalDays());
                    totalPercent += pct;
                    countWithAttendance++;
                    if (pct < 75) {
                        lowAttendanceCount++;
                    }
                }
            }
        }

        String avgAttStr = countWithAttendance > 0 ? (Math.round((float) totalPercent / countWithAttendance) + "%") : "—";
        String avgDelta = countWithAttendance > 0 ? "Across your students" : "No attendance marked yet";

        // Teacher's subject label
        String subjectLabel = "All subjects";
        String subjectDelta = "College ERP";
        if (teacherId != null && !teacherId.isBlank()) {
            Optional<Teacher> tOpt = teacherRepository.findByIdIgnoreCase(teacherId.trim());
            if (tOpt.isPresent()) {
                Teacher t = tOpt.get();
                subjectDelta = "Teacher ID " + t.getId();
                Optional<Subject> subOpt = subjectRepository.findById(t.getSubject());
                if (subOpt.isPresent()) {
                    subjectLabel = subOpt.get().getLabel();
                } else {
                    subjectLabel = t.getSubject();
                }
            }
        }

        long ongoingCourses = courses.stream()
                .filter(c -> "Ongoing".equalsIgnoreCase(c.getStatus()))
                .count();

        List<StatCardResponse> stats = new ArrayList<>();
        stats.add(new StatCardResponse("students", "Total Students", students.size(),
                students.isEmpty() ? "Add students to begin" : "In your class list", "👥"));
        stats.add(new StatCardResponse("subject", "My Subject", subjectLabel, subjectDelta, "🎓"));
        stats.add(new StatCardResponse("courses", "My Courses", courses.size(), ongoingCourses + " ongoing", "📚"));
        stats.add(new StatCardResponse("attendance", "Average Attendance", avgAttStr, avgDelta, "📈"));
        stats.add(new StatCardResponse("low", "Low Attendance", lowAttendanceCount, "Students below 75%", "⚠️"));

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Activity> getRecentActivities(String teacherId) {
        List<Activity> list = activityRepository.findRecentActivities(
                teacherId != null && !teacherId.isBlank() ? teacherId.trim() : null
        );

        LocalDateTime now = LocalDateTime.now();
        int limit = Math.min(list.size(), 8);
        List<Activity> sub = new ArrayList<>(list.subList(0, limit));

        for (Activity a : sub) {
            if (a.getCreatedAt() != null) {
                Duration d = Duration.between(a.getCreatedAt(), now);
                long mins = d.toMinutes();
                if (mins < 1) a.setTime("Just now");
                else if (mins < 60) a.setTime(mins + " min" + (mins > 1 ? "s" : "") + " ago");
                else {
                    long hrs = d.toHours();
                    if (hrs < 24) a.setTime(hrs + " hour" + (hrs > 1 ? "s" : "") + " ago");
                    else {
                        long days = d.toDays();
                        a.setTime(days == 1 ? "Yesterday" : days + " days ago");
                    }
                }
            } else {
                a.setTime("Recently");
            }
        }

        return sub;
    }

    @Override
    public Activity logActivity(String text, String type, String teacherId) {
        Activity act = new Activity(text, type, teacherId);
        return activityRepository.save(act);
    }
}
