package com.campusharmony.repository;

import com.campusharmony.entity.Marks;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * MarksRepository - Data Access Layer for student exam marks records.
 */
@Repository
public interface MarksRepository extends JpaRepository<Marks, Long> {
    Optional<Marks> findByStudentId(Long studentId);
    void deleteByStudentId(Long studentId);
}
