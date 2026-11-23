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
class TimetableWorkflowIT {

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
    void timetableAndLectureSchedulingWorkflow() throws Exception {
        try (var app = start()) {
            var admin = login(System.getenv("CAMPUS_ADMIN_LOGIN"), System.getenv("CAMPUS_ADMIN_PASSWORD"));

            // 1. Setup Academic catalog
            call(admin, "/academic/catalog/departments", Map.of("code", "CST", "name", "Computer Science & Engineering"), 200);
            call(admin, "/academic/catalog/subjects", Map.of("code", "ttm", "name", "Operating Systems"), 200);
            call(admin, "/academic/catalog/terms", Map.of("code", "TT1", "name", "Timetable Term", "year", "2026", "term", "Odd"), 200);

            var catalog = call(admin, "/academic/catalog", null, 200);
            int departmentId = 0, termId = 0;
            for (var d : catalog.get("departments")) {
                if ("Computer Science & Engineering".equals(d.get("name").asText())) departmentId = d.get("id").asInt();
            }
            for (var t : catalog.get("terms")) {
                if ("Timetable Term".equals(t.get("name").asText())) termId = t.get("id").asInt();
            }

            call(admin, "/academic/sections", Map.of("name", "Sec-T1", "departmentId", departmentId, "termId", termId, "semester", 3), 200);
            call(admin, "/academic/sections", Map.of("name", "Sec-T2", "departmentId", departmentId, "termId", termId, "semester", 3), 200);

            call(admin, "/academic/catalog/courses", Map.of("code", "CST601", "name", "Operating Systems", "departmentId", departmentId, "subject", "ttm", "semester", 3, "credits", 4), 200);
            call(admin, "/academic/catalog/courses", Map.of("code", "CST602", "name", "Computer Networks", "departmentId", departmentId, "subject", "ttm", "semester", 3, "credits", 4), 200);

            // 2. Create Faculty accounts
            call(admin, "/academic/teachers", Map.of("login", "faculty_tt1", "name", "Dr. Rajesh Gupta", "password", password, "departmentId", departmentId, "subject", "ttm"), 200);
            call(admin, "/academic/teachers", Map.of("login", "faculty_tt2", "name", "Dr. Anita Rao", "password", password, "departmentId", departmentId, "subject", "ttm"), 200);

            int sectionT1Id = 0, sectionT2Id = 0;
            for (var s : call(admin, "/academic/catalog", null, 200).get("sections")) {
                if ("Sec-T1".equals(s.get("name").asText())) sectionT1Id = s.get("id").asInt();
                if ("Sec-T2".equals(s.get("name").asText())) sectionT2Id = s.get("id").asInt();
            }

            // 3. Assign Course Offerings
            // Offering 1: Sec-T1 + CST601 (Dr. Rajesh)
            call(admin, "/academic/offerings", Map.of("sectionId", sectionT1Id, "courseCode", "CST601", "teacherId", "faculty_tt1"), 200);
            // Offering 2: Sec-T1 + CST602 (Dr. Anita)
            call(admin, "/academic/offerings", Map.of("sectionId", sectionT1Id, "courseCode", "CST602", "teacherId", "faculty_tt2"), 200);
            // Offering 3: Sec-T2 + CST601 (Dr. Rajesh)
            call(admin, "/academic/offerings", Map.of("sectionId", sectionT2Id, "courseCode", "CST601", "teacherId", "faculty_tt1"), 200);

            var faculty1 = login("faculty_tt1", password);
            var faculty2 = login("faculty_tt2", password);

            long offering1 = 0, offering2 = 0, offering3 = 0;
            for (var o : call(admin, "/academic/offerings", null, 200)) {
                if (o.get("section_id").asInt() == sectionT1Id && "CST601".equals(o.get("code").asText())) offering1 = o.get("id").asLong();
                if (o.get("section_id").asInt() == sectionT1Id && "CST602".equals(o.get("code").asText())) offering2 = o.get("id").asLong();
                if (o.get("section_id").asInt() == sectionT2Id && "CST601".equals(o.get("code").asText())) offering3 = o.get("id").asLong();
            }

            // 4. Enroll Student in Sec-T1
            var reg = Map.of(
                "sectionId", sectionT1Id,
                "roll", "24CSE7777",
                "name", "Pooja Sharma",
                "email", "pooja.tt@chitkara.edu.in",
                "phone", "9812345678",
                "gender", "Female",
                "password", password
            );
            call(faculty1, "/academic/students", reg, 200);
            var student = login("24CSE7777", password);

            // 5. Admin creates Timetable Slot 1: Monday Period 1 (09:00-09:50) for Sec-T1 CST601 in Room "LH-201"
            var slot1Res = call(admin, "/academic/timetable", Map.of(
                "offeringId", offering1,
                "dayOfWeek", "Monday",
                "periodNumber", 1,
                "startTime", "09:00",
                "endTime", "09:50",
                "room", "LH-201"
            ), 200);
            long slot1Id = slot1Res.get("id").asLong();
            assertTrue(slot1Id > 0);

            // 6. Test Time Range Validation: Start Time >= End Time should be rejected (400)
            call(admin, "/academic/timetable", Map.of(
                "offeringId", offering1,
                "dayOfWeek", "Tuesday",
                "periodNumber", 2,
                "startTime", "11:00",
                "endTime", "10:00",
                "room", "LH-201"
            ), 400);

            // 7. Test Section Conflict Detection: Sec-T1 already has a lecture on Monday Period 1
            // Try to assign offering 2 (CST602) to Sec-T1 on Monday Period 1 -> Expect 409 Conflict
            call(admin, "/academic/timetable", Map.of(
                "offeringId", offering2,
                "dayOfWeek", "Monday",
                "periodNumber", 1,
                "startTime", "09:00",
                "endTime", "09:50",
                "room", "LH-202"
            ), 409);

            // 8. Test Teacher Conflict Detection: faculty_tt1 is already busy on Monday Period 1
            // Try to assign offering 3 (Sec-T2, faculty_tt1) on Monday Period 1 -> Expect 409 Conflict
            call(admin, "/academic/timetable", Map.of(
                "offeringId", offering3,
                "dayOfWeek", "Monday",
                "periodNumber", 1,
                "startTime", "09:00",
                "endTime", "09:50",
                "room", "LH-301"
            ), 409);

            // 9. Test Room Conflict Detection: Room "LH-201" is already booked on Monday Period 1
            // Try to assign offering 3 with faculty2 in Room "LH-201" on Monday Period 1 -> Expect 409 Conflict
            // (Note: offering 3 has faculty_tt1, but let's test with offering 2 which has faculty_tt2 if section wasn't T1)
            // Or change teacher on offering 3 or create offering 4 for Sec-T2 with faculty2:
            call(admin, "/academic/offerings", Map.of("sectionId", sectionT2Id, "courseCode", "CST602", "teacherId", "faculty_tt2"), 200);
            long offering4 = 0;
            for (var o : call(admin, "/academic/offerings", null, 200)) {
                if (o.get("section_id").asInt() == sectionT2Id && "CST602".equals(o.get("code").asText())) offering4 = o.get("id").asLong();
            }
            call(admin, "/academic/timetable", Map.of(
                "offeringId", offering4,
                "dayOfWeek", "Monday",
                "periodNumber", 1,
                "startTime", "09:00",
                "endTime", "09:50",
                "room", "LH-201" // Duplicate room!
            ), 409);

            // 10. Valid Slot 2: Monday Period 2 (10:00-10:50) for Sec-T1 CST602 (faculty_tt2) in Room "LH-202"
            var slot2Res = call(admin, "/academic/timetable", Map.of(
                "offeringId", offering2,
                "dayOfWeek", "Monday",
                "periodNumber", 2,
                "startTime", "10:00",
                "endTime", "10:50",
                "room", "LH-202"
            ), 200);
            long slot2Id = slot2Res.get("id").asLong();
            assertTrue(slot2Id > 0);

            // 11. Schedule Retrieval & Scoping Checks
            // Section schedule for Sec-T1
            var sectionSchedule = callGet(admin, "/academic/timetable/section/" + sectionT1Id, 200);
            assertEquals(2, sectionSchedule.size());

            // Student personal schedule
            var studentSchedule = callGet(student, "/academic/timetable/my-schedule", 200);
            assertEquals(2, studentSchedule.size());
            assertEquals("CST601", studentSchedule.get(0).get("course_code").asText());
            assertEquals("Operating Systems", studentSchedule.get(0).get("course_name").asText());
            assertEquals("Dr. Rajesh Gupta", studentSchedule.get(0).get("teacher_name").asText());
            assertEquals("LH-201", studentSchedule.get(0).get("room").asText());
            assertEquals(1, studentSchedule.get(0).get("period_number").asInt());

            // Teacher personal schedule
            var faculty1Schedule = callGet(faculty1, "/academic/timetable/my-schedule", 200);
            assertEquals(1, faculty1Schedule.size());
            assertEquals("CST601", faculty1Schedule.get(0).get("course_code").asText());

            // 12. Teacher Conducts Lecture from Timetable Slot
            // Faculty 1 conducts slot 1 for today's date
            LocalDate checkDate = LocalDate.now();
            var conductRes = call(faculty1, "/academic/timetable/" + slot1Id + "/conduct", Map.of("date", checkDate.toString()), 200);
            long sessionId = conductRes.get("sessionId").asLong();
            assertTrue(sessionId > 0);
            assertEquals(1, conductRes.get("periodNumber").asInt());
            assertEquals("Scheduled", conductRes.get("status").asText());

            // Outsider teacher (faculty2) cannot conduct faculty1's slot
            call(faculty2, "/academic/timetable/" + slot1Id + "/conduct", Map.of("date", checkDate.toString()), 403);

            // Teacher loads roster for this session
            var roster = callGet(faculty1, "/academic/lectures/" + sessionId + "/roster", 200);
            assertEquals(1, roster.size());
            assertEquals("24CSE7777", roster.get(0).get("roll").asText());
            long enrollmentId = roster.get(0).get("enrollment_id").asLong();

            // Teacher marks attendance (Present)
            call(faculty1, "/academic/lectures/" + sessionId + "/attendance",
                Map.of("records", List.of(Map.of("enrollmentId", enrollmentId, "status", "Present"))), 200);

            // Student checks attendance -> 1 lecture, 1 present, 100%
            var studentAttendance = callGet(student, "/academic/my-attendance", 200);
            assertTrue(studentAttendance.size() >= 1);
            boolean foundOS = false;
            for (var att : studentAttendance) {
                if ("CST601".equals(att.get("code").asText())) {
                    foundOS = true;
                    assertEquals(1, att.get("lectures").asInt());
                    assertEquals(1, att.get("present").asInt());
                    assertEquals(100.0, att.get("percentage").asDouble());
                }
            }
            assertTrue(foundOS, "Student attendance should reflect the conducted timetable lecture");

            // 13. Cancel Lecture test
            call(faculty2, "/academic/timetable/cancel-lecture", Map.of(
                "offeringId", offering2,
                "date", checkDate.toString(),
                "period", 2,
                "reason", "Guest Faculty Seminar"
            ), 200);

            // Outsider cannot cancel faculty2's lecture
            call(faculty1, "/academic/timetable/cancel-lecture", Map.of(
                "offeringId", offering2,
                "date", checkDate.toString(),
                "period", 2,
                "reason", "Unauthorized cancel"
            ), 403);
        }

        // 14. Persistence across context restart
        try (var app = start()) {
            var student = login("24CSE7777", password);
            var studentScheduleAfterRestart = callGet(student, "/academic/timetable/my-schedule", 200);
            assertEquals(2, studentScheduleAfterRestart.size());

            var studentAttendanceAfterRestart = callGet(student, "/academic/my-attendance", 200);
            boolean verified = false;
            for (var att : studentAttendanceAfterRestart) {
                if ("CST601".equals(att.get("code").asText()) && att.get("percentage").asDouble() == 100.0) {
                    verified = true;
                }
            }
            assertTrue(verified, "Attendance and timetable persisted across application restart");
        }
    }
}
