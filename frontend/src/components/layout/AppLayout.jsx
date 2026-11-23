import React, { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth, SignIn } from "../../context/AuthContext";

export function AppLayout({ children }) {
  const { user, loading, error } = useAuth();
  const path = useRouterState().location.pathname;
  const [openMenuPath, setOpenMenuPath] = useState(null);
  const menuOpen = openMenuPath === path;
  if (loading) return <main className="p-6">Checking session…</main>;
  if (!user) return <SignIn />;
  const foundation =
    path === "/" ||
    path === "/attendance" ||
    path === "/marks" ||
    path === "/timetable" ||
    path === "/defaulters" ||
    path === "/complaints";
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar menuOpen={menuOpen} onNavigate={() => setOpenMenuPath(null)} />
      <div className="flex-1 min-w-0">
        <Navbar menuOpen={menuOpen} toggleMenu={() => setOpenMenuPath(menuOpen ? null : path)} />
        <main className="p-4 sm:p-6">
          {error && <p role="alert">{error}</p>}
          {foundation || user.role === "admin" || path === "/profile" ? (
            children
          ) : (
            <p>This page requires an administrator account.</p>
          )}
        </main>
      </div>
    </div>
  );
}
export default AppLayout;
