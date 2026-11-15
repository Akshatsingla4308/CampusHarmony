package com.campusharmony.dto;

import jakarta.validation.constraints.NotNull;

public class SessionRecordEntry {

    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotNull(message = "Status must be Present or Absent")
    private String status; // 'Present', 'Absent'

    private String remarks;

    public SessionRecordEntry() {
    }

    public SessionRecordEntry(Long studentId, String status, String remarks) {
        this.studentId = studentId;
        this.status = status;
        this.remarks = remarks;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
