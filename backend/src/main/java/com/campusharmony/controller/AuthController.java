package com.campusharmony.controller;
import com.campusharmony.security.*;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.boot.*;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
@RestController
@RequestMapping("/api/auth")
public class AuthController implements ApplicationRunner {
    private final JdbcTemplate db;
    private final Environment env;
    public AuthController(JdbcTemplate db,Environment env){this.db=db;this.env=env;}
    public void run(ApplicationArguments args) {
        String login = env.getProperty("campus.admin.login");
        if (login == null || login.isBlank()) login = env.getProperty("CAMPUS_ADMIN_LOGIN");
        if (login == null || login.isBlank()) login = System.getenv("CAMPUS_ADMIN_LOGIN");
        if (login == null || login.isBlank()) login = "admin";

        String password = env.getProperty("campus.admin.password");
        if (password == null || password.isBlank()) password = env.getProperty("CAMPUS_ADMIN_PASSWORD");
        if (password == null || password.isBlank()) password = System.getenv("CAMPUS_ADMIN_PASSWORD");

        if(password!=null && !password.isBlank() && db.queryForObject("SELECT COUNT(*) FROM accounts WHERE role='admin'",Integer.class)==0)
            db.update("INSERT INTO accounts(login,display_name,role,password_hash) VALUES(?,?,'admin',?)",login,login,Passwords.hash(password));
    }
    public record Credentials(@NotBlank @Size(max=80) String identifier,@NotBlank @Size(max=256) String password){}
    @PostMapping("/login") @Access("public")
    public Identity login(@Valid @RequestBody Credentials input,HttpServletRequest req) {
        var users=db.query("SELECT * FROM accounts WHERE login=?", (rs,i)-> {
            if(!Passwords.matches(input.password(),rs.getString("password_hash"))) return null;
            return new Identity(rs.getString("login"),rs.getString("display_name"),rs.getString("role"),rs.getString("teacher_id"),rs.getObject("student_id",Long.class));
        },input.identifier());
        if(users.isEmpty() || users.get(0)==null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Invalid credentials");
        if(req.getSession(false)!=null) req.getSession(false).invalidate();
        req.getSession(true).setAttribute("user",users.get(0));
        return users.get(0);
    }
    @GetMapping("/me") @Access({"admin","teacher","student"})
    public Identity me(@SessionAttribute Identity user){return user;}
    @PostMapping("/logout") @Access({"admin","teacher","student"})
    public void logout(HttpSession session){session.invalidate();}
}
