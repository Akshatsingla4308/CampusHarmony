package com.campusharmony.entity;

import jakarta.persistence.*;

/**
 * AcademicPeriod Entity - represents an academic calendar term/session.
 */
@Entity
@Table(name = "academic_periods")
public class AcademicPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 20)
    private String code; // e.g. '2026-ODD'

    @Column(nullable = false, length = 100)
    private String name; // e.g. 'Autumn Semester 2026'

    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear; // e.g. '2026-2027'

    @Column(name = "semester_term", nullable = false, length = 10)
    private String semesterTerm; // 'Odd', 'Even', 'Summer'

    @Column(name = "is_current", nullable = false)
    private Boolean current = false;

    public AcademicPeriod() {
    }

    public AcademicPeriod(String code, String name, String academicYear, String semesterTerm, Boolean current) {
        this.code = code;
        this.name = name;
        this.academicYear = academicYear;
        this.semesterTerm = semesterTerm;
        this.current = current != null ? current : false;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public String getSemesterTerm() {
        return semesterTerm;
    }

    public void setSemesterTerm(String semesterTerm) {
        this.semesterTerm = semesterTerm;
    }

    public Boolean getCurrent() {
        return current;
    }

    public void setCurrent(Boolean current) {
        this.current = current;
    }
}
