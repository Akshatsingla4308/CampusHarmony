package com.campusharmony.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * CourseEnrollment Entity - represents a student's formal registration in a course for a term.
 */
@Entity
@Table(name = "course_enrollments")
public class CourseEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "course_code", nullable = false, length = 20)
    private String courseCode;

    @Column(name = "academic_period_id", nullable = false)
    private Integer academicPeriodId;

    @Column(name = "enrollment_date", nullable = false)
    private LocalDate enrollmentDate = LocalDate.now();

    @Column(nullable = false, length = 20)
    private String status = "Enrolled"; // 'Enrolled', 'Dropped', 'Completed', 'Withdrawn'

    @Column(length = 5)
    private String grade;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public CourseEnrollment() {
    }

    public CourseEnrollment(Long studentId, String courseCode, Integer academicPeriodId, String status) {
        this.studentId = studentId;
        this.courseCode = courseCode;
        this.academicPeriodId = academicPeriodId;
        this.status = status != null ? status : "Enrolled";
        this.enrollmentDate = LocalDate.now();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.enrollmentDate == null) {
            this.enrollmentDate = LocalDate.now();
        }
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

    public LocalDate getEnrollmentDate() {
        return enrollmentDate;
    }

    public void setEnrollmentDate(LocalDate enrollmentDate) {
        this.enrollmentDate = enrollmentDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
