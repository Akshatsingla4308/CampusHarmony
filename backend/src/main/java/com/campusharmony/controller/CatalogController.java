package com.campusharmony.controller;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/academic/catalog")
public class CatalogController {
    private final JdbcTemplate db;
    public CatalogController(JdbcTemplate db){this.db=db;}
    public record Item(@NotBlank String code,@NotBlank String name){}
    public record Term(@NotBlank String code,@NotBlank String name,@NotBlank String year,@NotBlank String term){}
    public record Course(@NotBlank String code,@NotBlank String name,@Positive int departmentId,@NotBlank String subject,
                         @Min(1) @Max(8) int semester,@Min(1) @Max(10) int credits){}
    @PostMapping("/departments")
    public void department(@Valid @RequestBody Item item){
        db.update("INSERT INTO departments(code,name) VALUES(?,?)",item.code(),item.name());
    }
    @PostMapping("/subjects")
    public void subject(@Valid @RequestBody Item item){
        db.update("INSERT INTO subjects(subject_key,label) VALUES(?,?)",item.code(),item.name());
    }
    @PostMapping("/terms")
    public void term(@Valid @RequestBody Term t){
        db.update("INSERT INTO academic_periods(code,name,academic_year,semester_term) VALUES(?,?,?,?)",t.code(),t.name(),t.year(),t.term());
    }
    @PostMapping("/courses")
    public void course(@Valid @RequestBody Course c){
        db.update("INSERT INTO courses(code,name,department_id,subject_key,semester,credits) VALUES(?,?,?,?,?,?)",c.code(),c.name(),c.departmentId(),c.subject(),c.semester(),c.credits());
    }
}
