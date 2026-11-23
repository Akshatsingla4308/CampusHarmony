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
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 flex-col justify-between p-12 bg-slate-950 text-white relative overflow-hidden">
        {/* Background Decorative Gradients & Accents */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-primary/25">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                CampusHarmony
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  ERP 2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Sunrise Institute of Technology</p>
            </div>
          </div>
        </div>

        {/* Value Proposition & Highlights */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-indigo-300 text-xs font-semibold mb-6">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Role-Based Academic Governance
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
            One Unified Platform for Higher Education.
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            Experience automated class scheduling, instantaneous lecture attendance, gradebook management, and transparent grievance resolution across administration, faculty, and students.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-indigo-400 shrink-0 mt-0.5">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Live Attendance & Defaulters Tracking</h3>
                <p className="text-xs text-slate-400 mt-0.5">Instant period-by-period roll call with automated 75% threshold alerts.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-indigo-400 shrink-0 mt-0.5">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Continuous Evaluations & Transcripts</h3>
                <p className="text-xs text-slate-400 mt-0.5">Structured assessments, GPA calculations, and tamper-resistant grade recording.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-indigo-400 shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Grievance & Audit Accountability</h3>
                <p className="text-xs text-slate-400 mt-0.5">Formal complaint tracking and complete transactional audit logs.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Enterprise Campus Management</span>
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
              <div className="text-xs text-muted-foreground">Sunrise Institute of Technology</div>
            </div>
          </div>

          <div className="portal-card p-6 sm:p-8 shadow-sm">
            {/* Form Title & Subtitle */}
            <div className="space-y-1.5 mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign In</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Enter your institute-issued credentials to access your academic dashboard.
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
                <label className="portal-label" htmlFor="identifier">
                  Account ID / Login
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
                    className="portal-input pl-9"
                    disabled={busy}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="portal-label mb-0" htmlFor="password">
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
                    placeholder="Enter your password"
                    className="portal-input pl-9 pr-10"
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
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
                  className="portal-button-primary w-full gap-2 shadow-md shadow-primary/20 text-sm font-semibold"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to CampusHarmony</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-border/60 text-center">
              <p className="text-[11px] text-muted-foreground">
                Role-based authorization is enforced by backend security. Role dashboard is automatically assigned upon login.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
