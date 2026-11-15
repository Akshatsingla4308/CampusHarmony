import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";

function TestConsumer() {
  const { user, role, switchRole, logout } = useAuth();
  return (
    <div>
      <span data-testid="user-name">{user?.name}</span>
      <span data-testid="user-role">{role}</span>
      <button onClick={() => switchRole("student")}>Switch to Student</button>
      <button onClick={() => switchRole("teacher")}>Switch to Teacher</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("provides default faculty demo session for instant evaluator access", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("user-name")).toHaveTextContent("Dr. Sudha Rao");
    expect(screen.getByTestId("user-role")).toHaveTextContent("teacher");
  });

  it("switches personas between faculty and student seamlessly", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("Switch to Student"));
    expect(screen.getByTestId("user-name")).toHaveTextContent("Rahul Sharma");
    expect(screen.getByTestId("user-role")).toHaveTextContent("student");

    fireEvent.click(screen.getByText("Switch to Teacher"));
    expect(screen.getByTestId("user-name")).toHaveTextContent("Dr. Sudha Rao");
    expect(screen.getByTestId("user-role")).toHaveTextContent("teacher");
  });

  it("handles logout properly and resets role to guest", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("Logout"));
    expect(screen.getByTestId("user-role")).toHaveTextContent("guest");
  });
});
