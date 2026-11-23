import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  CalendarCheck,
  Award,
  AlertTriangle,
  FileText,
  Activity,
  Database,
  Code2,
  UserCheck,
  ExternalLink,
  Layers,
  Clock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function Sidebar({ menuOpen, onNavigate }) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { role } = useAuth();

  const getNavigationGroups = () => {
    if (role === "teacher") {
      return [
        {
          title: "Academic Teaching",
          items: [
            { name: "Dashboard", href: "/", icon: LayoutDashboard },
            { name: "Timetable & Schedule", href: "/timetable", icon: Clock },
            { name: "Class Attendance", href: "/attendance", icon: CalendarCheck },
            { name: "Attendance Analytics", href: "/defaulters", icon: AlertTriangle },
            { name: "Marks & Evaluations", href: "/marks", icon: Award },
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
          title: "Academic Records",
          items: [
            { name: "Dashboard", href: "/", icon: LayoutDashboard },
            { name: "Class Timetable", href: "/timetable", icon: Clock },
            { name: "My Attendance", href: "/attendance", icon: CalendarCheck },
            { name: "Attendance Insights", href: "/defaulters", icon: AlertTriangle },
            { name: "My Marks & Grades", href: "/marks", icon: Award },
          ],
        },
        {
          title: "Campus Support",
          items: [{ name: "Complaints & Grievances", href: "/complaints", icon: FileText }],
        },
        {
          title: "Account",
          items: [{ name: "Profile & Settings", href: "/profile", icon: UserCheck }],
        },
      ];
    }
    return [
      {
        title: "Academic Operations",
        items: [
          { name: "Dashboard", href: "/", icon: LayoutDashboard },
          { name: "Students", href: "/students", icon: Users },
          { name: "Faculty / Teachers", href: "/teachers", icon: GraduationCap },
          { name: "Departments", href: "/departments", icon: Building2 },
          { name: "Subjects Catalog", href: "/subjects", icon: BookOpen },
          { name: "Courses & Enrollment", href: "/courses", icon: Layers },
        ],
      },
      {
        title: "Attendance & Evaluation",
        items: [
          { name: "Weekly Timetable", href: "/timetable", icon: Clock },
          { name: "Attendance Sessions", href: "/attendance", icon: CalendarCheck },
          { name: "Attendance Analytics & Defaulters", href: "/defaulters", icon: AlertTriangle },
          { name: "Marks & Evaluations", href: "/marks", icon: Award },
          { name: "Academic Transcripts", href: "/transcript", icon: FileText },
        ],
      },
      {
        title: "Campus Life & Grievances",
        items: [
          { name: "Activities & Mentorship", href: "/activities", icon: Activity },
          { name: "Grievance Management", href: "/complaints", icon: FileText },
        ],
      },
      {
        title: "Academic Demonstrations (Chitkara)",
        items: [
          { name: "DBMS Stored Procedures & ACID", href: "/dbms-demo", icon: Database },
          { name: "Core Java CHO Demonstrations", href: "/java-demo", icon: Code2 },
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
      className={`${menuOpen ? "flex" : "hidden"} max-lg:fixed max-lg:inset-x-0 max-lg:top-16 max-lg:z-40 max-lg:max-h-[calc(100dvh-4rem)] max-lg:shadow-lg lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-col shrink-0`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
            CH
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight leading-none text-sidebar-foreground">
              Campus Harmony
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 leading-none font-medium">
              Sunrise Institute ERP
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav aria-label="Portal navigation" className="flex-1 p-3 space-y-6 overflow-y-auto">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-semibold"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* FEE-II Evaluated Vanilla Portal Shortcut */}
      <div className="p-3 border-t border-sidebar-border bg-sidebar-accent/30">
        <div className="text-[10px] uppercase font-semibold text-muted-foreground px-2 mb-1.5">
          FEE-II Evaluated Work
        </div>
        <a
          href="/sms/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors shadow-2xs"
        >
          <span className="truncate">Vanilla FEE-II Portal</span>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </a>
      </div>
    </aside>
  );
}

export default Sidebar;
