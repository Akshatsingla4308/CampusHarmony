/* =========================================================
   dashboard.js — Dashboard stats, charts, activity feed
   ========================================================= */
(() => {
  "use strict";
  const { api, escapeHtml } = SMS;

  const ACTIVITY_ICONS = {
    enroll: "＋",
    attendance: "✓",
    marks: "∑",
    course: "▣",
    edit: "✎",
    notice: "◆",
  };

  function renderStats(stats) {
    const host = document.querySelector("[data-stats]");
    host.innerHTML = stats
      .map(
        (s) => `
      <article class="card card--lift stat">
        <div class="stat__top">
          <span class="stat__label">${escapeHtml(s.label)}</span>
          <span class="stat__icon" aria-hidden="true">${s.icon}</span>
        </div>
        <div class="stat__value ${typeof s.value === "string" && /[A-Za-z]{3}/.test(s.value) ? "stat__value--text" : ""}">${escapeHtml(String(s.value))}</div>
        <div class="stat__delta">${escapeHtml(s.delta)}</div>
      </article>`
      )
      .join("");
  }

  function renderActivity(items) {
    const host = document.querySelector("[data-activity]");
    if (!items.length) {
      host.innerHTML = SMS.emptyState("No activity yet", "Actions you take will appear here.", "🕘");
      return;
    }
    host.innerHTML = `<ul class="feed">${items
      .map(
        (a, i) => `
      <li class="feed__item" style="animation-delay:${i * 0.05}s">
        <span class="feed__dot" aria-hidden="true">${ACTIVITY_ICONS[a.type] || "◆"}</span>
        <div class="feed__body">
          <p>${escapeHtml(a.text)}</p>
          <time>${escapeHtml(a.time)}</time>
        </div>
      </li>`
      )
      .join("")}</ul>`;
  }

  /* Department-wise attendance bar chart (students with no attendance marked yet are skipped) */
  function renderDeptChart(students) {
    const host = document.querySelector("[data-dept-chart]");
    const byDept = {};
    students
      .filter((s) => s.attendance != null)
      .forEach((s) => {
        byDept[s.department] = byDept[s.department] || { sum: 0, n: 0 };
        byDept[s.department].sum += s.attendance;
        byDept[s.department].n += 1;
      });
    const rows = Object.entries(byDept)
      .map(([dept, v]) => ({ dept, avg: Math.round(v.sum / v.n) }))
      .sort((a, b) => b.avg - a.avg);
    if (!rows.length) {
      host.innerHTML = SMS.emptyState("No attendance yet", "Mark attendance to see this chart.", "📈");
      return;
    }
    host.innerHTML = `<div class="chart-bars">${rows
      .map(
        (r) => `
      <div class="chart-row">
        <span class="chart-row__label" title="${escapeHtml(r.dept)}">${escapeHtml(r.dept)}</span>
        <div class="chart-row__track"><div class="chart-row__fill" style="width:${r.avg}%"></div></div>
        <span class="chart-row__val">${r.avg}%</span>
      </div>`
      )
      .join("")}</div>`;
  }

  /* Scores of the teacher's OWN subject only (a teacher never sees other subjects' marks) */
  function subjectScores(marks) {
    const sub = SMS.mySubject;
    if (!sub) return [];
    return marks.map((m) => m[sub.key]).filter((v) => v != null);
  }

  /* Score range bars for the teacher's subject */
  function renderScoreRanges(scores) {
    const host = document.querySelector("[data-subject-chart]");
    const sub = SMS.mySubject;
    document.querySelector("[data-subject-title]").textContent = sub ? `${sub.label} score ranges` : "Score ranges";
    document.querySelector("[data-subject-sub]").textContent = sub
      ? `Marks you entered for ${sub.label}`
      : "Your subject is not set";
    if (!scores.length) {
      host.innerHTML = SMS.emptyState("No marks entered yet", "Open the Marks page to enter marks for your subject.", "∑");
      return;
    }
    const ranges = [
      { label: "90 – 100", test: (v) => v >= 90 },
      { label: "75 – 89", test: (v) => v >= 75 && v < 90 },
      { label: "60 – 74", test: (v) => v >= 60 && v < 75 },
      { label: "40 – 59", test: (v) => v >= 40 && v < 60 },
      { label: "Below 40", test: (v) => v < 40 },
    ].map((r) => ({ ...r, n: scores.filter(r.test).length }));
    const avg = Math.round(scores.reduce((a, v) => a + v, 0) / scores.length);
    host.innerHTML = `<div class="chart-bars">${ranges
      .map(
        (r) => `
      <div class="chart-row">
        <span class="chart-row__label">${r.label}</span>
        <div class="chart-row__track"><div class="chart-row__fill" style="width:${(r.n / scores.length) * 100}%"></div></div>
        <span class="chart-row__val">${r.n}</span>
      </div>`
      )
      .join("")}</div>
      <p class="text-muted" style="margin-top:12px">Class average: <strong>${avg}</strong> / 100 · ${scores.length} student${scores.length > 1 ? "s" : ""}</p>`;
  }

  /* Grade distribution donut (teacher's subject only) */
  function renderDonut(scores) {
    const host = document.querySelector("[data-donut]");
    if (!scores.length) {
      host.innerHTML = SMS.emptyState("No grades yet", "Grades appear once you enter marks.", "🏅");
      return;
    }
    const buckets = { "A+ / A": 0, "B / C": 0, "D / F": 0 };
    scores.forEach((v) => {
      const g = SMS.gradeFor(v);
      if (g === "A+" || g === "A") buckets["A+ / A"]++;
      else if (g === "B" || g === "C") buckets["B / C"]++;
      else buckets["D / F"]++;
    });
    const total = scores.length;
    const colors = ["#1d9184", "#b8862b", "#b53a35"];
    let acc = 0;
    const stops = Object.values(buckets)
      .map((v, i) => {
        const from = (acc / total) * 100;
        acc += v;
        const to = (acc / total) * 100;
        return `${colors[i]} ${from}% ${to}%`;
      })
      .join(", ");
    const topRate = Math.round((buckets["A+ / A"] / total) * 100);
    host.innerHTML = `
      <div class="donut-wrap">
        <div class="donut" style="background:conic-gradient(${stops})" role="img"
             aria-label="Grade distribution donut chart">
          <div class="donut__center"><strong>${topRate}%</strong><span>Top grades</span></div>
        </div>
        <div class="legend">
          ${Object.entries(buckets)
            .map(
              ([k, v], i) => `
            <div class="legend__item">
              <span class="legend__dot" style="background:${colors[i]}"></span>
              <span>${escapeHtml(k)} — <strong>${v}</strong> student${v === 1 ? "" : "s"}</span>
            </div>`
            )
            .join("")}
        </div>
      </div>`;
  }

  function renderCourses(courses) {
    const host = document.querySelector("[data-deadlines]");
    if (!courses.length) {
      host.innerHTML = SMS.emptyState("No courses yet", "Add the courses you teach from the Courses page.", "📚");
      return;
    }
    host.innerHTML = `<ul class="mini-list">${courses
      .slice(0, 5)
      .map(
        (c) => `
      <li>
        <span><strong>${escapeHtml(c.code)}</strong> · ${escapeHtml(c.name)}</span>
        <span class="pill ${SMS.statusClass(c.status)}">${escapeHtml(c.status)}</span>
      </li>`
      )
      .join("")}</ul>`;
  }

  async function init() {
    SMS.breadcrumb([{ label: "Home", href: "index.html" }, { label: "Dashboard" }]);
    const [stats, activity, students, marks, courses] = await Promise.all([
      api.getStats(),
      api.getActivity(),
      api.getStudents(),
      api.getMarks(),
      api.getCourses(),
    ]);
    renderStats(stats);
    renderActivity(activity);
    renderDeptChart(students);
    const scores = subjectScores(marks);
    renderScoreRanges(scores);
    renderDonut(scores);
    renderCourses(courses);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
