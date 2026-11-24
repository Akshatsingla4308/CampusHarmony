import React, { createContext, useContext, useEffect, useState } from "react";
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
  CalendarCheck,
  Award,
  FileText,
} from "lucide-react";
import { api } from "../lib/api";
const Context = createContext(null);
export const useAuth = () => useContext(Context);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api.auth
      .me()
      .then((value) => {
        if (active) setUser(value);
      })
      .catch((e) => {
        if (active && e.status !== 401) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const expired = () => setUser(null);
    window.addEventListener("campus-session-expired", expired);
    return () => {
      active = false;
      window.removeEventListener("campus-session-expired", expired);
    };
  }, []);
  async function login(identifier, password) {
    setError("");
    try {
      setUser(await api.auth.login({ identifier, password }));
    } catch (e) {
      setError(e.message);
    }
  }
  async function logout() {
    try {
      await api.auth.logout();
      setUser(null);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <Context.Provider value={{ user, role: user?.role || "guest", loading, error, login, logout }}>
      {children}
    </Context.Provider>
  );
}
export function SignIn() {
  const { login, error } = useAuth();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!identifier.trim() || !password) return;
    setBusy(true);
    try {
      await login(identifier.trim(), password);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* Left Institutional Showcase Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden border-r border-slate-800">
        {/* Subtle Background Ambience */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white">CampusHarmony</div>
              <p className="text-xs text-slate-400 font-medium">Academic Management System</p>
            </div>
          </div>
        </div>

        {/* Value Proposition & Highlights */}
        <div className="relative z-10 my-auto py-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-indigo-300 text-xs font-semibold mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            University Management Platform
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
            One Unified Platform for Campus Operations.
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            Automated class scheduling, period-level lecture attendance, gradebook evaluations, and transparent grievance resolution for administrators, faculty, and students.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Live Attendance & Defaulters Tracking</h3>
                <p className="text-xs text-slate-400 mt-0.5">Instant period-by-period roll call with automated 75% threshold alerts.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Continuous Evaluations & Marks</h3>
                <p className="text-xs text-slate-400 mt-0.5">Structured assessments, grade matrix, and verified transcript recording.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Grievance & Audit Accountability</h3>
                <p className="text-xs text-slate-400 mt-0.5">Formal complaint tracking with bidirectional administrative resolution.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Enterprise Campus Harmony</span>
          <span>Academic Session 2026–2027</span>
        </div>
      </div>

      {/* Right Login Form Pane */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Brand Banner */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-foreground">CampusHarmony</div>
              <div className="text-xs text-muted-foreground">Academic Management System</div>
            </div>
          </div>

          <div className="portal-card p-6 sm:p-8 shadow-sm border border-border">
            {/* Form Title & Subtitle */}
            <div className="space-y-1.5 mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign In</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Enter your institutional account credentials to access your academic dashboard.
              </p>
            </div>

            {/* Error Alert Box */}
            {error && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-start gap-3 animate-in fade-in-50 duration-150"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-snug">{error}</div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="portal-label text-xs font-semibold" htmlFor="identifier">
                  Account ID / Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                    placeholder="e.g. admin, teacher ID, or roll number"
                    className="portal-input pl-9 text-sm"
                    disabled={busy}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="portal-label text-xs font-semibold mb-0" htmlFor="password">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your account password"
                    className="portal-input pl-9 pr-10 text-sm"
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={busy || !identifier.trim() || !password}
                  className="portal-button-primary w-full py-2.5 text-sm font-semibold gap-2 shadow-md shadow-primary/25 cursor-pointer disabled:cursor-not-allowed"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-border/60 text-center">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Role-based authorization is enforced by backend security. The system automatically opens the appropriate administrator, teacher, or student workspace.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
