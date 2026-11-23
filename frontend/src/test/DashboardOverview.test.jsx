import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import DashboardOverview from "../components/DashboardOverview";
import { api } from "../lib/api";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

vi.mock("../lib/api", () => ({
  api: {
    analytics: { getAdminOverview: vi.fn(), getStudentInsights: vi.fn() },
    complaints: { getAdminStats: vi.fn(), getMy: vi.fn() },
    marks: { getMyMarks: vi.fn() },
    timetable: { getTodaySchedule: vi.fn() },
  },
}));

it("keeps the admin attendance overview usable when complaint stats fail and can retry them", async () => {
  api.analytics.getAdminOverview.mockResolvedValue({
    overall: { totalConductedLectures: 0, averageAttendance: 0, defaultersCount: 0 },
  });
  api.complaints.getAdminStats
    .mockRejectedValueOnce(new Error("Complaints unavailable"))
    .mockResolvedValueOnce({ open: 2, inProgress: 1 });

  render(<DashboardOverview role="admin" />);
  expect(await screen.findByText("No lectures yet")).toBeInTheDocument();
  expect(await screen.findByRole("alert")).toHaveTextContent("Complaints unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("2")).toBeInTheDocument();
  expect(api.analytics.getStudentInsights).not.toHaveBeenCalled();
});

it("shows a student's recorded zero and the latest result across courses", async () => {
  api.analytics.getStudentInsights.mockResolvedValue({
    enrolledCoursesCount: 2,
    overallPercentage: 0,
    defaulterCoursesCount: 1,
    courses: [{ conducted_lectures: 1, attendance_percentage: 0 }],
  });
  api.timetable.getTodaySchedule.mockResolvedValue({ lectures: [] });
  api.complaints.getMy.mockResolvedValue([]);
  api.marks.getMyMarks.mockResolvedValue([
    {
      mark_id: 1,
      assessment_id: 1,
      assessment_date: "2026-01-01",
      assessment_title: "Earlier exam",
      course_code: "DB",
      marks_obtained: 20,
      max_marks: 50,
    },
    {
      mark_id: 2,
      assessment_id: 2,
      assessment_date: "2026-02-01",
      assessment_title: "Later exam",
      course_code: "JAVA",
      marks_obtained: 45,
      max_marks: 50,
    },
  ]);

  render(<DashboardOverview role="student" />);
  expect(await screen.findByText("0%")).toBeInTheDocument();
  expect(await screen.findByText("No lectures scheduled for today.")).toBeInTheDocument();
  expect((await screen.findByText("Later exam")).closest("li")).toHaveTextContent("45/50");
  expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Later exam");
});
