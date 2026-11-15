package com.campusharmony.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Teacher Entity - represents an instructor in the college ERP.
 * 
 * Demonstrates:
 * - Object-Oriented Encapsulation
 * - JPA Entity Mapping
 * - PrePersist lifecycle callback
 */
@Entity
@Table(name = "teachers")
public class Teacher {

    @Id
    @Column(length = 30)
    private String id; // e.g. 'T-1001'

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String subject; // subjectKey e.g. 'computerScience'

    @Column(nullable = false, length = 20)
    private String workspace = "demo"; // 'demo' or 'own'

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Teacher() {
    }

    public Teacher(String id, String name, String subject, String workspace) {
        this.id = id;
        this.name = name;
        this.subject = subject;
        this.workspace = workspace != null ? workspace : "demo";
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getWorkspace() {
        return workspace;
    }

    public void setWorkspace(String workspace) {
        this.workspace = workspace;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
