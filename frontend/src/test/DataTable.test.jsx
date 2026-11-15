import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DataTable from "../components/common/DataTable";

describe("DataTable Component", () => {
  const sampleColumns = [
    { header: "Roll", key: "roll", sortable: true },
    { header: "Name", key: "name", sortable: true },
    { header: "Department", key: "dept" },
  ];

  const sampleData = [
    { id: 1, roll: "CS-101", name: "Rahul Sharma", dept: "CSE" },
    { id: 2, roll: "CS-102", name: "Ananya Iyer", dept: "CSE" },
    { id: 3, roll: "ME-103", name: "Arjun Nair", dept: "ME" },
  ];

  it("renders table headers and row records", () => {
    render(<DataTable columns={sampleColumns} data={sampleData} keyField="id" />);
    expect(screen.getByText("Roll")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Rahul Sharma")).toBeInTheDocument();
    expect(screen.getByText("Ananya Iyer")).toBeInTheDocument();
    expect(screen.getByText("Arjun Nair")).toBeInTheDocument();
  });

  it("filters rows dynamically based on search input", () => {
    render(
      <DataTable
        columns={sampleColumns}
        data={sampleData}
        keyField="id"
        searchFields={["roll", "name", "dept"]}
      />
    );

    const input = screen.getByPlaceholderText("Search records...");
    fireEvent.change(input, { target: { value: "Ananya" } });

    expect(screen.getByText("Ananya Iyer")).toBeInTheDocument();
    expect(screen.queryByText("Rahul Sharma")).not.toBeInTheDocument();
    expect(screen.queryByText("Arjun Nair")).not.toBeInTheDocument();
  });

  it("displays empty state message when data is empty", () => {
    render(<DataTable columns={sampleColumns} data={[]} keyField="id" emptyMessage="Custom empty prompt" />);
    expect(screen.getByText("Custom empty prompt")).toBeInTheDocument();
  });
});
