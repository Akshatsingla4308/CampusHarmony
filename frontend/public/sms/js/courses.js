/* =========================================================
   courses.js — Course catalogue cards + enrolled students
   ========================================================= */
(() => {
  "use strict";
  const { api, escapeHtml, highlight, initials, avatarHue, statusClass } = SMS;

  const state = { courses: [], students: [], query: "", semester: "", status: "" };

  function filtered() {
    const q = state.query.trim().toLowerCase();
    return state.courses.filter((c) => {
      if (state.semester && String(c.semester) !== state.semester) return false;
      if (state.status && c.status !== state.status) return false;
      if (!q) return true;
      return [c.name, c.code, c.faculty].join(" ").toLowerCase().includes(q);
    });
  }

  function cardHtml(c) {
    return `<article class="card card--lift course-card">
      <div class="course-card__top">
        <div>
          <div class="course-card__code">${highlight(c.code, state.query)}</div>
          <h3 class="course-card__name">${highlight(c.name, state.query)}</h3>
          <div class="course-card__faculty">${highlight(c.faculty, state.query)}</div>
        </div>
        <span class="pill ${statusClass(c.status)}">${escapeHtml(c.status)}</span>
      </div>
      <div class="course-card__facts">
        <div class="fact"><strong>${c.credits}</strong><span>Credits</span></div>
        <div class="fact"><strong>${c.semester}</strong><span>Semester</span></div>
        <div class="fact"><strong>${c.totalStudents}</strong><span>Students</span></div>
      </div>
      <div class="course-card__foot">
        <span class="text-muted" style="font-size:.8rem">Semester ${c.semester} students</span>
        <button class="btn btn--primary btn--sm" data-students="${c.code}">View Students</button>
      </div>
    </article>`;
  }

  function render() {
    const host = document.querySelector("[data-course-grid]");
    const rows = filtered();
    if (!rows.length) {
      host.innerHTML = SMS.emptyState(
        state.courses.length ? "No courses found" : "No courses yet",
        state.courses.length ? "Try a different semester or clear the search box." : "Click Add course to add the courses you teach.",
        "📚"
      );
    } else {
      host.innerHTML = rows.map(cardHtml).join("");
      host.querySelectorAll("[data-students]").forEach((b) =>
        b.addEventListener("click", () => openStudents(b.dataset.students))
      );
    }
    document.querySelector("[data-result-note]").textContent = `${rows.length} of ${
      state.courses.length
    } courses`;
  }

  function openStudents(code) {
    const course = state.courses.find((c) => c.code === code);
    const enrolled = state.students.filter((s) => Number(s.semester) === Number(course.semester));
    SMS.openModal(
      `<div class="modal__head">
         <div>
           <h2 class="modal__title" id="cs-title">${escapeHtml(course.name)}</h2>
           <p>${escapeHtml(course.code)} · Semester ${
        course.semester
      }</p>
         </div>
         <button class="icon-btn" type="button" data-close-modal aria-label="Close">×</button>
       </div>
       <div class="modal__body">
         ${
           enrolled.length
             ? `<div class="mini-list">${enrolled
                 .map(
                   (s) => `
               <div class="course-mini">
                 <div class="cell-user">
                   <span class="avatar avatar--sm" style="background:linear-gradient(140deg,hsl(${avatarHue(
                     s.name
                   )} 42% 46%),hsl(${avatarHue(s.name)} 46% 28%))" aria-hidden="true">${initials(
                     s.name
                   )}</span>
                   <span><strong>${escapeHtml(s.name)}</strong><span>${escapeHtml(
                     s.roll || s.id
                   )} · ${escapeHtml(s.department)}</span></span>
                 </div>
                 <span class="pill ${SMS.statusClass(s.status)}">${SMS.pctText(s.attendance)} attendance</span>
               </div>`
                 )
                 .join("")}</div>`
             : SMS.emptyState("No students enrolled", "This course has no roster for the term yet.", "👥")
         }
       </div>
       <div class="modal__foot">
         <button class="btn btn--ghost" type="button" data-close-modal>Close</button>
         <a class="btn btn--primary" href="students.html">Manage students</a>
       </div>`,
      { size: "lg", labelledBy: "cs-title" }
    );
  }

  function openAddCourse() {
    const overlay = SMS.openModal(
      `<div class="modal__head">
         <h2 class="modal__title" id="ac-title">Add course</h2>
         <button class="icon-btn" type="button" data-close-modal aria-label="Close">×</button>
       </div>
       <form class="modal__body" novalidate data-form>
         <div class="form-grid">
           <div class="field"><label for="c-code">Course code *</label>
             <input class="input" id="c-code" name="code" type="text">
             <span class="field__error" data-error="code"></span></div>
           <div class="field"><label for="c-name">Course name *</label>
             <input class="input" id="c-name" name="name" type="text">
             <span class="field__error" data-error="name"></span></div>
           <div class="field"><label for="c-credits">Credits *</label>
             <input class="input" id="c-credits" name="credits" type="number" min="1" max="6">
             <span class="field__error" data-error="credits"></span></div>
           <div class="field"><label for="c-sem">Semester *</label>
             <select class="input" id="c-sem" name="semester">
               <option value="">Select semester</option>
               ${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option value="${n}">Semester ${n}</option>`).join("")}
             </select>
             <span class="field__error" data-error="semester"></span></div>
           <div class="field"><label for="c-status">Status</label>
             <select class="input" id="c-status" name="status">
               <option>Ongoing</option><option>Upcoming</option><option>Completed</option>
             </select></div>
         </div>
       </form>
       <div class="modal__foot">
         <button class="btn btn--ghost" type="button" data-close-modal>Cancel</button>
         <button class="btn btn--primary" type="button" data-submit>Add course</button>
       </div>`,
      { size: "lg", labelledBy: "ac-title" }
    );
    const form = overlay.querySelector("[data-form]");
    form.addEventListener("submit", (e) => e.preventDefault());
    overlay.querySelector("[data-submit]").addEventListener("click", () => {
      const d = {};
      new FormData(form).forEach((v, k) => (d[k] = String(v).trim()));
      const errors = {};
      if (!d.code) errors.code = "Course code is required.";
      else if (state.courses.some((c) => c.code.toLowerCase() === d.code.toLowerCase()))
        errors.code = "This code already exists.";
      if (!d.name || d.name.length < 4) errors.name = "Enter at least 4 characters.";
      if (!d.credits || Number(d.credits) < 1) errors.credits = "Credits must be 1 or more.";
      if (!d.semester) errors.semester = "Choose a semester.";
      overlay.querySelectorAll("[data-error]").forEach((e) => (e.textContent = ""));
      overlay.querySelectorAll(".input").forEach((e) => e.classList.remove("input--invalid"));
      const keys = Object.keys(errors);
      if (keys.length) {
        keys.forEach((k) => {
          overlay.querySelector(`[data-error="${k}"]`).textContent = errors[k];
          overlay.querySelector(`[name="${k}"]`).classList.add("input--invalid");
        });
        SMS.toast("Please fix the highlighted fields", "error");
        return;
      }
      api
        .addCourse({
          code: d.code.toUpperCase(),
          name: d.name,
          credits: Number(d.credits),
          semester: Number(d.semester),
          status: d.status || "Upcoming",
        })
        .then(async () => {
          state.courses = await api.getCourses();
          SMS.closeModal();
          render();
          SMS.toast("Course Added", "success");
        });
    });
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
    const sem = document.querySelector("[data-filter-sem]");
    sem.innerHTML =
      `<option value="">All semesters</option>` +
      [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option value="${n}">Semester ${n}</option>`).join("");
    sem.addEventListener("change", () => {
      state.semester = sem.value;
      render();
    });
    const status = document.querySelector("[data-filter-status]");
    status.addEventListener("change", () => {
      state.status = status.value;
      render();
    });
    document.querySelector("[data-add-course]").addEventListener("click", openAddCourse);
  }

  async function init() {
    SMS.breadcrumb([{ label: "Home", href: "index.html" }, { label: "My Courses" }]);
    const h1 = document.querySelector(".topbar__titles h1");
    if (h1) h1.textContent = "My Courses";
    const [courses, students] = await Promise.all([api.getCourses(), api.getStudents()]);
    state.courses = courses;
    state.students = students;
    bindToolbar();
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
