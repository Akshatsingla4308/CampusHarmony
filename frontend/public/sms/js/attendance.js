/* =========================================================
   attendance.js — Attendance register with present/absent
   ========================================================= */
(() => {
  "use strict";
  const { api, escapeHtml, highlight, initials, avatarHue, attendanceTone } = SMS;

  const state = { records: [], query: "", tone: "" };

  /* null = attendance not marked yet (new student) */
  const pct = (r) => (r.totalDays ? Math.round((r.presentDays / r.totalDays) * 100) : null);
  const statusOf = (p) => (p == null ? "Not marked" : p >= 85 ? "Good" : p >= 70 ? "Watchlist" : "Detained Risk");
  const toneOf = (p) => (p == null ? "warn" : attendanceTone(p));

  function filtered() {
    const q = state.query.trim().toLowerCase();
    return state.records.filter((r) => {
      const p = pct(r);
      if (state.tone && (p == null || attendanceTone(p) !== state.tone)) return false;
      if (!q) return true;
      return [r.name, r.roll, r.department].join(" ").toLowerCase().includes(q);
    });
  }

  function renderSummary() {
    const host = document.querySelector("[data-att-summary]");
    const list = state.records;
    const marked = list.filter((r) => pct(r) != null);
    const avg = marked.length ? `${Math.round(marked.reduce((a, r) => a + pct(r), 0) / marked.length)}%` : "—";
    const good = marked.filter((r) => pct(r) >= 85).length;
    const risk = marked.filter((r) => pct(r) < 70).length;
    const totalPresent = list.reduce((a, r) => a + r.presentDays, 0);
    const cards = [
      { label: "Average Attendance", value: avg, delta: "Across your students", icon: "📈" },
      { label: "Above 85%", value: good, delta: "Eligible for exams", icon: "✅" },
      { label: "Below 70%", value: risk, delta: "Needs intervention", icon: "⚠️" },
      { label: "Present Days Logged", value: totalPresent, delta: "This academic term", icon: "🗓" },
    ];
    host.innerHTML = cards
      .map(
        (c) => `
      <article class="card card--lift stat">
        <div class="stat__top">
          <span class="stat__label">${c.label}</span>
          <span class="stat__icon" aria-hidden="true">${c.icon}</span>
        </div>
        <div class="stat__value">${escapeHtml(String(c.value))}</div>
        <div class="stat__delta">${c.delta}</div>
      </article>`
      )
      .join("");
  }

  function rowHtml(r) {
    const p = pct(r);
    const status = statusOf(p);
    return `<tr data-row="${r.studentId}">
      <td>
        <div class="cell-user">
          <span class="avatar avatar--sm" style="background:linear-gradient(140deg,hsl(${avatarHue(
            r.name
          )} 42% 46%),hsl(${avatarHue(r.name)} 46% 28%))" aria-hidden="true">${initials(r.name)}</span>
          <span><strong>${highlight(r.name, state.query)}</strong><span>${escapeHtml(
      r.department
    )}</span></span>
        </div>
      </td>
      <td class="mono">${highlight(r.roll, state.query)}</td>
      <td>
        <div class="meter">
          <div class="meter__track"><div class="meter__fill is-${toneOf(p)}" style="width:${p == null ? 0 : p}%"></div></div>
          <span class="meter__val">${p == null ? "—" : p + "%"}</span>
        </div>
      </td>
      <td><span class="pill ${
        p == null ? "pill--muted" : p >= 85 ? "pill--ok" : p >= 70 ? "pill--warn" : "pill--bad"
      }">${status}</span></td>
      <td><span class="day-count">${r.presentDays}<small>/ ${r.totalDays}</small></span></td>
      <td class="mono">${r.absentDays}</td>
      <td class="mono">${escapeHtml(r.lastMarked)}</td>
      <td>
        <div class="att-actions">
          <button class="btn btn--sm btn--present" data-present="${r.studentId}">Mark Present</button>
          <button class="btn btn--sm btn--absent" data-absent="${r.studentId}">Mark Absent</button>
        </div>
      </td>
    </tr>`;
  }

  function render() {
    const tbody = document.querySelector("[data-tbody]");
    const rows = filtered();
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="8">${SMS.emptyState(
        state.records.length ? "No attendance records" : "No students yet",
        state.records.length ? "Adjust your search or filter to see the register." : "Add students from the Students page to take attendance.",
        "🗓"
      )}</td></tr>`;
    } else {
      tbody.innerHTML = rows.map(rowHtml).join("");
      bindRowActions();
    }
    document.querySelector("[data-result-note]").textContent = `${rows.length} of ${
      state.records.length
    } records`;
    renderSummary();
  }

  function bindRowActions() {
    document.querySelectorAll("[data-present]").forEach((b) =>
      b.addEventListener("click", () => mark(Number(b.dataset.present), true))
    );
    document.querySelectorAll("[data-absent]").forEach((b) =>
      b.addEventListener("click", () => mark(Number(b.dataset.absent), false))
    );
  }

  async function mark(studentId, present) {
    const updated = await api.markAttendance(studentId, present);
    if (!updated) return;
    const idx = state.records.findIndex((r) => r.studentId === studentId);
    state.records[idx] = updated;
    render();
    const row = document.querySelector(`[data-row="${studentId}"]`);
    if (row) row.classList.add("row-flash");
    SMS.toast(`Attendance Updated — ${updated.name} marked ${present ? "present" : "absent"}`, present ? "success" : "warning");
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
    const tone = document.querySelector("[data-filter-tone]");
    tone.addEventListener("change", () => {
      state.tone = tone.value;
      render();
    });
  }

  async function init() {
    SMS.breadcrumb([{ label: "Home", href: "index.html" }, { label: "Attendance" }]);
    document.querySelector("[data-tbody]").innerHTML = SMS.skeletonRows(6, 8);
    state.records = await api.getAttendance();
    bindToolbar();
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
