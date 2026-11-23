import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ComplaintsPage from "../routes/complaints";
import { api } from "../lib/api";
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
  api: {
    complaints: {
      submit: vi.fn(),
      getMy: vi.fn(),
      getMyCourses: vi.fn(),
      getDetails: vi.fn(),
      getAdminList: vi.fn(),
      getAdminStats: vi.fn(),
      updateStatus: vi.fn(),
      addResponse: vi.fn(),
    },
  },
}));

describe("Student Complaints & Grievance Management Page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("student views complaints list and submits a new grievance", async () => {
    useAuth.mockReturnValue({
      role: "student",
      user: { login: "24CSE9001", name: "Aman Kumar", studentId: 101 },
    });

    api.complaints.getMy.mockResolvedValue([
      {
        id: 1,
        reference_number: "GRV-2026-90A1B2",
        category: "Examination / Marks",
        subject: "Discrepancy in Midterm CA-1 Score",
        description: "My question 3 was not checked properly.",
        status: "Open",
        created_at: "2026-11-20T10:00:00Z",
        resolved_at: null,
        latest_response: null,
      },
    ]);

    api.complaints.getMyCourses.mockResolvedValue([
      {
        offering_id: 10,
        course_code: "CS-GRV1",
        course_name: "Grievance Systems",
        section_name: "A-GRV",
      },
    ]);

    api.complaints.submit.mockResolvedValue({
      id: 2,
      referenceNumber: "GRV-2026-CC4488",
      status: "Open",
      category: "Academic",
      subject: "Lab Assignment Submission Portal Closed Early",
    });

    render(<ComplaintsPage />);

    expect(await screen.findByText("Student Complaints & Grievance Portal")).toBeInTheDocument();
    expect(screen.getByText("GRV-2026-90A1B2")).toBeInTheDocument();
    expect(screen.getByText("Discrepancy in Midterm CA-1 Score")).toBeInTheDocument();

    // Open submit modal
    const submitBtn = screen.getByRole("button", { name: /New Grievance/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText("Submit Grievance / Complaint")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Subject \/ Summary \*/i), {
      target: { value: "Lab Assignment Submission Portal Closed Early" },
    });
    fireEvent.change(screen.getByLabelText(/Detailed Grievance Description \*/i), {
      target: { value: "The portal closed 15 minutes before the stated deadline." },
    });

    const formSubmitBtn = screen.getByRole("button", { name: /^Submit Grievance$/i });
    fireEvent.click(formSubmitBtn);

    await waitFor(() => {
      expect(api.complaints.submit).toHaveBeenCalledWith({
        category: "Academic",
        subject: "Lab Assignment Submission Portal Closed Early",
        description: "The portal closed 15 minutes before the stated deadline.",
        relatedOfferingId: null,
      });
    });
  });

  it("student views complaint details and audit response timeline", async () => {
    useAuth.mockReturnValue({
      role: "student",
      user: { login: "24CSE9001", name: "Aman Kumar", studentId: 101 },
    });

    api.complaints.getMy.mockResolvedValue([
      {
        id: 1,
        reference_number: "GRV-2026-90A1B2",
        category: "Examination / Marks",
        subject: "Discrepancy in Midterm CA-1 Score",
        description: "My question 3 was not checked properly.",
        status: "Resolved",
        created_at: "2026-11-20T10:00:00Z",
        resolved_at: "2026-11-21T12:00:00Z",
        latest_response: "Score corrected to 24/25.",
      },
    ]);
    api.complaints.getMyCourses.mockResolvedValue([]);

    api.complaints.getDetails.mockResolvedValue({
      id: 1,
      reference_number: "GRV-2026-90A1B2",
      category: "Examination / Marks",
      subject: "Discrepancy in Midterm CA-1 Score",
      description: "My question 3 solution on B+ Trees was not awarded marks.",
      status: "Resolved",
      created_at: "2026-11-20T10:00:00Z",
      resolved_at: "2026-11-21T12:00:00Z",
      activities: [
        {
          id: 1,
          actor_name: "Aman Kumar",
          actor_role: "student",
          action: "CREATED",
          new_status: "Open",
          response_text: "Grievance submitted by student.",
          created_at: "2026-11-20T10:00:00Z",
        },
        {
          id: 2,
          actor_name: "Academic Admin",
          actor_role: "admin",
          action: "RESOLVED",
          previous_status: "In Progress",
          new_status: "Resolved",
          response_text: "Score corrected in ERP portal.",
          created_at: "2026-11-21T12:00:00Z",
        },
      ],
    });

    render(<ComplaintsPage />);

    const detailsBtn = await screen.findByRole("button", { name: /View Details & History/i });
    fireEvent.click(detailsBtn);

    expect(await screen.findByText("Official Activity & Response Timeline")).toBeInTheDocument();
    expect(screen.getByText("Score corrected in ERP portal.")).toBeInTheDocument();
    expect(screen.getByText("Status: In Progress → Resolved")).toBeInTheDocument();
  });

  it("administrator manages complaints, updates status, and replies", async () => {
    useAuth.mockReturnValue({
      role: "admin",
      user: { login: "admin", name: "Institutional Admin" },
    });

    api.complaints.getAdminStats.mockResolvedValue({
      total: 5,
      open: 2,
      inProgress: 1,
      resolved: 2,
      closed: 0,
      byCategory: {
        Academic: 1,
        Attendance: 1,
        "Examination / Marks": 2,
        "Faculty / Teaching": 0,
        Infrastructure: 1,
        Administrative: 0,
        Other: 0,
      },
    });

    api.complaints.getAdminList.mockResolvedValue([
      {
        id: 1,
        reference_number: "GRV-2026-90A1B2",
        student_name: "Aman Kumar",
        student_roll: "24CSE9001",
        category: "Examination / Marks",
        subject: "Discrepancy in Midterm CA-1 Score",
        status: "Open",
        created_at: "2026-11-20T10:00:00Z",
      },
    ]);

    api.complaints.getDetails.mockResolvedValue({
      id: 1,
      reference_number: "GRV-2026-90A1B2",
      student_name: "Aman Kumar",
      student_roll: "24CSE9001",
      department_name: "Computer Science",
      category: "Examination / Marks",
      subject: "Discrepancy in Midterm CA-1 Score",
      description: "My question 3 was not awarded marks.",
      status: "Open",
      created_at: "2026-11-20T10:00:00Z",
      activities: [],
    });

    api.complaints.updateStatus.mockResolvedValue({ success: true });
    api.complaints.addResponse.mockResolvedValue({ success: true });

    render(<ComplaintsPage />);

    expect(await screen.findByText("Institutional Grievance Management Dashboard")).toBeInTheDocument();
    expect(await screen.findByText("Aman Kumar")).toBeInTheDocument();
    expect(screen.getByText("Open Actions")).toBeInTheDocument();

    const reviewBtn = screen.getByRole("button", { name: /Review & Action/i });
    fireEvent.click(reviewBtn);

    expect(await screen.findByText("Update Workflow Status")).toBeInTheDocument();

    const commitStatusBtn = screen.getByRole("button", { name: /Commit Status Change/i });
    fireEvent.click(commitStatusBtn);

    await waitFor(() => {
      expect(api.complaints.updateStatus).toHaveBeenCalledWith(1, {
        status: "In Progress",
        responseText: undefined,
      });
    });
  });
});
