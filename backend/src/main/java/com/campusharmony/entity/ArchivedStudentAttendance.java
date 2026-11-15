package com.campusharmony.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ArchivedStudentAttendance Entity - historical archival snapshot of attendance records
 * preserved prior to student deletion per institutional audit requirements.
 */
@Entity
@Table(name = "archived_student_attendance")
public class ArchivedStudentAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "student_roll", nullable = false, length = 30)
    private String studentRoll;

    @Column(name = "student_name", nullable = false, length = 100)
    private String studentName;

    @Column(nullable = false, length = 100)
    private String department;

    @Column(name = "course_code", nullable = false, length = 20)
    private String courseCode;

    @Column(name = "academic_period_code", nullable = false, length = 20)
    private String academicPeriodCode;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "session_slot", nullable = false)
    private Integer sessionSlot;

    @Column(nullable = false, length = 10)
    private String status;

    @Column(name = "archived_at", updatable = false)
    private LocalDateTime archivedAt;

    @Column(name = "archived_by", nullable = false, length = 50)
    private String archivedBy = "SYSTEM";

    public ArchivedStudentAttendance() {
    }

    @PrePersist
    protected void onCreate() {
        this.archivedAt = LocalDateTime.now();
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

    public String getStudentRoll() {
        return studentRoll;
    }

    public void setStudentRoll(String studentRoll) {
        this.studentRoll = studentRoll;
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

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public String getAcademicPeriodCode() {
        return academicPeriodCode;
    }

    public void setAcademicPeriodCode(String academicPeriodCode) {
        this.academicPeriodCode = academicPeriodCode;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public void setSessionDate(LocalDate sessionDate) {
        this.sessionDate = sessionDate;
    }

    public Integer getSessionSlot() {
        return sessionSlot;
    }

    public void setSessionSlot(Integer sessionSlot) {
        this.sessionSlot = sessionSlot;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getArchivedAt() {
        return archivedAt;
    }

    public String getArchivedBy() {
        return archivedBy;
    }

    public void setArchivedBy(String archivedBy) {
        this.archivedBy = archivedBy;
    }
}
