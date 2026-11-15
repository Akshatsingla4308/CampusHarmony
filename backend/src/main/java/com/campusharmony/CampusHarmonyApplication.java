package com.campusharmony;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Entry Point for Campus Harmony / Sunrise Institute Student Management System.
 * 
 * Demonstrates:
 * - Spring Boot Application Bootstrap
 * - Auto-configuration
 * - Component scanning across controllers, services, repositories, and entities
 */
@SpringBootApplication
public class CampusHarmonyApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampusHarmonyApplication.class, args);
        System.out.println("=========================================================");
        System.out.println(" Campus Harmony Backend running on http://localhost:8080");
        System.out.println(" REST APIs ready for Sunrise Institute ERP Frontend");
        System.out.println("=========================================================");
    }
}
