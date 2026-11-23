import React from "react";
import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { api } from "../lib/api";
import { AuthProvider, useAuth } from "../context/AuthContext";
vi.mock("../lib/api", () => ({ api: { auth: { me: vi.fn(), login: vi.fn(), logout: vi.fn() } } }));
function Consumer() {
  const { user, loading, error, login, logout } = useAuth();
  return (
    <>
      <span>{loading ? "Checking" : (user?.name ?? "Guest")}</span>
      <span>{error}</span>
      <button onClick={() => login("test", "fixture")}>Login</button>
      <button onClick={logout}>Logout</button>
    </>
  );
}
function start() {
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
}
describe("Server-backed sessions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });
  it("ignores a stored demo identity", async () => {
    localStorage.setItem("sms.session", JSON.stringify({ role: "teacher" }));
    api.auth.me.mockRejectedValue({ status: 401 });
    start();
    expect(await screen.findByText("Guest")).toBeInTheDocument();
  });
  it("keeps a rejected login signed out", async () => {
    api.auth.me.mockRejectedValue({ status: 401 });
    api.auth.login.mockRejectedValue(new Error("Invalid credentials"));
    start();
    await screen.findByText("Guest");
    fireEvent.click(screen.getByText("Login"));
    await screen.findByText("Invalid credentials");
    expect(screen.getByText("Guest")).toBeInTheDocument();
  });
  it("restores a backend identity and logs out", async () => {
    api.auth.me.mockResolvedValue({ name: "Verified user", role: "teacher" });
    api.auth.logout.mockResolvedValue(null);
    start();
    await screen.findByText("Verified user");
    fireEvent.click(screen.getByText("Logout"));
    await waitFor(() => expect(screen.getByText("Guest")).toBeInTheDocument());
    expect(api.auth.logout).toHaveBeenCalledOnce();
  });
});
