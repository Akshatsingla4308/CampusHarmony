package com.campusharmony.repository;

import com.campusharmony.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * StudentRepository - Data Access Layer for Student records.
 * 
 * Demonstrates:
 * - Spring Data JPA derived queries
 * - Custom JPQL queries with joins and parameters
 */
@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByRollIgnoreCase(String roll);

    Optional<Student> findByEmailIgnoreCase(String email);

    List<Student> findByTeacherId(String teacherId);

    List<Student> findByTeacherIdIsNull();

    List<Student> findBySemester(Integer semester);

    @Query("SELECT s FROM Student s WHERE " +
           "(:teacherId IS NULL AND s.teacherId IS NULL) OR " +
           "(:teacherId IS NOT NULL AND s.teacherId = :teacherId)")
    List<Student> findByWorkspace(@Param("teacherId") String teacherId);

    @Query("SELECT s FROM Student s WHERE " +
           "((:teacherId IS NULL AND s.teacherId IS NULL) OR (:teacherId IS NOT NULL AND s.teacherId = :teacherId)) AND " +
           "(:dept IS NULL OR :dept = '' OR s.department = :dept) AND " +
           "(:sem IS NULL OR s.semester = :sem)")
    List<Student> filterStudents(@Param("teacherId") String teacherId,
                                 @Param("dept") String dept,
                                 @Param("sem") Integer sem);
}
