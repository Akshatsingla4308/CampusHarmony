import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Users } from "lucide-react";
import MetricCard from "../components/common/MetricCard";

describe("MetricCard Component", () => {
  it("renders metric title, value, and subtitle", () => {
    render(
      <MetricCard
        title="Total Students"
        value={150}
        subtitle="Batch of 2025"
        icon={Users}
        trend="+12%"
      />
    );

    expect(screen.getByText("Total Students")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText(/Batch of 2025/)).toBeInTheDocument();
    expect(screen.getByText("+12%")).toBeInTheDocument();
  });

  it("handles null/undefined value gracefully with fallback dash", () => {
    render(<MetricCard title="Inactive Users" value={null} />);
    expect(screen.getByText("Inactive Users")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
