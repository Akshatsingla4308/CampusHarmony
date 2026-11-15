package com.campusharmony.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DefaulterAuditLog Entity - immutable historical snapshot of attendance defaulters.
 */
@Entity
@Table(name = "defaulter_audit_log")
public class DefaulterAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id")
    private Long studentId;

    @Column(nullable = false, length = 30)
    private String roll;

    @Column(name = "student_name", nullable = false, length = 100)
    private String studentName;

    @Column(nullable = false, length = 100)
    private String department;

    @Column(name = "attendance_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal attendancePercentage;

    @Column(name = "classes_needed", nullable = false)
    private Integer classesNeeded;

    @Column(name = "reported_at", updatable = false)
    private LocalDateTime reportedAt;

    public DefaulterAuditLog() {
    }

    public DefaulterAuditLog(Long studentId, String roll, String studentName, String department,
                             BigDecimal attendancePercentage, Integer classesNeeded) {
        this.studentId = studentId;
        this.roll = roll;
        this.studentName = studentName;
        this.department = department;
        this.attendancePercentage = attendancePercentage;
        this.classesNeeded = classesNeeded;
    }

    @PrePersist
    protected void onCreate() {
        this.reportedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getRoll() {
        return roll;
    }

    public void setRoll(String roll) {
        this.roll = roll;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public BigDecimal getAttendancePercentage() {
        return attendancePercentage;
    }

    public void setAttendancePercentage(BigDecimal attendancePercentage) {
        this.attendancePercentage = attendancePercentage;
    }

    public Integer getClassesNeeded() {
        return classesNeeded;
    }

    public void setClassesNeeded(Integer classesNeeded) {
        this.classesNeeded = classesNeeded;
    }

    public LocalDateTime getReportedAt() {
        return reportedAt;
    }
}
