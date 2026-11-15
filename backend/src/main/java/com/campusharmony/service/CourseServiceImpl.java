package com.campusharmony.service;

import com.campusharmony.dto.CourseRequest;
import com.campusharmony.entity.Activity;
import com.campusharmony.entity.Course;
import com.campusharmony.entity.Student;
import com.campusharmony.entity.Subject;
import com.campusharmony.exception.BadRequestException;
import com.campusharmony.repository.ActivityRepository;
import com.campusharmony.repository.CourseRepository;
import com.campusharmony.repository.StudentRepository;
import com.campusharmony.repository.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * CourseServiceImpl - Implementation of CourseService.
 */
@Service
@Transactional
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;
    private final ActivityRepository activityRepository;
    private final SubjectRepository subjectRepository;

    public CourseServiceImpl(CourseRepository courseRepository,
                             StudentRepository studentRepository,
                             ActivityRepository activityRepository,
                             SubjectRepository subjectRepository) {
        this.courseRepository = courseRepository;
        this.studentRepository = studentRepository;
        this.activityRepository = activityRepository;
        this.subjectRepository = subjectRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Course> getCourses(String teacherId) {
        List<Course> courses = courseRepository.findByWorkspace(teacherId != null && !teacherId.isBlank() ? teacherId.trim() : null);
        List<Student> students = teacherId != null && !teacherId.isBlank() 
                ? studentRepository.findByTeacherId(teacherId.trim()) 
                : studentRepository.findByTeacherIdIsNull();

        // Calculate enrolled students per course based on semester
        for (Course c : courses) {
            long count = students.stream()
                    .filter(s -> s.getSemester() != null && s.getSemester().equals(c.getSemester()))
                    .count();
            c.setTotalStudents((int) count);
        }

        return courses;
    }

    @Override
    public Course addCourse(CourseRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (courseRepository.findById(code).isPresent()) {
            throw new BadRequestException("Course code " + code + " already exists.");
        }

        Course course = new Course(
                code,
                request.getName().trim(),
                request.getFaculty() != null ? request.getFaculty().trim() : "Faculty",
                request.getCredits(),
                request.getSemester(),
                request.getStatus() != null ? request.getStatus() : "Upcoming",
                request.getTeacherId()
        );

        Course saved = courseRepository.save(course);

        activityRepository.save(new Activity(
                "Course added: " + saved.getName(),
                "course",
                saved.getTeacherId()
        ));

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Subject> getSubjects() {
        return subjectRepository.findAll();
    }
}
