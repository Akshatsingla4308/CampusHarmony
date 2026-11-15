package com.campusharmony.dto;

import jakarta.validation.constraints.NotNull;

public class MarkAttendanceRequest {

    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotNull(message = "Present flag (true/false) is required")
    private Boolean present;

    public MarkAttendanceRequest() {
    }

    public MarkAttendanceRequest(Long studentId, Boolean present) {
        this.studentId = studentId;
        this.present = present;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Boolean getPresent() {
        return present;
    }

    public void setPresent(Boolean present) {
        this.present = present;
    }
}
