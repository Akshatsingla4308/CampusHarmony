package com.campusharmony.repository;

import com.campusharmony.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * AttendanceRepository - Data Access Layer for student attendance records.
 */
@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByStudentId(Long studentId);
    void deleteByStudentId(Long studentId);
}
