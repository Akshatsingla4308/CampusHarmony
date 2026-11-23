import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import {
  Database,
  Play,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Layers,
  Code2,
  Table,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { api } from "../lib/api";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";

export const Route = createFileRoute("/dbms-demo")({
  component: DbmsDemoPage,
});

function DbmsDemoPage() {
  const [activeTab, setActiveTab] = useState("sp-cursor"); // "sp-cursor" | "transactions" | "reconciliation" | "triggers" | "functions"
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // 1. Defaulters Procedure
  const [threshold, setThreshold] = useState(75.0);
  const runDefaulterProcedure = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.dbms.getDefaulters(threshold);
      setResult({
        title: "Stored Procedure with Cursor Executed Successfully",
        command: `CALL sp_generate_attendance_defaulter_report(${threshold});`,
        output: data,
        note: "Processed via MySQL explicit cursor 'cur_defaulters' with continuous shortfall math.",
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Transaction Commit / Rollback
  const runTransactionDemo = async (simulateError) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.dbms.executeTransactionDemo(simulateError);
      setResult({
        title: simulateError
          ? "ACID Transaction Exception: Explicit ROLLBACK Executed"
          : "ACID Transaction: Multi-Table COMMIT Executed",
        command: `CALL sp_batch_enroll_student_with_transaction(..., p_simulate_error => ${simulateError});`,
        output: data,
        note: simulateError
          ? "Trapped by DECLARE EXIT HANDLER FOR SQLEXCEPTION -> Guaranteed ROLLBACK."
          : "Inserted into `students` and `attendance` within single transaction boundary -> COMMIT.",
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Cache Reconciliation
  const [studentIdToReconcile, setStudentIdToReconcile] = useState(1);
  const runSingleReconciliation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.dbms.reconcileStudentCache(studentIdToReconcile);
      setResult({
        title: `Summary Cache Reconciled for Student #${studentIdToReconcile}`,
        command: `CALL sp_reconcile_attendance_cache(${studentIdToReconcile}, @out_status);`,
        output: data,
        note: "Synchronized denormalized `attendance` table against dated `attendance_records`.",
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const runAllReconciliation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.dbms.reconcileAllCaches();
      setResult({
        title: "Institution-Wide Cache Reconciliation Completed",
        command: `CALL sp_reconcile_all_attendance_caches(@out_total);`,
        output: data,
        note: "Scanned `v_attendance_cache_discrepancy` and repaired all out-of-sync student records.",
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const checkDiscrepancies = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.dbms.getCacheDiscrepancies();
      setResult({
        title: "Discrepancy View Diagnostic (`v_attendance_cache_discrepancy`)",
        command: `SELECT * FROM v_attendance_cache_discrepancy;`,
        output: data,
        note: "Compares cached (present_days, absent_days) vs COUNT(*) from `attendance_records`.",
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
          <Database className="w-3.5 h-3.5" />
          <span>DBMS Project Evaluation (24CSE0209) — 50 Marks</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight">Database Programmability & Integrity Demonstration</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Execute MySQL 8.0 Stored Procedures, Functions, Triggers, Views, and ACID Transactions live from the browser
        </p>
      </div>

      {/* Demonstration Navigation Tabs */}
      <div className="flex flex-wrap border-b border-border gap-2">
        {[
          { id: "sp-cursor", label: "1. Stored Procedure & Cursor" },
          { id: "transactions", label: "2. ACID Multi-Table Transaction" },
          { id: "reconciliation", label: "3. Cache Self-Healing & Views" },
          { id: "triggers", label: "4. Trigger Integrity Inventory" },
          { id: "functions", label: "5. Stored Functions" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setResult(null);
              setError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: SP & Cursor */}
      {activeTab === "sp-cursor" && (
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold">Stored Procedure with Explicit Cursor (`sp_generate_attendance_defaulter_report`)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Iterates through student attendance caches using <code className="font-mono">DECLARE cur_defaulters CURSOR FOR ...</code>,
              computes consecutive shortfall lectures mathematically, and logs immutable historical snapshots in <code className="font-mono">defaulter_audit_log</code>.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">Attendance Threshold (%):</span>
              <input
                type="number"
                min="50"
                max="90"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-20 px-3 py-1.5 text-xs rounded-lg border border-input bg-background font-mono text-center"
              />
            </div>
            <button
              onClick={runDefaulterProcedure}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              Execute Cursor Procedure
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: ACID Transactions */}
      {activeTab === "transactions" && (
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold">ACID Multi-Table Transaction with Guaranteed Rollback</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Demonstrates atomic student enrollment: inserts into <code className="font-mono">students</code> and initializes <code className="font-mono">attendance</code> inside a single database transaction.
              Traps errors with <code className="font-mono">DECLARE EXIT HANDLER FOR SQLEXCEPTION</code> and issues an explicit <code className="font-mono">ROLLBACK</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => runTransactionDemo(false)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Execute Clean Transaction (COMMIT)
            </button>

            <button
              onClick={() => runTransactionDemo(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-xs disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Simulate Failure (ROLLBACK)
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Reconciliation & Views */}
      {activeTab === "reconciliation" && (
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold">Cache Self-Healing Procedures & Analytical Views</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Examines discrepancies between dated <code className="font-mono">attendance_records</code> and summary cache <code className="font-mono">attendance</code>, and invokes self-healing reconciliation procedures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={checkDiscrepancies}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-input bg-card hover:bg-muted text-foreground transition-all shadow-xs"
            >
              <Table className="w-3.5 h-3.5 text-primary" />
              Query `v_attendance_cache_discrepancy`
            </button>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={studentIdToReconcile}
                onChange={(e) => setStudentIdToReconcile(parseInt(e.target.value, 10))}
                className="w-16 px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background font-mono text-center"
                placeholder="ID"
              />
              <button
                onClick={runSingleReconciliation}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reconcile Single Student
              </button>
            </div>

            <button
              onClick={runAllReconciliation}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              Batch Reconcile All Students
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Trigger Inventory */}
      {activeTab === "triggers" && (
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold">15 Relational Row-Level Triggers Active in MySQL</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Enforcing full DML cache sync, enrollment status gating, historical retention, and marks validation:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {[
              { name: "trg_attendance_records_after_insert", role: "AFTER INSERT sync to summary table" },
              { name: "trg_attendance_records_after_update", role: "AFTER UPDATE status change counter balance" },
              { name: "trg_attendance_records_after_delete", role: "AFTER DELETE status counter decrement" },
              { name: "trg_check_enrollment_before_attendance_insert", role: "Blocks marking attendance for Dropped/Completed courses" },
              { name: "trg_check_enrollment_before_attendance_update", role: "Prohibits altering attendance for completed courses" },
              { name: "trg_prevent_drop_with_attendance", role: "Blocks dropping a course if attendance is already logged" },
              { name: "trg_prevent_completed_modification", role: "Guarantees terminal immutability for Completed registrations" },
              { name: "trg_prevent_dropped_reactivation", role: "Blocks reactivating dropped courses" },
              { name: "trg_prevent_student_delete_with_attendance", role: "Blocks casual student deletion if attendance exists (Retention policy)" },
              { name: "trg_defaulter_audit_prevent_update", role: "Immutable audit ledger: blocks UPDATE" },
              { name: "trg_defaulter_audit_prevent_delete", role: "Immutable audit ledger: blocks DELETE" },
              { name: "trg_validate_marks_insert", role: "Enforces 0 <= marks <= max_marks and exam types" },
              { name: "trg_validate_marks_update", role: "Enforces marks bounds on update" },
              { name: "trg_sync_student_dept_from_fk", role: "Auto-populates legacy department cache string" },
              { name: "trg_sync_course_faculty_from_fk", role: "Auto-populates legacy faculty cache string" },
            ].map((t) => (
              <div key={t.name} className="p-3 rounded-xl border border-border bg-muted/20 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-mono font-bold text-foreground">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Functions */}
      {activeTab === "functions" && (
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold">3 Deterministic MySQL Stored Functions</h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl border border-border bg-muted/20">
              <span className="font-mono font-bold text-foreground">fn_calculate_grade(p_marks_obtained, p_max_marks)</span>
              <p className="text-muted-foreground text-[11px] mt-1">
                Grade thresholds are A+ (≥90%), A (≥80%), B (≥70%), C (≥60%), D (≥50%) and F (&lt;50%).
                Includes bounds checking for negative numbers and zero division.
              </p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-muted/20">
              <span className="font-mono font-bold text-foreground">fn_get_student_average(p_student_id)</span>
              <p className="text-muted-foreground text-[11px] mt-1">
                Aggregates and returns the arithmetic mean score across all normalized examination marks.
              </p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-muted/20">
              <span className="font-mono font-bold text-foreground">fn_get_attendance_percentage(p_student_id)</span>
              <p className="text-muted-foreground text-[11px] mt-1">
                Returns real-time percentage (present_days / total_days) * 100 with division protection.
              </p>
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingState message="Executing database transaction on MySQL localhost:3306..." />}
      {error && <ErrorMessage error={error} />}

      {/* Result Output Display Terminal */}
      {result && (
        <div className="bg-slate-950 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-200">{result.title}</span>
            </div>
            <span className="text-[10px] text-slate-500">MySQL InnoDB Engine</span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-emerald-400">
            <span className="text-slate-500">$ </span>
            {result.command}
          </div>

          {result.note && <div className="text-slate-400 text-[11px] italic"># {result.note}</div>}

          <div className="max-h-80 overflow-y-auto pt-2">
            <pre className="text-[11px] text-slate-300 whitespace-pre-wrap">
              {JSON.stringify(result.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
