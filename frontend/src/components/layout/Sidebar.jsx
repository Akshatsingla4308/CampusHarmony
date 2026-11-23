import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  CalendarCheck,
  Award,
  AlertTriangle,
  FileText,
  Activity,
  UserCheck,
  Layers,
  Clock,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function Sidebar({ menuOpen, onNavigate }) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { user, role, logout } = useAuth();

  const getNavigationGroups = () => {
    if (role === "teacher") {
      return [
        {
          title: "Classroom Operations",
          items: [
            { name: "Dashboard", href: "/", icon: LayoutDashboard },
            { name: "Teaching Timetable", href: "/timetable", icon: Clock },
            { name: "Lecture Attendance", href: "/attendance", icon: CalendarCheck },
            { name: "Marks & Assessments", href: "/marks", icon: Award },
            { name: "Attendance Analytics", href: "/defaulters", icon: AlertTriangle },
          ],
        },
        {
          title: "Account",
          items: [{ name: "Profile & Settings", href: "/profile", icon: UserCheck }],
        },
      ];
    }
    if (role === "student") {
      return [
        {
          title: "Academic Portal",
          items: [
            { name: "Dashboard", href: "/", icon: LayoutDashboard },
            { name: "Class Timetable", href: "/timetable", icon: Clock },
            { name: "My Attendance", href: "/attendance", icon: CalendarCheck },
            { name: "My Grades & Marks", href: "/marks", icon: Award },
            { name: "Attendance Insights", href: "/defaulters", icon: AlertTriangle },
          ],
        },
        {
          title: "Campus Support",
          items: [{ name: "Grievances & Complaints", href: "/complaints", icon: FileText }],
        },
        {
          title: "Account",
          items: [{ name: "Profile & Settings", href: "/profile", icon: UserCheck }],
        },
      ];
    }

    // Default / Admin
    return [
      {
        title: "Institutional Management",
        items: [
          { name: "Dashboard", href: "/", icon: LayoutDashboard },
          { name: "Students", href: "/students", icon: Users },
          { name: "Faculty", href: "/teachers", icon: GraduationCap },
          { name: "Departments", href: "/departments", icon: Building2 },
          { name: "Courses & Sections", href: "/courses", icon: Layers },
        ],
      },
      {
        title: "Academic Operations",
        items: [
          { name: "Weekly Timetable", href: "/timetable", icon: Clock },
          { name: "Attendance Sessions", href: "/attendance", icon: CalendarCheck },
          { name: "Defaulters & Reports", href: "/defaulters", icon: AlertTriangle },
          { name: "Marks & Evaluations", href: "/marks", icon: Award },
          { name: "Academic Transcripts", href: "/transcript", icon: FileText },
        ],
      },
      {
        title: "Campus Life & Governance",
        items: [
          { name: "Grievance Desk", href: "/complaints", icon: FileText },
          { name: "Activities & Mentorship", href: "/activities", icon: Activity },
        ],
      },
      {
        title: "Account",
        items: [{ name: "Profile & Settings", href: "/profile", icon: UserCheck }],
      },
    ];
  };

  const navigationGroups = getNavigationGroups();

  return (
    <aside
      id="portal-navigation"
      className={`${menuOpen ? "flex" : "hidden"} max-lg:fixed max-lg:inset-x-0 max-lg:top-16 max-lg:z-40 max-lg:max-h-[calc(100dvh-4rem)] max-lg:shadow-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-col shrink-0`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
            CH
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight leading-none text-sidebar-foreground">
              CampusHarmony
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 leading-none font-medium">
              Sunrise Institute ERP
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav aria-label="Portal navigation" className="flex-1 space-y-5 overflow-y-auto p-3">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-9 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-2xs"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 opacity-80" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Status Card */}
      <div className="p-3 border-t border-sidebar-border bg-sidebar-accent/20">
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-card/60 border border-border/50">
          <Link
            to="/profile"
            onClick={onNavigate}
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="text-xs font-semibold text-foreground truncate">{user?.name}</div>
              <div className="text-[10px] text-muted-foreground capitalize leading-none mt-0.5">
                {role}
              </div>
            </div>
          </Link>
          <button
            onClick={logout}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
