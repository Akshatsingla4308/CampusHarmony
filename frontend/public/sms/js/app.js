/* =========================================================
   app.js — Shared shell: data access layer, sidebar, theme,
   toasts, modals, loader, helpers.
   ---------------------------------------------------------
   BACKEND SWAP: every read/write goes through SMS.api.*.
   Replace the body of those functions with fetch("/api/...")
   and the rest of the app keeps working unchanged.
   ========================================================= */

/* ---------- Auth guard: every page except login.html needs a session ---------- */
(function authGuard() {
  const page = location.pathname.split("/").pop();
  const session = window.SMS_AUTH && window.SMS_AUTH.getSession();
  if (page === "login.html") return;
  if (!session) {
    location.replace("login.html");
    return;
  }
  /* Students may only open their own profile page; teachers can open everything */
  if (session.role === "student" && page !== "profile.html") location.replace("profile.html");
})();

const SMS = (() => {
  "use strict";

  /* ---------- Local storage helpers ---------- */
  const LS = {
    read(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    write(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        /* storage unavailable — ignore */
      }
    },
  };

  /* ---------- Who is logged in, and which data do they see? ---------- */
  const AUTH = window.SMS_AUTH;
  const seed = window.SMS_SEED || {};
  const session0 = AUTH.getSession();
  const isTeacher = !!session0 && session0.role === "teacher";
  const isStudent = !!session0 && session0.role === "student";
  /* A teacher who REGISTERED has an own, empty workspace; built-in teachers share the college data */
  const ownWorkspace = isTeacher && session0.workspace === "own";
  const PREFIX = ownWorkspace ? AUTH.workspacePrefix(session0.roll) : "sms.";

  const SUBJECTS = seed.subjects || [];
  const mySubject = isTeacher ? SUBJECTS.find((s) => s.key === session0.subject) || null : null;

  const keysFor = (prefix) => ({
    added: prefix + "students.added",
    removed: prefix + "students.removed",
    patches: prefix + "students.patches",
    courses: prefix + "courses.added",
    attendance: prefix + "attendance.overrides",
    marks: prefix + "marks",
  });
  const KEYS = {
    theme: "sms.theme",
    prefs: "sms.prefs",
    session: "sms.session",
    activity: PREFIX + "activity",
    ...Object.fromEntries(Object.entries(keysFor(PREFIX)).map(([k, v]) => [k === "added" ? "newStudents" : k, v])),
  };

  /* Build one workspace (students, attendance, marks, courses) from seed data + saved changes */
  function buildWorkspace(prefix, withSeed) {
    const k = keysFor(prefix);
    const removed = new Set(LS.read(k.removed, []));
    const patches = LS.read(k.patches, {});
    const students = [
      ...(withSeed ? seed.students || [] : []).map((s) => ({ ...s })),
      ...LS.read(k.added, []).map((s) => ({ ...s })),
    ]
      .filter((s) => !removed.has(s.id))
      .map((s) => Object.assign(s, patches[s.id] || {}, { id: s.id }));

    const baseAtt = new Map((withSeed ? seed.attendanceRecords || [] : []).map((r) => [r.studentId, { ...r }]));
    const attOver = new Map(LS.read(k.attendance, []).map((o) => [o.studentId, o]));
    const attendance = students.map((s) => {
      const rec = Object.assign(
        baseAtt.get(s.id) || { studentId: s.id, totalDays: 0, presentDays: 0, absentDays: 0, lastMarked: "—" },
        attOver.get(s.id) || {}
      );
      rec.name = s.name;
      rec.roll = s.roll || `ID-${s.id}`;
      rec.department = s.department;
      s.attendance = rec.totalDays ? Math.round((rec.presentDays / rec.totalDays) * 100) : null;
      return rec;
    });

    const baseMarks = new Map((withSeed ? seed.marksRecords || [] : []).map((r) => [r.studentId, { ...r }]));
    const markOver = LS.read(k.marks, {});
    const marks = students.map((s) => {
      const rec = baseMarks.get(s.id) || { studentId: s.id };
      SUBJECTS.forEach((sub) => {
        if (rec[sub.key] === undefined) rec[sub.key] = null;
      });
      return Object.assign(rec, markOver[s.id] || {});
    });

    const courses = [
      ...(withSeed ? seed.courses || [] : []).map((c) => ({ ...c })),
      ...LS.read(k.courses, []).map((c) => ({ ...c })),
    ];
    return { students, attendance, marks, courses };
  }

  let ws;
  if (isStudent) {
    /* A student looks themselves up across the college data and every teacher's class */
    const parts = [buildWorkspace("sms.", true), ...AUTH.ownPrefixes().map((p) => buildWorkspace(p, false))];
    ws = {
      students: parts.flatMap((p) => p.students),
      attendance: parts.flatMap((p) => p.attendance),
      marks: parts.flatMap((p) => p.marks),
      courses: parts.flatMap((p) => p.courses),
    };
  } else {
    ws = buildWorkspace(PREFIX, !ownWorkspace);
  }

  /* ---------- In-memory store (simulates server state) ---------- */
  const store = {
    departments: [...(seed.departments || [])],
    students: ws.students,
    attendance: ws.attendance,
    marks: ws.marks,
    /* A teacher only sees the courses they teach */
    courses: isTeacher ? ws.courses.filter((c) => AUTH.sameName(c.faculty, session0.name)) : ws.courses,
    activity: LS.read(KEYS.activity, []),
  };

  const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms));
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const today = () => new Date().toISOString().slice(0, 10);

  function timeAgo(iso) {
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    const days = Math.round(hrs / 24);
    return days === 1 ? "Yesterday" : `${days} days ago`;
  }

  /* ---------- Backend REST API Client & Data Access Layer ---------- */
  const BACKEND_BASE = "http://localhost:8080/api";

  async function apiFetch(endpoint, options = {}) {
    const url = `${BACKEND_BASE}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let errMsg = `Request failed: HTTP ${res.status}`;
      try {
        const body = await res.json();
        errMsg = body.message || body.error || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  const api = {
    async getDepartments() {
      try {
        return await apiFetch("/departments");
      } catch (e) {
        return clone(store.departments);
      }
    },
    async getStudents() {
      try {
        const q = ownWorkspace ? `?teacherId=${encodeURIComponent(session0.roll)}` : "";
        return await apiFetch(`/students${q}`);
      } catch (e) {
        await delay();
        return clone(store.students);
      }
    },
    async getStudent(id) {
      try {
        return await apiFetch(`/students/${id}`);
      } catch (e) {
        await delay(80);
        return clone(store.students.find((s) => s.id === Number(id)) || null);
      }
    },
    async createStudent(payload) {
      try {
        const body = {
          ...payload,
          teacherId: ownWorkspace ? session0.roll : null,
        };
        const created = await apiFetch("/students", {
          method: "POST",
          body: JSON.stringify(body),
        });
        return created;
      } catch (e) {
        console.warn("Backend API error, using local fallback:", e);
        await delay();
        const student = { status: "Active", ...payload, id: Number(payload.id || Date.now()), attendance: null };
        return clone(student);
      }
    },
    async updateStudent(id, patch) {
      try {
        return await apiFetch(`/students/${id}`, {
          method: "PUT",
          body: JSON.stringify(patch),
        });
      } catch (e) {
        console.warn("Backend API error, using local fallback:", e);
        await delay();
        const s = store.students.find((st) => st.id === Number(id));
        if (!s) return null;
        Object.assign(s, patch, { id: Number(id) });
        return clone(s);
      }
    },
    async removeStudent(id) {
      try {
        await apiFetch(`/students/${id}`, { method: "DELETE" });
        return { ok: true, id: Number(id) };
      } catch (e) {
        console.warn("Backend API error, using local fallback:", e);
        await delay();
        return { ok: true, id: Number(id) };
      }
    },
    async getCourses() {
      try {
        const q = ownWorkspace ? `?teacherId=${encodeURIComponent(session0.roll)}` : "";
        return await apiFetch(`/courses${q}`);
      } catch (e) {
        await delay();
        return clone(
          store.courses.map((c) => ({
            ...c,
            totalStudents: store.students.filter((s) => Number(s.semester) === Number(c.semester)).length,
          }))
        );
      }
    },
    async addCourse(payload) {
      try {
        const body = {
          ...payload,
          faculty: isTeacher ? session0.name : payload.faculty,
          teacherId: ownWorkspace ? session0.roll : null,
        };
        return await apiFetch("/courses", {
          method: "POST",
          body: JSON.stringify(body),
        });
      } catch (e) {
        console.warn("Backend API error, using local fallback:", e);
        await delay(120);
        return clone(payload);
      }
    },
    async getAttendance() {
      try {
        const q = ownWorkspace ? `?teacherId=${encodeURIComponent(session0.roll)}` : "";
        return await apiFetch(`/attendance${q}`);
      } catch (e) {
        await delay();
        return clone(store.attendance);
      }
    },
    async markAttendance(studentId, present) {
      try {
        return await apiFetch("/attendance/mark", {
          method: "POST",
          body: JSON.stringify({ studentId: Number(studentId), present: Boolean(present) }),
        });
      } catch (e) {
        console.warn("Backend API error, using local fallback:", e);
        await delay(90);
        const rec = store.attendance.find((r) => r.studentId === Number(studentId));
        return clone(rec);
      }
    },
    async getMarks() {
      try {
        const q = ownWorkspace ? `?teacherId=${encodeURIComponent(session0.roll)}` : "";
        return await apiFetch(`/marks${q}`);
      } catch (e) {
        await delay();
        return clone(store.marks);
      }
    },
    async saveMarks(entries) {
      if (!mySubject) throw new Error("No subject is set for this teacher.");
      try {
        return await apiFetch("/marks/save", {
          method: "POST",
          body: JSON.stringify({
            teacherId: ownWorkspace ? session0.roll : null,
            subjectKey: mySubject.key,
            entries,
          }),
        });
      } catch (e) {
        console.error("Failed to save marks via backend:", e);
        throw e;
      }
    },
    async getStats() {
      try {
        const q = ownWorkspace ? `?teacherId=${encodeURIComponent(session0.roll)}` : "";
        return await apiFetch(`/dashboard/stats${q}`);
      } catch (e) {
        await delay(80);
        const students = store.students;
        const withAtt = students.filter((s) => s.attendance != null);
        const avg = withAtt.length ? Math.round(withAtt.reduce((a, s) => a + s.attendance, 0) / withAtt.length) : null;
        const low = withAtt.filter((s) => s.attendance < 75).length;
        const ongoing = store.courses.filter((c) => c.status === "Ongoing").length;
        return [
          { key: "students", label: "Total Students", value: students.length, delta: students.length ? "In your class list" : "Add students to begin", icon: "👥" },
          { key: "subject", label: "My Subject", value: mySubject ? mySubject.label : "Not set", delta: `Teacher ID ${session0 ? session0.roll : ""}`, icon: "🎓" },
          { key: "courses", label: "My Courses", value: store.courses.length, delta: `${ongoing} ongoing`, icon: "📚" },
          { key: "attendance", label: "Average Attendance", value: avg == null ? "—" : `${avg}%`, delta: avg == null ? "No attendance marked yet" : "Across your students", icon: "📈" },
          { key: "low", label: "Low Attendance", value: low, delta: "Students below 75%", icon: "⚠️" },
        ];
      }
    },
    async getActivity() {
      try {
        const q = ownWorkspace ? `?teacherId=${encodeURIComponent(session0.roll)}` : "";
        return await apiFetch(`/dashboard/activity${q}`);
      } catch (e) {
        await delay(80);
        return clone(store.activity).slice(0, 8).map((a) => ({ ...a, time: a.at ? timeAgo(a.at) : a.time }));
      }
    },
    logActivity(text, type = "notice") {
      try {
        apiFetch("/dashboard/activity", {
          method: "POST",
          body: JSON.stringify({
            text,
            type,
            teacherId: ownWorkspace ? session0.roll : null,
          }),
        }).catch(() => {});
      } catch (e) {}
      const entry = { text, type, at: new Date().toISOString() };
      store.activity.unshift(entry);
      LS.write(KEYS.activity, store.activity.slice(0, 20));
      return entry;
    },
  };

  /* ---------- Marks maths ---------- */
  function gradeFor(percentage) {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
  }

  /* Works on a student's full record. Subjects not entered yet are skipped (result = Pending) */
  function summarizeMarks(record) {
    const entered = SUBJECTS.filter((s) => record[s.key] != null);
    const total = entered.reduce((sum, s) => sum + Number(record[s.key]), 0);
    const max = entered.length * 100;
    const percentage = max ? Math.round((total / max) * 1000) / 10 : 0;
    const complete = entered.length === SUBJECTS.length;
    const failed = entered.some((s) => Number(record[s.key]) < 40);
    return {
      total,
      max,
      percentage,
      grade: max ? gradeFor(percentage) : "—",
      complete,
      result: !complete ? "Pending" : failed || percentage < 50 ? "Fail" : "Pass",
    };
  }

  /* Attendance can be "no data yet" (null) for a brand new student */
  const pctText = (v) => (v == null ? "—" : `${v}%`);
  const pctWidth = (v) => (v == null ? 0 : v);

  /* ---------- Theme ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    LS.write(KEYS.theme, theme);
    document.querySelectorAll("[data-theme-toggle]").forEach((el) => {
      el.setAttribute("aria-pressed", String(theme === "dark"));
    });
  }
  function applyDensity() {
    const prefs = LS.read(KEYS.prefs, {});
    document.documentElement.setAttribute("data-density", prefs.density === "compact" ? "compact" : "comfortable");
  }
  function initTheme() {
    applyTheme(LS.read(KEYS.theme, "light"));
    applyDensity();
  }
  function toggleTheme() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    toast(`${next === "dark" ? "Dark" : "Light"} mode enabled`, "info");
  }

  /* ---------- Toasts ---------- */
  const TOAST_ICONS = { success: "✔", error: "✕", info: "ℹ", warning: "!" };
  function toast(message, type = "success") {
    let host = document.querySelector(".toast-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "toast-host";
      host.setAttribute("role", "status");
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.innerHTML = `<span class="toast__icon">${TOAST_ICONS[type] || "ℹ"}</span>
      <span class="toast__msg"></span>
      <button class="toast__close" type="button" aria-label="Dismiss notification">×</button>`;
    el.querySelector(".toast__msg").textContent = message;
    host.appendChild(el);
    const close = () => {
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), 260);
    };
    el.querySelector(".toast__close").addEventListener("click", close);
    setTimeout(close, 3600);
  }

  /* ---------- Modal ---------- */
  let lastFocused = null;
  function openModal(html, { size = "md", labelledBy = "" } = {}) {
    closeModal();
    lastFocused = document.activeElement;
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `<div class="modal modal--${size}" role="dialog" aria-modal="true" ${
      labelledBy ? `aria-labelledby="${labelledBy}"` : ""
    }>${html}</div>`;
    document.body.appendChild(overlay);
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => overlay.classList.add("is-open"));
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) closeModal();
    });
    overlay.querySelectorAll("[data-close-modal]").forEach((b) =>
      b.addEventListener("click", () => closeModal())
    );
    const focusable = overlay.querySelector(
      "input, select, textarea, button:not([data-close-modal])"
    );
    if (focusable) focusable.focus();
    return overlay;
  }
  function closeModal() {
    const overlay = document.querySelector(".modal-overlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    setTimeout(() => overlay.remove(), 220);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  function confirmDialog({ title, message, confirmLabel = "Confirm", danger = true }) {
    return new Promise((resolve) => {
      const overlay = openModal(
        `<div class="modal__head"><h2 class="modal__title" id="confirm-title">${escapeHtml(
          title
        )}</h2></div>
         <div class="modal__body"><p class="text-muted">${escapeHtml(message)}</p></div>
         <div class="modal__foot">
           <button class="btn btn--ghost" type="button" data-cancel>Cancel</button>
           <button class="btn ${danger ? "btn--danger" : "btn--primary"}" type="button" data-ok>${escapeHtml(
          confirmLabel
        )}</button>
         </div>`,
        { size: "sm", labelledBy: "confirm-title" }
      );
      overlay.querySelector("[data-cancel]").addEventListener("click", () => {
        closeModal();
        resolve(false);
      });
      overlay.querySelector("[data-ok]").addEventListener("click", () => {
        closeModal();
        resolve(true);
      });
    });
  }

  /* ---------- Small helpers ---------- */
  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function highlight(text, query) {
    const safe = escapeHtml(text);
    if (!query) return safe;
    const q = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!q) return safe;
    return safe.replace(new RegExp(q, "gi"), (m) => `<mark class="hl">${m}</mark>`);
  }
  function initials(name) {
    return String(name || "")
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] || "")
      .join("")
      .toUpperCase();
  }
  function avatarHue(seed) {
    const str = String(seed);
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
    return h;
  }
  function debounce(fn, wait = 180) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }
  function statusClass(status) {
    const s = String(status).toLowerCase();
    if (s === "active" || s === "ongoing" || s === "pass") return "pill--ok";
    if (s === "probation" || s === "upcoming") return "pill--warn";
    if (s === "inactive" || s === "fail") return "pill--bad";
    return "pill--muted";
  }
  function attendanceTone(pct) {
    if (pct >= 85) return "ok";
    if (pct >= 70) return "warn";
    return "bad";
  }
  function emptyState(title, message, icon = "🗂") {
    return `<div class="empty fade-in">
      <div class="empty__icon" aria-hidden="true">${icon}</div>
      <h3 class="empty__title">${escapeHtml(title)}</h3>
      <p class="empty__msg">${escapeHtml(message)}</p>
    </div>`;
  }
  function skeletonRows(rows = 6, cols = 8) {
    let out = "";
    for (let r = 0; r < rows; r++) {
      out += "<tr>";
      for (let c = 0; c < cols; c++) out += '<td><span class="skeleton"></span></td>';
      out += "</tr>";
    }
    return out;
  }

  /* ---------- App shell: sidebar, topbar, loader ---------- */
  const NAV = [
    { label: "Dashboard", href: "index.html", icon: "◈" },
    { label: "Students", href: "students.html", icon: "❏" },
    { label: "Attendance", href: "attendance.html", icon: "✓" },
    { label: "Courses", href: "courses.html", icon: "▣" },
    { label: "Marks", href: "marks.html", icon: "∑" },
    { label: "Student Profile", href: "profile.html", icon: "☺" },
    { label: "Settings", href: "#settings", icon: "⚙", action: "settings" },
    { label: "Logout", href: "#logout", icon: "⏻", action: "logout" },
  ];

  function currentPage() {
    const path = location.pathname.split("/").pop();
    return path && path.length ? path : "index.html";
  }

  function visibleNav() {
    if (isStudent) return NAV.filter((i) => i.href === "profile.html" || i.action);
    return NAV;
  }

  /* Academic term worked out from today's date: Monsoon (Jul-Nov), Winter (Dec-Apr), Summer (May-Jun) */
  function currentTerm() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    let name, start, end;
    if (m >= 6 && m <= 10) { name = "Monsoon"; start = new Date(y, 6, 1); end = new Date(y, 11, 1); }
    else if (m >= 4 && m <= 5) { name = "Summer"; start = new Date(y, 4, 1); end = new Date(y, 6, 1); }
    else {
      const sy = m === 11 ? y : y - 1;
      name = "Winter"; start = new Date(sy, 11, 1); end = new Date(sy + 1, 4, 1);
    }
    const pct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
    return { name: `${name} ${start.getFullYear()}`, pct };
  }

  function renderShell() {
    const term = currentTerm();
    const page = currentPage();
    const sidebar = document.querySelector("[data-sidebar]");
    if (sidebar) {
      sidebar.innerHTML = `
        <div class="brand">
          <div class="brand__mark" aria-hidden="true">SM</div>
          <div class="brand__text">
            <strong>Sunrise Institute</strong>
            <span>Student ERP</span>
          </div>
        </div>
        <nav class="nav" aria-label="Main navigation">
          ${visibleNav().map(
            (item) => `
            <a class="nav__link ${item.href === page ? "is-active" : ""}" href="${item.href}"
               ${item.action ? `data-nav-action="${item.action}"` : ""}>
              <span class="nav__icon" aria-hidden="true">${item.icon}</span>
              <span>${item.label}</span>
            </a>`
          ).join("")}
        </nav>
        <div class="sidebar__foot">
          <div class="term-card">
            <span class="term-card__label">Academic Term</span>
            <strong>${term.name}</strong>
            <div class="bar"><div class="bar__fill" style="width:${term.pct}%"></div></div>
            <span class="term-card__hint">${term.pct}% of term completed</span>
          </div>
        </div>`;

      sidebar.querySelectorAll("[data-nav-action]").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const action = link.dataset.navAction;
          if (action === "settings") openSettings();
          else openLogout();
          closeSidebar();
        });
      });
    }

    /* Show the signed-in user in the topbar (teachers also see their subject) */
    const session = session0;
    if (session) {
      document.querySelectorAll(".user-chip").forEach((chip) => {
        const av = chip.querySelector(".avatar");
        const meta = chip.querySelector(".user-chip__meta");
        if (av) av.textContent = initials(session.name);
        const line = isTeacher
          ? `${mySubject ? mySubject.label : "Subject not set"} Teacher`
          : `Student · ${session.roll}`;
        if (meta) meta.innerHTML = `<strong>${escapeHtml(session.name)}</strong><span>${escapeHtml(line)}</span>`;
      });
      if (isTeacher) {
        const titles = document.querySelector(".topbar__titles");
        if (titles && !titles.querySelector(".subject-pill")) {
          const pill = document.createElement("span");
          pill.className = "subject-pill";
          pill.textContent = `📘 Subject: ${mySubject ? mySubject.label : "Not set"}`;
          titles.appendChild(pill);
        }
        const h1 = document.querySelector(".topbar__titles h1");
        if (h1 && page === "index.html") h1.textContent = "Teacher Dashboard";
      }
    }

    /* Topbar controls */
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) =>
      btn.addEventListener("click", toggleTheme)
    );
    document.querySelectorAll("[data-sidebar-toggle]").forEach((btn) =>
      btn.addEventListener("click", () => {
        document.body.classList.toggle("sidebar-open");
      })
    );
    const scrim = document.querySelector("[data-scrim]");
    if (scrim) scrim.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal();
        closeSidebar();
      }
    });

    /* Loading screen */
    const loader = document.querySelector("[data-loader]");
    if (loader) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          loader.classList.add("is-hidden");
          setTimeout(() => loader.remove(), 400);
        }, 350);
      });
    }
  }

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
  }

  function openSettings() {
    const prefs = LS.read(KEYS.prefs, { density: "comfortable", rows: 8 });
    const overlay = openModal(
      `<div class="modal__head">
         <h2 class="modal__title" id="settings-title">Preferences</h2>
         <button class="icon-btn" type="button" data-close-modal aria-label="Close">×</button>
       </div>
       <div class="modal__body">
         <div class="field">
           <label for="pref-rows">Table rows per page</label>
           <select id="pref-rows" class="input">
             ${[5, 8, 10, 15]
               .map((n) => `<option value="${n}" ${n === prefs.rows ? "selected" : ""}>${n}</option>`)
               .join("")}
           </select>
         </div>
         <div class="field">
           <label for="pref-density">Interface density</label>
           <select id="pref-density" class="input">
             ${["comfortable", "compact"]
               .map(
                 (d) =>
                   `<option value="${d}" ${d === prefs.density ? "selected" : ""}>${
                     d[0].toUpperCase() + d.slice(1)
                   }</option>`
               )
               .join("")}
           </select>
         </div>
       </div>
       <div class="modal__foot">
         <button class="btn btn--ghost" type="button" data-close-modal>Cancel</button>
         <button class="btn btn--primary" type="button" data-save>Save preferences</button>
       </div>`,
      { size: "sm", labelledBy: "settings-title" }
    );
    overlay.querySelector("[data-save]").addEventListener("click", () => {
      LS.write(KEYS.prefs, {
        rows: Number(overlay.querySelector("#pref-rows").value),
        density: overlay.querySelector("#pref-density").value,
      });
      applyDensity();
      closeModal();
      toast("Preferences saved", "success");
    });
  }

  async function openLogout() {
    const ok = await confirmDialog({
      title: "Sign out?",
      message: "You will be returned to the sign-in page.",
      confirmLabel: "Sign out",
    });
    if (ok) {
      AUTH.clearSession();
      location.replace("login.html");
    }
  }

  function breadcrumb(items) {
    const host = document.querySelector("[data-breadcrumb]");
    if (!host) return;
    host.innerHTML = items
      .map((i, idx) =>
        idx === items.length - 1
          ? `<span aria-current="page">${escapeHtml(i.label)}</span>`
          : `<a href="${i.href}">${escapeHtml(i.label)}</a><span class="crumb-sep" aria-hidden="true">/</span>`
      )
      .join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    renderShell();
  });
  initTheme();

  return {
    api,
    LS,
    KEYS,
    SUBJECTS,
    summarizeMarks,
    gradeFor,
    toast,
    openModal,
    closeModal,
    confirmDialog,
    escapeHtml,
    highlight,
    initials,
    avatarHue,
    debounce,
    statusClass,
    attendanceTone,
    emptyState,
    skeletonRows,
    breadcrumb,
    toggleTheme,
    session: () => session0,
    mySubject,
    isTeacher,
    pctText,
    pctWidth,
  };
})();

window.SMS = SMS;

/* ---------- Button ripple (global, progressive enhancement) ---------- */
document.addEventListener("pointerdown", (e) => {
  const btn = e.target.closest(".btn");
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const span = document.createElement("span");
  span.className = "ripple";
  span.style.width = span.style.height = `${size}px`;
  span.style.left = `${e.clientX - rect.left - size / 2}px`;
  span.style.top = `${e.clientY - rect.top - size / 2}px`;
  btn.appendChild(span);
  setTimeout(() => span.remove(), 560);
});
