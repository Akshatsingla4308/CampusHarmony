package com.campusharmony.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class SessionAttendanceRequest {

    @NotNull(message = "Session ID is required")
    private Long sessionId;

    @NotEmpty(message = "Attendance entries must not be empty")
    private List<SessionRecordEntry> entries;

    public SessionAttendanceRequest() {
    }

    public SessionAttendanceRequest(Long sessionId, List<SessionRecordEntry> entries) {
        this.sessionId = sessionId;
        this.entries = entries;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public List<SessionRecordEntry> getEntries() {
        return entries;
    }

    public void setEntries(List<SessionRecordEntry> entries) {
        this.entries = entries;
    }
}
