import React, { createContext, useContext, useEffect, useState } from "react";
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
  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await login(data.get("identifier"), data.get("password"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-center px-4 py-8">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Campus Harmony</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in with the account issued by your institute.
        </p>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label>
            Account ID
            <input
              required
              name="identifier"
              autoComplete="username"
              className="mt-1 block w-full rounded-md border border-border bg-background p-2"
            />
          </label>
          <label>
            Password
            <input
              required
              name="password"
              type="password"
              autoComplete="current-password"
              className="mt-1 block w-full rounded-md border border-border bg-background p-2"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="rounded-md bg-primary p-2 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
