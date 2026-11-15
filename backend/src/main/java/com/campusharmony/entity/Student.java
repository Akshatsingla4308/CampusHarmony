package com.campusharmony.entity;

import jakarta.persistence.*;

/**
 * Student Entity - Master record for enrolled college students.
 * 
 * Demonstrates:
 * - OOP Inheritance (extends BaseEntity)
 * - OOP Encapsulation (private fields with public getters/setters)
 * - JPA Table and Column mappings
 * - Transient field (calculated attendance percentage for frontend display)
 */
@Entity
@Table(name = "students")
public class Student extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String roll;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String department;

    @Column(nullable = false)
    private Integer semester;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 20)
    private String status = "Active"; // 'Active', 'Probation', 'Inactive'

    @Column(nullable = false, length = 10)
    private String gender; // 'Male', 'Female', 'Other'

    @Column(length = 255)
    private String address;

    @Column(name = "teacher_id", length = 30)
    private String teacherId; // null for demo, or T-xxx for custom teacher

    @Transient
    private Integer attendance; // Dynamic percentage for UI convenience

    public Student() {
    }

    public Student(String roll, String name, String department, Integer semester,
                   String email, String phone, String status, String gender, String address, String teacherId) {
        this.roll = roll;
        this.name = name;
        this.department = department;
        this.semester = semester;
        this.email = email;
        this.phone = phone;
        this.status = status != null ? status : "Active";
        this.gender = gender;
        this.address = address;
        this.teacherId = teacherId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoll() {
        return roll;
    }

    public void setRoll(String roll) {
        this.roll = roll;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(String teacherId) {
        this.teacherId = teacherId;
    }

    public Integer getAttendance() {
        return attendance;
    }

    public void setAttendance(Integer attendance) {
        this.attendance = attendance;
    }
}
