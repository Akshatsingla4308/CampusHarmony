package com.campusharmony.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class RegisterTeacherRequest {

    @NotBlank(message = "Teacher ID is required")
    @Pattern(regexp = "^[A-Za-z0-9/_-]{2,20}$", message = "ID can only contain letters, numbers, -, /, and _")
    private String id;

    @NotBlank(message = "Teacher name is required")
    private String name;

    @NotBlank(message = "Subject is required")
    private String subject;

    public RegisterTeacherRequest() {
    }

    public RegisterTeacherRequest(String id, String name, String subject) {
        this.id = id;
        this.name = name;
        this.subject = subject;
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
}
