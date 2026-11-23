import React, { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { GraduationCap, ShieldAlert } from "lucide-react";
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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Initializing CampusHarmony…</p>
        </div>
      </div>
    );

  if (!user) return <SignIn />;

  const foundation =
    path === "/" ||
    path === "/attendance" ||
    path === "/marks" ||
    path === "/timetable" ||
    path === "/defaulters" ||
    path === "/complaints";

  return (
    <div className="min-h-screen lg:flex bg-background" onKeyDown={closeMenuOnEscape}>
      <a
        href="#main-content"
        className="portal-button sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50"
      >
        Skip to content
      </a>
      <Sidebar menuOpen={menuOpen} onNavigate={() => setOpenMenuPath(null)} />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <Navbar menuOpen={menuOpen} toggleMenu={() => setOpenMenuPath(menuOpen ? null : path)} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 mx-auto w-full max-w-screen-2xl min-w-0 p-4 sm:p-6 lg:p-8"
        >
          {error && (
            <div role="alert" className="mb-4 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          {foundation || user.role === "admin" || path === "/profile" ? (
            children
          ) : (
            <div className="portal-card max-w-md mx-auto p-8 text-center my-12 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Restricted Access</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This administrative section requires an institutional administrator account.
              </p>
              <div className="mt-6">
                <Link to="/" className="portal-button-primary">
                  Return to Dashboard
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
