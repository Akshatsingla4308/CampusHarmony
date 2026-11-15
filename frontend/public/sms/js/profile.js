/* =========================================================
   profile.js — Single student profile page
   Reads ?id= from the URL, falls back to the first student.
   ========================================================= */
(() => {
  "use strict";
  const { api, escapeHtml, initials, avatarHue, statusClass, attendanceTone, summarizeMarks } = SMS;
  const SUBJECTS = SMS.mySubject ? [SMS.mySubject] : window.SMS_SEED.subjects; /* a teacher sees only their own subject */

  function renderHero(s) {
    document.querySelector("[data-hero]").innerHTML = `
      <div class="profile-hero">
        <span class="avatar avatar--lg" style="background:linear-gradient(140deg,hsl(${avatarHue(
          s.name
        )} 42% 46%),hsl(${avatarHue(s.name)} 46% 28%))" aria-hidden="true">${initials(s.name)}</span>
        <div class="profile-hero__meta">
          <h2>${escapeHtml(s.name)}</h2>
          <p>${escapeHtml(s.roll || `ID ${s.id}`)} · ${escapeHtml(s.department)} · Semester ${escapeHtml(
      s.semester
    )}</p>
          <div class="tags">
            <span class="pill ${statusClass(s.status)}">${escapeHtml(s.status)}</span>
            <span class="pill pill--muted">${SMS.pctText(s.attendance)} attendance</span>
            <span class="pill pill--muted">${escapeHtml(s.gender || "—")}</span>
          </div>
        </div>
      </div>`;
  }

  function renderDetails(s) {
    document.querySelector("[data-details]").innerHTML = `
      <dl class="kv">
        <dt>Student ID</dt><dd>${escapeHtml(s.id)}</dd>
        <dt>Roll number</dt><dd>${escapeHtml(s.roll || "—")}</dd>
        <dt>Email</dt><dd>${escapeHtml(s.email)}</dd>
        <dt>Phone</dt><dd>${escapeHtml(s.phone)}</dd>
        <dt>Department</dt><dd>${escapeHtml(s.department)}</dd>
        <dt>Semester</dt><dd>Semester ${escapeHtml(s.semester)}</dd>
        <dt>Address</dt><dd>${escapeHtml(s.address || "—")}</dd>
        <dt>Status</dt><dd>${escapeHtml(s.status)}</dd>
      </dl>`;
  }

  function renderPerformance(mark) {
    const host = document.querySelector("[data-performance]");
    const entered = mark ? SUBJECTS.filter((x) => mark[x.key] != null) : [];
    if (!entered.length) {
      host.innerHTML = SMS.emptyState("Marks not entered", "Marks appear once the teacher enters them.", "∑");
      return;
    }
    const bars = SUBJECTS.map((x) => {
      const v = mark[x.key];
      return `<div class="chart-row">
          <span class="chart-row__label">${escapeHtml(x.label)}</span>
          <div class="chart-row__track"><div class="chart-row__fill" style="width:${v == null ? 0 : v}%"></div></div>
          <span class="chart-row__val">${v == null ? "—" : v}</span>
        </div>`;
    }).join("");
    /* Totals only make sense when the student's own full marksheet is shown */
    let summary = "";
    if (!SMS.isTeacher) {
      const sum = summarizeMarks(mark);
      summary = `<div class="mini-list" style="margin-top:14px">
        <li><span>Total</span><strong>${sum.total} / ${sum.max}</strong></li>
        <li><span>Percentage</span><strong>${sum.percentage}%</strong></li>
        <li><span>Grade</span><strong>${sum.grade}</strong></li>
        <li><span>Result</span><span class="pill ${statusClass(sum.result)}">${sum.result}</span></li>
      </div>`;
    }
    host.innerHTML = `<div class="chart-bars">${bars}</div>${summary}`;
  }

  function renderAttendance(rec, s) {
    const host = document.querySelector("[data-attendance]");
    const pct = rec && rec.totalDays ? Math.round((rec.presentDays / rec.totalDays) * 100) : null;
    host.innerHTML = `
      <div class="meter" style="min-width:0;margin-bottom:12px">
        <div class="meter__track"><div class="meter__fill is-${pct == null ? "warn" : attendanceTone(
          pct
        )}" style="width:${SMS.pctWidth(pct)}%"></div></div>
        <span class="meter__val">${SMS.pctText(pct)}</span>
      </div>
      <ul class="mini-list">
        <li><span>Present days</span><strong>${rec ? rec.presentDays : "—"}</strong></li>
        <li><span>Absent days</span><strong>${rec ? rec.absentDays : "—"}</strong></li>
        <li><span>Total sessions</span><strong>${rec ? rec.totalDays : "—"}</strong></li>
        <li><span>Last marked</span><strong>${rec ? escapeHtml(rec.lastMarked) : "—"}</strong></li>
      </ul>`;
  }

  function renderCourses(courses, s) {
    const host = document.querySelector("[data-courses]");
    const list = courses.filter((c) => Number(c.semester) === Number(s.semester));
    host.innerHTML = list.length
      ? `<div class="mini-list">${list
          .map(
            (c) => `<div class="course-mini">
        <span><strong>${escapeHtml(c.name)}</strong><span>${escapeHtml(c.code)} · ${escapeHtml(
              c.faculty
            )} · ${c.credits} credits</span></span>
        <span class="pill ${statusClass(c.status)}">${escapeHtml(c.status)}</span>
      </div>`
          )
          .join("")}</div>`
      : SMS.emptyState("No courses", "No courses are mapped to this semester yet.", "📚");
  }

  /* Badges are worked out from the student's real numbers */
  function renderBadges(student, mark) {
    const badges = [];
    if (student.attendance != null && student.attendance >= 90) badges.push("Regular Attendee");
    if (mark && !SMS.isTeacher) {
      const sum = summarizeMarks(mark);
      if (sum.complete && sum.percentage >= 85) badges.push("Top Performer");
    }
    if (student.status === "Probation") badges.push("On Probation");
    document.querySelector("[data-badges]").innerHTML = badges.length
      ? `<div class="tags">${badges.map((b) => `<span class="badge">★ ${escapeHtml(b)}</span>`).join("")}</div>`
      : "";
  }

  async function renderPicker(students, currentId) {
    const select = document.querySelector("[data-student-picker]");
    select.innerHTML = students
      .map(
        (s) =>
          `<option value="${s.id}" ${s.id === currentId ? "selected" : ""}>${escapeHtml(
            s.name
          )} — ${escapeHtml(s.roll || s.id)}</option>`
      )
      .join("");
    select.addEventListener("change", () => {
      location.search = `?id=${select.value}`;
    });
  }

  async function init() {
    SMS.breadcrumb([
      { label: "Home", href: "index.html" },
      { label: "Students", href: "students.html" },
      { label: "Profile" },
    ]);
    const students = await api.getStudents();
    const session = SMS.session();
    const isStudent = session && session.role === "student";
    let student;
    if (isStudent) {
      /* A student only ever sees their own record, matched by roll number */
      student = students.find((s) => String(s.roll || "").toUpperCase() === session.roll);
      const picker = document.querySelector("[data-student-picker]");
      if (picker) (picker.closest(".field") || picker).style.display = "none";
      SMS.breadcrumb([{ label: "Home" }, { label: "My Profile" }]);
      if (!student) {
        /* Roll number isn't in the student list yet: show a basic profile
           from the login details instead of an error. */
        student = {
          id: "—",
          roll: session.roll,
          name: session.name,
          department: "Not assigned",
          semester: "—",
          email: "—",
          phone: "—",
          address: "—",
          gender: "—",
          status: "Active",
          attendance: null,
        };
        SMS.toast("Your roll number isn't in any class list yet, so only basic details are shown.", "info");
      }
    } else {
      const wanted = Number(new URLSearchParams(location.search).get("id"));
      student = students.find((s) => s.id === wanted) || students[0];
    }
    if (!student) {
      document.querySelector("[data-hero]").innerHTML = SMS.emptyState(
        "No student records",
        "Add a student from the Students page to see a profile.",
        "☺"
      );
      return;
    }
    const [attendance, marks, courses] = await Promise.all([
      api.getAttendance(),
      api.getMarks(),
      api.getCourses(),
    ]);
    if (!isStudent) renderPicker(students, student.id);
    renderHero(student);
    renderDetails(student);
    renderPerformance(marks.find((m) => m.studentId === student.id));
    renderAttendance(attendance.find((a) => a.studentId === student.id), student);
    renderCourses(courses, student);
    renderBadges(student, marks.find((m) => m.studentId === student.id));
    /* The global activity log is not a student's business, so this card is removed */
    const act = document.querySelector("[data-activity]");
    if (act) act.closest(".card").remove();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
