package com.campusharmony.repository;

import com.campusharmony.entity.CourseEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {
    List<CourseEnrollment> findByStudentId(Long studentId);
    List<CourseEnrollment> findByCourseCode(String courseCode);
    List<CourseEnrollment> findByCourseCodeAndAcademicPeriodId(String courseCode, Integer academicPeriodId);
    Optional<CourseEnrollment> findByStudentIdAndCourseCodeAndAcademicPeriodId(Long studentId, String courseCode, Integer academicPeriodId);
}
