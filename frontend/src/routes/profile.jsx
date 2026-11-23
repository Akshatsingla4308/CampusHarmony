import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import { Shield, CalendarCheck, LogOut } from "lucide-react";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const { user, role, logout } = useAuth();
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
            {user?.name ? user.name.charAt(0) : "U"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                <Shield className="w-3 h-3" />
                {role}
              </span>
              <span className="text-xs text-muted-foreground font-mono">@{user?.login}</span>
            </div>
          </div>
        </div>

        <div className="py-4 space-y-3 text-sm">
          <div className="flex justify-between py-1 border-b border-border/50">
            <span className="text-muted-foreground">Account Identifier</span>
            <span className="font-mono font-medium">{user?.login}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/50">
            <span className="text-muted-foreground">Assigned Role</span>
            <span className="font-semibold capitalize">{role}</span>
          </div>
          {user?.teacherId && (
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Teacher ID</span>
              <span className="font-mono font-medium">{user.teacherId}</span>
            </div>
          )}
          {user?.studentId && (
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Student Database ID</span>
              <span className="font-mono font-medium">{user.studentId}</span>
            </div>
          )}
        </div>

        <div className="pt-4 flex gap-3">
          <Link
            to="/attendance"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
          >
            <CalendarCheck className="w-4 h-4" />
            Go to Attendance Workspace
          </Link>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
