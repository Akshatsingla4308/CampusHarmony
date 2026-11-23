package com.campusharmony;

import com.fasterxml.jackson.databind.*;
import java.net.*;
import java.net.http.*;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import static org.junit.jupiter.api.Assertions.*;

/** Run only against a new, disposable, migrated schema. Two independent Boot contexts exercise restart. */
@EnabledIfEnvironmentVariable(named="CAMPUS_DISPOSABLE_WORKFLOW",matches="true")
class FoundationWorkflowIT {
    private final ObjectMapper json=new ObjectMapper();
    private final String password=UUID.randomUUID().toString();
    private String base;
    private HttpClient browser(){
        return HttpClient.newBuilder().cookieHandler(new CookieManager(null,CookiePolicy.ACCEPT_ALL)).build();
    }
    private JsonNode call(HttpClient client,String path,Object body,int expected) throws Exception {
        var request=HttpRequest.newBuilder(URI.create(base+path)).timeout(java.time.Duration.ofSeconds(20)).header("X-Campus-Request","1");
        if(body!=null) request.header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
        var response=client.send(request.build(),HttpResponse.BodyHandlers.ofString());
        assertEquals(expected,response.statusCode(),path+" "+response.body());
        return response.body().isBlank()?json.nullNode():json.readTree(response.body());
    }
    private HttpClient login(String login,String secret) throws Exception {
        HttpClient client=browser();
        call(client,"/auth/login",Map.of("identifier",login,"password",secret),200);
        return client;
    }
    private ServletWebServerApplicationContext start(){
        var app=(ServletWebServerApplicationContext)SpringApplication.run(CampusHarmonyApplication.class,"--server.port=0");
        base="http://127.0.0.1:"+app.getWebServer().getPort()+"/api";
        return app;
    }
    @Test void lectureSurvivesRestart() throws Exception {
        String date=LocalDate.now().toString();
        try(var app=start()){
            var admin=login(System.getenv("CAMPUS_ADMIN_LOGIN"),System.getenv("CAMPUS_ADMIN_PASSWORD"));
            call(browser(),"/academic/catalog",null,401);
            call(browser(),"/auth/login",Map.of("identifier","faculty","password",password),401);
            call(admin,"/academic/catalog/departments",Map.of("code","CS","name","Computing"),200);
            call(admin,"/academic/catalog/subjects",Map.of("code","db","name","Databases"),200);
            call(admin,"/academic/catalog/terms",Map.of("code","T1","name","First term","year","2026","term","Odd"),200);
            var catalog=call(admin,"/academic/catalog",null,200);
            int department=0,term=0;
            for(var d:catalog.get("departments")){if("Computing".equals(d.get("name").asText())) department=d.get("id").asInt();}
            for(var t:catalog.get("terms")){if("First term".equals(t.get("name").asText())) term=t.get("id").asInt();}
            call(admin,"/academic/sections",Map.of("name","A","departmentId",department,"termId",term,"semester",3),200);
            call(admin,"/academic/catalog/courses",Map.of("code","DB","name","Database systems","departmentId",department,"subject","db","semester",3,"credits",3),200);
            for(String teacher:List.of("faculty","unassigned"))
                call(admin,"/academic/teachers",Map.of("login",teacher,"name",teacher,"password",password,"departmentId",department,"subject","db"),200);
            int section=0;
            for(var s:call(admin,"/academic/catalog",null,200).get("sections")){if("A".equals(s.get("name").asText())) section=s.get("id").asInt();}
            call(admin,"/academic/offerings",Map.of("sectionId",section,"courseCode","DB","teacherId","faculty"),200);
            var faculty=login("faculty",password);
            var outsider=login("unassigned",password);
            assertEquals(0,call(outsider,"/academic/offerings",null,200).size());
            int offering=call(faculty,"/academic/offerings",null,200).get(0).get("id").asInt();
            var registration=Map.of("sectionId",section,"roll","student1","name","Test student","email","fixture@example.invalid","gender","Other","phone","1234567890","password",password);
            call(outsider,"/academic/students",registration,403);
            call(faculty,"/academic/students",registration,200);
            call(faculty,"/academic/students",registration,409);
            var student=login("student1",password);
            assertTrue(call(student,"/academic/my-attendance",null,200).get(0).get("percentage").isNull());
            var schedule=Map.of("offeringId",offering,"date",date,"period",1);
            call(admin,"/academic/lectures",schedule,200);
            call(admin,"/academic/lectures",schedule,409);
            long lecture=call(faculty,"/academic/lectures?offeringId="+offering+"&date="+date,null,200).get(0).get("id").asLong();
            String route="/academic/lectures/"+lecture;
            var roster=call(faculty,route+"/roster",null,200);
            assertEquals("student1",roster.get(0).get("roll").asText());
            long enrollment=roster.get(0).get("enrollment_id").asLong();
            var submission=Map.of("records",List.of(Map.of("enrollmentId",enrollment,"status","Present")));
            call(outsider,route+"/roster",null,403);
            call(student,route+"/attendance",submission,403);
            call(faculty,route+"/attendance",Map.of("records",List.of(Map.of("enrollmentId",enrollment+999,"status","Present"))),400);
            call(faculty,route+"/attendance",submission,200);
            call(faculty,route+"/attendance",submission,409);
            assertEquals(100,call(student,"/academic/my-attendance",null,200).get(0).get("percentage").asInt());
            call(student,"/auth/logout",Map.of(),200);
            call(student,"/academic/my-attendance",null,401);
        }
        try(var app=start()){
            var record=call(login("student1",password),"/academic/my-attendance",null,200).get(0);
            assertEquals(1,record.get("lectures").asInt());
            assertEquals(1,record.get("present").asInt());
            assertEquals(100,record.get("percentage").asInt());
        }
    }
}

