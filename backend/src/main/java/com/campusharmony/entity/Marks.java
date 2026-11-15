package com.campusharmony.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Marks Entity - Stores academic test scores across 5 core subjects.
 * 
 * Demonstrates:
 * - 1-to-1 relationship with Student
 * - Encapsulation of subject scores (0-100)
 */
@Entity
@Table(name = "marks")
public class Marks {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false, unique = true)
    private Long studentId;

    @Column(name = "mathematics")
    private Integer mathematics;

    @Column(name = "physics")
    private Integer physics;

    @Column(name = "chemistry")
    private Integer chemistry;

    @Column(name = "english")
    private Integer english;

    @Column(name = "computer_science")
    private Integer computerScience;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Marks() {
    }

    public Marks(Long studentId) {
        this.studentId = studentId;
    }

    public Marks(Long studentId, Integer mathematics, Integer physics, Integer chemistry, Integer english, Integer computerScience) {
        this.studentId = studentId;
        this.mathematics = mathematics;
        this.physics = physics;
        this.chemistry = chemistry;
        this.english = english;
        this.computerScience = computerScience;
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

    public Integer getMathematics() {
        return mathematics;
    }

    public void setMathematics(Integer mathematics) {
        this.mathematics = mathematics;
    }

    public Integer getPhysics() {
        return physics;
    }

    public void setPhysics(Integer physics) {
        this.physics = physics;
    }

    public Integer getChemistry() {
        return chemistry;
    }

    public void setChemistry(Integer chemistry) {
        this.chemistry = chemistry;
    }

    public Integer getEnglish() {
        return english;
    }

    public void setEnglish(Integer english) {
        this.english = english;
    }

    public Integer getComputerScience() {
        return computerScience;
    }

    public void setComputerScience(Integer computerScience) {
        this.computerScience = computerScience;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Helper getter/setter by subject key
    public Integer getScoreBySubject(String subjectKey) {
        if ("mathematics".equalsIgnoreCase(subjectKey)) return mathematics;
        if ("physics".equalsIgnoreCase(subjectKey)) return physics;
        if ("chemistry".equalsIgnoreCase(subjectKey)) return chemistry;
        if ("english".equalsIgnoreCase(subjectKey)) return english;
        if ("computerScience".equalsIgnoreCase(subjectKey) || "computer_science".equalsIgnoreCase(subjectKey)) return computerScience;
        return null;
    }

    public void setScoreBySubject(String subjectKey, Integer score) {
        if ("mathematics".equalsIgnoreCase(subjectKey)) this.mathematics = score;
        else if ("physics".equalsIgnoreCase(subjectKey)) this.physics = score;
        else if ("chemistry".equalsIgnoreCase(subjectKey)) this.chemistry = score;
        else if ("english".equalsIgnoreCase(subjectKey)) this.english = score;
        else if ("computerScience".equalsIgnoreCase(subjectKey) || "computer_science".equalsIgnoreCase(subjectKey)) this.computerScience = score;
    }
}
