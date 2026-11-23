package com.campusharmony;

import com.campusharmony.config.CorsConfig;
import com.campusharmony.controller.AcademicTimetableController;
import com.campusharmony.security.Identity;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.method.HandlerMethod;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TimetableAccessTests {

    private int status(Object controller, String method, String role, String verb, boolean header) throws Exception {
        var target = Arrays.stream(controller.getClass().getDeclaredMethods())
            .filter(m -> m.getName().equals(method)).findFirst().orElseThrow();
        var request = new MockHttpServletRequest(verb, "/api/academic/timetable");
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
    void timetableEndpointsEnforceRoleBasedAccess() throws Exception {
        var controller = new AcademicTimetableController(null);

        // 1. Anonymous unauthenticated calls
        assertEquals(403, status(controller, "createEntry", null, "POST", false)); // missing CSRF -> 403
        assertEquals(401, status(controller, "createEntry", null, "POST", true));  // with CSRF, unauthenticated -> 401
        assertEquals(401, status(controller, "updateEntry", null, "PUT", true));
        assertEquals(401, status(controller, "deleteEntry", null, "DELETE", true));
        assertEquals(401, status(controller, "getSectionTimetable", null, "GET", false));
        assertEquals(401, status(controller, "getTeacherScheduleAdmin", null, "GET", false));
        assertEquals(401, status(controller, "getMySchedule", null, "GET", false));
        assertEquals(401, status(controller, "getTodaySchedule", null, "GET", false));
        assertEquals(401, status(controller, "conductLecture", null, "POST", true));
        assertEquals(401, status(controller, "cancelLecture", null, "POST", true));

        // 2. Student role permissions
        assertEquals(403, status(controller, "createEntry", "student", "POST", true));
        assertEquals(403, status(controller, "updateEntry", "student", "PUT", true));
        assertEquals(403, status(controller, "deleteEntry", "student", "DELETE", true));
        assertEquals(403, status(controller, "getTeacherScheduleAdmin", "student", "GET", false));
        assertEquals(403, status(controller, "conductLecture", "student", "POST", true));
        assertEquals(403, status(controller, "cancelLecture", "student", "POST", true));
        assertEquals(200, status(controller, "getSectionTimetable", "student", "GET", false));
        assertEquals(200, status(controller, "getMySchedule", "student", "GET", false));
        assertEquals(200, status(controller, "getTodaySchedule", "student", "GET", false));

        // 3. Teacher role permissions
        assertEquals(403, status(controller, "createEntry", "teacher", "POST", true));
        assertEquals(403, status(controller, "updateEntry", "teacher", "PUT", true));
        assertEquals(403, status(controller, "deleteEntry", "teacher", "DELETE", true));
        assertEquals(403, status(controller, "getTeacherScheduleAdmin", "teacher", "GET", false));
        assertEquals(200, status(controller, "getSectionTimetable", "teacher", "GET", false));
        assertEquals(200, status(controller, "getMySchedule", "teacher", "GET", false));
        assertEquals(200, status(controller, "getTodaySchedule", "teacher", "GET", false));
        assertEquals(200, status(controller, "conductLecture", "teacher", "POST", true));
        assertEquals(200, status(controller, "cancelLecture", "teacher", "POST", true));

        // 4. Admin role permissions
        assertEquals(200, status(controller, "createEntry", "admin", "POST", true));
        assertEquals(200, status(controller, "updateEntry", "admin", "PUT", true));
        assertEquals(200, status(controller, "deleteEntry", "admin", "DELETE", true));
        assertEquals(200, status(controller, "getSectionTimetable", "admin", "GET", false));
        assertEquals(200, status(controller, "getTeacherScheduleAdmin", "admin", "GET", false));
        assertEquals(200, status(controller, "cancelLecture", "admin", "POST", true));
        // Admin is not teacher/student, so conductLecture and mySchedule are restricted to teacher/student roles
        assertEquals(403, status(controller, "conductLecture", "admin", "POST", true));
        assertEquals(403, status(controller, "getMySchedule", "admin", "GET", false));
    }
}
