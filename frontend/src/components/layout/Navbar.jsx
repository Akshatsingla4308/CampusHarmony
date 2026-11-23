import React, { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function Navbar({ menuOpen, toggleMenu }) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { user, role, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkStored = localStorage.getItem("sms.theme") === "dark";
    setIsDark(isDarkStored);
    if (isDarkStored) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("sms.theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("sms.theme", "light");
    }
  };

  const getPageTitle = (path) => {
    if (path === "/") return "Dashboard";
    if (path.startsWith("/students")) return "Students";
    if (path.startsWith("/teachers")) return "Teachers";
    if (path.startsWith("/departments")) return "Departments";
    if (path.startsWith("/subjects")) return "Subjects";
    if (path.startsWith("/courses")) return "Courses";
    if (path.startsWith("/attendance")) return "Attendance";
    if (path === "/timetable") return "Timetable";
    if (path === "/complaints") return "Complaints";
    if (path.startsWith("/marks")) return "Marks and assessments";
    if (path.startsWith("/transcript")) return "Official Academic Transcripts";
    if (path.startsWith("/defaulters")) return "Attendance reports";
    if (path.startsWith("/activities")) return "Extracurricular Activities";
    if (path.startsWith("/dbms-demo")) return "DBMS Advanced Demonstrations (50 Marks)";
    if (path.startsWith("/java-demo")) return "Programming in Java CHO Demonstration (25 Marks)";
    if (path.startsWith("/profile")) return "User Profile & Security";
    return "Campus Harmony ERP";
  };

  return (
    <header className="h-16 border-b border-border bg-card px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sticky top-0 z-30">
      {/* Page Title & Breadcrumb */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          id="portal-menu-toggle"
          type="button"
          onClick={toggleMenu}
          aria-expanded={menuOpen}
          aria-controls="portal-navigation"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          className="portal-button px-2.5 lg:hidden"
        >
          {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-sm sm:text-base font-semibold text-foreground">
            {getPageTitle(currentPath)}
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button onClick={logout} className="portal-button whitespace-nowrap">
          Sign out
        </button>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="portal-button px-2.5"
          title="Toggle Light / Dark Mode"
          aria-label={isDark ? "Use light theme" : "Use dark theme"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile Pill */}
        <Link
          to="/profile"
          className="flex items-center gap-2.5 pl-2 border-l border-border hover:opacity-80 transition-opacity"
          title="View Profile"
          aria-label="View profile"
        >
          <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.charAt(0) : "U"}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-foreground leading-none">{user?.name}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-none capitalize">
              {role}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
