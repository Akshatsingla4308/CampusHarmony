package com.campusharmony.dto;

public class SubjectMarkEntry {

    private Long studentId;
    private Integer value;

    public SubjectMarkEntry() {
    }

    public SubjectMarkEntry(Long studentId, Integer value) {
        this.studentId = studentId;
        this.value = value;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Integer getValue() {
        return value;
    }

    public void setValue(Integer value) {
        this.value = value;
    }
}
