package com.campusharmony.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * AttendanceRecord Entity - represents an individual student's attendance entry for a session.
 */
@Entity
@Table(name = "attendance_records")
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "enrollment_id", nullable = false)
    private Long enrollmentId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "course_code", nullable = false, length = 20)
    private String courseCode;

    @Column(name = "academic_period_id", nullable = false)
    private Integer academicPeriodId;

    @Column(nullable = false, length = 10)
    private String status; // 'Present', 'Absent'

    @Column(length = 100)
    private String remarks;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public AttendanceRecord() {
    }

    public AttendanceRecord(Long sessionId, Long enrollmentId, Long studentId,
                            String courseCode, Integer academicPeriodId, String status, String remarks) {
        this.sessionId = sessionId;
        this.enrollmentId = enrollmentId;
        this.studentId = studentId;
        this.courseCode = courseCode;
        this.academicPeriodId = academicPeriodId;
        this.status = status;
        this.remarks = remarks;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public Long getEnrollmentId() {
        return enrollmentId;
    }

    public void setEnrollmentId(Long enrollmentId) {
        this.enrollmentId = enrollmentId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public Integer getAcademicPeriodId() {
        return academicPeriodId;
    }

    public void setAcademicPeriodId(Integer academicPeriodId) {
        this.academicPeriodId = academicPeriodId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
