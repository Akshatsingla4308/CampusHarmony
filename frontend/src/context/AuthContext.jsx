import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

const SESSION_KEY = "sms.session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Ignore
    }
    // Default demo faculty session for instant academic viva evaluation
    return {
      roll: "T-CS-01",
      name: "Dr. Sudha Rao",
      role: "teacher",
      department: "Computer Science",
      departmentId: 1,
      subject: "computerScience",
      email: "sudha.rao@college.edu",
      loggedInAt: new Date().toISOString(),
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      } catch (e) {
        // Storage full/disabled
      }
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  const login = async (role, identifier, password) => {
    setLoading(true);
    setError(null);
    try {
      // Attempt backend auth API
      const res = await api.auth.login({ role, identifier, password });
      const sessionUser = {
        roll: res.roll || identifier,
        name: res.name || "Faculty Member",
        role: role || res.role || "teacher",
        department: res.department || "Computer Science",
        departmentId: res.departmentId || 1,
        email: res.email || `${identifier.toLowerCase()}@college.edu`,
        loggedInAt: new Date().toISOString(),
      };
      setUser(sessionUser);
      return sessionUser;
    } catch (err) {
      // Local fallback for offline evaluation demo accounts
      if (role === "teacher" && (identifier === "sudha" || identifier === "T-CS-01")) {
        const demo = {
          roll: "T-CS-01",
          name: "Dr. Sudha Rao",
          role: "teacher",
          department: "Computer Science",
          departmentId: 1,
          subject: "computerScience",
          email: "sudha.rao@college.edu",
          loggedInAt: new Date().toISOString(),
        };
        setUser(demo);
        return demo;
      } else if (role === "student") {
        const demoStudent = {
          roll: identifier || "CS-2101",
          name: "Rahul Sharma",
          role: "student",
          department: "Computer Science",
          departmentId: 1,
          email: "rahul@college.edu",
          loggedInAt: new Date().toISOString(),
        };
        setUser(demoStudent);
        return demoStudent;
      }
      setError(err.message || "Invalid credentials");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const switchRole = (newRole) => {
    if (newRole === "teacher") {
      setUser({
        roll: "T-CS-01",
        name: "Dr. Sudha Rao",
        role: "teacher",
        department: "Computer Science",
        departmentId: 1,
        subject: "computerScience",
        email: "sudha.rao@college.edu",
        loggedInAt: new Date().toISOString(),
      });
    } else {
      setUser({
        roll: "CS-2101",
        name: "Rahul Sharma",
        role: "student",
        department: "Computer Science",
        departmentId: 1,
        email: "rahul@college.edu",
        loggedInAt: new Date().toISOString(),
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "guest",
        isLoggedIn: !!user,
        loading,
        error,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
