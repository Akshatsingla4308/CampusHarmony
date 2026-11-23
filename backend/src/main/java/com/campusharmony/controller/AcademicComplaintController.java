package com.campusharmony.controller;

import com.campusharmony.security.Access;
import com.campusharmony.security.Identity;
import com.campusharmony.service.ComplaintService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
public class AcademicComplaintController {

    private final ComplaintService complaintService;

    public AcademicComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    // -------------------------------------------------------------------------
    // Student Endpoints
    // -------------------------------------------------------------------------

    @PostMapping("/api/academic/complaints")
    @Access("student")
    public Map<String, Object> submitComplaint(
        @RequestBody ComplaintService.ComplaintSubmissionRequest request,
        @SessionAttribute Identity user
    ) {
        if (user.studentId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Student session required");
        }
        return complaintService.submitComplaint(user.studentId(), user, request);
    }

    @GetMapping("/api/academic/complaints/my")
    @Access("student")
    public List<Map<String, Object>> getMyComplaints(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String search,
        @SessionAttribute Identity user
    ) {
        if (user.studentId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Student session required");
        }
        return complaintService.getMyComplaints(user.studentId(), status, search);
    }

    @GetMapping("/api/academic/complaints/my-courses")
    @Access("student")
    public List<Map<String, Object>> getMyCourses(@SessionAttribute Identity user) {
        if (user.studentId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Student session required");
        }
        return complaintService.getMyEnrolledCourses(user.studentId());
    }

    // -------------------------------------------------------------------------
    // Shared Details Endpoint (Student scoped by ownership, Admin unrestricted)
    // -------------------------------------------------------------------------

    @GetMapping("/api/academic/complaints/{id}")
    @Access({"student", "admin"})
    public Map<String, Object> getComplaintDetails(
        @PathVariable long id,
        @SessionAttribute Identity user
    ) {
        return complaintService.getComplaintDetails(id, user);
    }

    // -------------------------------------------------------------------------
    // Administrator Endpoints
    // -------------------------------------------------------------------------

    @GetMapping("/api/academic/admin/complaints")
    @Access("admin")
    public List<Map<String, Object>> getAdminComplaints(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return complaintService.getAdminComplaints(status, category, search, fromDate, toDate);
    }

    @GetMapping("/api/academic/admin/complaints/stats")
    @Access("admin")
    public Map<String, Object> getAdminComplaintStats() {
        return complaintService.getAdminComplaintStats();
    }

    @PutMapping("/api/academic/admin/complaints/{id}/status")
    @Access("admin")
    public Map<String, Object> updateComplaintStatus(
        @PathVariable long id,
        @RequestBody ComplaintService.StatusUpdateRequest request,
        @SessionAttribute Identity user
    ) {
        complaintService.updateStatus(id, request, user);
        return Map.of("success", true, "message", "Complaint status updated successfully");
    }

    @PostMapping("/api/academic/admin/complaints/{id}/response")
    @Access("admin")
    public Map<String, Object> addAdminResponse(
        @PathVariable long id,
        @RequestBody ComplaintService.ResponseRequest request,
        @SessionAttribute Identity user
    ) {
        complaintService.addAdminResponse(id, request, user);
        return Map.of("success", true, "message", "Administrative response recorded");
    }
}
