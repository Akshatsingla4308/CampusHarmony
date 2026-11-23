package com.campusharmony;

import com.campusharmony.config.CorsConfig;
import com.campusharmony.controller.AcademicMarksController;
import com.campusharmony.security.Identity;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.method.HandlerMethod;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MarksAccessTests {

    private int status(Object controller, String method, String role, String verb, boolean header) throws Exception {
        var target = Arrays.stream(controller.getClass().getDeclaredMethods())
            .filter(m -> m.getName().equals(method)).findFirst().orElseThrow();
        var request = new MockHttpServletRequest(verb, "/api/academic");
        if (role != null) {
            request.getSession().setAttribute("user", new Identity("fixture", "Fixture", role, "T-1001", 101L));
        }
        if (header) {
            request.addHeader("X-Campus-Request", "1");
        }
        var response = new MockHttpServletResponse();
        new CorsConfig().preHandle(request, response, new HandlerMethod(controller, target));
        return response.getStatus();
    }

    @Test
    void marksEndpointsEnforceRoleBasedAccess() throws Exception {
        var controller = new AcademicMarksController(null);

        // Anonymous unauthenticated calls
        assertEquals(401, status(controller, "getAssessments", null, "GET", false));
        assertEquals(403, status(controller, "createAssessment", null, "POST", false));
        assertEquals(401, status(controller, "saveMarks", null, "POST", true)); // header present, but unauthenticated
        assertEquals(401, status(controller, "getMyMarks", null, "GET", false));
        assertEquals(401, status(controller, "getAdminMarksReports", null, "GET", false));

        // Student access checks
        assertEquals(403, status(controller, "getAssessments", "student", "GET", false));
        assertEquals(403, status(controller, "createAssessment", "student", "POST", true));
        assertEquals(403, status(controller, "saveMarks", "student", "POST", true));
        assertEquals(403, status(controller, "getAdminMarksReports", "student", "GET", false));
        assertEquals(200, status(controller, "getMyMarks", "student", "GET", false));

        // Teacher access checks
        assertEquals(200, status(controller, "getAssessments", "teacher", "GET", false));
        assertEquals(200, status(controller, "createAssessment", "teacher", "POST", true));
        assertEquals(200, status(controller, "saveMarks", "teacher", "POST", true));
        assertEquals(403, status(controller, "getMyMarks", "teacher", "GET", false));
        assertEquals(403, status(controller, "getAdminMarksReports", "teacher", "GET", false));

        // Admin access checks
        assertEquals(200, status(controller, "getAssessments", "admin", "GET", false));
        assertEquals(200, status(controller, "createAssessment", "admin", "POST", true));
        assertEquals(200, status(controller, "saveMarks", "admin", "POST", true));
        assertEquals(200, status(controller, "getAdminMarksReports", "admin", "GET", false));
        assertEquals(403, status(controller, "getMyMarks", "admin", "GET", false));
    }
}
