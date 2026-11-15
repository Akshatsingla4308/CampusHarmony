package com.campusharmony.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Course Entity - represents an academic subject/module in the curriculum.
 */
@Entity
@Table(name = "courses")
public class Course {

    @Id
    @Column(length = 20)
    private String code; // e.g. 'CS501'

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 100)
    private String faculty;

    @Column(nullable = false)
    private Integer credits;

    @Column(nullable = false)
    private Integer semester;

    @Column(nullable = false, length = 20)
    private String status = "Upcoming"; // 'Ongoing', 'Completed', 'Upcoming'

    @Column(name = "teacher_id", length = 30)
    private String teacherId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Transient
    private Integer totalStudents; // Calculated field for course cards

    public Course() {
    }

    public Course(String code, String name, String faculty, Integer credits, Integer semester, String status, String teacherId) {
        this.code = code;
        this.name = name;
        this.faculty = faculty;
        this.credits = credits;
        this.semester = semester;
        this.status = status != null ? status : "Upcoming";
        this.teacherId = teacherId;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFaculty() {
        return faculty;
    }

    public void setFaculty(String faculty) {
        this.faculty = faculty;
    }

    public Integer getCredits() {
        return credits;
    }

    public void setCredits(Integer credits) {
        this.credits = credits;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(String teacherId) {
        this.teacherId = teacherId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(Integer totalStudents) {
        this.totalStudents = totalStudents;
    }
}
