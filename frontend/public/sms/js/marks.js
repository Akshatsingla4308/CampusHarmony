/* =========================================================
   marks.js — A teacher enters and saves marks for THEIR OWN
   subject only (out of 100). Other subjects are never shown.
   ========================================================= */
(() => {
  "use strict";
  const { api, escapeHtml, highlight, initials, avatarHue, gradeFor } = SMS;
  const subject = SMS.mySubject;

  const state = { rows: [], query: "", grade: "", sortKey: "name", sortDir: "asc", dirty: new Set() };

  const gradeOf = (r) => (r.score == null ? "—" : gradeFor(r.score));
  const resultOf = (r) => (r.score == null ? "Pending" : r.score >= 40 ? "Pass" : "Fail");

  function filtered() {
    const q = state.query.trim().toLowerCase();
    const rows = state.rows.filter((r) => {
      if (state.grade && gradeOf(r) !== state.grade) return false;
      if (!q) return true;
      return [r.name, r.roll, r.department].join(" ").toLowerCase().includes(q);
    });
    const dir = state.sortDir === "asc" ? 1 : -1;
    const val = (r) => (state.sortKey === "grade" ? gradeOf(r) : r[state.sortKey]);
    rows.sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1; /* not-entered always last */
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return rows;
  }

  const gradeClass = (g) => (g === "A+" || g === "A" ? "grade--top" : g === "B" || g === "C" ? "grade--mid" : "grade--low");

  function renderSummary() {
    const host = document.querySelector("[data-marks-summary]");
    const entered = state.rows.filter((r) => r.score != null);
    const avg = entered.length ? Math.round((entered.reduce((a, r) => a + r.score, 0) / entered.length) * 10) / 10 : null;
    const passed = entered.filter((r) => r.score >= 40).length;
    const topper = entered.reduce((best, r) => (!best || r.score > best.score ? r : best), null);
    const cards = [
      { label: "Class Average", value: avg == null ? "—" : avg, delta: `${subject.label}, out of 100`, icon: "∑" },
      { label: "Pass Rate", value: entered.length ? `${Math.round((passed / entered.length) * 100)}%` : "—", delta: `${passed} of ${entered.length} passed`, icon: "✅" },
      { label: "Topper", value: topper ? topper.score : "—", delta: topper ? topper.name : "No marks yet", icon: "🏅" },
      { label: "Marks Entered", value: `${entered.length} / ${state.rows.length}`, delta: "Students with marks", icon: "📝" },
    ];
    host.innerHTML = cards
      .map(
        (c) => `
      <article class="card card--lift stat">
        <div class="stat__top"><span class="stat__label">${c.label}</span>
        <span class="stat__icon" aria-hidden="true">${c.icon}</span></div>
        <div class="stat__value">${escapeHtml(String(c.value))}</div>
        <div class="stat__delta">${escapeHtml(c.delta)}</div>
      </article>`
      )
      .join("");
  }

  const COLUMNS = [
    { key: "name", label: "Student" },
    { key: "department", label: "Department" },
    { key: "semester", label: "Semester" },
    { key: "score", label: "" }, /* label filled with the subject name */
    { key: "grade", label: "Grade" },
    { key: "result", label: "Result", noSort: true },
  ];

  function renderHead() {
    COLUMNS[3].label = `${subject.label} (out of 100)`;
    document.querySelector("[data-thead]").innerHTML = `<tr>${COLUMNS.map((c) =>
      c.noSort
        ? `<th>${c.label}</th>`
        : `<th class="th-sort ${state.sortKey === c.key ? (state.sortDir === "asc" ? "is-asc" : "is-desc") : ""}" data-sort="${c.key}" tabindex="0" role="button">${c.label}</th>`
    ).join("")}</tr>`;
    document.querySelectorAll("[data-sort]").forEach((th) => {
      const apply = () => {
        const key = th.dataset.sort;
        if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        else {
          state.sortKey = key;
          state.sortDir = key === "score" ? "desc" : "asc";
        }
        render();
      };
      th.addEventListener("click", apply);
      th.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          apply();
        }
      });
    });
  }

  function rowHtml(r) {
    const g = gradeOf(r);
    const res = resultOf(r);
    return `<tr data-row="${r.studentId}">
      <td>
        <div class="cell-user">
          <span class="avatar avatar--sm" style="background:linear-gradient(140deg,hsl(${avatarHue(r.name)} 42% 46%),hsl(${avatarHue(r.name)} 46% 28%))" aria-hidden="true">${initials(r.name)}</span>
          <span><strong>${highlight(r.name, state.query)}</strong><span>${escapeHtml(r.roll)}</span></span>
        </div>
      </td>
      <td>${escapeHtml(r.department)}</td>
      <td class="mono">${escapeHtml(r.semester)}</td>
      <td><input class="input mark-input ${state.dirty.has(r.studentId) ? "is-dirty" : ""}" type="number" min="0" max="100" step="1" inputmode="numeric"
           value="${r.score == null ? "" : r.score}" placeholder="—" data-mark="${r.studentId}" aria-label="${escapeHtml(subject.label)} marks for ${escapeHtml(r.name)}"></td>
      <td data-grade-cell><span class="grade ${gradeClass(g)}">${g}</span></td>
      <td data-result-cell><span class="pill ${SMS.statusClass(res)}">${res}</span></td>
    </tr>`;
  }

  function render() {
    renderHead();
    const rows = filtered();
    const tbody = document.querySelector("[data-tbody]");
    if (!state.rows.length) {
      tbody.innerHTML = `<tr><td colspan="${COLUMNS.length}">${SMS.emptyState(
        "No students yet",
        "Add students from the Students page, then come back to enter their marks.",
        "👥"
      )}</td></tr>`;
    } else if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="${COLUMNS.length}">${SMS.emptyState("No students found", "Try another grade filter or clear the search box.", "∑")}</td></tr>`;
    } else {
      tbody.innerHTML = rows.map(rowHtml).join("");
      tbody.querySelectorAll("[data-mark]").forEach((input) => input.addEventListener("input", () => onEdit(input)));
    }
    document.querySelector("[data-result-note]").textContent = `${rows.length} of ${state.rows.length} students`;
    renderSummary();
  }

  /* Live update while typing (no full re-render, so the cursor stays in the box) */
  function onEdit(input) {
    const id = Number(input.dataset.mark);
    const row = state.rows.find((r) => r.studentId === id);
    const raw = input.value.trim();
    const num = Number(raw);
    const valid = raw === "" || (Number.isInteger(num) && num >= 0 && num <= 100);
    input.classList.toggle("input--invalid", !valid);
    if (!valid) return;
    row.score = raw === "" ? null : num;
    state.dirty.add(id);
    input.classList.add("is-dirty");
    const tr = input.closest("tr");
    const g = gradeOf(row);
    const res = resultOf(row);
    tr.querySelector("[data-grade-cell]").innerHTML = `<span class="grade ${gradeClass(g)}">${g}</span>`;
    tr.querySelector("[data-result-cell]").innerHTML = `<span class="pill ${SMS.statusClass(res)}">${res}</span>`;
    renderSummary();
  }

  async function save() {
    const bad = document.querySelector(".mark-input.input--invalid");
    if (bad) {
      bad.focus();
      SMS.toast("Marks must be whole numbers from 0 to 100", "error");
      return;
    }
    const entries = state.rows
      .filter((r) => state.dirty.has(r.studentId) && r.score != null)
      .map((r) => ({ studentId: r.studentId, value: r.score }));
    if (!entries.length) {
      SMS.toast(state.dirty.size ? "Enter a mark before saving" : "No changes to save", "info");
      return;
    }
    try {
      await api.saveMarks(entries);
    } catch (err) {
      SMS.toast(err.message, "error");
      return;
    }
    state.dirty.clear();
    render();
    SMS.toast(`${subject.label} marks saved for ${entries.length} student${entries.length > 1 ? "s" : ""}`, "success");
  }

  function bindToolbar() {
    const search = document.querySelector("[data-search]");
    search.addEventListener(
      "input",
      SMS.debounce(() => {
        state.query = search.value;
        render();
      }, 140)
    );
    const grade = document.querySelector("[data-filter-grade]");
    grade.innerHTML =
      `<option value="">All grades</option>` +
      ["A+", "A", "B", "C", "D", "F", "—"].map((g) => `<option value="${g}">${g === "—" ? "Not entered" : "Grade " + g}</option>`).join("");
    grade.addEventListener("change", () => {
      state.grade = grade.value;
      render();
    });
    document.querySelector("[data-save-marks]").addEventListener("click", save);
    window.addEventListener("beforeunload", (e) => {
      if (state.dirty.size) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
  }

  async function init() {
    SMS.breadcrumb([{ label: "Home", href: "index.html" }, { label: "Marks" }]);
    if (!subject) {
      document.querySelectorAll(".main > section").forEach((el) => el.remove());
      document.querySelector(".main").insertAdjacentHTML("beforeend", `<section class="card">${SMS.emptyState(
        "Your subject is not set",
        "Marks are entered per subject. Please register again with a new Teacher ID and choose your subject.",
        "∑"
      )}</section>`);
      return;
    }
    document.querySelector("[data-marks-title]").textContent = `Marks · ${subject.label}`;
    document.querySelector("[data-tbody]").innerHTML = SMS.skeletonRows(6, COLUMNS.length);
    const [students, marks] = await Promise.all([api.getStudents(), api.getMarks()]);
    state.rows = students.map((s) => {
      const m = marks.find((x) => x.studentId === s.id) || {};
      return { studentId: s.id, name: s.name, roll: s.roll || `ID-${s.id}`, department: s.department, semester: s.semester, score: m[subject.key] ?? null };
    });
    bindToolbar();
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
