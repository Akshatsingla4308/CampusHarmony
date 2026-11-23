import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  Sliders,
  RefreshCw,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  BookOpen,
  User,
  Layers,
  Building2,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { api, request } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";

export const Route = createFileRoute("/defaulters")({
  component: AttendanceAnalyticsPage,
});

export function AttendanceAnalyticsPage() {
  const { user, role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Threshold State
  const [threshold, setThreshold] = useState(75.0);
  const [savingThreshold, setSavingThreshold] = useState(false);

  // Admin Data State
  const [adminOverview, setAdminOverview] = useState(null);
  const [catalog, setCatalog] = useState({ departments: [], terms: [], sections: [] });
  const [filterDept, setFilterDept] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [filterSec, setFilterSec] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminActiveTab, setAdminActiveTab] = useState("defaulters"); // "defaulters" | "departments" | "sections" | "courses"

  // Teacher Data State
  const [teacherData, setTeacherData] = useState(null);
  const [selectedOffering, setSelectedOffering] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherActiveTab, setTeacherActiveTab] = useState("roster"); // "roster" | "history"

  // Student Data State
  const [studentInsights, setStudentInsights] = useState(null);
  const [expandedHistory, setExpandedHistory] = useState({});

  useEffect(() => {
    loadData();
  }, [role, selectedOffering, filterDept, filterSem, filterSec]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load Threshold
      const thRes = await api.analytics.getThreshold();
      if (thRes && thRes.threshold) {
        setThreshold(thRes.threshold);
      }

      if (role === "admin") {
        // Load Catalog for filters
        const [cat, overview] = await Promise.all([
          request("/academic/catalog"),
          api.analytics.getAdminOverview({
            departmentId: filterDept ? Number(filterDept) : null,
            semester: filterSem ? Number(filterSem) : null,
            sectionId: filterSec ? Number(filterSec) : null,
          }),
        ]);
        setCatalog(cat);
        setAdminOverview(overview);
      } else if (role === "teacher") {
        const data = await api.analytics.getTeacherSummary({
          offeringId: selectedOffering ? Number(selectedOffering) : null,
        });
        setTeacherData(data);
        if (!selectedOffering && data.selectedOfferingId) {
          setSelectedOffering(String(data.selectedOfferingId));
        }
      } else if (role === "student") {
        const insights = await api.analytics.getStudentInsights();
        setStudentInsights(insights);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load attendance analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateThreshold = async () => {
    try {
      setSavingThreshold(true);
      await api.analytics.updateThreshold(threshold);
      setSuccessMsg(`Attendance defaulter threshold successfully updated to ${threshold}%!`);
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to update threshold");
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleExportAdminCsv = () => {
    const q = new URLSearchParams();
    if (filterDept) q.append("departmentId", filterDept);
    if (filterSem) q.append("semester", filterSem);
    if (filterSec) q.append("sectionId", filterSec);
    const url = `/api/academic/analytics/admin/export-csv${q.toString() ? "?" + q.toString() : ""}`;
    window.open(url, "_blank");
  };

  const handleExportTeacherCsv = () => {
    if (!selectedOffering) return;
    const url = `/api/academic/analytics/teacher/export-csv?offeringId=${selectedOffering}`;
    window.open(url, "_blank");
  };

  const toggleHistory = (courseCode) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [courseCode]: !prev[courseCode],
    }));
  };

  // Filtered lists
  const filteredAdminDefaulters = useMemo(() => {
    if (!adminOverview || !adminOverview.defaulters) return [];
    if (!adminSearch) return adminOverview.defaulters;
    const term = adminSearch.toLowerCase();
    return adminOverview.defaulters.filter(
      (d) =>
        d.roll.toLowerCase().includes(term) ||
        d.name.toLowerCase().includes(term) ||
        d.courseCode.toLowerCase().includes(term) ||
        d.department.toLowerCase().includes(term)
    );
  }, [adminOverview, adminSearch]);

  const filteredTeacherRoster = useMemo(() => {
    if (!teacherData || !teacherData.roster) return [];
    if (!teacherSearch) return teacherData.roster;
    const term = teacherSearch.toLowerCase();
    return teacherData.roster.filter(
      (r) =>
        r.roll.toLowerCase().includes(term) ||
        r.student_name.toLowerCase().includes(term) ||
        (r.student_email && r.student_email.toLowerCase().includes(term))
    );
  }, [teacherData, teacherSearch]);

  if (loading && !adminOverview && !teacherData && !studentInsights) {
    return <LoadingState message="Calculating live attendance analytics..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            {role === "admin"
              ? "Attendance Analytics & Institutional Defaulters"
              : role === "teacher"
              ? "Course Attendance Analytics & Defaulter Tracking"
              : "My Attendance Insights & Defaulter Projections"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {role === "admin"
              ? "Institutional attendance analytics, compliance benchmarks, department breakdowns & CSV reports"
              : role === "teacher"
              ? "Course-wise live attendance monitoring, shortfall metrics, roster compliance & CSV downloads"
              : "Subject-wise attendance tracking, threshold status & consecutive class recovery estimates"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-muted text-foreground transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          {role === "admin" && (
            <button
              onClick={handleExportAdminCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-primary" />
              Export Defaulters CSV
            </button>
          )}

          {role === "teacher" && (
            <button
              onClick={handleExportTeacherCsv}
              disabled={!selectedOffering}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-primary" />
              Export Course Roster CSV
            </button>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* CONFIGURABLE THRESHOLD WIDGET (ADMIN OR INFO BADGE) */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Defaulter Cutoff Benchmark</h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {threshold}% Minimum
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Students below this attendance benchmark in conducted lectures are categorized as defaulters.
              </p>
            </div>
          </div>

          {role === "admin" ? (
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-36 accent-primary"
              />
              <span className="text-xs font-bold font-mono w-12 text-center text-foreground">{threshold}%</span>
              <button
                onClick={handleUpdateThreshold}
                disabled={savingThreshold}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {savingThreshold ? "Updating..." : "Update Threshold"}
              </button>
            </div>
          ) : (
            <div className="text-xs font-medium text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-md border border-border">
              Institutional Policy: Mandatory <strong className="text-foreground">{threshold}%</strong> Attendance
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ADMINISTRATOR ATTENDANCE DASHBOARD                                    */}
      {/* ========================================================================= */}
      {role === "admin" && adminOverview && (
        <div className="space-y-6">
          {/* Institutional KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <div className="text-xs font-medium text-muted-foreground">Active Enrollments</div>
              <div className="text-2xl font-bold text-foreground mt-1">{adminOverview.overall.totalEnrollments}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Across {adminOverview.overall.totalStudents} distinct students
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <div className="text-xs font-medium text-muted-foreground">Conducted Lectures</div>
              <div className="text-2xl font-bold text-foreground mt-1">{adminOverview.overall.totalConductedLectures}</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Active verified sessions</div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <div className="text-xs font-medium text-muted-foreground">Institutional Attendance</div>
              <div className="text-2xl font-bold text-primary mt-1">{adminOverview.overall.averageAttendance}%</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Overall conducted average</div>
            </div>

            <div className="bg-card border border-red-500/30 bg-red-500/5 rounded-xl p-4 shadow-xs">
              <div className="text-xs font-medium text-red-600 dark:text-red-400">Total Defaulters</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{adminOverview.overall.defaultersCount}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {adminOverview.overall.defaulterRate}% institutional defaulter rate
              </div>
            </div>
          </div>

          {/* Admin Filters & Search */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Department:</label>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="text-xs rounded-md border border-input bg-background px-2.5 py-1.5 text-foreground"
                >
                  <option value="">All Departments</option>
                  {catalog.departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Semester:</label>
                <select
                  value={filterSem}
                  onChange={(e) => setFilterSem(e.target.value)}
                  className="text-xs rounded-md border border-input bg-background px-2.5 py-1.5 text-foreground"
                >
                  <option value="">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Section:</label>
                <select
                  value={filterSec}
                  onChange={(e) => setFilterSec(e.target.value)}
                  className="text-xs rounded-md border border-input bg-background px-2.5 py-1.5 text-foreground"
                >
                  <option value="">All Sections</option>
                  {catalog.sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search roll, student, course..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full text-xs rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-foreground"
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-border flex items-center gap-4">
            <button
              onClick={() => setAdminActiveTab("defaulters")}
              className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                adminActiveTab === "defaulters"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Defaulters Roster ({filteredAdminDefaulters.length})
            </button>
            <button
              onClick={() => setAdminActiveTab("departments")}
              className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                adminActiveTab === "departments"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Department Analytics
            </button>
            <button
              onClick={() => setAdminActiveTab("sections")}
              className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                adminActiveTab === "sections"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Section Analytics
            </button>
            <button
              onClick={() => setAdminActiveTab("courses")}
              className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                adminActiveTab === "courses"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Course Analytics
            </button>
          </div>

          {/* Tab 1: Defaulters Roster */}
          {adminActiveTab === "defaulters" && (
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="p-3 font-semibold text-foreground">Roll No</th>
                      <th className="p-3 font-semibold text-foreground">Student Name</th>
                      <th className="p-3 font-semibold text-foreground">Dept & Sec</th>
                      <th className="p-3 font-semibold text-foreground">Course</th>
                      <th className="p-3 font-semibold text-foreground text-center">Conducted</th>
                      <th className="p-3 font-semibold text-foreground text-center">Attended</th>
                      <th className="p-3 font-semibold text-foreground text-center">Missed</th>
                      <th className="p-3 font-semibold text-foreground text-center">Current %</th>
                      <th className="p-3 font-semibold text-foreground text-center">Shortfall Recovery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminDefaulters.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-muted-foreground italic">
                          No defaulters found matching current criteria. All active students meet the {threshold}% benchmark.
                        </td>
                      </tr>
                    ) : (
                      filteredAdminDefaulters.map((d) => (
                        <tr key={d.enrollmentId} className="border-b border-border/70 hover:bg-muted/20">
                          <td className="p-3 font-mono font-bold text-foreground">{d.roll}</td>
                          <td className="p-3 font-semibold text-foreground">{d.name}</td>
                          <td className="p-3 text-muted-foreground">
                            {d.department} • {d.section} (Sem {d.semester})
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-foreground">{d.courseCode}</span>: {d.courseName}
                          </td>
                          <td className="p-3 text-center font-mono">{d.conductedLectures}</td>
                          <td className="p-3 text-center font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {d.attendedLectures}
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-red-600 dark:text-red-400">
                            {d.missedLectures}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-red-600 dark:text-red-400">
                            {d.attendancePercentage}%
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              {d.classesNeededForThreshold === -1 ? "Unreachable (100% threshold)" : `+${d.classesNeededForThreshold} Lectures`}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Department Breakdown */}
          {adminActiveTab === "departments" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminOverview.departmentStats.map((dept) => (
                <div key={dept.department} className="bg-card border border-border rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{dept.department}</h3>
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Students Enrolled:</span>
                      <strong className="text-foreground">{dept.studentsCount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Attendance:</span>
                      <strong className="text-primary font-mono">{dept.avgAttendance}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Defaulters:</span>
                      <strong className="text-red-600 dark:text-red-400 font-mono">{dept.defaultersCount}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Section Breakdown */}
          {adminActiveTab === "sections" && (
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="p-3 font-semibold text-foreground">Section</th>
                    <th className="p-3 font-semibold text-foreground">Semester</th>
                    <th className="p-3 font-semibold text-foreground text-center">Students</th>
                    <th className="p-3 font-semibold text-foreground text-center">Average Attendance</th>
                    <th className="p-3 font-semibold text-foreground text-center">Defaulters</th>
                  </tr>
                </thead>
                <tbody>
                  {adminOverview.sectionStats.map((s) => (
                    <tr key={s.section} className="border-b border-border/70 hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">{s.section}</td>
                      <td className="p-3 text-muted-foreground">Semester {s.semester}</td>
                      <td className="p-3 text-center font-mono">{s.studentsCount}</td>
                      <td className="p-3 text-center font-mono font-bold text-primary">{s.avgAttendance}%</td>
                      <td className="p-3 text-center font-mono font-bold text-red-600 dark:text-red-400">{s.defaultersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 4: Course Breakdown */}
          {adminActiveTab === "courses" && (
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="p-3 font-semibold text-foreground">Code</th>
                    <th className="p-3 font-semibold text-foreground">Course Title</th>
                    <th className="p-3 font-semibold text-foreground text-center">Conducted</th>
                    <th className="p-3 font-semibold text-foreground text-center">Enrolled</th>
                    <th className="p-3 font-semibold text-foreground text-center">Average %</th>
                    <th className="p-3 font-semibold text-foreground text-center">Defaulters</th>
                  </tr>
                </thead>
                <tbody>
                  {adminOverview.courseStats.map((c) => (
                    <tr key={c.courseCode} className="border-b border-border/70 hover:bg-muted/20">
                      <td className="p-3 font-mono font-bold text-primary">{c.courseCode}</td>
                      <td className="p-3 font-semibold text-foreground">{c.courseName}</td>
                      <td className="p-3 text-center font-mono">{c.conductedLectures}</td>
                      <td className="p-3 text-center font-mono">{c.totalEnrollments}</td>
                      <td className="p-3 text-center font-mono font-bold text-primary">{c.avgAttendance}%</td>
                      <td className="p-3 text-center font-mono font-bold text-red-600 dark:text-red-400">{c.defaultersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TEACHER ATTENDANCE ANALYTICS                                          */}
      {/* ========================================================================= */}
      {role === "teacher" && teacherData && (
        <div className="space-y-6">
          {/* Offering Selector & Course KPIs */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-foreground">Course Offering:</label>
                  <select
                    value={selectedOffering}
                    onChange={(e) => setSelectedOffering(e.target.value)}
                    className="text-xs rounded-md border border-input bg-background px-3 py-1.5 text-foreground font-medium"
                  >
                    {teacherData.offerings.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.course_code}: {o.course_name} (Section {o.section_name})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedOffering && (
                  <div className="flex items-center gap-2">
                    <a
                      href={`/attendance?offeringId=${selectedOffering}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors"
                    >
                      <Clock className="w-3 h-3 text-primary" />
                      Mark Attendance
                    </a>
                    <a
                      href={`/marks?offeringId=${selectedOffering}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Enter Marks
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
                <div className="text-center px-3 py-1 rounded-md bg-muted/30">
                  <div className="text-[10px] text-muted-foreground uppercase">Enrolled</div>
                  <div className="text-base font-bold text-foreground">{teacherData.summary.totalEnrolled}</div>
                </div>
                <div className="text-center px-3 py-1 rounded-md bg-muted/30">
                  <div className="text-[10px] text-muted-foreground uppercase">Conducted</div>
                  <div className="text-base font-bold text-foreground">{teacherData.summary.conductedLectures}</div>
                </div>
                <div className="text-center px-3 py-1 rounded-md bg-muted/30">
                  <div className="text-[10px] text-muted-foreground uppercase">Class Avg</div>
                  <div className="text-base font-bold text-primary">{teacherData.summary.avgPercentage}%</div>
                </div>
                <div className="text-center px-3 py-1 rounded-md bg-red-500/10">
                  <div className="text-[10px] text-red-600 dark:text-red-400 uppercase">Defaulters</div>
                  <div className="text-base font-bold text-red-600 dark:text-red-400">{teacherData.summary.defaultersCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Sub-tabs */}
          <div className="border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTeacherActiveTab("roster")}
                className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                  teacherActiveTab === "roster"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Student Attendance Roster ({filteredTeacherRoster.length})
              </button>
              <button
                onClick={() => setTeacherActiveTab("history")}
                className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                  teacherActiveTab === "history"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Conducted Lecture Sessions ({teacherData.history.length})
              </button>
            </div>

            {teacherActiveTab === "roster" && (
              <div className="relative min-w-[200px] mb-2">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student or roll..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="w-full text-xs rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-foreground"
                />
              </div>
            )}
          </div>

          {/* Teacher Roster Tab */}
          {teacherActiveTab === "roster" && (
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="p-3 font-semibold text-foreground">Roll No</th>
                    <th className="p-3 font-semibold text-foreground">Student Name</th>
                    <th className="p-3 font-semibold text-foreground text-center">Conducted</th>
                    <th className="p-3 font-semibold text-foreground text-center">Attended</th>
                    <th className="p-3 font-semibold text-foreground text-center">Missed</th>
                    <th className="p-3 font-semibold text-foreground text-center">Attendance %</th>
                    <th className="p-3 font-semibold text-foreground text-center">Status</th>
                    <th className="p-3 font-semibold text-foreground text-center">Shortfall Recovery</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeacherRoster.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-muted-foreground italic">
                        No enrolled students found for this course offering.
                      </td>
                    </tr>
                  ) : (
                    filteredTeacherRoster.map((r) => {
                      const isDefaulter = r.is_defaulter;
                      const hasConducted = r.conducted_lectures > 0;

                      return (
                        <tr key={r.enrollment_id} className="border-b border-border/70 hover:bg-muted/20">
                          <td className="p-3 font-mono font-bold text-foreground">{r.roll}</td>
                          <td className="p-3 font-semibold text-foreground">{r.student_name}</td>
                          <td className="p-3 text-center font-mono">{r.conducted_lectures}</td>
                          <td className="p-3 text-center font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {r.attended_lectures}
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-red-600 dark:text-red-400">
                            {r.missed_lectures}
                          </td>
                          <td className="p-3 text-center font-mono font-bold">
                            {hasConducted ? (
                              <span className={isDefaulter ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
                                {r.attendance_percentage}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-normal italic">N/A</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                !hasConducted
                                  ? "bg-muted text-muted-foreground"
                                  : isDefaulter
                                  ? "bg-red-500/15 text-red-600 dark:text-red-400"
                                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {r.status_label}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {isDefaulter ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                +{r.shortfall} Lectures
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Teacher History Tab */}
          {teacherActiveTab === "history" && (
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="p-3 font-semibold text-foreground">Date</th>
                    <th className="p-3 font-semibold text-foreground">Slot / Period</th>
                    <th className="p-3 font-semibold text-foreground">Type & Topic</th>
                    <th className="p-3 font-semibold text-foreground text-center">Present / Enrolled</th>
                    <th className="p-3 font-semibold text-foreground text-center">Session %</th>
                    <th className="p-3 font-semibold text-foreground text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherData.history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground italic">
                        No lecture sessions conducted yet for this offering.
                      </td>
                    </tr>
                  ) : (
                    teacherData.history.map((h) => {
                      const isCancelled = h.status === "Cancelled";
                      const isCompleted = h.submitted_at != null;

                      return (
                        <tr key={h.id} className="border-b border-border/70 hover:bg-muted/20">
                          <td className="p-3 font-mono font-medium text-foreground">{h.session_date}</td>
                          <td className="p-3 font-medium text-foreground">Period {h.session_slot}</td>
                          <td className="p-3">
                            <span className="font-semibold text-foreground">{h.session_type}</span>
                            {h.session_topic && <span className="text-muted-foreground"> — {h.session_topic}</span>}
                          </td>
                          <td className="p-3 text-center font-mono">
                            {isCompleted ? `${h.present_count} / ${h.total_records}` : "—"}
                          </td>
                          <td className="p-3 text-center font-mono font-semibold">
                            {isCompleted ? `${h.attendance_pct}%` : "—"}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                isCancelled
                                  ? "bg-red-500/15 text-red-600 dark:text-red-400"
                                  : isCompleted
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              {h.status || "Scheduled"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. STUDENT ATTENDANCE INSIGHTS                                           */}
      {/* ========================================================================= */}
      {role === "student" && studentInsights && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <div className="text-xs font-medium text-muted-foreground">Cumulative Attendance</div>
              <div className="text-2xl font-bold text-primary mt-1">{studentInsights.overallPercentage}%</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Across all enrolled subjects</div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <div className="text-xs font-medium text-muted-foreground">Enrolled Subjects</div>
              <div className="text-2xl font-bold text-foreground mt-1">{studentInsights.enrolledCoursesCount}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Active curriculum offerings</div>
            </div>

            <div
              className={`border rounded-xl p-4 shadow-xs ${
                studentInsights.defaulterCoursesCount > 0
                  ? "bg-red-500/5 border-red-500/30"
                  : "bg-emerald-500/5 border-emerald-500/30"
              }`}
            >
              <div
                className={`text-xs font-medium ${
                  studentInsights.defaulterCoursesCount > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                Academic Compliance Standing
              </div>
              <div
                className={`text-2xl font-bold mt-1 ${
                  studentInsights.defaulterCoursesCount > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {studentInsights.defaulterCoursesCount > 0
                  ? `${studentInsights.defaulterCoursesCount} Defaulter Warning(s)`
                  : "Good Academic Standing"}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Benchmark: Minimum {threshold}% attendance required
              </div>
            </div>
          </div>

          {/* Subject Breakdown Cards */}
          <div className="space-y-4">
            {studentInsights.courses.map((c) => {
              const isDefaulter = c.is_defaulter;
              const hasConducted = c.conducted_lectures > 0;
              const isExpanded = !!expandedHistory[c.course_code];

              return (
                <div
                  key={c.enrollment_id}
                  className={`border rounded-xl p-5 transition-all ${
                    isDefaulter
                      ? "bg-card border-red-500/30 shadow-xs"
                      : "bg-card border-border shadow-xs"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-primary">{c.course_code}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">Sec: {c.section_name}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">Faculty: {c.teacher_name}</span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{c.course_name}</h3>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Current Attendance</div>
                        <div
                          className={`text-2xl font-bold font-mono ${
                            !hasConducted
                              ? "text-muted-foreground"
                              : isDefaulter
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {hasConducted ? `${c.attendance_percentage}%` : "Not Available"}
                        </div>
                      </div>

                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          !hasConducted
                            ? "bg-muted text-muted-foreground"
                            : isDefaulter
                            ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {c.status_label}
                      </span>
                    </div>
                  </div>

                  {/* Attendance Stats Bar */}
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/60 text-xs">
                    <div>
                      <span className="text-muted-foreground">Eligible Conducted:</span>{" "}
                      <strong className="text-foreground font-mono">{c.conducted_lectures}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lectures Attended:</span>{" "}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{c.attended_lectures}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lectures Missed:</span>{" "}
                      <strong className="text-red-600 dark:text-red-400 font-mono">{c.missed_lectures}</strong>
                    </div>
                  </div>

                  {/* Shortfall Recovery Alert (for defaulters) */}
                  {isDefaulter && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {c.classes_needed_for_threshold === -1 
                            ? `At ${threshold}% threshold, 100% attendance cannot be restored once a lecture has been missed.`
                            : `Shortfall Recovery Target: Needs +${c.classes_needed_for_threshold} consecutive attended lectures to reach ${threshold}%.`}
                        </span>
                        <p className="text-muted-foreground mt-0.5 italic">
                          *{c.shortfall_note}.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Lecture History Toggle */}
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                    <button
                      onClick={() => toggleHistory(c.course_code)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isExpanded ? "Hide Attendance History" : "View Lecture-wise Attendance History"}
                    </button>
                    <span className="text-[11px] text-muted-foreground">
                      {c.history.length} recorded session(s)
                    </span>
                  </div>

                  {/* Collapsible History Table */}
                  {isExpanded && (
                    <div className="mt-3 border border-border/70 rounded-lg overflow-hidden bg-muted/10">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-muted/30 border-b border-border/60">
                            <th className="p-2.5 font-semibold text-foreground">Date</th>
                            <th className="p-2.5 font-semibold text-foreground">Period</th>
                            <th className="p-2.5 font-semibold text-foreground">Topic</th>
                            <th className="p-2.5 font-semibold text-foreground text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.history.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-muted-foreground italic">
                                No conducted lectures recorded yet.
                              </td>
                            </tr>
                          ) : (
                            c.history.map((h) => (
                              <tr key={h.id} className="border-b border-border/40 hover:bg-muted/20">
                                <td className="p-2.5 font-mono text-foreground">{h.session_date}</td>
                                <td className="p-2.5 text-foreground">Period {h.session_slot}</td>
                                <td className="p-2.5 text-muted-foreground">{h.session_topic || "Regular Lecture"}</td>
                                <td className="p-2.5 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                      h.attendance_status === "Present"
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                        : "bg-red-500/15 text-red-600 dark:text-red-400"
                                    }`}
                                  >
                                    {h.attendance_status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceAnalyticsPage;
