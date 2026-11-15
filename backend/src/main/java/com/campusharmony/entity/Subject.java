package com.campusharmony.entity;

import jakarta.persistence.*;

/**
 * Entity representing an academic Subject for evaluation.
 */
@Entity
@Table(name = "subjects")
public class Subject {

    @Id
    @Column(name = "subject_key", length = 50)
    private String subjectKey;

    @Column(nullable = false, unique = true, length = 100)
    private String label;

    public Subject() {
    }

    public Subject(String subjectKey, String label) {
        this.subjectKey = subjectKey;
        this.label = label;
    }

    public String getSubjectKey() {
        return subjectKey;
    }

    public void setSubjectKey(String subjectKey) {
        this.subjectKey = subjectKey;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }
}
