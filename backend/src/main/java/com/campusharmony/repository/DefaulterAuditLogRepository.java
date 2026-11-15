package com.campusharmony.repository;

import com.campusharmony.entity.DefaulterAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DefaulterAuditLogRepository extends JpaRepository<DefaulterAuditLog, Long> {
    List<DefaulterAuditLog> findAllByOrderByAttendancePercentageAsc();
}
