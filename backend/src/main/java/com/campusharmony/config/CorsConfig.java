package com.campusharmony.config;
import com.campusharmony.security.*;
import jakarta.servlet.http.*;
import java.util.*;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.*;
import org.springframework.web.servlet.config.annotation.*;
@Configuration
public class CorsConfig implements WebMvcConfigurer, HandlerInterceptor {
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins("http://localhost:5173","http://127.0.0.1:5173")
            .allowedMethods("GET","POST","PUT","DELETE","PATCH","OPTIONS").allowedHeaders("Content-Type","X-Campus-Request","Accept").allowCredentials(true);
    }
    public void addInterceptors(InterceptorRegistry registry){registry.addInterceptor(this);}
    public boolean preHandle(HttpServletRequest req,HttpServletResponse res,Object handler) throws Exception {
        if(!(handler instanceof HandlerMethod method) || !method.getBeanType().getPackageName().startsWith("com.campusharmony")) return true;
        if(!Set.of("GET","HEAD","OPTIONS").contains(req.getMethod()) && !"1".equals(req.getHeader("X-Campus-Request"))) {
            res.sendError(403); return false;
        }
        Access access=method.getMethodAnnotation(Access.class);
        List<String> roles=access==null ? List.of("admin") : Arrays.asList(access.value());
        if(roles.contains("public")) return true;
        HttpSession session=req.getSession(false);
        Identity user=session==null ? null : (Identity)session.getAttribute("user");
        if(user==null || !roles.contains(user.role())) {res.sendError(user==null?401:403);return false;}
        return true;
    }
}
