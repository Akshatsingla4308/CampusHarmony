package com.campusharmony.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @NotBlank(message = "Role is required (teacher or student)")
    private String role; // "teacher" or "student"

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Roll number or Teacher ID is required")
    private String roll; // Student Roll (e.g. CS-2101) or Teacher ID (e.g. T-1001)

    public LoginRequest() {
    }

    public LoginRequest(String role, String name, String roll) {
        this.role = role;
        this.name = name;
        this.roll = roll;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRoll() {
        return roll;
    }

    public void setRoll(String roll) {
        this.roll = roll;
    }
}
