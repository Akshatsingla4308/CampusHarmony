package com.campusharmony.config;

import com.campusharmony.entity.Subject;
import com.campusharmony.entity.Teacher;
import com.campusharmony.repository.SubjectRepository;
import com.campusharmony.repository.TeacherRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

/**
 * DataSeeder - makes sure a brand-new (empty) database already has the demo data
 * (subjects, teachers, students, courses ...) the moment the backend starts.
 *
 * Without this, sign-in and teacher registration failed on a fresh database because
 * the subjects/teachers tables were empty and the user had to run database/data.sql by hand.
 * It only runs when the teachers table is empty, so it never overwrites real data.
 */
@org.springframework.context.annotation.Profile("demo-fixtures")
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final DataSource dataSource;
    private final TeacherRepository teacherRepository;
    private final SubjectRepository subjectRepository;

    public DataSeeder(DataSource dataSource,
                      TeacherRepository teacherRepository,
                      SubjectRepository subjectRepository) {
        this.dataSource = dataSource;
        this.teacherRepository = teacherRepository;
        this.subjectRepository = subjectRepository;
    }

    @Override
    public void run(String... args) {
        if (teacherRepository.count() == 0) {
            try {
                ResourceDatabasePopulator populator =
                        new ResourceDatabasePopulator(new ClassPathResource("seed-data.sql"));
                populator.setContinueOnError(true);
                populator.execute(dataSource);
                log.info("Demo data loaded from seed-data.sql");
            } catch (Exception e) {
                log.warn("Could not run seed-data.sql ({}). Falling back to minimal seed.", e.getMessage());
            }
        }

        // Minimal safety net: subjects + demo teachers must exist for sign-in / register to work.
        if (subjectRepository.count() == 0) {
            subjectRepository.save(new Subject("mathematics", "Mathematics"));
            subjectRepository.save(new Subject("physics", "Physics"));
            subjectRepository.save(new Subject("chemistry", "Chemistry"));
            subjectRepository.save(new Subject("english", "English"));
            subjectRepository.save(new Subject("computerScience", "Computer Science"));
            log.info("Default subjects created");
        }
        if (teacherRepository.count() == 0) {
            teacherRepository.save(new Teacher("T-1001", "Dr. Sudha Rao", "computerScience", "demo"));
            log.info("Default demo teacher T-1001 created");
        }
    }
}

