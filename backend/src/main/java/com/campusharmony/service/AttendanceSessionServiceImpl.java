package com.campusharmony.service;

import com.campusharmony.dto.SessionAttendanceRequest;
import com.campusharmony.dto.SessionRecordEntry;
import com.campusharmony.entity.AttendanceRecord;
import com.campusharmony.entity.AttendanceSession;
import com.campusharmony.entity.CourseEnrollment;
import com.campusharmony.exception.BadRequestException;
import com.campusharmony.exception.ResourceNotFoundException;
import com.campusharmony.repository.AttendanceRecordRepository;
import com.campusharmony.repository.AttendanceSessionRepository;
import com.campusharmony.repository.CourseEnrollmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class AttendanceSessionServiceImpl implements AttendanceSessionService {

    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;
    private final CourseEnrollmentRepository enrollmentRepository;

    public AttendanceSessionServiceImpl(
            AttendanceSessionRepository sessionRepository,
            AttendanceRecordRepository recordRepository,
            CourseEnrollmentRepository enrollmentRepository) {
        this.sessionRepository = sessionRepository;
        this.recordRepository = recordRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    @Override
    @Transactional
    public AttendanceSession createSession(AttendanceSession session) {
        return sessionRepository.save(session);
    }

    @Override
    public List<AttendanceSession> getSessionsByCourse(String courseCode) {
        return sessionRepository.findByCourseCode(courseCode);
    }

    @Override
    public List<AttendanceRecord> getRecordsBySession(Long sessionId) {
        return recordRepository.findBySessionId(sessionId);
    }

    @Override
    @Transactional
    public List<AttendanceRecord> markSessionAttendance(SessionAttendanceRequest request) {
        AttendanceSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("AttendanceSession", "id", request.getSessionId()));

        if (session.getOfferingId() != null) {
            throw new BadRequestException("Use the assigned teacher lecture roster for this offering.");
        }

        List<AttendanceRecord> savedRecords = new ArrayList<>();

        for (SessionRecordEntry entry : request.getEntries()) {
            // Find enrollment for this student in this course & academic period
            CourseEnrollment enrollment = enrollmentRepository
                    .findByStudentIdAndCourseCodeAndAcademicPeriodId(
                            entry.getStudentId(), session.getCourseCode(), session.getAcademicPeriodId())
                    .orElseThrow(() -> new BadRequestException(
                            "Student " + entry.getStudentId() + " is not enrolled in course " +
                            session.getCourseCode() + " for term " + session.getAcademicPeriodId()));

            // Find existing record or create new
            AttendanceRecord record = recordRepository
                    .findBySessionIdAndStudentId(session.getId(), entry.getStudentId())
                    .orElseGet(AttendanceRecord::new);

            record.setSessionId(session.getId());
            record.setEnrollmentId(enrollment.getId());
            record.setStudentId(entry.getStudentId());
            record.setCourseCode(session.getCourseCode());
            record.setAcademicPeriodId(session.getAcademicPeriodId());
            record.setStatus(entry.getStatus());
            record.setRemarks(entry.getRemarks());

            savedRecords.add(recordRepository.save(record));
        }

        return savedRecords;
    }
}
