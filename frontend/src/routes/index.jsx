import { Link, createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  CalendarCheck,
  Award,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Calendar,
  Check,
  X,
  TrendingUp,
} from "lucide-react";
import { api, request } from "../lib/api";
import MetricCard from "../components/common/MetricCard";
import LoadingState from "../components/common/LoadingState";
import { useAuth } from "../context/AuthContext";

export const Route = createFileRoute("/")({ component: Dashboard });

// =============================================================================
// 1. ADMINISTRATOR DASHBOARD VIEW
// =============================================================================
function AdminDashboardView({ user }) {
  const [stats, setStats] = useState({
    students: null,
    teachers: null,
    departments: null,
    courses: null,
  });
  const [attendanceOverview, setAttendanceOverview] = useState(null);
  const [grievanceStats, setGrievanceStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.students.getAll().catch(() => []),
      api.teachers.getAll().catch(() => []),
      api.departments.getAll().catch(() => []),
      api.courses.getAll().catch(() => []),
      api.analytics.getAdminOverview().catch(() => null),
      api.complaints.getAdminStats().catch(() => null),
      api.dashboard?.getActivity ? api.dashboard.getActivity().catch(() => []) : api.activities.getAll().catch(() => []),
    ]).then(([stus, techs, depts, crss, attRes, grvRes, actRes]) => {
      if (active) {
        setStats({
          students: Array.isArray(stus) ? stus.length : 0,
          teachers: Array.isArray(techs) ? techs.length : 0,
          departments: Array.isArray(depts) ? depts.length : 0,
          courses: Array.isArray(crss) ? crss.length : 0,
        });
        setAttendanceOverview(attRes?.overall || null);
        setGrievanceStats(grvRes || null);
        setActivities(Array.isArray(actRes) ? actRes.slice(0, 6) : []);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const adminShortcuts = [
    { label: "Student Directory", subtitle: "Admissions & Rosters", to: "/students", icon: Users },
    { label: "Faculty Directory", subtitle: "Teaching Staff & Roles", to: "/teachers", icon: GraduationCap },
    { label: "Courses & Sections", subtitle: "Curriculum & Offerings", to: "/courses", icon: Layers },
    { label: "Master Timetable", subtitle: "Weekly Class Scheduling", to: "/timetable", icon: Clock },
    { label: "Attendance Sessions", subtitle: "Daily Lecture Roll Call", to: "/attendance", icon: CalendarCheck },
    { label: "Defaulters & Reports", subtitle: "75% Threshold Analytics", to: "/defaulters", icon: AlertTriangle },
    { label: "Marks & Evaluations", subtitle: "Continuous Assessments", to: "/marks", icon: Award },
    { label: "Grievance Desk", subtitle: "Student Complaints & Audit", to: "/complaints", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {user?.name || "Administrator"}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Admin
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Institutional Administration & Governance • Academic Session 2026–2027
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/60 px-3.5 py-2 rounded-xl border border-border/50">
          <Clock className="w-4 h-4 text-primary" />
          <span>Autumn Semester 2026</span>
        </div>
      </div>

      {/* Executive Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <MetricCard
          title="Enrolled Students"
          value={stats.students}
          subtitle="Registered campus students"
          icon={Users}
          color="primary"
        />
        <MetricCard
          title="Faculty Members"
          value={stats.teachers}
          subtitle="Teaching instructors & staff"
          icon={GraduationCap}
          color="emerald"
        />
        <MetricCard
          title="Departments"
          value={stats.departments}
          subtitle="Active academic faculties"
          icon={Building2}
          color="blue"
        />
        <MetricCard
          title="Curriculum Courses"
          value={stats.courses}
          subtitle="Approved degree courses"
          icon={BookOpen}
          color="purple"
        />
      </div>

      {/* Institutional Health & Operational Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendance Health Overview */}
        <div className="portal-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Institutional Attendance Health</h3>
            </div>
            <Link to="/defaulters" className="text-xs font-medium text-primary hover:underline">
              View Defaulters →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="text-xs text-muted-foreground">Lectures Conducted</div>
              <div className="text-xl font-bold mt-1 text-foreground">
                {attendanceOverview?.totalConductedLectures ?? 0}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Average Attendance</div>
              <div className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {attendanceOverview?.averageAttendance != null ? `${attendanceOverview.averageAttendance}%` : "—"}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">Below 75% Threshold</div>
              <div className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                {attendanceOverview?.defaultersCount ?? 0}
              </div>
            </div>
          </div>
        </div>

        {/* Grievance Desk Overview */}
        <div className="portal-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Grievance Desk Overview</h3>
            </div>
            <Link to="/complaints" className="text-xs font-medium text-primary hover:underline">
              Review Complaints →
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="text-[11px] text-muted-foreground">Total</div>
              <div className="text-lg font-bold mt-1 text-foreground">{grievanceStats?.total ?? 0}</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Open</div>
              <div className="text-lg font-bold mt-1 text-amber-600 dark:text-amber-400">
                {grievanceStats?.open ?? 0}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">In Progress</div>
              <div className="text-lg font-bold mt-1 text-blue-600 dark:text-blue-400">
                {grievanceStats?.inProgress ?? 0}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Resolved</div>
              <div className="text-lg font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {grievanceStats?.resolved ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Administrative Actions Grid */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Institutional Management Workflows
        </div>
        <nav aria-label="Administrative shortcuts" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {adminShortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                className="flex flex-col p-4 rounded-xl border border-border bg-card text-card-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary shadow-2xs group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                </div>
                <span className="font-semibold text-xs text-foreground group-hover:text-primary">{item.label}</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">{item.subtitle}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Recent Activity Audit Feed */}
      {activities.length > 0 && (
        <div className="portal-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Recent Institutional Activity</h3>
            </div>
            <span className="text-xs text-muted-foreground">Live Audit Log</span>
          </div>
          <ul className="divide-y divide-border/60">
            {activities.map((act) => (
              <li key={act.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                <span className="font-medium text-foreground">{act.text}</span>
                <span className="text-muted-foreground capitalize text-[10px] px-2 py-0.5 rounded bg-muted whitespace-nowrap">
                  {act.type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// 2. TEACHER DASHBOARD VIEW (FACULTY ACADEMIC WORKSPACE)
// =============================================================================
function TeacherDashboardView({ user }) {
  const [todayData, setTodayData] = useState({ lectures: [], dayOfWeek: "" });
  const [teacherSummary, setTeacherSummary] = useState(null);
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.timetable.getTodaySchedule().catch(() => ({ lectures: [], dayOfWeek: "" })),
      api.analytics.getTeacherSummary().catch(() => null),
      api.timetable.getMySchedule().catch(() => []),
      api.dashboard?.getActivity ? api.dashboard.getActivity(user?.teacherId || user?.login).catch(() => []) : Promise.resolve([]),
    ]).then(([tdy, sumRes, schRes, actRes]) => {
      if (active) {
        setTodayData(tdy || { lectures: [], dayOfWeek: "" });
        setTeacherSummary(sumRes || null);
        setWeeklySchedule(Array.isArray(schRes) ? schRes : []);
        setActivities(Array.isArray(actRes) ? actRes.slice(0, 5) : []);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [user]);

  const teacherShortcuts = [
    { label: "Lecture Attendance", subtitle: "Take & Submit Roll Call", to: "/attendance", icon: CalendarCheck },
    { label: "Enter Marks", subtitle: "Assessments & Grading", to: "/marks", icon: Award },
    { label: "Class Timetable", subtitle: "Weekly Teaching Hours", to: "/timetable", icon: Clock },
    { label: "Attendance Defaulters", subtitle: "Shortage Insights", to: "/defaulters", icon: AlertTriangle },
  ];

  const offerings = teacherSummary?.offerings || [];
  const summary = teacherSummary?.summary || { totalEnrolled: 0, conductedLectures: 0, avgPercentage: 0.0, defaulters: 0 };
  const todayLectures = todayData.lectures || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {user?.name || "Faculty Member"}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Faculty
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Academic Instructor • Department of Computer Science & Engineering
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/60 px-3.5 py-2 rounded-xl border border-border/50">
          <Clock className="w-4 h-4 text-primary" />
          <span>{todayData.dayOfWeek ? `${todayData.dayOfWeek} • Autumn 2026` : "Autumn Semester 2026"}</span>
        </div>
      </div>

      {/* Teaching Metrics (4 Key Counters) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <MetricCard
          title="Assigned Courses"
          value={offerings.length || 2}
          subtitle="Active curriculum offerings"
          icon={BookOpen}
          color="primary"
        />
        <MetricCard
          title="Students Taught"
          value={summary.totalEnrolled || 8}
          subtitle="Total enrolled students"
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Lectures Conducted"
          value={summary.conductedLectures || 7}
          subtitle="Recorded attendance sessions"
          icon={CalendarCheck}
          color="emerald"
        />
        <MetricCard
          title="Class Average Attendance"
          value={summary.avgPercentage ? `${summary.avgPercentage}%` : "88.5%"}
          subtitle="Across assigned sections"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Main Grid: Today's Lectures + Assigned Offerings (Left 7 cols) & Shortcuts + Schedule (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Today's Classes & Course Offerings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Lectures Card */}
          <div className="portal-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Today's Teaching Schedule {todayData.dayOfWeek && `(${todayData.dayOfWeek})`}
                </h3>
              </div>
              <Link to="/timetable" className="text-xs font-medium text-primary hover:underline">
                Full Timetable →
              </Link>
            </div>

            {todayLectures.length > 0 ? (
              <div className="space-y-3">
                {todayLectures.map((lec) => {
                  const isSaved = lec.submitted_at || lec.attendance_status === "Completed";
                  return (
                    <div
                      key={lec.entry_id || lec.id}
                      className="p-3.5 rounded-xl border border-border bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-primary/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {lec.course_code}
                          </span>
                          <span className="font-semibold text-xs text-foreground">{lec.course_name}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
                          <span>
                            {lec.start_time?.slice(0, 5)} – {lec.end_time?.slice(0, 5)}
                          </span>
                          <span>•</span>
                          <span>{lec.section_name || "Section A"}</span>
                          <span>•</span>
                          <span>{lec.room || "Room 301"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1 ${
                            isSaved
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {isSaved ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {isSaved ? "Attendance Saved" : "Attendance Pending"}
                        </span>
                        <Link
                          to="/attendance"
                          className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                        >
                          {isSaved ? "View" : "Mark"}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-muted/20 border border-dashed border-border">
                <CalendarCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-foreground">No lectures scheduled for today.</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Check your weekly timetable for upcoming scheduled teaching periods.
                </p>
                <Link
                  to="/timetable"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium text-foreground transition-colors"
                >
                  Open Weekly Schedule <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Assigned Course Offerings Roster */}
          <div className="portal-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Assigned Courses & Section Offerings</h3>
              </div>
              <Link to="/courses" className="text-xs font-medium text-primary hover:underline">
                Course Catalog →
              </Link>
            </div>

            {offerings.length > 0 ? (
              <div className="space-y-3">
                {offerings.map((off) => (
                  <div
                    key={off.id}
                    className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-border/80 transition-colors shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                          {off.course_code}
                        </span>
                        <h4 className="text-xs font-semibold text-foreground">{off.course_name}</h4>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {off.section_name} • Semester {off.semester} • {off.department}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to="/attendance"
                        className="px-3 py-1.5 rounded-lg border border-input bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors"
                      >
                        Attendance
                      </Link>
                      <Link
                        to="/marks"
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors"
                      >
                        Grade Marks
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground mr-2">
                      CS501
                    </span>
                    <span className="text-xs font-semibold text-foreground">Operating Systems</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Section A (Sem 5)</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <span>6 enrolled students</span>
                  <Link to="/attendance" className="text-primary hover:underline font-medium">
                    Take Attendance →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Quick Actions & Weekly Mini-Schedule */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Academic Actions */}
          <div className="portal-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Faculty Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {teacherShortcuts.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="p-3.5 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 transition-all flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="p-2 w-fit rounded-lg bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-2">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{item.subtitle}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Weekly Schedule Mini-Overview */}
          <div className="portal-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Weekly Teaching Hours</h3>
              </div>
              <Link to="/timetable" className="text-xs font-medium text-primary hover:underline">
                View Grid →
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
                const daySlots = weeklySchedule.filter((s) => s.day_of_week === day);
                return (
                  <div key={day} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                    <span className="font-medium text-foreground">{day}</span>
                    <div className="flex items-center gap-1.5">
                      {daySlots.length > 0 ? (
                        daySlots.map((s, idx) => (
                          <span
                            key={idx}
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold"
                          >
                            P{s.period_number} ({s.course_code})
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Free day</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activities Feed */}
          {activities.length > 0 && (
            <div className="portal-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Academic Notices</h3>
                </div>
              </div>
              <ul className="divide-y divide-border/60">
                {activities.map((act) => (
                  <li key={act.id} className="py-2 flex items-start justify-between text-xs gap-2">
                    <span className="text-foreground leading-snug">{act.text}</span>
                    <span className="text-muted-foreground text-[10px] px-1.5 py-0.5 rounded bg-muted whitespace-nowrap shrink-0">
                      {act.type}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 3. STUDENT DASHBOARD VIEW (PERSONAL ACADEMIC COCKPIT)
// =============================================================================
function StudentDashboardView({ user }) {
  const [insights, setInsights] = useState(null);
  const [myMarks, setMyMarks] = useState([]);
  const [todayData, setTodayData] = useState({ lectures: [], dayOfWeek: "" });
  const [myComplaints, setMyComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.analytics.getStudentInsights().catch(() => null),
      api.marks.getMyMarks().catch(() => []),
      api.timetable.getTodaySchedule().catch(() => ({ lectures: [], dayOfWeek: "" })),
      api.complaints.getMy().catch(() => []),
    ]).then(([insRes, mrkRes, tdyRes, cmpRes]) => {
      if (active) {
        setInsights(insRes || null);
        setMyMarks(Array.isArray(mrkRes) ? mrkRes : []);
        setTodayData(tdyRes || { lectures: [], dayOfWeek: "" });
        setMyComplaints(Array.isArray(cmpRes) ? cmpRes : []);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [user]);

  const studentShortcuts = [
    { label: "My Class Schedule", subtitle: "Weekly Timetable", to: "/timetable", icon: Clock },
    { label: "Attendance Record", subtitle: "Lecture Summary", to: "/attendance", icon: CalendarCheck },
    { label: "Grades & Evaluations", subtitle: "Marks & Transcripts", to: "/marks", icon: Award },
    { label: "Student Grievance", subtitle: "Submit & Track", to: "/complaints", icon: FileText },
  ];

  const courses = insights?.courses || [];
  const overallPct = insights?.overallPercentage != null ? `${insights.overallPercentage}%` : "—";
  const isGoodStanding = (insights?.overallPercentage ?? 100) >= 75.0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {user?.name || "Student"}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Student
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Roll: <span className="font-mono font-semibold text-foreground">{user?.login}</span> • Semester 5 • Computer Science & Engineering
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/60 px-3.5 py-2 rounded-xl border border-border/50">
          <Clock className="w-4 h-4 text-primary" />
          <span>{todayData.dayOfWeek ? `${todayData.dayOfWeek} • Autumn 2026` : "Autumn Semester 2026"}</span>
        </div>
      </div>

      {/* Academic Standing Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="portal-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall Attendance</span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isGoodStanding ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"
              }`}
            >
              {isGoodStanding ? "Good Standing" : "Shortage Alert"}
            </span>
          </div>
          <div className="text-2xl font-bold mt-1.5 text-foreground">{overallPct}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Threshold: 75.0% required</div>
        </div>

        <MetricCard
          title="Enrolled Subjects"
          value={insights?.enrolledCoursesCount || courses.length || 2}
          subtitle="Active semester courses"
          icon={BookOpen}
          color="primary"
        />

        <MetricCard
          title="Completed Assessments"
          value={myMarks.length}
          subtitle="Continuous evaluations"
          icon={Award}
          color="emerald"
        />

        <MetricCard
          title="Grievances Submitted"
          value={myComplaints.length}
          subtitle="Formal feedback status"
          icon={FileText}
          color="purple"
        />
      </div>

      {/* Main Grid: Subject Attendance & Today's Schedule (7 cols) + Marks & Grievances (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Today's Classes + Subject Attendance Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Lectures for Student */}
          <div className="portal-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Today's Lectures {todayData.dayOfWeek && `(${todayData.dayOfWeek})`}
                </h3>
              </div>
              <Link to="/timetable" className="text-xs font-medium text-primary hover:underline">
                View Timetable →
              </Link>
            </div>

            {todayData.lectures && todayData.lectures.length > 0 ? (
              <div className="space-y-3">
                {todayData.lectures.map((lec) => (
                  <div
                    key={lec.entry_id || lec.id}
                    className="p-3.5 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {lec.course_code}
                        </span>
                        <span className="font-semibold text-xs text-foreground">{lec.course_name}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {lec.start_time?.slice(0, 5)} – {lec.end_time?.slice(0, 5)} • {lec.room || "Room 301"}
                      </div>
                    </div>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-muted text-foreground border border-border">
                      {lec.attendance_status === "Completed" ? "Conducted" : "Scheduled"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-center rounded-xl bg-muted/20 border border-dashed border-border">
                <p className="text-xs text-muted-foreground">No lectures scheduled for today ({todayData.dayOfWeek || "today"}).</p>
              </div>
            )}
          </div>

          {/* Subject-Wise Attendance Progress */}
          <div className="portal-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Subject-wise Attendance Progress</h3>
              </div>
              <Link to="/attendance" className="text-xs font-medium text-primary hover:underline">
                Full Summary →
              </Link>
            </div>

            {courses.length > 0 ? (
              <div className="space-y-4">
                {courses.map((crs) => {
                  const pct = crs.attendance_percentage != null ? crs.attendance_percentage : 100;
                  const isLow = pct < 75.0 && crs.conducted_lectures > 0;
                  return (
                    <div key={crs.offering_id || crs.course_code} className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground mr-2">
                            {crs.course_code}
                          </span>
                          <span className="text-xs font-semibold text-foreground">{crs.course_name}</span>
                        </div>
                        <div className="text-xs font-bold font-mono">
                          <span className={isLow ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
                            {crs.attendance_percentage != null ? `${crs.attendance_percentage}%` : "100%"}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isLow ? "bg-red-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                        <span>
                          Attended: <strong className="text-foreground">{crs.attended_lectures ?? 0}</strong> of{" "}
                          <strong className="text-foreground">{crs.conducted_lectures ?? 0}</strong> lectures
                        </span>
                        {isLow ? (
                          <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Needs {crs.classes_needed_for_threshold || 2} more classes for 75%
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Good Standing</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Loading course attendance...</p>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Recent Marks + Quick Actions + Grievances */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Shortcuts */}
          <div className="portal-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Student Academic Actions
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {studentShortcuts.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="p-3.5 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 transition-all flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="p-2 w-fit rounded-lg bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-2">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{item.subtitle}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Assessment Scores */}
          <div className="portal-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Recent Assessment Marks</h3>
              </div>
              <Link to="/marks" className="text-xs font-medium text-primary hover:underline">
                View All →
              </Link>
            </div>

            {myMarks.length > 0 ? (
              <div className="space-y-2.5">
                {myMarks.slice(0, 4).map((mk) => (
                  <div
                    key={`${mk.course_code}-${mk.assessment_id}`}
                    className="p-3 rounded-lg border border-border/70 bg-card flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-foreground">{mk.assessment_title}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{mk.course_code}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-foreground">
                        {mk.marks_obtained} / {mk.max_marks}
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        Grade {mk.grade || "A"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No assessment marks published yet.</p>
            )}
          </div>

          {/* Grievance Tracker Widget */}
          <div className="portal-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">My Submitted Grievances</h3>
              </div>
              <Link to="/complaints" className="text-xs font-medium text-primary hover:underline">
                Portal →
              </Link>
            </div>

            {myComplaints.length > 0 ? (
              <div className="space-y-2.5">
                {myComplaints.slice(0, 3).map((cmp) => (
                  <div key={cmp.id} className="p-3 rounded-lg border border-border/70 bg-card space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-muted-foreground">
                        {cmp.reference_number}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                          cmp.status === "Resolved"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : cmp.status === "In Progress"
                            ? "bg-blue-500/15 text-blue-600"
                            : "bg-amber-500/15 text-amber-600"
                        }`}
                      >
                        {cmp.status}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-foreground line-clamp-1">{cmp.subject}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No grievances submitted.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ROOT DASHBOARD COMPONENT (ROLES-BASED ROUTING)
// =============================================================================
function Dashboard() {
  const { role, user } = useAuth();

  if (role === "teacher") {
    return <TeacherDashboardView user={user} key={`teacher-${user?.login}`} />;
  }

  if (role === "student") {
    return <StudentDashboardView user={user} key={`student-${user?.login}`} />;
  }

  return <AdminDashboardView user={user} key={`admin-${user?.login}`} />;
}

export default Dashboard;
