import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MarksManagementPage from "../routes/marks";
import { api, request } from "../lib/api";
import { useAuth } from "../context/AuthContext";

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../lib/api", () => ({
  request: vi.fn(),
  api: {
    marks: {
      getOfferingAssessments: vi.fn(),
      createAssessment: vi.fn(),
      getAssessmentRoster: vi.fn(),
      saveAssessmentMarks: vi.fn(),
      getAssessmentStats: vi.fn(),
      getMyMarks: vi.fn(),
      getAdminMarksReports: vi.fn(),
    },
  },
}));

describe("Marks & Evaluations Management Page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("teacher can view assigned course assessments and submit valid marks", async () => {
    useAuth.mockReturnValue({ role: "teacher" });
    request.mockResolvedValue([
      { id: 10, section_id: 1, section_name: "CSE-A", course_name: "Databases", code: "CS501" },
    ]);

    api.marks.getOfferingAssessments.mockResolvedValue([
      { id: 101, title: "CA-1", assessment_type: "CA-1", max_marks: 50, assessment_date: "2026-11-22" },
    ]);

    api.marks.getAssessmentRoster.mockResolvedValue({
      assessment: { id: 101, title: "CA-1", max_marks: 50 },
      roster: [
        { enrollment_id: 501, student_id: 1, roll: "24CSE1001", name: "Aarav Patel", marks_obtained: null, is_saved: false },
      ],
    });

    api.marks.getAssessmentStats.mockResolvedValue({
      summary: { submitted_count: 0, avg_marks: null, avg_percentage: null },
      grades: [],
    });

    api.marks.saveAssessmentMarks.mockResolvedValue({ inserted: 1, updated: 0 });

    render(<MarksManagementPage />);

    // Check header
    expect(await screen.findByText(/Marks & Evaluations Management/)).toBeInTheDocument();
    expect(await screen.findByText(/CA-1 — Grading Roster/)).toBeInTheDocument();
    expect(screen.getByText("24CSE1001")).toBeInTheDocument();
    expect(screen.getByText("Aarav Patel")).toBeInTheDocument();

    // Enter marks: 45 (45 / 50 = 90% => A+)
    const markInput = screen.getByPlaceholderText("Enter mark");
    fireEvent.change(markInput, { target: { value: "45" } });

    // Computed grade should display A+ (90% and above is A+)
    expect(screen.getByText("A+")).toBeInTheDocument();

    // Submit
    const saveButtons = screen.getAllByRole("button", { name: /Save Marks/ });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(api.marks.saveAssessmentMarks).toHaveBeenCalledWith("101", {
        records: [{ enrollmentId: 501, marksObtained: 45, remarks: "Evaluated" }],
        reason: "Evaluation submission",
      });
    });
  });

  it("student views own evaluation records and percentage grades", async () => {
    useAuth.mockReturnValue({ role: "student" });
    api.marks.getMyMarks.mockResolvedValue([
      {
        mark_id: 1,
        assessment_id: 101,
        assessment_title: "Midterm Exam",
        assessment_type: "Midterm",
        assessment_date: "2026-11-20",
        marks_obtained: 88,
        max_marks: 100,
        percentage: 88.0,
        grade: "A",
        remarks: "Excellent performance",
        course_code: "CS501",
        course_name: "Database Management Systems",
        section_name: "A",
        semester: 3,
        period_name: "Odd Term 2026",
        teacher_name: "Dr. Sharma",
      },
    ]);

    render(<MarksManagementPage />);

    expect(await screen.findByText(/My Assessment Marks & Academic Performance/)).toBeInTheDocument();
    expect(screen.getByText("Database Management Systems")).toBeInTheDocument();
    expect(screen.getByText("Midterm Exam")).toBeInTheDocument();
    expect(screen.getByText("88.0%")).toBeInTheDocument();
    expect(screen.getByText("Excellent performance")).toBeInTheDocument();
  });

  it("preserves full roster and detects unsaved changes during search filtering", async () => {
    useAuth.mockReturnValue({ role: "teacher" });
    request.mockResolvedValue([
      { id: 10, section_id: 1, section_name: "CSE-A", course_name: "Databases", code: "CS501" },
    ]);

    api.marks.getOfferingAssessments.mockResolvedValue([
      { id: 101, title: "CA-1", assessment_type: "CA-1", max_marks: 50, assessment_date: "2026-11-22" },
    ]);

    api.marks.getAssessmentRoster.mockResolvedValue({
      assessment: { id: 101, title: "CA-1", max_marks: 50 },
      roster: [
        { enrollment_id: 501, student_id: 1, roll: "24CSE1001", name: "Aarav Patel", marks_obtained: 40, remarks: "Evaluated", is_saved: true },
        { enrollment_id: 502, student_id: 2, roll: "24CSE1002", name: "Bhavna Sharma", marks_obtained: 45, remarks: "Evaluated", is_saved: true },
        { enrollment_id: 503, student_id: 3, roll: "24CSE1003", name: "Chirag Singh", marks_obtained: null, remarks: "", is_saved: false },
      ],
    });

    api.marks.getAssessmentStats.mockResolvedValue({
      summary: { submitted_count: 2, avg_marks: 42.5, avg_percentage: 85.0 },
      grades: [],
    });

    api.marks.saveAssessmentMarks.mockResolvedValue({ inserted: 0, updated: 1 });

    render(<MarksManagementPage />);
    expect(await screen.findByText(/CA-1 — Grading Roster/)).toBeInTheDocument();

    // Roster count chip shows Enrolled: 3, Evaluated: 2
    expect(screen.getByText("Enrolled: 3")).toBeInTheDocument();
    expect(screen.getByText("Evaluated: 2")).toBeInTheDocument();

    // Search filter input is rendered because roster.length > 2
    const searchInput = screen.getByPlaceholderText("Search roster…");
    fireEvent.change(searchInput, { target: { value: "Aarav" } });

    // Aarav is visible, Bhavna is filtered out of view
    expect(screen.getByText("24CSE1001")).toBeInTheDocument();
    expect(screen.queryByText("24CSE1002")).not.toBeInTheDocument();

    // Update Aarav's mark to 48
    const markInput = screen.getByPlaceholderText("Enter mark");
    fireEvent.change(markInput, { target: { value: "48" } });

    // Unsaved changes badge is visible
    expect(screen.getByText(/Unsaved changes/)).toBeInTheDocument();

    // Save marks
    const saveButtons = screen.getAllByRole("button", { name: /Save Marks/ });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(api.marks.saveAssessmentMarks).toHaveBeenCalledWith("101", {
        records: [
          { enrollmentId: 501, marksObtained: 48, remarks: "Evaluated" },
          { enrollmentId: 502, marksObtained: 45, remarks: "Evaluated" },
        ],
        reason: "Evaluation submission",
      });
    });
  });
});
