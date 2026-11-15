package com.campusharmony.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Attendance Entity - Tracks student presence and absent days.
 * 
 * Demonstrates:
 * - 1-to-1 Relationship with Student entity
 * - Referential Integrity mapping
 */
@Entity
@Table(name = "attendance")
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false, unique = true)
    private Long studentId;

    @Column(name = "total_days", nullable = false)
    private Integer totalDays = 0;

    @Column(name = "present_days", nullable = false)
    private Integer presentDays = 0;

    @Column(name = "absent_days", nullable = false)
    private Integer absentDays = 0;

    @Column(name = "last_marked", length = 20)
    private String lastMarked = "—";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Transient fields for frontend convenience
    @Transient
    private String name;

    @Transient
    private String roll;

    @Transient
    private String department;

    public Attendance() {
    }

    public Attendance(Long studentId, Integer totalDays, Integer presentDays, Integer absentDays, String lastMarked) {
        this.studentId = studentId;
        this.totalDays = totalDays != null ? totalDays : 0;
        this.presentDays = presentDays != null ? presentDays : 0;
        this.absentDays = absentDays != null ? absentDays : 0;
        this.lastMarked = lastMarked != null ? lastMarked : "—";
    }

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = LocalDateTime.now();
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

    public Integer getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(Integer totalDays) {
        this.totalDays = totalDays;
    }

    public Integer getPresentDays() {
        return presentDays;
    }

    public void setPresentDays(Integer presentDays) {
        this.presentDays = presentDays;
    }

    public Integer getAbsentDays() {
        return absentDays;
    }

    public void setAbsentDays(Integer absentDays) {
        this.absentDays = absentDays;
    }

    public String getLastMarked() {
        return lastMarked;
    }

    public void setLastMarked(String lastMarked) {
        this.lastMarked = lastMarked;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRoll() {
        return roll;
    }

    public void setRoll(String roll) {
        this.roll = roll;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }
}
