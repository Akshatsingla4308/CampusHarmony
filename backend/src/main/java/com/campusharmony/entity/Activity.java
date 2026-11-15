package com.campusharmony.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Activity Entity - Audit trail / recent events feed for college actions.
 */
@Entity
@Table(name = "activities")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String text;

    @Column(nullable = false, length = 50)
    private String type = "notice"; // 'enroll', 'edit', 'notice', 'course', 'attendance', 'marks'

    @Column(name = "teacher_id", length = 30)
    private String teacherId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Transient
    private String time; // Relative time string e.g. "2 hours ago"

    public Activity() {
    }

    public Activity(String text, String type, String teacherId) {
        this.text = text;
        this.type = type != null ? type : "notice";
        this.teacherId = teacherId;
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

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
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

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }
}
