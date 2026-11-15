package com.campusharmony.service;

import com.campusharmony.dto.ApiResponse;
import com.campusharmony.dto.SaveMarksRequest;
import com.campusharmony.entity.Marks;
import com.campusharmony.entity.StudentMark;

import java.util.List;

/**
 * MarksService - Interface for marks recording and evaluation.
 */
public interface MarksService {

    List<Marks> getMarks(String teacherId);

    ApiResponse saveMarks(SaveMarksRequest request);

    List<StudentMark> getEvaluations(Long studentId);

    StudentMark saveEvaluation(StudentMark evaluation);
}
