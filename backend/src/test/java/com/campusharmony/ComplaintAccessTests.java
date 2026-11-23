package com.campusharmony;

import com.campusharmony.config.CorsConfig;
import com.campusharmony.controller.AcademicComplaintController;
import com.campusharmony.security.Identity;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.method.HandlerMethod;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ComplaintAccessTests {

    private int status(Object controller, String method, String role, String verb, boolean header) throws Exception {
        var target = Arrays.stream(controller.getClass().getDeclaredMethods())
            .filter(m -> m.getName().equals(method)).findFirst().orElseThrow();
        var request = new MockHttpServletRequest(verb, "/api/academic/complaints");
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
    void complaintEndpointsEnforceRoleBasedAccess() throws Exception {
        var controller = new AcademicComplaintController(null);

        // 1. Anonymous unauthenticated checks
        assertEquals(403, status(controller, "submitComplaint", null, "POST", false)); // missing CSRF
        assertEquals(401, status(controller, "submitComplaint", null, "POST", true));  // with CSRF
        assertEquals(401, status(controller, "getMyComplaints", null, "GET", false));
        assertEquals(401, status(controller, "getMyCourses", null, "GET", false));
        assertEquals(401, status(controller, "getComplaintDetails", null, "GET", false));
        assertEquals(401, status(controller, "getAdminComplaints", null, "GET", false));
        assertEquals(401, status(controller, "getAdminComplaintStats", null, "GET", false));
        assertEquals(403, status(controller, "updateComplaintStatus", null, "PUT", false));
        assertEquals(401, status(controller, "updateComplaintStatus", null, "PUT", true));
        assertEquals(403, status(controller, "addAdminResponse", null, "POST", false));
        assertEquals(401, status(controller, "addAdminResponse", null, "POST", true));

        // 2. Student permissions
        assertEquals(200, status(controller, "submitComplaint", "student", "POST", true));
        assertEquals(200, status(controller, "getMyComplaints", "student", "GET", false));
        assertEquals(200, status(controller, "getMyCourses", "student", "GET", false));
        assertEquals(200, status(controller, "getComplaintDetails", "student", "GET", false));
        assertEquals(403, status(controller, "getAdminComplaints", "student", "GET", false));
        assertEquals(403, status(controller, "getAdminComplaintStats", "student", "GET", false));
        assertEquals(403, status(controller, "updateComplaintStatus", "student", "PUT", true));
        assertEquals(403, status(controller, "addAdminResponse", "student", "POST", true));

        // 3. Teacher permissions (teachers cannot submit or administer grievances)
        assertEquals(403, status(controller, "submitComplaint", "teacher", "POST", true));
        assertEquals(403, status(controller, "getMyComplaints", "teacher", "GET", false));
        assertEquals(403, status(controller, "getMyCourses", "teacher", "GET", false));
        assertEquals(403, status(controller, "getComplaintDetails", "teacher", "GET", false));
        assertEquals(403, status(controller, "getAdminComplaints", "teacher", "GET", false));
        assertEquals(403, status(controller, "getAdminComplaintStats", "teacher", "GET", false));
        assertEquals(403, status(controller, "updateComplaintStatus", "teacher", "PUT", true));
        assertEquals(403, status(controller, "addAdminResponse", "teacher", "POST", true));

        // 4. Admin permissions
        assertEquals(403, status(controller, "submitComplaint", "admin", "POST", true));
        assertEquals(403, status(controller, "getMyComplaints", "admin", "GET", false));
        assertEquals(403, status(controller, "getMyCourses", "admin", "GET", false));
        assertEquals(200, status(controller, "getComplaintDetails", "admin", "GET", false));
        assertEquals(200, status(controller, "getAdminComplaints", "admin", "GET", false));
        assertEquals(200, status(controller, "getAdminComplaintStats", "admin", "GET", false));
        assertEquals(200, status(controller, "updateComplaintStatus", "admin", "PUT", true));
        assertEquals(200, status(controller, "addAdminResponse", "admin", "POST", true));
    }
}
