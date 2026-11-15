package com.campusharmony.repository;

import com.campusharmony.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * TeacherRepository - Data Access Layer for Teacher entities.
 * Demonstrates: Spring Data JPA interfaces and query derivation.
 */
@Repository
public interface TeacherRepository extends JpaRepository<Teacher, String> {
    Optional<Teacher> findByIdIgnoreCase(String id);
}
