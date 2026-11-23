package com.campusharmony;

import com.campusharmony.config.CorsConfig;
import com.campusharmony.controller.*;
import com.campusharmony.security.*;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import org.springframework.web.method.HandlerMethod;
import java.util.Arrays;
import static org.junit.jupiter.api.Assertions.*;

class FoundationAccessTests {
    private int status(Object controller,String method,String role,String verb,boolean header) throws Exception {
        var target=Arrays.stream(controller.getClass().getDeclaredMethods())
            .filter(m->m.getName().equals(method)).findFirst().orElseThrow();
        var request=new MockHttpServletRequest(verb,"/api");
        if(role!=null) request.getSession().setAttribute("user",new Identity("fixture","Fixture",role,null,null));
        if(header)request.addHeader("X-Campus-Request","1");
        var response=new MockHttpServletResponse();
        new CorsConfig().preHandle(request,response,new HandlerMethod(controller,target));
        return response.getStatus();
    }
    @Test void apiDefaultsToAdminAndChecksAttendanceRole() throws Exception {
        var controller=new AcademicController(null);
        assertEquals(401,status(controller,"catalog",null,"GET",false));
        assertEquals(403,status(controller,"catalog","teacher","GET",false));
        assertEquals(200,status(controller,"catalog","admin","GET",false));
        assertEquals(403,status(controller,"submit","student","POST",true));
        assertEquals(200,status(controller,"submit","teacher","POST",true));
        assertEquals(403,status(controller,"register","teacher","POST",false));
        assertEquals(403,status(new StudentController(null),"getStudents","student","GET",true));
    }
    @Test void publicLoginStillRequiresBrowserRequestHeader() throws Exception {
        var controller=new AuthController(null,null);
        assertEquals(403,status(controller,"login",null,"POST",false));
        assertEquals(200,status(controller,"login",null,"POST",true));
        assertEquals(401,status(controller,"me",null,"GET",false));
    }
    @Test void randomSaltsAndPasswordVerification(){
        String password=java.util.UUID.randomUUID().toString();
        String encoded=Passwords.hash(password);
        assertNotEquals(encoded,Passwords.hash(password));
        assertTrue(Passwords.matches(password,encoded));
        assertFalse(Passwords.matches("wrong",encoded));
        assertThrows(org.springframework.web.server.ResponseStatusException.class,()->Passwords.hash("short"));
    }
}
