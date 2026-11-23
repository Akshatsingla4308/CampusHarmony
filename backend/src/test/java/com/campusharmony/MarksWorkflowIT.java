package com.campusharmony;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;

import java.math.BigDecimal;
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
class MarksWorkflowIT {

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
    void marksEvaluationCompleteWorkflow() throws Exception {
        String today = LocalDate.now().toString();

        try (var app = start()) {
            var admin = login(System.getenv("CAMPUS_ADMIN_LOGIN"), System.getenv("CAMPUS_ADMIN_PASSWORD"));

            // 1. Setup Academic catalog
            call(admin, "/academic/catalog/departments", Map.of("code", "CSM", "name", "Computing Sciences"), 200);
            call(admin, "/academic/catalog/subjects", Map.of("code", "dbm", "name", "DBMS Subject"), 200);
            call(admin, "/academic/catalog/terms", Map.of("code", "TM1", "name", "Evaluation Term", "year", "2026", "term", "Odd"), 200);
            var catalog = call(admin, "/academic/catalog", null, 200);
            int departmentId = 0, termId = 0;
            for (var d : catalog.get("departments")) {
                if ("Computing Sciences".equals(d.get("name").asText())) departmentId = d.get("id").asInt();
            }
            for (var t : catalog.get("terms")) {
                if ("Evaluation Term".equals(t.get("name").asText())) termId = t.get("id").asInt();
            }

            call(admin, "/academic/sections", Map.of("name", "Sec-M", "departmentId", departmentId, "termId", termId, "semester", 3), 200);
            call(admin, "/academic/catalog/courses", Map.of("code", "CSM501", "name", "Relational Database Systems", "departmentId", departmentId, "subject", "dbm", "semester", 3, "credits", 4), 200);

            // 2. Create Faculty accounts
            call(admin, "/academic/teachers", Map.of("login", "faculty_m", "name", "Prof. Sharma", "password", password, "departmentId", departmentId, "subject", "dbm"), 200);
            call(admin, "/academic/teachers", Map.of("login", "outsider_m", "name", "Prof. Verma", "password", password, "departmentId", departmentId, "subject", "dbm"), 200);

            int sectionId = 0;
            for (var s : call(admin, "/academic/catalog", null, 200).get("sections")) {
                if ("Sec-M".equals(s.get("name").asText())) sectionId = s.get("id").asInt();
            }

            // 3. Assign Teacher to Section offering
            call(admin, "/academic/offerings", Map.of("sectionId", sectionId, "courseCode", "CSM501", "teacherId", "faculty_m"), 200);

            var faculty = login("faculty_m", password);
            var outsider = login("outsider_m", password);

            int offeringId = call(faculty, "/academic/offerings", null, 200).get(0).get("id").asInt();

            // 4. Enroll student
            var reg = Map.of(
                "sectionId", sectionId,
                "roll", "24CSE9999",
                "name", "Aarav Patel",
                "email", "aarav.marks@chitkara.edu.in",
                "phone", "9876543210",
                "gender", "Male",
                "password", password
            );
            call(faculty, "/academic/students", reg, 200);

            var student = login("24CSE9999", password);

            // 5. Create Assessment
            // Outsider cannot create assessment on faculty1's offering
            call(outsider, "/academic/offerings/" + offeringId + "/assessments",
                Map.of("title", "CA-1", "assessmentType", "CA-1", "maxMarks", 50, "assessmentDate", today), 403);

            // Faculty creates CA-1
            var createRes = call(faculty, "/academic/offerings/" + offeringId + "/assessments",
                Map.of("title", "CA-1", "assessmentType", "CA-1", "maxMarks", 50, "assessmentDate", today), 200);
            long assessmentId = createRes.get("id").asLong();

            // Duplicate title within offering rejected
            call(faculty, "/academic/offerings/" + offeringId + "/assessments",
                Map.of("title", "CA-1", "assessmentType", "CA-1", "maxMarks", 50, "assessmentDate", today), 409);

            // 6. View Roster
            var rosterData = call(faculty, "/academic/assessments/" + assessmentId + "/roster", null, 200);
            var students = rosterData.get("roster");
            assertEquals(1, students.size());
            assertEquals("24CSE9999", students.get(0).get("roll").asText());
            assertFalse(students.get(0).get("is_saved").asBoolean());
            assertTrue(students.get(0).get("marks_obtained").isNull());
            long enrollmentId = students.get(0).get("enrollment_id").asLong();

            // Outsider cannot view roster
            call(outsider, "/academic/assessments/" + assessmentId + "/roster", null, 403);

            // 7. Validate Marks entry constraints
            // Negative marks rejected
            call(faculty, "/academic/assessments/" + assessmentId + "/marks",
                Map.of("records", List.of(Map.of("enrollmentId", enrollmentId, "marksObtained", -5))), 400);

            // Exceeding max marks rejected
            call(faculty, "/academic/assessments/" + assessmentId + "/marks",
                Map.of("records", List.of(Map.of("enrollmentId", enrollmentId, "marksObtained", 55))), 400);

            // Student cannot submit marks
            call(student, "/academic/assessments/" + assessmentId + "/marks",
                Map.of("records", List.of(Map.of("enrollmentId", enrollmentId, "marksObtained", 42.5))), 403);

            // Valid marks submission (42.5 / 50 -> 85% -> Grade 'A')
            var saveRes = call(faculty, "/academic/assessments/" + assessmentId + "/marks",
                Map.of("records", List.of(Map.of("enrollmentId", enrollmentId, "marksObtained", 42.5, "remarks", "Good analytical answers")),
                       "reason", "Initial CA-1 evaluation"), 200);
            assertEquals(1, saveRes.get("inserted").asInt());

            // 8. Student logs in and sees their marks
            var studentMarks = call(student, "/academic/my-marks", null, 200);
            assertEquals(1, studentMarks.size());
            var markRecord = studentMarks.get(0);
            assertEquals("CA-1", markRecord.get("assessment_title").asText());
            assertEquals(42.5, markRecord.get("marks_obtained").asDouble());
            assertEquals(50.0, markRecord.get("max_marks").asDouble());
            assertEquals(85.0, markRecord.get("percentage").asDouble());
            assertEquals("A", markRecord.get("grade").asText());
            assertEquals("Good analytical answers", markRecord.get("remarks").asText());

            // 9. Teacher updates the marks with an audit trail (46.0 / 50 -> 92% -> Grade 'A+')
            var updateRes = call(faculty, "/academic/assessments/" + assessmentId + "/marks",
                Map.of("records", List.of(Map.of("enrollmentId", enrollmentId, "marksObtained", 46.0, "remarks", "Corrected score after review")),
                       "reason", "Re-checked Question 3"), 200);
            assertEquals(1, updateRes.get("updated").asInt());

            // 10. Student sees corrected result
            var updatedStudentMarks = call(student, "/academic/my-marks", null, 200);
            assertEquals(1, updatedStudentMarks.size());
            assertEquals(46.0, updatedStudentMarks.get(0).get("marks_obtained").asDouble());
            assertEquals(92.0, updatedStudentMarks.get(0).get("percentage").asDouble());
            assertEquals("A+", updatedStudentMarks.get(0).get("grade").asText());
            assertEquals("Corrected score after review", updatedStudentMarks.get(0).get("remarks").asText());

            // 11. Performance stats & Admin report
            var stats = call(faculty, "/academic/assessments/" + assessmentId + "/stats", null, 200);
            assertEquals(1, stats.get("summary").get("submitted_count").asInt());
            assertEquals(46.0, stats.get("summary").get("avg_marks").asDouble());
            assertEquals(92.0, stats.get("summary").get("avg_percentage").asDouble());

            var adminReports = call(admin, "/academic/admin/marks-reports", null, 200);
            assertTrue(adminReports.size() >= 1);
            assertEquals("CA-1", adminReports.get(0).get("assessment_title").asText());
            assertEquals(1, adminReports.get(0).get("submissions_count").asInt());
            assertEquals(46.0, adminReports.get(0).get("avg_marks").asDouble());
        }

        // 12. Application Restart: Verify persistence across independent context restart
        try (var app = start()) {
            var student = login("24CSE9999", password);
            var marksAfterRestart = call(student, "/academic/my-marks", null, 200);
            assertEquals(1, marksAfterRestart.size());
            assertEquals(46.0, marksAfterRestart.get(0).get("marks_obtained").asDouble());
            assertEquals(50.0, marksAfterRestart.get(0).get("max_marks").asDouble());
            assertEquals("A+", marksAfterRestart.get(0).get("grade").asText());
        }
    }
}
