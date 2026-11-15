import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "../components/common/StatusBadge";

describe("StatusBadge Component", () => {
  it("renders active status with emerald classes", () => {
    const { container } = render(<StatusBadge status="Active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("text-emerald-700");
  });

  it("renders probation status with rose classes", () => {
    const { container } = render(<StatusBadge status="Probation" />);
    expect(screen.getByText("Probation")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("text-rose-700");
  });

  it("renders dropped status with amber classes", () => {
    const { container } = render(<StatusBadge status="Dropped" />);
    expect(screen.getByText("Dropped")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("text-amber-700");
  });

  it("renders completed status with blue classes", () => {
    const { container } = render(<StatusBadge status="Completed" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("text-blue-700");
  });
});
