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
} from "lucide-react";
import { api } from "../lib/api";
import DashboardOverview from "../components/DashboardOverview";
import MetricCard from "../components/common/MetricCard";
import { useAuth } from "../context/AuthContext";

export const Route = createFileRoute("/")({ component: Dashboard });

function AdminExecutiveStats() {
  const [stats, setStats] = useState({
    students: null,
    teachers: null,
    departments: null,
    courses: null,
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      api.students.getAll().catch(() => []),
      api.teachers.getAll().catch(() => []),
      api.departments.getAll().catch(() => []),
      api.courses.getAll().catch(() => []),
    ]).then(([stus, techs, depts, crss]) => {
      if (active) {
        setStats({
          students: Array.isArray(stus) ? stus.length : 0,
          teachers: Array.isArray(techs) ? techs.length : 0,
          departments: Array.isArray(depts) ? depts.length : 0,
          courses: Array.isArray(crss) ? crss.length : 0,
        });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
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
  );
}

function RecentActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetcher = api.dashboard?.getActivity || api.activities?.getAll;
    if (!fetcher) {
      setLoading(false);
      return;
    }
    fetcher()
      .then((res) => {
        if (active) setActivities(Array.isArray(res) ? res.slice(0, 5) : []);
      })
      .catch(() => {
        if (active) setActivities([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading || activities.length === 0) return null;

  return (
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
          <li key={act.id} className="py-2.5 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{act.text}</span>
            <span className="text-muted-foreground capitalize text-[11px] px-2 py-0.5 rounded bg-muted">
              {act.type}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const roleNavConfig = {
  admin: [
    { label: "Student Directory", to: "/students", icon: Users },
    { label: "Faculty Directory", to: "/teachers", icon: GraduationCap },
    { label: "Courses & Sections", to: "/courses", icon: Layers },
    { label: "Master Timetable", to: "/timetable", icon: Clock },
    { label: "Attendance Sessions", to: "/attendance", icon: CalendarCheck },
    { label: "Defaulters & Reports", to: "/defaulters", icon: AlertTriangle },
    { label: "Marks & Evaluations", to: "/marks", icon: Award },
    { label: "Grievance Desk", to: "/complaints", icon: FileText },
  ],
  teacher: [
    { label: "Lecture Attendance", to: "/attendance", icon: CalendarCheck },
    { label: "Enter Marks", to: "/marks", icon: Award },
    { label: "Class Timetable", to: "/timetable", icon: Clock },
    { label: "Class Analytics", to: "/defaulters", icon: AlertTriangle },
  ],
  student: [
    { label: "Class Timetable", to: "/timetable", icon: Clock },
    { label: "My Attendance", to: "/attendance", icon: CalendarCheck },
    { label: "Grades & Marks", to: "/marks", icon: Award },
    { label: "Grievance Portal", to: "/complaints", icon: FileText },
  ],
};

function Dashboard() {
  const { role, user } = useAuth();
  const shortcuts = roleNavConfig[role] || [];

  return (
    <div className="grid min-w-0 gap-6" key={role + ":" + user?.login}>
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {user?.name || "CampusHarmony User"}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {role}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {role === "admin" && "Institutional Administration & Governance • Sunrise Institute of Technology"}
            {role === "teacher" && "Faculty Teaching Portal • Manage your lecture rosters, attendance, and grading."}
            {role === "student" && `Academic Student Portal · Account: ${user?.login} • Track your classes and attendance.`}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-3.5 py-2 rounded-xl">
          <Clock className="w-4 h-4 text-primary" />
          <span>Academic Session 2026–2027</span>
        </div>
      </div>

      {/* Admin Executive Metrics */}
      {role === "admin" && <AdminExecutiveStats />}

      {/* Quick Actions Bar */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
          Quick Academic Actions
        </div>
        <nav aria-label="Academic shortcuts" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card text-card-foreground text-xs font-semibold transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary shadow-2xs group"
              >
                <div className="p-1.5 rounded-lg bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate">{item.label}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Role-Specific Overview Panels (Attendance & Complaints) */}
      <DashboardOverview role={role} />

      {/* Recent Activity Audit Feed (Admin Only) */}
      {role === "admin" && <RecentActivityFeed />}
    </div>
  );
}

export default Dashboard;
