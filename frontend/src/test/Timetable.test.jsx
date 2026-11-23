import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TimetablePage from "../routes/timetable";
import { api, request } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    createFileRoute: () => (config) => config.component,
  };
});

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../lib/api", () => ({
  request: vi.fn(),
  api: {
    timetable: {
      getSectionSchedule: vi.fn(),
      getTeacherScheduleAdmin: vi.fn(),
      getMySchedule: vi.fn(),
      getTodaySchedule: vi.fn(),
      createEntry: vi.fn(),
      updateEntry: vi.fn(),
      deleteEntry: vi.fn(),
      conductLecture: vi.fn(),
      cancelLecture: vi.fn(),
    },
  },
}));

describe("Timetable & Lecture Scheduling Page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("teacher views assigned teaching schedule and can conduct today's lecture", async () => {
    useAuth.mockReturnValue({ role: "teacher", user: { id: "T-101", name: "Dr. Rajesh Gupta" } });

    api.timetable.getTodaySchedule.mockResolvedValue({
      dayOfWeek: "Monday",
      date: "2026-11-23",
      lectures: [
        {
          entry_id: 101,
          offering_id: 1,
          course_code: "CST601",
          course_name: "Operating Systems",
          section_name: "Sec-T1",
          period_number: 1,
          start_time: "09:00:00",
          end_time: "09:50:00",
          room: "LH-201",
          attendance_status: "Scheduled",
          submitted_at: null,
        },
      ],
    });

    api.timetable.getMySchedule.mockResolvedValue([
      {
        entry_id: 101,
        offering_id: 1,
        course_code: "CST601",
        course_name: "Operating Systems",
        section_name: "Sec-T1",
        day_of_week: "Monday",
        period_number: 1,
        start_time: "09:00:00",
        end_time: "09:50:00",
        room: "LH-201",
      },
    ]);

    api.timetable.conductLecture.mockResolvedValue({
      sessionId: 501,
      offeringId: 1,
      courseCode: "CST601",
      periodNumber: 1,
      date: "2026-11-23",
      submittedAt: "",
      status: "Scheduled",
    });

    render(<TimetablePage />);

    expect(await screen.findByText(/Faculty Teaching Schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/Today's Lectures/i)).toBeInTheDocument();
    expect(screen.getAllByText(/CST601: Operating Systems/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText("LH-201").length).toBeGreaterThan(0);

    const conductBtn = screen.getByRole("button", { name: /Conduct/i });
    expect(conductBtn).toBeInTheDocument();

    fireEvent.click(conductBtn);

    await waitFor(() => {
      expect(api.timetable.conductLecture).toHaveBeenCalledWith(101);
      expect(mockNavigate).toHaveBeenCalledWith({
        to: "/attendance",
        search: { offeringId: 1, date: "2026-11-23", sessionId: 501 },
      });
    });
  });

  it("student views personalized weekly class timetable", async () => {
    useAuth.mockReturnValue({ role: "student", user: { id: "24CSE7777", name: "Pooja Sharma" } });

    api.timetable.getTodaySchedule.mockResolvedValue({
      dayOfWeek: "Monday",
      date: "2026-11-23",
      lectures: [
        {
          entry_id: 101,
          offering_id: 1,
          course_code: "CST601",
          course_name: "Operating Systems",
          section_name: "Sec-T1",
          teacher_name: "Dr. Rajesh Gupta",
          period_number: 1,
          start_time: "09:00:00",
          end_time: "09:50:00",
          room: "LH-201",
          attendance_status: "Scheduled",
        },
      ],
    });

    api.timetable.getMySchedule.mockResolvedValue([
      {
        entry_id: 101,
        offering_id: 1,
        course_code: "CST601",
        course_name: "Operating Systems",
        section_name: "Sec-T1",
        teacher_name: "Dr. Rajesh Gupta",
        day_of_week: "Monday",
        period_number: 1,
        start_time: "09:00:00",
        end_time: "09:50:00",
        room: "LH-201",
      },
    ]);

    render(<TimetablePage />);

    expect(await screen.findByText(/My Class Timetable/i)).toBeInTheDocument();
    expect(screen.getByText(/Weekly Master Timetable/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText(/Operating Systems/i).length).toBeGreaterThan(0);
    });
    // Student should not see Conduct button
    expect(screen.queryByRole("button", { name: /Conduct/i })).not.toBeInTheDocument();
  });

  it("admin can open modal and schedule a recurring timetable slot", async () => {
    useAuth.mockReturnValue({ role: "admin", user: { id: "admin", name: "Campus Administrator" } });

    request.mockImplementation((path) => {
      if (path === "/academic/catalog") {
        return Promise.resolve({
          departments: [{ id: 1, name: "CSE" }],
          terms: [{ id: 1, name: "Odd 2026" }],
          sections: [{ id: 1, name: "Sec-T1", department: "CSE", semester: 3, term: "Odd 2026" }],
          teachers: [{ teacher_id: "faculty_tt1", name: "Dr. Rajesh Gupta" }],
        });
      }
      if (path === "/academic/offerings") {
        return Promise.resolve([
          { id: 1, section_id: 1, section_name: "Sec-T1", code: "CST601", course_name: "Operating Systems", teacher_id: "faculty_tt1" },
        ]);
      }
      return Promise.resolve([]);
    });

    api.timetable.getSectionSchedule.mockResolvedValue([]);
    api.timetable.createEntry.mockResolvedValue({ id: 105, message: "Created" });

    render(<TimetablePage />);

    expect(await screen.findByText(/Timetable & Lecture Scheduling Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule Lecture Slot/i)).toBeInTheDocument();

    // Click Schedule Lecture Slot
    fireEvent.click(screen.getByText(/Schedule Lecture Slot/i));

    expect(screen.getByText(/Schedule Recurring Lecture Slot/i)).toBeInTheDocument();

    // Select offering
    const offeringSelect = screen.getByLabelText(/Course Offering/i);
    fireEvent.change(offeringSelect, { target: { value: "1" } });

    // Submit form
    const saveBtn = screen.getByRole("button", { name: /Save Lecture Slot/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.timetable.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          offeringId: 1,
          dayOfWeek: "Monday",
          periodNumber: 1,
          startTime: "09:00",
          endTime: "09:50",
        })
      );
    });
  });
});
