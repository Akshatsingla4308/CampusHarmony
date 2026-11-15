import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Plus,
  UserCheck,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import { api } from "../lib/api";
import DataTable from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";

export const Route = createFileRoute("/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const [activeTab, setActiveTab] = useState("summaries"); // "summaries" | "sessions"
  const [summaries, setSummaries] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Session Creation Modal
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    courseCode: "CS501",
    academicPeriodId: 1,
    sessionDate: new Date().toISOString().split("T")[0],
    slotNumber: 1,
    topic: "Introduction to Relational Integrity",
    facultyTeacherId: 1,
  });

  // Batch Marking Modal
  const [markingSession, setMarkingSession] = useState(null);
  const [markingRecords, setMarkingRecords] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, sesRes, stuRes, crsRes] = await Promise.allSettled([
        api.attendance.getAllSummaries(),
        api.attendance.getSessions(),
        api.students.getAll(),
        api.courses.getAll(),
      ]);

      const sumList = sumRes.status === "fulfilled" && Array.isArray(sumRes.value) ? sumRes.value : [];
      const sesList = sesRes.status === "fulfilled" && Array.isArray(sesRes.value) ? sesRes.value : [];
      const stuList = stuRes.status === "fulfilled" && Array.isArray(stuRes.value) ? stuRes.value : [];
      const crsList = crsRes.status === "fulfilled" && Array.isArray(crsRes.value) ? crsRes.value : [];

      setSummaries(sumList);
      setSessions(sesList);
      setStudents(stuList);
      setCourses(crsList);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      const created = await api.attendance.createSession(sessionForm);
      setSuccessMsg(`Session for ${sessionForm.courseCode} on ${sessionForm.sessionDate} scheduled successfully.`);
      setIsSessionModalOpen(false);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  const openMarkingModal = async (session) => {
    setMarkingSession(session);
    // Initialize roster of students for this session
    const records = students.map((s, idx) => ({
      studentId: s.id,
      roll: s.roll,
      name: s.name,
      enrollmentId: idx + 1, // simulated enrollment id
      status: "Present",
      remarks: "Lecture attendance",
    }));
    setMarkingRecords(records);
  };

  const handleToggleStatus = (studentId) => {
    setMarkingRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status: r.status === "Present" ? "Absent" : "Present" } : r))
    );
  };

  const handleSubmitBatchRecords = async () => {
    if (!markingSession) return;
    setError(null);
    setSuccessMsg(null);
    try {
      const payload = {
        sessionId: markingSession.id,
        courseCode: markingSession.courseCode,
        academicPeriodId: markingSession.academicPeriodId,
        records: markingRecords.map((r) => ({
          studentId: r.studentId,
          enrollmentId: r.enrollmentId,
          status: r.status,
          remarks: r.remarks,
        })),
      };

      await api.attendance.submitSessionRecords(markingSession.id, payload);
      setSuccessMsg(`Logged attendance for ${markingRecords.length} students in session #${markingSession.id}.`);
      setMarkingSession(null);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  const handleQuickMark = async (studentId, isPresent) => {
    setError(null);
    try {
      const summary = summaries.find((s) => s.studentId === studentId);
      if (!summary) return;

      const newTotal = (summary.totalDays || 0) + 1;
      const newPresent = (summary.presentDays || 0) + (isPresent ? 1 : 0);
      const newAbsent = (summary.absentDays || 0) + (isPresent ? 0 : 1);

      await api.attendance.updateSummary(studentId, {
        studentId,
        totalDays: newTotal,
        presentDays: newPresent,
        absentDays: newAbsent,
        lastMarked: new Date().toISOString().split("T")[0],
      });

      setSuccessMsg(`Attendance updated for student #${studentId}.`);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  const handleReconcile = async (studentId) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.dbms.reconcileStudentCache(studentId);
      setSuccessMsg(`Reconciled summary cache for student #${studentId}: ${JSON.stringify(res)}`);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm("Are you sure you want to reset all attendance counters to 0?")) return;
    setError(null);
    try {
      await api.attendance.resetAll();
      setSuccessMsg("All attendance records reset to 0.");
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  // Merge students info into summaries for display
  const enrichedSummaries = summaries.map((s) => {
    const student = students.find((st) => st.id === s.studentId);
    const pct = s.totalDays > 0 ? Math.round((s.presentDays / s.totalDays) * 100) : 0;
    return {
      ...s,
      roll: s.roll || student?.roll || `STU-${s.studentId}`,
      name: s.name || student?.name || "Student",
      department: s.department || student?.department || "CSE",
      pct,
    };
  });

  const summaryColumns = [
    {
      header: "Roll No",
      key: "roll",
      sortable: true,
      className: "w-28 font-mono font-bold text-foreground",
    },
    {
      header: "Student Name",
      key: "name",
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-semibold text-foreground">{val}</div>
          <div className="text-xs text-muted-foreground">{row.department}</div>
        </div>
      ),
    },
    {
      header: "Total Days",
      key: "totalDays",
      sortable: true,
      className: "w-24 text-center font-mono font-medium",
    },
    {
      header: "Present",
      key: "presentDays",
      sortable: true,
      className: "w-24 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400",
    },
    {
      header: "Absent",
      key: "absentDays",
      sortable: true,
      className: "w-24 text-center font-mono font-bold text-rose-600 dark:text-rose-400",
    },
    {
      header: "Percentage",
      key: "pct",
      sortable: true,
      render: (val) => {
        const isDefaulter = val < 75;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${isDefaulter ? "bg-rose-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(val, 100)}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${isDefaulter ? "text-rose-600" : "text-emerald-600"}`}>
              {val}%
            </span>
          </div>
        );
      },
    },
    {
      header: "Last Marked",
      key: "lastMarked",
      sortable: true,
      render: (val) => <span className="text-xs text-muted-foreground font-mono">{val || "—"}</span>,
    },
    {
      header: "Quick Actions",
      key: "studentId",
      className: "text-right",
      render: (val) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleQuickMark(val, true)}
            className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 transition-colors"
            title="Mark Present"
          >
            + Present
          </button>
          <button
            onClick={() => handleQuickMark(val, false)}
            className="px-2 py-1 text-[11px] font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 transition-colors"
            title="Mark Absent"
          >
            + Absent
          </button>
          <button
            onClick={() => handleReconcile(val)}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
            title="Reconcile with DB Records (sp_reconcile_attendance_cache)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const sessionColumns = [
    {
      header: "Session ID",
      key: "id",
      sortable: true,
      className: "w-24 font-mono text-xs",
    },
    {
      header: "Course Code",
      key: "courseCode",
      sortable: true,
      className: "w-28 font-mono font-bold text-foreground",
    },
    {
      header: "Session Date",
      key: "sessionDate",
      sortable: true,
      render: (val) => <span className="font-semibold text-foreground">{val}</span>,
    },
    {
      header: "Slot",
      key: "slotNumber",
      sortable: true,
      className: "w-20 text-center",
      render: (val) => <span className="px-2 py-0.5 rounded bg-muted text-xs">Slot {val || 1}</span>,
    },
    {
      header: "Lecture Topic",
      key: "topic",
      sortable: true,
      render: (val) => <span className="text-xs text-foreground font-medium">{val || "Scheduled Class"}</span>,
    },
    {
      header: "Actions",
      key: "id",
      className: "text-right",
      render: (val, row) => (
        <button
          onClick={() => openMarkingModal(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
        >
          <UserCheck className="w-3.5 h-3.5" />
          Mark Attendance
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Lecture Attendance & Summaries</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage lecture sessions, batch attendance marking, and 1:1 synchronized student attendance caches
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "sessions" ? (
            <button
              onClick={() => setIsSessionModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Schedule Lecture Session
            </button>
          ) : (
            <button
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("summaries")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "summaries"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Attendance Summaries Cache ({enrichedSummaries.length})
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "sessions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Dated Lecture Sessions ({sessions.length})
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && <ErrorMessage error={error} onRetry={loadData} />}

      {activeTab === "summaries" ? (
        <DataTable
          columns={summaryColumns}
          data={enrichedSummaries}
          keyField="studentId"
          searchPlaceholder="Search attendance by student name, roll, or department..."
          searchFields={["roll", "name", "department"]}
          loading={loading}
          emptyMessage="No attendance summaries found."
        />
      ) : (
        <DataTable
          columns={sessionColumns}
          data={sessions}
          keyField="id"
          searchPlaceholder="Search sessions by course code, date, or topic..."
          searchFields={["courseCode", "sessionDate", "topic"]}
          loading={loading}
          emptyMessage="No lecture sessions scheduled."
        />
      )}

      {/* Schedule Lecture Session Modal */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground rounded-2xl border border-border max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold">Schedule Lecture Session</h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-5">
              Create an official dated attendance session entity in MySQL.
            </p>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Course Code *</label>
                  <select
                    value={sessionForm.courseCode}
                    onChange={(e) => setSessionForm({ ...sessionForm, courseCode: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background font-mono"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Date *</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.sessionDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Slot / Period</label>
                  <select
                    value={sessionForm.slotNumber}
                    onChange={(e) => setSessionForm({ ...sessionForm, slotNumber: parseInt(e.target.value, 10) })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  >
                    {[1, 2, 3, 4, 5, 6].map((slot) => (
                      <option key={slot} value={slot}>
                        Period {slot}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Academic Period</label>
                  <select
                    value={sessionForm.academicPeriodId}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, academicPeriodId: parseInt(e.target.value, 10) })
                    }
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  >
                    <option value={1}>Odd 2026 (Sem 5)</option>
                    <option value={2}>Even 2026 (Sem 6)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Lecture Topic *</label>
                <input
                  type="text"
                  required
                  value={sessionForm.topic}
                  onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  placeholder="e.g. Relational Integrity & BCNF Normalization"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-input hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Attendance Marking Drawer / Modal */}
      {markingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground rounded-2xl border border-border max-w-2xl w-full p-6 shadow-xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold">
                  Mark Attendance: {markingSession.courseCode} — {markingSession.sessionDate}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Topic: {markingSession.topic || "Scheduled Class"} (Slot {markingSession.slotNumber || 1})
                </p>
              </div>
              <button
                onClick={() => setMarkingSession(null)}
                className="text-muted-foreground hover:text-foreground p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              <div className="text-xs text-muted-foreground mb-3 flex items-center justify-between">
                <span>Click status pill to toggle Present / Absent for each enrolled student:</span>
                <span className="font-semibold text-foreground">
                  Present: {markingRecords.filter((r) => r.status === "Present").length} | Absent:{" "}
                  {markingRecords.filter((r) => r.status === "Absent").length}
                </span>
              </div>

              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {markingRecords.map((rec) => (
                  <div key={rec.studentId} className="p-3 flex items-center justify-between hover:bg-muted/30">
                    <div>
                      <div className="font-bold text-xs font-mono text-foreground">{rec.roll}</div>
                      <div className="text-xs text-foreground font-medium">{rec.name}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(rec.studentId)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        rec.status === "Present"
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-rose-500 text-white shadow-xs"
                      }`}
                    >
                      {rec.status}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMarkingSession(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-input hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitBatchRecords}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                Submit Session Attendance ({markingRecords.length} Records)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
