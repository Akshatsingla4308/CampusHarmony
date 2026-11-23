import React, { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth, SignIn } from "../../context/AuthContext";

export function AppLayout({ children }) {
  const { user, loading, error } = useAuth();
  const path = useRouterState().location.pathname;
  const [openMenuPath, setOpenMenuPath] = useState(null);
  const menuOpen = openMenuPath === path;
  useEffect(() => {
    if (menuOpen) document.querySelector("#portal-navigation nav a")?.focus();
  }, [menuOpen]);

  function closeMenuOnEscape(event) {
    if (!menuOpen || event.key !== "Escape") return;
    setOpenMenuPath(null);
    document.getElementById("portal-menu-toggle")?.focus();
  }
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
    <div className="min-h-screen lg:flex" onKeyDown={closeMenuOnEscape}>
      <a
        href="#main-content"
        className="portal-button sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50"
      >
        Skip to content
      </a>
      <Sidebar menuOpen={menuOpen} onNavigate={() => setOpenMenuPath(null)} />
      <div className="flex-1 min-w-0">
        <Navbar menuOpen={menuOpen} toggleMenu={() => setOpenMenuPath(menuOpen ? null : path)} />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-screen-2xl min-w-0 p-4 sm:p-6 lg:px-8"
        >
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
