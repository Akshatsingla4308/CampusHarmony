/* =========================================================
   auth.js — Sign-in session, teacher list and workspaces.
   Loaded by login.html and by every other page (before app.js).
   ---------------------------------------------------------
   FULL-STACK INTEGRATION:
   Communicates directly with Spring Boot REST API:
   http://localhost:8080/api/auth/*
   ========================================================= */
window.SMS_AUTH = (() => {
  "use strict";

  const BACKEND_URL = "http://localhost:8080/api";
  const SESSION_KEY = "sms.session";
  const REG_KEY = "sms.teachers.registered";
  const SESSION_HOURS = 12;
  const seed = window.SMS_SEED || {};

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- Subjects ---------- */
  let subjects = seed.subjects || [
    { key: "mathematics", label: "Mathematics" },
    { key: "physics", label: "Physics" },
    { key: "chemistry", label: "Chemistry" },
    { key: "english", label: "English" },
    { key: "computerScience", label: "Computer Science" },
  ];
  const subjectLabel = (key) => (subjects.find((s) => (s.key === key || s.subjectKey === key)) || {}).label || "";

  async function fetchSubjects() {
    try {
      const res = await fetch(`${BACKEND_URL}/subjects`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          subjects = data.map((s) => ({ key: s.subjectKey || s.key, label: s.label }));
          return subjects;
        }
      }
    } catch (e) {
      /* Fallback to local default */
    }
    return subjects;
  }

  /* ---------- Names: "Dr. Sudha Rao" == "sudha  rao" ---------- */
  const normName = (n) =>
    String(n || "")
      .toLowerCase()
      .replace(/^(dr|prof)\.?\s+/, "")
      .replace(/\s+/g, " ")
      .trim();
  const sameName = (a, b) => normName(a) === normName(b);

  /* ---------- Session ---------- */
  function getSession() {
    const sess = read(SESSION_KEY, null);
    if (!sess || !sess.name || !sess.roll) return null;
    const age = Date.now() - new Date(sess.loggedInAt).getTime();
    if (!(age < SESSION_HOURS * 3600 * 1000)) {
      clearSession();
      return null;
    }
    return sess;
  }
  function saveSession(data) {
    return write(SESSION_KEY, { ...data, loggedInAt: new Date().toISOString() });
  }
  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      /* ignore */
    }
  }
  const homeFor = (role) => (role === "teacher" ? "index.html" : "profile.html");

  /* ---------- Teachers & Auth via Spring Boot REST APIs ----------
     If the backend is not running (or its database is not set up), the same
     operations are done locally from the demo data + this browser's storage,
     so sign-in and register keep working. */
  const STUDENTS_KEY = "sms.students.added";
  const normRoll = (r) => String(r || "").trim().toUpperCase();

  function errorMessage(errObj, fallback) {
    if (!errObj) return fallback;
    if (errObj.errors && typeof errObj.errors === "object") {
      const first = Object.values(errObj.errors)[0];
      if (first) return String(first);
    }
    return errObj.message || errObj.error || fallback;
  }

  /* POST JSON. Throws an Error with .offline = true when the server can't be reached or crashes (HTTP 5xx). */
  async function post(path, body, fallbackMsg) {
    let res;
    try {
      res = await fetch(`${BACKEND_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      const err = new Error("Backend server is not reachable.");
      err.offline = true;
      throw err;
    }
    if (!res.ok) {
      let errObj = null;
      try {
        errObj = await res.json();
      } catch (e) {}
      const err = new Error(errorMessage(errObj, fallbackMsg));
      if (res.status >= 500) err.offline = true;
      throw err;
    }
    return res.json();
  }

  function localStudents() {
    return allKnownStudents();
  }

  function loginLocally({ role, name, roll }) {
    const id = normRoll(roll);
    const loggedInAt = new Date().toISOString();
    if (role === "teacher") {
      const t = allTeachers().find((x) => normRoll(x.id) === id);
      if (!t) throw new Error('Teacher ID not found. New teacher? Use "Register here" below.');
      if (!sameName(t.name, name)) throw new Error("Name does not match this teacher ID.");
      return { role: "teacher", name: t.name, roll: normRoll(t.id), subject: t.subject, workspace: t.workspace, loggedInAt };
    }
    const s = localStudents().find((x) => normRoll(x.roll) === id);
    if (!s) throw new Error('Roll number not found. New student? Use "Register here" below.');
    if (!sameName(s.name, name)) throw new Error("Name does not match this roll number.");
    return {
      role: "student", id: s.id, name: s.name, roll: normRoll(s.roll),
      department: s.department, semester: s.semester, workspace: "demo", loggedInAt,
    };
  }

  async function loginWithBackend({ role, name, roll }) {
    try {
      return await post("/auth/login", { role, name, roll }, "Login failed. Please check your credentials.");
    } catch (err) {
      if (err.offline) return loginLocally({ role, name, roll });
      throw err;
    }
  }

  async function registerTeacherWithBackend({ id, name, subject }) {
    let teacher;
    try {
      teacher = await post("/auth/register-teacher", { id, name, subject }, "Registration failed.");
    } catch (err) {
      if (!err.offline) throw err;
      const cleanId = normRoll(id);
      if (allTeachers().some((t) => normRoll(t.id) === cleanId)) {
        throw new Error("This teacher ID is already registered. Please sign in or pick another ID.");
      }
      teacher = { id: cleanId, name, subject };
    }
    registerTeacher(teacher); /* remember in this browser too */
    return teacher;
  }

  async function registerStudentWithBackend({ roll, name, department, semester }) {
    try {
      return await post("/auth/register-student", { roll, name, department, semester: Number(semester) }, "Registration failed.");
    } catch (err) {
      if (!err.offline) throw err;
      const cleanRoll = normRoll(roll);
      if (localStudents().some((s) => normRoll(s.roll) === cleanRoll)) {
        throw new Error("This roll number is already registered. Please sign in.");
      }
      const list = read(STUDENTS_KEY, []);
      const student = {
        id: Date.now(),
        roll: cleanRoll,
        name,
        department,
        semester: Number(semester),
        email: `${cleanRoll.toLowerCase()}@campus.local`,
        phone: "—",
        status: "Active",
        gender: "Other",
        address: "",
        attendance: null,
      };
      list.push(student);
      write(STUDENTS_KEY, list);
      return student;
    }
  }

  function registeredTeachers() {
    return read(REG_KEY, []).map((t) => ({ ...t, workspace: "own" }));
  }
  function allTeachers() {
    return [
      ...(seed.teachers || []).map((t) => ({ ...t, workspace: "demo" })),
      ...registeredTeachers(),
    ];
  }
  function registerTeacher({ id, name, subject }) {
    const list = read(REG_KEY, []);
    const cleanId = normRoll(id);
    if (!list.some((t) => normRoll(t.id) === cleanId)) list.push({ id: cleanId, name, subject });
    return write(REG_KEY, list);
  }

  /* ---------- Workspaces ---------- */
  const workspacePrefix = (teacherId) => `sms.ws.${teacherId}.`;

  function ownPrefixes() {
    const out = new Set();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("sms.ws.")) out.add(k.split(".").slice(0, 3).join(".") + ".");
      }
    } catch (e) {}
    return [...out];
  }

  function allKnownStudents() {
    const list = [...(seed.students || []), ...read("sms.students.added", [])];
    ownPrefixes().forEach((p) => list.push(...read(p + "students.added", [])));
    return list;
  }

  return {
    BACKEND_URL,
    SESSION_HOURS,
    subjects,
    subjectLabel,
    fetchSubjects,
    normName,
    sameName,
    getSession,
    saveSession,
    clearSession,
    homeFor,
    loginWithBackend,
    registerTeacherWithBackend,
    registerStudentWithBackend,
    departments: seed.departments || ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil"],
    registeredTeachers,
    allTeachers,
    registerTeacher,
    workspacePrefix,
    ownPrefixes,
    allKnownStudents,
    read,
    write,
  };
})();
