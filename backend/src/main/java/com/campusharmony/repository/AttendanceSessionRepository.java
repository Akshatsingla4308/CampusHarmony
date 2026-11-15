package com.campusharmony.repository;

import com.campusharmony.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    List<AttendanceSession> findByCourseCode(String courseCode);
    List<AttendanceSession> findByCourseCodeAndAcademicPeriodId(String courseCode, Integer academicPeriodId);
    Optional<AttendanceSession> findByCourseCodeAndAcademicPeriodIdAndSessionDateAndSessionSlot(
            String courseCode, Integer academicPeriodId, LocalDate sessionDate, Integer sessionSlot);
}
