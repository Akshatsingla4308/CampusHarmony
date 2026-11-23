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
class AnalyticsWorkflowIT {

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

    private HttpResponse<String> callRaw(HttpClient client, String path, int expected) throws Exception {
        var request = HttpRequest.newBuilder(URI.create(base + path))
            .timeout(java.time.Duration.ofSeconds(20))
            .header("X-Campus-Request", "1")
            .GET();
        var response = client.send(request.build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(expected, response.statusCode(), path + " -> " + response.body());
        return response;
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
    void attendanceAnalyticsAndDefaulterWorkflow() throws Exception {
        try (var app = start()) {
            var admin = login(System.getenv("CAMPUS_ADMIN_LOGIN"), System.getenv("CAMPUS_ADMIN_PASSWORD"));

            // 1. Threshold API: verify initial default and update
            var initialThreshold = callGet(admin, "/academic/analytics/threshold", 200);
            assertEquals(75.0, initialThreshold.get("threshold").asDouble());

            // Update to 75.0 explicitly
            callPut(admin, "/academic/analytics/threshold", Map.of("threshold", 75.0), 200);

            // 2. Setup Academic catalog
            call(admin, "/academic/catalog/departments", Map.of("code", "CSA", "name", "Applied Computer Applications"), 200);
            call(admin, "/academic/catalog/subjects", Map.of("code", "anm", "name", "Analytics Engineering"), 200);
            call(admin, "/academic/catalog/terms", Map.of("code", "AT1", "name", "Analytics Term", "year", "2026", "term", "Odd"), 200);

            var catalog = call(admin, "/academic/catalog", null, 200);
            int departmentId = 0, termId = 0;
            for (var d : catalog.get("departments")) {
                if ("Applied Computer Applications".equals(d.get("name").asText())) departmentId = d.get("id").asInt();
            }
            for (var t : catalog.get("terms")) {
                if ("Analytics Term".equals(t.get("name").asText())) termId = t.get("id").asInt();
            }

            call(admin, "/academic/sections", Map.of("name", "Sec-A1", "departmentId", departmentId, "termId", termId, "semester", 3), 200);
            call(admin, "/academic/catalog/courses", Map.of("code", "CSA701", "name", "Data Warehousing & BI", "departmentId", departmentId, "subject", "anm", "semester", 3, "credits", 4), 200);

            // 3. Create Faculty accounts
            call(admin, "/academic/teachers", Map.of("login", "faculty_an1", "name", "Prof. Vikram Sen", "password", password, "departmentId", departmentId, "subject", "anm"), 200);

            int sectionId = 0;
            for (var s : call(admin, "/academic/catalog", null, 200).get("sections")) {
                if ("Sec-A1".equals(s.get("name").asText())) sectionId = s.get("id").asInt();
            }

            // Assign Teacher to Course Offering
            call(admin, "/academic/offerings", Map.of("sectionId", sectionId, "courseCode", "CSA701", "teacherId", "faculty_an1"), 200);
            var faculty = login("faculty_an1", password);

            long offeringId = 0;
            for (var o : call(admin, "/academic/offerings", null, 200)) {
                if (o.get("section_id").asInt() == sectionId && "CSA701".equals(o.get("code").asText())) offeringId = o.get("id").asLong();
            }

            // 4. Enroll Students
            // Student 1: Pooja (High Attendance)
            call(faculty, "/academic/students", Map.of(
                "sectionId", sectionId,
                "roll", "24CSE1111",
                "name", "Pooja Roy",
                "email", "pooja.roy@chitkara.edu.in",
                "phone", "9811111111",
                "gender", "Female",
                "password", password
            ), 200);

            // Student 2: Rohan (Low Attendance / Defaulter)
            call(faculty, "/academic/students", Map.of(
                "sectionId", sectionId,
                "roll", "24CSE2222",
                "name", "Rohan Mehta",
                "email", "rohan.mehta@chitkara.edu.in",
                "phone", "9822222222",
                "gender", "Male",
                "password", password
            ), 200);

            var student1 = login("24CSE1111", password);
            var student2 = login("24CSE2222", password);

            // 5. Verify Zero-Lecture State: Students with no conducted lectures must NOT be classified as defaulters
            var insightsBefore = callGet(student1, "/academic/analytics/student/insights", 200);
            assertEquals(1, insightsBefore.get("courses").size());
            var courseBefore = insightsBefore.get("courses").get(0);
            assertEquals(0, courseBefore.get("conducted_lectures").asInt());
            assertEquals("No Lectures Conducted", courseBefore.get("status_label").asText());
            assertFalse(courseBefore.get("is_defaulter").asBoolean());
            assertEquals(0, courseBefore.get("classes_needed_for_threshold").asInt());

            var adminBefore = callGet(admin, "/academic/analytics/admin/overview", 200);
            assertEquals(0, adminBefore.get("overall").get("defaultersCount").asInt());

            // 6. Teacher Conducts Lecture 1 (Pooja Present, Rohan Absent)
            LocalDate today = LocalDate.now();
            call(faculty, "/academic/lectures", Map.of("offeringId", offeringId, "date", today.toString(), "period", 1), 200);
            var lectures = callGet(faculty, "/academic/lectures?offeringId=" + offeringId + "&date=" + today, 200);
            long session1Id = lectures.get(0).get("id").asLong();

            var roster1 = callGet(faculty, "/academic/lectures/" + session1Id + "/roster", 200);
            long poojaEnrollment = 0, rohanEnrollment = 0;
            for (var r : roster1) {
                if ("24CSE1111".equals(r.get("roll").asText())) poojaEnrollment = r.get("enrollment_id").asLong();
                if ("24CSE2222".equals(r.get("roll").asText())) rohanEnrollment = r.get("enrollment_id").asLong();
            }
            assertTrue(poojaEnrollment > 0, "Pooja's enrollment ID must be found");
            assertTrue(rohanEnrollment > 0, "Rohan's enrollment ID must be found");

            call(faculty, "/academic/lectures/" + session1Id + "/attendance", Map.of(
                "records", List.of(
                    Map.of("enrollmentId", poojaEnrollment, "status", "Present"),
                    Map.of("enrollmentId", rohanEnrollment, "status", "Absent")
                )
            ), 200);

            // 7. Teacher Conducts Lecture 2 (Pooja Present, Rohan Absent)
            call(faculty, "/academic/lectures", Map.of("offeringId", offeringId, "date", today.toString(), "period", 2), 200);
            var lectures2 = callGet(faculty, "/academic/lectures?offeringId=" + offeringId + "&date=" + today, 200);
            long session2Id = 0;
            for (var l : lectures2) {
                if (l.get("session_slot").asInt() == 2) session2Id = l.get("id").asLong();
            }

            call(faculty, "/academic/lectures/" + session2Id + "/attendance", Map.of(
                "records", List.of(
                    Map.of("enrollmentId", poojaEnrollment, "status", "Present"),
                    Map.of("enrollmentId", rohanEnrollment, "status", "Absent")
                )
            ), 200);

            // 8. Teacher Conducts Lecture 3 (Pooja Absent, Rohan Present)
            call(faculty, "/academic/lectures", Map.of("offeringId", offeringId, "date", today.toString(), "period", 3), 200);
            var lectures3 = callGet(faculty, "/academic/lectures?offeringId=" + offeringId + "&date=" + today, 200);
            long session3Id = 0;
            for (var l : lectures3) {
                if (l.get("session_slot").asInt() == 3) session3Id = l.get("id").asLong();
            }

            call(faculty, "/academic/lectures/" + session3Id + "/attendance", Map.of(
                "records", List.of(
                    Map.of("enrollmentId", poojaEnrollment, "status", "Absent"),
                    Map.of("enrollmentId", rohanEnrollment, "status", "Present")
                )
            ), 200);

            // Current stats:
            // Pooja: 2/3 = 66.67% -> Defaulter! (Shortfall: (0.75*3 - 2)/0.25 = (2.25 - 2)/0.25 = 1)
            // Rohan: 1/3 = 33.33% -> Defaulter! (Shortfall: (0.75*3 - 1)/0.25 = (2.25 - 1)/0.25 = 5)
            var student1Insights = callGet(student1, "/academic/analytics/student/insights", 200);
            var s1Course = student1Insights.get("courses").get(0);
            assertEquals(3, s1Course.get("conducted_lectures").asInt());
            assertEquals(2, s1Course.get("attended_lectures").asInt());
            assertEquals(1, s1Course.get("missed_lectures").asInt());
            assertEquals(66.67, s1Course.get("attendance_percentage").asDouble());
            assertTrue(s1Course.get("is_defaulter").asBoolean());
            assertEquals("Defaulter", s1Course.get("status_label").asText());
            assertEquals(1, s1Course.get("classes_needed_for_threshold").asInt());

            var student2Insights = callGet(student2, "/academic/analytics/student/insights", 200);
            var s2Course = student2Insights.get("courses").get(0);
            assertEquals(3, s2Course.get("conducted_lectures").asInt());
            assertEquals(1, s2Course.get("attended_lectures").asInt());
            assertEquals(2, s2Course.get("missed_lectures").asInt());
            assertEquals(33.33, s2Course.get("attendance_percentage").asDouble());
            assertTrue(s2Course.get("is_defaulter").asBoolean());
            assertEquals(5, s2Course.get("classes_needed_for_threshold").asInt());

            // 9. Authorized Attendance Correction: Teacher corrects Lecture 3 for Pooja (Absent -> Present)
            callPut(faculty, "/academic/lectures/" + session3Id + "/attendance", Map.of(
                "records", List.of(
                    Map.of("enrollmentId", poojaEnrollment, "status", "Present"),
                    Map.of("enrollmentId", rohanEnrollment, "status", "Present")
                )
            ), 200);

            // Pooja is now 3/3 = 100.0% -> Good Standing! Shortfall = 0.
            var s1Corrected = callGet(student1, "/academic/analytics/student/insights", 200);
            var s1CourseCorrected = s1Corrected.get("courses").get(0);
            assertEquals(3, s1CourseCorrected.get("attended_lectures").asInt());
            assertEquals(100.0, s1CourseCorrected.get("attendance_percentage").asDouble());
            assertFalse(s1CourseCorrected.get("is_defaulter").asBoolean());
            assertEquals("Good Standing", s1CourseCorrected.get("status_label").asText());
            assertEquals(0, s1CourseCorrected.get("classes_needed_for_threshold").asInt());

            // 10. Cancelled Lecture Test: Ensure cancelled lectures do not affect percentage
            call(faculty, "/academic/timetable/cancel-lecture", Map.of(
                "offeringId", offeringId,
                "date", today.toString(),
                "period", 4,
                "reason", "Special Guest Lecture"
            ), 200);

            // Pooja's stats should still be 3 conducted, 3 attended, 100.0%
            var s1AfterCancel = callGet(student1, "/academic/analytics/student/insights", 200);
            var s1CourseAfterCancel = s1AfterCancel.get("courses").get(0);
            assertEquals(3, s1CourseAfterCancel.get("conducted_lectures").asInt());
            assertEquals(100.0, s1CourseAfterCancel.get("attendance_percentage").asDouble());

            // 11. Admin Defaulters Overview and CSV Export
            var adminOverview = callGet(admin, "/academic/analytics/admin/overview", 200);
            // Only Rohan is a defaulter
            assertEquals(1, adminOverview.get("overall").get("defaultersCount").asInt());
            assertEquals(1, adminOverview.get("defaulters").size());
            assertEquals("24CSE2222", adminOverview.get("defaulters").get(0).get("roll").asText());
            assertEquals(5, adminOverview.get("defaulters").get(0).get("classesNeededForThreshold").asInt());

            // CSV Export contains Rohan Mehta and CSV headers
            var csvRes = callRaw(admin, "/academic/analytics/admin/export-csv", 200);
            assertTrue(csvRes.body().contains("Roll Number,Student Name"));
            assertTrue(csvRes.body().contains("24CSE2222"));
            assertTrue(csvRes.body().contains("Rohan Mehta"));

            // Teacher Course CSV Export
            var teacherCsv = callRaw(faculty, "/academic/analytics/teacher/export-csv?offeringId=" + offeringId, 200);
            assertTrue(teacherCsv.body().contains("24CSE1111"));
            assertTrue(teacherCsv.body().contains("Pooja Roy"));
            assertTrue(teacherCsv.body().contains("Good Standing"));
        }

        // 12. Application Restart: Verify persistence across independent context restart
        try (var app = start()) {
            var student2 = login("24CSE2222", password);
            var student2InsightsAfterRestart = callGet(student2, "/academic/analytics/student/insights", 200);
            var s2Course = student2InsightsAfterRestart.get("courses").get(0);
            assertEquals(3, s2Course.get("conducted_lectures").asInt());
            assertEquals(1, s2Course.get("attended_lectures").asInt());
            assertEquals(33.33, s2Course.get("attendance_percentage").asDouble());
            assertTrue(s2Course.get("is_defaulter").asBoolean());
            assertEquals(5, s2Course.get("classes_needed_for_threshold").asInt());
        }
    }
}
