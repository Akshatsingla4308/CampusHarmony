import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../lib/api";

describe("Centralized API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches students with correct endpoint and headers", async () => {
    const mockStudents = [{ id: 1, roll: "CS-2101", name: "Rahul Sharma" }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => mockStudents,
    });

    const result = await api.students.getAll();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/students"),
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
    expect(result).toEqual(mockStudents);
  });

  it("throws ApiError when server returns 500 error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      headers: { get: () => "application/json" },
      json: async () => ({ message: "Database trigger constraint failed" }),
    });

    await expect(api.students.getById(99)).rejects.toThrow("Database trigger constraint failed");
  });

  it("invokes dbms defaulters procedure with custom threshold", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => [{ "Roll Number": "CS-2117", "Current Attendance": 41.0 }],
    });

    const res = await api.dbms.getDefaulters(80.0);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/dbms/defaulters?threshold=80"),
      expect.anything()
    );
    expect(res).toHaveLength(1);
  });
});
