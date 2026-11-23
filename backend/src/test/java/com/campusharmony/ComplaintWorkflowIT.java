package com.campusharmony;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "CAMPUS_DISPOSABLE_WORKFLOW", matches = "true")
class ComplaintWorkflowIT {

    private final ObjectMapper json = new ObjectMapper();
    private final String password = UUID.randomUUID().toString();
    private String base;

    private HttpClient browser() {
        return HttpClient.newBuilder().cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL)).build();
    }

    private JsonNode call(HttpClient client, String path, Object body, int expected) throws Exception {
        var request = HttpRequest.newBuilder(URI.create(base + path))
            .timeout(java.time.Duration.ofSeconds(20))
            .header("X-Campus-Request", "1");
        if (body != null) {
            request.header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
        }
        var response = client.send(request.build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(expected, response.statusCode(), path + " -> " + response.body());
        return response.body().isBlank() ? json.nullNode() : json.readTree(response.body());
    }

    private JsonNode callPut(HttpClient client, String path, Object body, int expected) throws Exception {
        var request = HttpRequest.newBuilder(URI.create(base + path))
            .timeout(java.time.Duration.ofSeconds(20))
            .header("X-Campus-Request", "1")
            .header("Content-Type", "application/json")
            .PUT(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
        var response = client.send(request.build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(expected, response.statusCode(), path + " -> " + response.body());
        return response.body().isBlank() ? json.nullNode() : json.readTree(response.body());
    }

    private JsonNode callGet(HttpClient client, String path, int expected) throws Exception {
        var request = HttpRequest.newBuilder(URI.create(base + path))
            .timeout(java.time.Duration.ofSeconds(20))
            .header("X-Campus-Request", "1")
            .GET();
        var response = client.send(request.build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(expected, response.statusCode(), path + " -> " + response.body());
        return response.body().isBlank() ? json.nullNode() : json.readTree(response.body());
    }

    private HttpClient login(String login, String secret) throws Exception {
        HttpClient client = browser();
        call(client, "/auth/login", Map.of("identifier", login, "password", secret), 200);
        return client;
    }

    private ServletWebServerApplicationContext start() {
        var app = (ServletWebServerApplicationContext) SpringApplication.run(CampusHarmonyApplication.class, "--server.port=0");
        base = "http://127.0.0.1:" + app.getWebServer().getPort() + "/api";
        return app;
    }

    @Test
    void studentGrievanceFullWorkflow() throws Exception {
        long complaintId;
        String referenceNumber;

        try (var app = start()) {
            var admin = login(System.getenv("CAMPUS_ADMIN_LOGIN"), System.getenv("CAMPUS_ADMIN_PASSWORD"));

            // 1. Setup Academic catalog
            call(admin, "/academic/catalog/departments", Map.of("code", "GRV", "name", "Grievance Dept"), 200);
            call(admin, "/academic/catalog/subjects", Map.of("code", "grv", "name", "Grievance Subject"), 200);
            call(admin, "/academic/catalog/terms", Map.of("code", "TGRV", "name", "Grievance Term", "year", "2026", "term", "Odd"), 200);

            var catalog = call(admin, "/academic/catalog", null, 200);
            int deptId = 0, termId = 0;
            for (var d : catalog.get("departments")) {
                if ("Grievance Dept".equals(d.get("name").asText())) deptId = d.get("id").asInt();
            }
            for (var t : catalog.get("terms")) {
                if ("Grievance Term".equals(t.get("name").asText())) termId = t.get("id").asInt();
            }
            assertTrue(deptId > 0 && termId > 0);

            call(admin, "/academic/sections", Map.of("name", "Sec-GRV", "departmentId", deptId, "termId", termId, "semester", 3), 200);
            call(admin, "/academic/catalog/courses", Map.of("code", "CS-GRV1", "name", "Grievance Systems", "departmentId", deptId, "subject", "grv", "semester", 3, "credits", 4), 200);

            // Register Teacher
            call(admin, "/academic/teachers", Map.of(
                "login", "faculty_grv",
                "name", "Prof. Grievance",
                "password", password,
                "departmentId", deptId,
                "subject", "grv"
            ), 200);

            int sectionId = 0;
            for (var s : call(admin, "/academic/catalog", null, 200).get("sections")) {
                if ("Sec-GRV".equals(s.get("name").asText())) sectionId = s.get("id").asInt();
            }
            assertTrue(sectionId > 0);

            // Assign Course Offering
            call(admin, "/academic/offerings", Map.of(
                "sectionId", sectionId,
                "courseCode", "CS-GRV1",
                "teacherId", "faculty_grv"
            ), 200);

            var faculty = login("faculty_grv", password);
            long offeringId = 0;
            for (var o : call(admin, "/academic/offerings", null, 200)) {
                if (o.get("section_id").asInt() == sectionId && "CS-GRV1".equals(o.get("code").asText())) {
                    offeringId = o.get("id").asLong();
                }
            }
            assertTrue(offeringId > 0);

            // Register Student 1: Aman (Complainant)
            call(faculty, "/academic/students", Map.of(
                "sectionId", sectionId,
                "roll", "24CSE9001",
                "name", "Aman Kumar",
                "email", "aman.kumar@chitkara.edu.in",
                "phone", "9811190011",
                "gender", "Male",
                "password", password
            ), 200);

            // Register Student 2: Sneha (Independent student)
            call(faculty, "/academic/students", Map.of(
                "sectionId", sectionId,
                "roll", "24CSE9002",
                "name", "Sneha Sharma",
                "email", "sneha.sharma@chitkara.edu.in",
                "phone", "9822290022",
                "gender", "Female",
                "password", password
            ), 200);

            var student1 = login("24CSE9001", password);
            var student2 = login("24CSE9002", password);

            // 2. Student 1 queries enrolled courses
            var myCourses = callGet(student1, "/academic/complaints/my-courses", 200);
            assertTrue(myCourses.size() >= 1);
            assertEquals("CS-GRV1", myCourses.get(0).get("course_code").asText());

            // 3. Student 1 submits an Academic Grievance
            var complaintRes = call(student1, "/academic/complaints", Map.of(
                "category", "Examination / Marks",
                "subject", "Discrepancy in Midterm Question 3 Evaluation",
                "description", "My question 3 solution on B+ Trees was not awarded marks despite matching scheme. Kindly re-evaluate.",
                "relatedOfferingId", offeringId
            ), 200);

            complaintId = complaintRes.get("id").asLong();
            referenceNumber = complaintRes.get("referenceNumber").asText();
            assertTrue(complaintId > 0);
            assertTrue(referenceNumber.startsWith("GRV-"));
            assertEquals("Open", complaintRes.get("status").asText());

            // 4. Student 1 views their submitted complaints list
            var myComplaints = callGet(student1, "/academic/complaints/my", 200);
            assertEquals(1, myComplaints.size());
            assertEquals(referenceNumber, myComplaints.get(0).get("reference_number").asText());
            assertEquals("Open", myComplaints.get(0).get("status").asText());

            // 5. Student 1 views full complaint details + activity history
            var details = callGet(student1, "/academic/complaints/" + complaintId, 200);
            assertEquals(referenceNumber, details.get("reference_number").asText());
            assertEquals("Aman Kumar", details.get("student_name").asText());
            var activities = details.get("activities");
            assertEquals(1, activities.size());
            assertEquals("CREATED", activities.get(0).get("action").asText());

            // 6. Security/Privacy Check: Student 2 MUST NOT be able to view Student 1's complaint
            callGet(student2, "/academic/complaints/" + complaintId, 403);

            // 7. Security Check: Student 1 MUST NOT be able to modify complaint status
            callPut(student1, "/academic/admin/complaints/" + complaintId + "/status", Map.of("status", "Resolved"), 403);

            // 8. Admin Grievance Dashboard: Stats check
            var statsBefore = callGet(admin, "/academic/admin/complaints/stats", 200);
            assertTrue(statsBefore.get("total").asInt() >= 1);
            assertTrue(statsBefore.get("open").asInt() >= 1);
            assertTrue(statsBefore.get("byCategory").get("Examination / Marks").asInt() >= 1);

            // 9. Admin lists incoming complaints
            var adminList = callGet(admin, "/academic/admin/complaints?status=Open", 200);
            assertTrue(adminList.size() >= 1);
            boolean found = false;
            for (var item : adminList) {
                if (referenceNumber.equals(item.get("reference_number").asText())) {
                    found = true;
                    break;
                }
            }
            assertTrue(found, "Admin must see the student complaint");

            // 10. Admin marks complaint "In Progress"
            callPut(admin, "/academic/admin/complaints/" + complaintId + "/status", Map.of(
                "status", "In Progress",
                "responseText", "Forwarded exam booklet to Department Evaluation Committee."
            ), 200);

            // 11. Admin adds an administrative response message
            call(admin, "/academic/admin/complaints/" + complaintId + "/response", Map.of(
                "responseText", "Evaluation committee reviewed answer script. Examiner acknowledged 4 marks omission."
            ), 200);

            // 12. Admin marks complaint "Resolved"
            callPut(admin, "/academic/admin/complaints/" + complaintId + "/status", Map.of(
                "status", "Resolved",
                "responseText", "4 marks added to ERP portal. Resolution complete."
            ), 200);

            // 13. Student 1 verifies resolution and audit trail
            var resolvedDetails = callGet(student1, "/academic/complaints/" + complaintId, 200);
            assertEquals("Resolved", resolvedDetails.get("status").asText());
            assertNotNull(resolvedDetails.get("resolved_at"));
            var resolvedActivities = resolvedDetails.get("activities");
            // 4 activities: CREATED, STATUS_CHANGE (In Progress), RESPONSE_ADDED, RESOLVED
            assertEquals(4, resolvedActivities.size());
            assertEquals("CREATED", resolvedActivities.get(0).get("action").asText());
            assertEquals("STATUS_CHANGE", resolvedActivities.get(1).get("action").asText());
            assertEquals("RESPONSE_ADDED", resolvedActivities.get(2).get("action").asText());
            assertEquals("RESOLVED", resolvedActivities.get(3).get("action").asText());

            // 14. Admin closes the complaint
            callPut(admin, "/academic/admin/complaints/" + complaintId + "/status", Map.of(
                "status", "Closed",
                "responseText", "Grievance closed after student confirmation."
            ), 200);

            var closedDetails = callGet(student1, "/academic/complaints/" + complaintId, 200);
            assertEquals("Closed", closedDetails.get("status").asText());
            assertEquals(5, closedDetails.get("activities").size());
        }

        // 15. Persistence across application restart
        try (var app = start()) {
            var student1 = login("24CSE9001", password);
            var restartedDetails = callGet(student1, "/academic/complaints/" + complaintId, 200);
            assertEquals("Closed", restartedDetails.get("status").asText());
            assertEquals(referenceNumber, restartedDetails.get("reference_number").asText());
            assertEquals(5, restartedDetails.get("activities").size());
        }
    }
}
