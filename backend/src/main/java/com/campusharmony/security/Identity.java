package com.campusharmony.security;
public record Identity(String login, String name, String role, String teacherId, Long studentId) implements java.io.Serializable {}
