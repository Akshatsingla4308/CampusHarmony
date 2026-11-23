package com.campusharmony.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * AttendanceSession Entity - represents an instructional lecture/lab event.
 */
@Entity
@Table(name = "attendance_sessions")
public class AttendanceSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_code", nullable = false, length = 20)
    private String courseCode;

    @Column(name = "academic_period_id", nullable = false)
    private Integer academicPeriodId;

    @Column(name = "teacher_id", length = 30)
    private String teacherId;

    @Column(name = "offering_id", insertable = false, updatable = false)
    private Long offeringId;

    public Long getOfferingId() { return offeringId; }

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "session_slot", nullable = false)
    private Integer sessionSlot = 1;

    @Column(name = "session_type", nullable = false, length = 20)
    private String sessionType = "Lecture"; // 'Lecture', 'Lab', 'Tutorial'

    @Column(name = "session_topic", length = 150)
    private String sessionTopic;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public AttendanceSession() {
    }

    public AttendanceSession(String courseCode, Integer academicPeriodId, String teacherId,
                             LocalDate sessionDate, Integer sessionSlot, String sessionType, String sessionTopic) {
        this.courseCode = courseCode;
        this.academicPeriodId = academicPeriodId;
        this.teacherId = teacherId;
        this.sessionDate = sessionDate;
        this.sessionSlot = sessionSlot != null ? sessionSlot : 1;
        this.sessionType = sessionType != null ? sessionType : "Lecture";
        this.sessionTopic = sessionTopic;
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

    public String getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(String teacherId) {
        this.teacherId = teacherId;
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

    public String getSessionType() {
        return sessionType;
    }

    public void setSessionType(String sessionType) {
        this.sessionType = sessionType;
    }

    public String getSessionTopic() {
        return sessionTopic;
    }

    public void setSessionTopic(String sessionTopic) {
        this.sessionTopic = sessionTopic;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
