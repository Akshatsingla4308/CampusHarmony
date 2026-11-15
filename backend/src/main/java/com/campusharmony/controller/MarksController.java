package com.campusharmony.controller;

import com.campusharmony.dto.ApiResponse;
import com.campusharmony.dto.SaveMarksRequest;
import com.campusharmony.entity.Marks;
import com.campusharmony.service.MarksService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * MarksController - REST endpoints for marks evaluation and results.
 */
@RestController
@RequestMapping("/api/marks")
public class MarksController {

    private final MarksService marksService;

    public MarksController(MarksService marksService) {
        this.marksService = marksService;
    }

    @GetMapping
    public ResponseEntity<List<Marks>> getMarks(@RequestParam(required = false) String teacherId) {
        List<Marks> marks = marksService.getMarks(teacherId);
        return ResponseEntity.ok(marks);
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse> saveMarks(@RequestBody SaveMarksRequest request) {
        ApiResponse response = marksService.saveMarks(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/evaluations")
    public ResponseEntity<ApiResponse> getEvaluations(@RequestParam(required = false) Long studentId) {
        List<com.campusharmony.entity.StudentMark> list = marksService.getEvaluations(studentId);
        return ResponseEntity.ok(ApiResponse.success("Subject-level marks evaluations retrieved", list));
    }

    @PostMapping("/evaluations")
    public ResponseEntity<ApiResponse> saveEvaluation(@RequestBody com.campusharmony.entity.StudentMark evaluation) {
        com.campusharmony.entity.StudentMark saved = marksService.saveEvaluation(evaluation);
        return ResponseEntity.ok(ApiResponse.success("Subject evaluation saved and synchronized to summary cache via triggers", saved));
    }
}
