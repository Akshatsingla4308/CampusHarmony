package com.campusharmony.repository;

import com.campusharmony.entity.StudentMark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentMarkRepository extends JpaRepository<StudentMark, Long> {
    List<StudentMark> findByStudentId(Long studentId);
    List<StudentMark> findBySubjectKeyAndAcademicPeriodId(String subjectKey, Integer academicPeriodId);
    Optional<StudentMark> findByStudentIdAndSubjectKeyAndExamTypeAndAcademicPeriodId(
            Long studentId, String subjectKey, String examType, Integer academicPeriodId);
}
