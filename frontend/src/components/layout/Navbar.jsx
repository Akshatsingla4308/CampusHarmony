import React, { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Sun, Moon, User, LogOut, ArrowRightLeft, ShieldCheck, ExternalLink } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function Navbar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { user, role, switchRole, logout } = useAuth();
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
    if (path === "/") return "Executive ERP Dashboard";
    if (path.startsWith("/students")) return "Student Directory & Admissions";
    if (path.startsWith("/teachers")) return "Faculty & Instructors Directory";
    if (path.startsWith("/departments")) return "Academic Departments Master";
    if (path.startsWith("/subjects")) return "Subjects & Course Curriculum";
    if (path.startsWith("/courses")) return "Course Offerings & Registrations";
    if (path.startsWith("/attendance")) return "Lecture Attendance & Sessions";
    if (path.startsWith("/marks")) return "Student Marks & Evaluations";
    if (path.startsWith("/transcript")) return "Official Academic Transcripts";
    if (path.startsWith("/defaulters")) return "Attendance Defaulter Analytics";
    if (path.startsWith("/activities")) return "Extracurricular Activities";
    if (path.startsWith("/dbms-demo")) return "DBMS Advanced Demonstrations (50 Marks)";
    if (path.startsWith("/java-demo")) return "Programming in Java CHO Demonstration (25 Marks)";
    if (path.startsWith("/profile")) return "User Profile & Security";
    return "Campus Harmony ERP";
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Page Title & Breadcrumb */}
      <div>
        <h1 className="text-base font-bold text-foreground leading-none">{getPageTitle(currentPath)}</h1>
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
          <span>Campus Harmony</span>
          <span>/</span>
          <span className="capitalize">{currentPath.replace("/", "") || "Dashboard"}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Role Switcher Pill for Faculty Evaluation */}
        <div className="hidden sm:flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border text-xs">
          <span className="px-2 py-0.5 text-muted-foreground font-semibold text-[11px]">ROLE:</span>
          <button
            onClick={() => switchRole("teacher")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              role === "teacher"
                ? "bg-background text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Faculty
          </button>
          <button
            onClick={() => switchRole("student")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              role === "student"
                ? "bg-background text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Student
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Toggle Light / Dark Mode"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.charAt(0) : "U"}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-foreground leading-none">{user?.name || "Dr. Sudha Rao"}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-none capitalize">
              {role} • {user?.department || "CSE"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
