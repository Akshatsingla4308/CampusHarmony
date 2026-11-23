import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DefaultersPage from "../routes/defaulters";
import { api, request } from "../lib/api";
import { useAuth } from "../context/AuthContext";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    createFileRoute: () => (config) => config.component,
  };
});

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../lib/api", () => ({
  request: vi.fn(),
  api: {
    analytics: {
      getThreshold: vi.fn(),
      updateThreshold: vi.fn(),
      getAdminOverview: vi.fn(),
      getTeacherSummary: vi.fn(),
      getStudentInsights: vi.fn(),
      correctAttendance: vi.fn(),
    },
  },
}));

describe("Attendance Analytics & Defaulter Management Page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("admin views institutional attendance metrics and can update threshold", async () => {
    useAuth.mockReturnValue({ role: "admin", user: { id: "admin", name: "Campus Admin" } });

    api.analytics.getThreshold.mockResolvedValue({ threshold: 75.0 });
    request.mockResolvedValue({ departments: [], terms: [], sections: [] });

    api.analytics.getAdminOverview.mockResolvedValue({
      threshold: 75.0,
      overall: {
        totalStudents: 100,
        totalEnrollments: 200,
        totalConductedLectures: 35,
        averageAttendance: 82.5,
        defaultersCount: 3,
        defaulterRate: 1.5,
      },
      departmentStats: [],
      sectionStats: [],
      courseStats: [],
      defaulters: [
        {
          enrollmentId: 101,
          studentId: 1,
          roll: "24CSE2222",
          name: "Rohan Mehta",
          department: "Computer Science",
          section: "Sec-A1",
          semester: 3,
          courseCode: "CSA701",
          courseName: "Data Warehousing",
          conductedLectures: 3,
          attendedLectures: 1,
          missedLectures: 2,
          attendancePercentage: 33.33,
          isDefaulter: true,
          classesNeededForThreshold: 5,
        },
      ],
    });

    api.analytics.updateThreshold.mockResolvedValue({ threshold: 80.0 });

    render(<DefaultersPage />);

    expect(await screen.findByText(/Attendance Analytics & Institutional Defaulters/i)).toBeInTheDocument();
    expect(screen.getByText("75% Minimum")).toBeInTheDocument();
    expect(screen.getByText("24CSE2222")).toBeInTheDocument();
    expect(screen.getByText("Rohan Mehta")).toBeInTheDocument();
    expect(screen.getByText("33.33%")).toBeInTheDocument();
    expect(screen.getByText("+5 Lectures")).toBeInTheDocument();

    // Update threshold slider and submit
    const updateBtn = screen.getByRole("button", { name: /Update Threshold/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(api.analytics.updateThreshold).toHaveBeenCalledWith(75.0);
    });
  });

  it("teacher views assigned course attendance roster and shortfall projections", async () => {
    useAuth.mockReturnValue({ role: "teacher", user: { id: "T-101", name: "Prof. Vikram Sen" } });

    api.analytics.getThreshold.mockResolvedValue({ threshold: 75.0 });
    api.analytics.getTeacherSummary.mockResolvedValue({
      threshold: 75.0,
      selectedOfferingId: 1,
      offerings: [
        { id: 1, course_code: "CSA701", course_name: "Data Warehousing", section_name: "Sec-A1" },
      ],
      roster: [
        {
          enrollment_id: 101,
          roll: "24CSE1111",
          student_name: "Pooja Roy",
          student_email: "pooja@chitkara.edu.in",
          conducted_lectures: 3,
          attended_lectures: 3,
          missed_lectures: 0,
          attendance_percentage: 100.0,
          is_defaulter: false,
          shortfall: 0,
          status_label: "Good Standing",
        },
        {
          enrollment_id: 102,
          roll: "24CSE2222",
          student_name: "Rohan Mehta",
          student_email: "rohan@chitkara.edu.in",
          conducted_lectures: 3,
          attended_lectures: 1,
          missed_lectures: 2,
          attendance_percentage: 33.33,
          is_defaulter: true,
          shortfall: 5,
          status_label: "Defaulter",
        },
      ],
      history: [],
      summary: {
        totalEnrolled: 2,
        conductedLectures: 3,
        avgPercentage: 66.7,
        defaultersCount: 1,
      },
    });

    render(<DefaultersPage />);

    expect(await screen.findByText(/Course Attendance Analytics & Defaulter Tracking/i)).toBeInTheDocument();
    expect(screen.getByText("Pooja Roy")).toBeInTheDocument();
    expect(screen.getByText("Rohan Mehta")).toBeInTheDocument();
    expect(screen.getByText("Good Standing")).toBeInTheDocument();
    expect(screen.getByText("Defaulter")).toBeInTheDocument();
    expect(screen.getByText("+5 Lectures")).toBeInTheDocument();
  });

  it("student views personalized attendance insights and recovery projections", async () => {
    useAuth.mockReturnValue({ role: "student", user: { id: "24CSE2222", name: "Rohan Mehta" } });

    api.analytics.getThreshold.mockResolvedValue({ threshold: 75.0 });
    api.analytics.getStudentInsights.mockResolvedValue({
      threshold: 75.0,
      overallPercentage: 33.3,
      enrolledCoursesCount: 1,
      defaulterCoursesCount: 1,
      courses: [
        {
          enrollment_id: 102,
          course_code: "CSA701",
          course_name: "Data Warehousing & BI",
          section_name: "Sec-A1",
          teacher_name: "Prof. Vikram Sen",
          conducted_lectures: 3,
          attended_lectures: 1,
          missed_lectures: 2,
          attendance_percentage: 33.33,
          threshold: 75.0,
          status_label: "Defaulter",
          is_defaulter: true,
          classes_needed_for_threshold: 5,
          shortfall_note: "Estimate assuming 100% attendance in future eligible lectures",
          history: [
            { id: 1, session_date: "2026-11-20", session_slot: 1, session_topic: "Introduction", attendance_status: "Absent" },
            { id: 2, session_date: "2026-11-21", session_slot: 2, session_topic: "Schemas", attendance_status: "Absent" },
            { id: 3, session_date: "2026-11-22", session_slot: 3, session_topic: "ETL", attendance_status: "Present" },
          ],
        },
      ],
    });

    render(<DefaultersPage />);

    expect(await screen.findByText(/My Attendance Insights & Defaulter Projections/i)).toBeInTheDocument();
    expect(screen.getByText("1 Defaulter Warning(s)")).toBeInTheDocument();
    expect(screen.getByText("Data Warehousing & BI")).toBeInTheDocument();
    expect(screen.getByText(/Needs \+5 consecutive attended lectures to reach 75%/i)).toBeInTheDocument();

    // Toggle lecture-by-lecture history
    const toggleBtn = screen.getByText(/View Lecture-wise Attendance History/i);
    fireEvent.click(toggleBtn);

    expect(await screen.findByText("Introduction")).toBeInTheDocument();
    expect(screen.getByText("Schemas")).toBeInTheDocument();
    expect(screen.getByText("ETL")).toBeInTheDocument();
  });
});
