package com.campusharmony.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * StudentMark Entity - normalized subject-level and exam-level marks.
 */
@Entity
@Table(name = "student_marks")
public class StudentMark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "subject_key", nullable = false, length = 50)
    private String subjectKey;

    @Column(name = "academic_period_id", nullable = false)
    private Integer academicPeriodId;

    @Column(nullable = false)
    private Integer semester;

    @Column(name = "exam_type", nullable = false, length = 20)
    private String examType = "Endterm"; // 'Internal', 'Midterm', 'Endterm'

    @Column(name = "marks_obtained", nullable = false, precision = 5, scale = 2)
    private BigDecimal marksObtained;

    @Column(name = "max_marks", nullable = false, precision = 5, scale = 2)
    private BigDecimal maxMarks = new BigDecimal("100.00");

    @Column(length = 5)
    private String grade;

    @Column(length = 100)
    private String remarks;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public StudentMark() {
    }

    public StudentMark(Long studentId, String subjectKey, Integer academicPeriodId,
                       Integer semester, String examType, BigDecimal marksObtained, BigDecimal maxMarks) {
        this.studentId = studentId;
        this.subjectKey = subjectKey;
        this.academicPeriodId = academicPeriodId;
        this.semester = semester;
        this.examType = examType != null ? examType : "Endterm";
        this.marksObtained = marksObtained;
        this.maxMarks = maxMarks != null ? maxMarks : new BigDecimal("100.00");
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

    public String getSubjectKey() {
        return subjectKey;
    }

    public void setSubjectKey(String subjectKey) {
        this.subjectKey = subjectKey;
    }

    public Integer getAcademicPeriodId() {
        return academicPeriodId;
    }

    public void setAcademicPeriodId(Integer academicPeriodId) {
        this.academicPeriodId = academicPeriodId;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public String getExamType() {
        return examType;
    }

    public void setExamType(String examType) {
        this.examType = examType;
    }

    public BigDecimal getMarksObtained() {
        return marksObtained;
    }

    public void setMarksObtained(BigDecimal marksObtained) {
        this.marksObtained = marksObtained;
    }

    public BigDecimal getMaxMarks() {
        return maxMarks;
    }

    public void setMaxMarks(BigDecimal maxMarks) {
        this.maxMarks = maxMarks;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
