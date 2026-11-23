import React from "react";
import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AcademicWorkspace from "../components/AcademicWorkspace";
import { request } from "../lib/api";
import { useAuth } from "../context/AuthContext";
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../lib/api", () => ({ request: vi.fn() }));
it("submits the actual enrollment ID returned for the selected lecture", async () => {
  useAuth.mockReturnValue({ role: "teacher" });
  request.mockImplementation(async (path, options) => {
    if (path.endsWith("/offerings"))
      return [
        {
          id: 42,
          section_id: 7,
          section_name: "A",
          department: "CS",
          term: "Term",
          semester: 3,
          code: "DB",
          course_name: "Databases",
        },
      ];
    if (path.includes("/lectures?offeringId=42")) return [{ id: 300, session_slot: 2 }];
    if (path.endsWith("/300/roster"))
      return [{ enrollment_id: 917, student_id: 5, name: "Test Learner", roll: "TEST-5" }];
    if (options?.method === "POST") return null;
    throw new Error("Unexpected request " + path);
  });
  render(<AcademicWorkspace />);
  fireEvent.change(await screen.findByLabelText("Assigned class"), { target: { value: "7" } });
  fireEvent.change(screen.getByLabelText("Course", { exact: true }), { target: { value: "42" } });
  await screen.findByText("Period 2");
  fireEvent.change(screen.getByLabelText("Scheduled lecture"), { target: { value: "300" } });
  fireEvent.change(await screen.findByLabelText(/TEST-5/), { target: { value: "Absent" } });
  fireEvent.click(screen.getByText("Submit attendance"));
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith("/academic/lectures/300/attendance", {
      method: "POST",
      body: { records: [{ enrollmentId: 917, status: "Absent" }] },
    }),
  );
});
it("displays an unmarked course separately from a recorded zero percent", async () => {
  useAuth.mockReturnValue({ role: "student" });
  request.mockResolvedValue([
    { code: "DB", name: "Databases", term: "T", lectures: 1, present: 0, percentage: 0 },
    { code: "JV", name: "Java", term: "T", lectures: 0, present: 0, percentage: null },
  ]);
  render(<AcademicWorkspace />);
  await screen.findByText("0%");
  expect(screen.getByText("No lectures marked")).toBeInTheDocument();
});

it("opens the requested lecture and saves corrections with unchanged roster entries", async () => {
  useAuth.mockReturnValue({ role: "teacher" });
  let savedStatus = "Absent";
  request.mockImplementation(async (path, options) => {
    if (path.endsWith("/offerings"))
      return [
        { id: 42, section_id: 7, section_name: "A", code: "DB", course_name: "Databases" },
        { id: 43, section_id: 8, section_name: "B", code: "JV", course_name: "Java" },
      ];
    if (path === "/academic/lectures?offeringId=43&date=2026-01-01")
      return [{ id: 301, session_slot: 2, submitted_at: "2026-01-01" }];
    if (path.endsWith("/301/roster"))
      return [
        { enrollment_id: 917, name: "Test Learner", roll: "TEST-5", status: savedStatus },
        { enrollment_id: 918, name: "Other Learner", roll: "TEST-6", status: "Present" },
      ];
    if (path.endsWith("/301/attendance") && options?.method === "PUT") {
      savedStatus = options.body.records[0].status;
      return null;
    }
    throw new Error("Unexpected request " + path);
  });

  render(<AcademicWorkspace selection={{ offeringId: 43, sessionId: 301, date: "2026-01-01" }} />);
  fireEvent.click(await screen.findByRole("button", { name: "Correct attendance" }, { timeout: 4000 }));
  const status = screen.getByLabelText(/TEST-5/);
  expect(status).toHaveValue("Absent");
  expect(screen.getByRole("button", { name: "Save corrections" })).toBeDisabled();
  fireEvent.change(status, { target: { value: "Present" } });
  fireEvent.click(screen.getByRole("button", { name: "Save corrections" }));
  await screen.findByText("Attendance corrections saved.", { exact: true });
  expect(request).toHaveBeenCalledWith("/academic/lectures/301/attendance", {
    method: "PUT",
    body: {
      records: [
        { enrollmentId: 917, status: "Present" },
        { enrollmentId: 918, status: "Present" },
      ],
    },
  });
});

it("allows bulk marking and preserves full roster when search filter is active", async () => {
  useAuth.mockReturnValue({ role: "teacher" });
  request.mockImplementation(async (path, options) => {
    if (path.endsWith("/offerings"))
      return [{ id: 42, section_id: 7, section_name: "A", code: "DB", course_name: "Databases" }];
    if (path.includes("/lectures?offeringId=42"))
      return [{ id: 300, session_slot: 2 }];
    if (path.endsWith("/300/roster"))
      return [
        { enrollment_id: 917, student_id: 5, name: "Aarav Patel", roll: "TEST-5" },
        { enrollment_id: 918, student_id: 6, name: "Bhavna Sharma", roll: "TEST-6" },
        { enrollment_id: 919, student_id: 7, name: "Chirag Singh", roll: "TEST-7" },
        { enrollment_id: 920, student_id: 8, name: "Divya Verma", roll: "TEST-8" },
      ];
    if (options?.method === "POST") return null;
    throw new Error("Unexpected request " + path);
  });

  render(<AcademicWorkspace selection={{ offeringId: 42, sessionId: 300, date: "2026-01-01" }} />);
  await screen.findByText(/TEST-5/);

  // Click "Mark All Present"
  fireEvent.click(screen.getByRole("button", { name: "Mark All Present" }));
  expect(screen.getByText("Present: 4")).toBeInTheDocument();

  // Search filter
  const searchInput = screen.getByPlaceholderText("Search by name or roll…");
  fireEvent.change(searchInput, { target: { value: "Aarav" } });

  // Aarav is visible, Bhavna is filtered out of view
  expect(screen.getByText(/Aarav Patel/)).toBeInTheDocument();
  expect(screen.queryByText(/Bhavna Sharma/)).not.toBeInTheDocument();

  // Submit attendance submits all 4 students even with search filter active
  fireEvent.click(screen.getByText("Submit attendance"));
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith("/academic/lectures/300/attendance", {
      method: "POST",
      body: {
        records: [
          { enrollmentId: 917, status: "Present" },
          { enrollmentId: 918, status: "Present" },
          { enrollmentId: 919, status: "Present" },
          { enrollmentId: 920, status: "Present" },
        ],
      },
    }),
  );
});
