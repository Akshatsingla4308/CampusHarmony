import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { AlertTriangle, Sliders, RefreshCw, Calculator, FileCheck, ShieldAlert } from "lucide-react";
import { api } from "../lib/api";
import DataTable from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";

export const Route = createFileRoute("/defaulters")({
  component: DefaultersPage,
});

function DefaultersPage() {
  const [threshold, setThreshold] = useState(75.0);
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDefaulterReport = async (tVal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.dbms.getDefaulters(tVal || threshold);
      setDefaulters(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefaulterReport(threshold);
  }, []);

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setThreshold(val);
  };

  const handleApplyThreshold = () => {
    loadDefaulterReport(threshold);
  };

  const columns = [
    {
      header: "Roll No",
      key: "Roll Number",
      sortable: true,
      className: "w-28 font-mono font-bold text-foreground",
    },
    {
      header: "Student Name",
      key: "Student Name",
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-semibold text-foreground">{val}</div>
          <div className="text-xs text-muted-foreground">{row.Department}</div>
        </div>
      ),
    },
    {
      header: "Current Attendance",
      key: "Current Attendance",
      sortable: true,
      className: "w-32",
      render: (val) => {
        const pct = parseFloat(val) || 0;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">{pct}%</span>
            <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
              <div className="bg-rose-500 h-full" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      header: "Classes Needed",
      key: "Consecutive Classes Needed for 75%",
      sortable: true,
      className: "w-36 text-center",
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          +{val || 0} Lectures
        </span>
      ),
    },
    {
      header: "Reported Date",
      key: "Reported Date",
      sortable: true,
      render: (val) => <span className="text-xs text-muted-foreground font-mono">{val || "Live Run"}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Attendance Defaulter Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time low-attendance report executed via stored procedure <code className="font-mono">sp_generate_attendance_defaulter_report</code>
          </p>
        </div>
        <button
          onClick={handleApplyThreshold}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-run DB Cursor
        </button>
      </div>

      {/* Threshold Controller Card */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">Defaulter Cutoff Threshold</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Adjust minimum attendance benchmark required for university examination eligibility.
            </p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <input
              type="range"
              min="50"
              max="90"
              step="5"
              value={threshold}
              onChange={handleSliderChange}
              onMouseUp={handleApplyThreshold}
              className="w-48 accent-primary cursor-pointer"
            />
            <div className="px-3 py-1 rounded-lg border border-border bg-muted font-mono font-bold text-sm text-foreground">
              {threshold.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Shortfall Math Formula Box for Evaluators */}
        <div className="mt-4 pt-4 border-t border-border flex items-start gap-3 bg-muted/20 p-3 rounded-xl text-xs">
          <Calculator className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-foreground">
              Mathematical Defaulter Shortfall Algorithm (MySQL Cursor Implementation):
            </span>
            <p className="text-muted-foreground font-mono text-[11px]">
              Classes Needed = CEIL( ( (threshold * total_days) - (100 * present_days) ) / (100 - threshold) )
            </p>
          </div>
        </div>
      </div>

      {error && <ErrorMessage error={error} onRetry={handleApplyThreshold} />}

      <DataTable
        columns={columns}
        data={defaulters}
        keyField="Roll Number"
        searchPlaceholder="Filter defaulters by roll number, name, or department..."
        searchFields={["Roll Number", "Student Name", "Department"]}
        loading={loading}
        emptyMessage={`No students found with attendance below ${threshold}%.`}
      />
    </div>
  );
}
