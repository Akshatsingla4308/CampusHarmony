package com.campusharmony.dto;

import java.util.List;

public class SaveMarksRequest {

    private String teacherId;
    private String subjectKey;
    private List<SubjectMarkEntry> entries;

    public SaveMarksRequest() {
    }

    public SaveMarksRequest(String teacherId, String subjectKey, List<SubjectMarkEntry> entries) {
        this.teacherId = teacherId;
        this.subjectKey = subjectKey;
        this.entries = entries;
    }

    public String getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(String teacherId) {
        this.teacherId = teacherId;
    }

    public String getSubjectKey() {
        return subjectKey;
    }

    public void setSubjectKey(String subjectKey) {
        this.subjectKey = subjectKey;
    }

    public List<SubjectMarkEntry> getEntries() {
        return entries;
    }

    public void setEntries(List<SubjectMarkEntry> entries) {
        this.entries = entries;
    }
}
