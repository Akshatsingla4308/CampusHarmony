import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { User, Shield, Key, Clock, Database, Laptop, CheckCircle2, RotateCcw } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, role, switchRole, logout } = useAuth();
  const [successMsg, setSuccessMsg] = useState(null);

  const handleRoleChange = (newRole) => {
    switchRole(newRole);
    setSuccessMsg(`Switched active academic persona to: ${newRole.toUpperCase()}.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold tracking-tight">User Profile & Session Settings</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage authenticated academic session, role permissions, and examine system architecture details
        </p>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl shadow-xs">
            {user?.name ? user.name.charAt(0) : "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">{user?.name || "Dr. Sudha Rao"}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                {role}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user?.department || "Computer Science"} • Roll: <span className="font-mono">{user?.roll || "T-CS-01"}</span>
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{user?.email || "sudha.rao@college.edu"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleRoleChange(role === "teacher" ? "student" : "teacher")}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg border border-input bg-background hover:bg-muted text-foreground transition-all shadow-xs"
          >
            Switch to {role === "teacher" ? "Student" : "Faculty"} Persona
          </button>
        </div>
      </div>

      {/* Role Switcher Detail */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Evaluation Academic Personas
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Toggle between faculty and student views to evaluate role-based access control and dashboards:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => handleRoleChange("teacher")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              role === "teacher"
                ? "border-primary bg-primary/5 shadow-2xs"
                : "border-border hover:border-primary/50 bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">Faculty / Teacher Persona</span>
              {role === "teacher" && <CheckCircle2 className="w-4 h-4 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Full administrative privileges: schedule sessions, mark attendance, enter examination grades, execute DBMS procedures.
            </p>
          </div>

          <div
            onClick={() => handleRoleChange("student")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              role === "student"
                ? "border-primary bg-primary/5 shadow-2xs"
                : "border-border hover:border-primary/50 bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">Student Persona</span>
              {role === "student" && <CheckCircle2 className="w-4 h-4 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Student viewpoint: view personal attendance standing, course enrollments, examination transcripts, and campus activities.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Architecture Overview for Evaluators */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Laptop className="w-4 h-4 text-primary" />
          Technical Architecture & Evaluation Specifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
            <span className="font-bold text-foreground">FEE-II Frontend</span>
            <p className="text-muted-foreground text-[11px]">
              React 19, Tailwind CSS v4, TanStack Router, Recharts, Lucide Icons. Complete vanilla FEE-II portal preserved under <code className="font-mono">/sms/</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
            <span className="font-bold text-foreground">DBMS (MySQL 8.0)</span>
            <p className="text-muted-foreground text-[11px]">
              InnoDB Engine, 15 Relational Tables, 15 Triggers, 6 Stored Procedures, 3 Stored Functions, 4 Analytical Views. Strict ACID transactions.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
            <span className="font-bold text-foreground">Programming in Java</span>
            <p className="text-muted-foreground text-[11px]">
              Spring Boot 3.2.5, JDK 21 LTS, Direct JDBC transactions, Streams API, Custom Comparators, Generics, ThreadPools, CountDownLatch, CSV I/O.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border">
          <span>Local/Offline Architecture: 100% On-Premise MySQL & Spring Boot</span>
          <span>Chitkara University Batch 2025</span>
        </div>
      </div>
    </div>
  );
}
