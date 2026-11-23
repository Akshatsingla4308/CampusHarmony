package com.campusharmony;

import com.campusharmony.config.CorsConfig;
import com.campusharmony.controller.AcademicAnalyticsController;
import com.campusharmony.security.Identity;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.method.HandlerMethod;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AnalyticsAccessTests {

    private int status(Object controller, String method, String role, String verb, boolean header) throws Exception {
        var target = Arrays.stream(controller.getClass().getDeclaredMethods())
            .filter(m -> m.getName().equals(method)).findFirst().orElseThrow();
        var request = new MockHttpServletRequest(verb, "/api/academic/analytics");
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
    void analyticsEndpointsEnforceRoleBasedAccess() throws Exception {
        var controller = new AcademicAnalyticsController(null);

        // 1. Anonymous unauthenticated checks
        assertEquals(401, status(controller, "getThreshold", null, "GET", false));
        assertEquals(403, status(controller, "updateThreshold", null, "PUT", false)); // missing CSRF
        assertEquals(401, status(controller, "updateThreshold", null, "PUT", true));  // with CSRF
        assertEquals(401, status(controller, "getAdminOverview", null, "GET", false));
        assertEquals(401, status(controller, "exportAdminDefaultersCsv", null, "GET", false));
        assertEquals(401, status(controller, "getTeacherAnalytics", null, "GET", false));
        assertEquals(401, status(controller, "exportTeacherCourseCsv", null, "GET", false));
        assertEquals(401, status(controller, "getStudentInsights", null, "GET", false));

        // 2. Student permissions
        assertEquals(200, status(controller, "getThreshold", "student", "GET", false));
        assertEquals(403, status(controller, "updateThreshold", "student", "PUT", true));
        assertEquals(403, status(controller, "getAdminOverview", "student", "GET", false));
        assertEquals(403, status(controller, "exportAdminDefaultersCsv", "student", "GET", false));
        assertEquals(403, status(controller, "getTeacherAnalytics", "student", "GET", false));
        assertEquals(403, status(controller, "exportTeacherCourseCsv", "student", "GET", false));
        assertEquals(200, status(controller, "getStudentInsights", "student", "GET", false));

        // 3. Teacher permissions
        assertEquals(200, status(controller, "getThreshold", "teacher", "GET", false));
        assertEquals(403, status(controller, "updateThreshold", "teacher", "PUT", true));
        assertEquals(403, status(controller, "getAdminOverview", "teacher", "GET", false));
        assertEquals(403, status(controller, "exportAdminDefaultersCsv", "teacher", "GET", false));
        assertEquals(200, status(controller, "getTeacherAnalytics", "teacher", "GET", false));
        assertEquals(200, status(controller, "exportTeacherCourseCsv", "teacher", "GET", false));
        assertEquals(403, status(controller, "getStudentInsights", "teacher", "GET", false));

        // 4. Admin permissions
        assertEquals(200, status(controller, "getThreshold", "admin", "GET", false));
        assertEquals(200, status(controller, "updateThreshold", "admin", "PUT", true));
        assertEquals(200, status(controller, "getAdminOverview", "admin", "GET", false));
        assertEquals(200, status(controller, "exportAdminDefaultersCsv", "admin", "GET", false));
        assertEquals(403, status(controller, "getTeacherAnalytics", "admin", "GET", false));
        assertEquals(403, status(controller, "exportTeacherCourseCsv", "admin", "GET", false));
        assertEquals(403, status(controller, "getStudentInsights", "admin", "GET", false));
    }
}
