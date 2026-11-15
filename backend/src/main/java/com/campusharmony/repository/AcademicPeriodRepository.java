package com.campusharmony.repository;

import com.campusharmony.entity.AcademicPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AcademicPeriodRepository extends JpaRepository<AcademicPeriod, Integer> {
    Optional<AcademicPeriod> findByCode(String code);
    Optional<AcademicPeriod> findByCurrentTrue();
}
