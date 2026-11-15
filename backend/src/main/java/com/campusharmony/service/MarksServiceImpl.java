package com.campusharmony.service;

import com.campusharmony.dto.ApiResponse;
import com.campusharmony.dto.SaveMarksRequest;
import com.campusharmony.dto.SubjectMarkEntry;
import com.campusharmony.entity.Activity;
import com.campusharmony.entity.Marks;
import com.campusharmony.entity.Student;
import com.campusharmony.exception.BadRequestException;
import com.campusharmony.repository.ActivityRepository;
import com.campusharmony.repository.MarksRepository;
import com.campusharmony.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * MarksServiceImpl - Business logic for marks management.
 */
@Service
@Transactional
public class MarksServiceImpl implements MarksService {

    private final MarksRepository marksRepository;
    private final StudentRepository studentRepository;
    private final ActivityRepository activityRepository;
    private final com.campusharmony.repository.StudentMarkRepository studentMarkRepository;

    public MarksServiceImpl(MarksRepository marksRepository,
                            StudentRepository studentRepository,
                            ActivityRepository activityRepository,
                            com.campusharmony.repository.StudentMarkRepository studentMarkRepository) {
        this.marksRepository = marksRepository;
        this.studentRepository = studentRepository;
        this.activityRepository = activityRepository;
        this.studentMarkRepository = studentMarkRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Marks> getMarks(String teacherId) {
        List<Student> students = teacherId != null && !teacherId.isBlank()
                ? studentRepository.findByTeacherId(teacherId.trim())
                : studentRepository.findByTeacherIdIsNull();

        List<Marks> result = new ArrayList<>();
        for (Student s : students) {
            Marks m = marksRepository.findByStudentId(s.getId())
                    .orElseGet(() -> {
                        Marks fresh = new Marks(s.getId());
                        return marksRepository.save(fresh);
                    });
            result.add(m);
        }

        return result;
    }

    @Override
    public ApiResponse saveMarks(SaveMarksRequest request) {
        if (request.getEntries() == null || request.getEntries().isEmpty()) {
            return new ApiResponse(true, "No entries provided to save.");
        }

        String subjectKey = request.getSubjectKey();
        if (subjectKey == null || subjectKey.isBlank()) {
            throw new BadRequestException("Subject key is required to save marks.");
        }

        int count = 0;
        for (SubjectMarkEntry entry : request.getEntries()) {
            if (entry.getStudentId() == null || entry.getValue() == null) continue;

            int val = entry.getValue();
            if (val < 0 || val > 100) {
                throw new BadRequestException("Marks must be an integer between 0 and 100.");
            }

            Marks mark = marksRepository.findByStudentId(entry.getStudentId())
                    .orElseGet(() -> new Marks(entry.getStudentId()));

            mark.setScoreBySubject(subjectKey, val);
            marksRepository.save(mark);
            count++;
        }

        activityRepository.save(new Activity(
                subjectKey + " marks saved for " + count + " student" + (count > 1 ? "s" : ""),
                "marks",
                request.getTeacherId()
        ));

        ApiResponse response = new ApiResponse(true, "Marks saved successfully");
        response.setData(count);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.campusharmony.entity.StudentMark> getEvaluations(Long studentId) {
        if (studentId != null) {
            return studentMarkRepository.findByStudentId(studentId);
        }
        return studentMarkRepository.findAll();
    }

    @Override
    public com.campusharmony.entity.StudentMark saveEvaluation(com.campusharmony.entity.StudentMark evaluation) {
        return studentMarkRepository.save(evaluation);
    }
}
