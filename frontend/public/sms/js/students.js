/* =========================================================
   students.js — Student module: search, filters, sorting,
   pagination, add / edit / view / remove
   ========================================================= */
(() => {
  "use strict";
  const { api, escapeHtml, highlight, initials, avatarHue, statusClass, attendanceTone } = SMS;

  const state = {
    all: [],
    removed: new Set(),
    query: "",
    department: "",
    semester: "",
    sortKey: "name",
    sortDir: "asc",
    page: 1,
    perPage: (SMS.LS.read(SMS.KEYS.prefs, {}) || {}).rows || 8,
  };

  const COLUMNS = [
    { key: "id", label: "Student ID", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "semester", label: "Semester", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Phone", sortable: false },
    { key: "attendance", label: "Attendance", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "actions", label: "Actions", sortable: false },
  ];

  /* ---------- Derived data ---------- */
  function visibleStudents() {
    const q = state.query.trim().toLowerCase();
    let rows = state.all.filter((s) => !state.removed.has(s.id));
    if (state.department) rows = rows.filter((s) => s.department === state.department);
    if (state.semester) rows = rows.filter((s) => String(s.semester) === state.semester);
    if (q) {
      rows = rows.filter((s) =>
        [s.name, s.email, s.department, s.roll, String(s.id), s.phone]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    const dir = state.sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const av = a[state.sortKey];
      const bv = b[state.sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return rows;
  }

  /* ---------- Rendering ---------- */
  function renderHead() {
    document.querySelector("[data-thead]").innerHTML = `<tr>${COLUMNS.map(
      (c) =>
        `<th ${
          c.sortable
            ? `class="th-sort ${
                state.sortKey === c.key ? (state.sortDir === "asc" ? "is-asc" : "is-desc") : ""
              }" data-sort="${c.key}" tabindex="0" role="button"`
            : ""
        }>${c.label}</th>`
    ).join("")}</tr>`;

    document.querySelectorAll("[data-sort]").forEach((th) => {
      const apply = () => {
        const key = th.dataset.sort;
        if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        else {
          state.sortKey = key;
          state.sortDir = "asc";
        }
        state.page = 1;
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

  function rowHtml(s) {
    const q = state.query;
    return `<tr data-row="${s.id}">
      <td class="mono">${highlight(s.roll || s.id, q)}</td>
      <td>
        <div class="cell-user">
          <span class="avatar avatar--sm" style="background:linear-gradient(140deg,hsl(${avatarHue(
            s.name
          )} 42% 46%),hsl(${avatarHue(s.name)} 46% 28%))" aria-hidden="true">${initials(s.name)}</span>
          <span><strong>${highlight(s.name, q)}</strong><span>ID ${s.id}</span></span>
        </div>
      </td>
      <td>${highlight(s.department, q)}</td>
      <td>Sem ${escapeHtml(s.semester)}</td>
      <td class="link-cell">${highlight(s.email, q)}</td>
      <td class="mono">${highlight(s.phone, q)}</td>
      <td>
        <div class="meter">
          <div class="meter__track"><div class="meter__fill is-${s.attendance == null ? "warn" : attendanceTone(
            s.attendance
          )}" style="width:${SMS.pctWidth(s.attendance)}%"></div></div>
          <span class="meter__val">${SMS.pctText(s.attendance)}</span>
        </div>
      </td>
      <td><span class="pill ${statusClass(s.status)}">${escapeHtml(s.status)}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn btn--ghost btn--sm" data-view="${s.id}">View</button>
          <button class="btn btn--ghost btn--sm" data-edit="${s.id}">Edit</button>
          <button class="btn btn--ghost btn--sm" data-remove="${s.id}">Delete</button>
        </div>
      </td>
    </tr>`;
  }

  function render() {
    const rows = visibleStudents();
    const tbody = document.querySelector("[data-tbody]");
    const note = document.querySelector("[data-result-note]");
    const totalPages = Math.max(1, Math.ceil(rows.length / state.perPage));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * state.perPage;
    const pageRows = rows.slice(start, start + state.perPage);

    renderHead();

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="${COLUMNS.length}">${SMS.emptyState(
        "No students match your filters",
        "Try clearing the search box or choosing a different department.",
        "🔍"
      )}</td></tr>`;
      note.textContent = "0 students found";
      renderPager(0, totalPages);
      return;
    }

    tbody.innerHTML = pageRows.map(rowHtml).join("");
    note.textContent = `Showing ${start + 1}–${start + pageRows.length} of ${rows.length} students`;
    renderPager(rows.length, totalPages);
    bindRowActions();
  }

  function renderPager(count, totalPages) {
    const host = document.querySelector("[data-pager]");
    if (!count) {
      host.innerHTML = "";
      return;
    }
    const pages = [];
    for (let p = 1; p <= totalPages; p++) pages.push(p);
    host.innerHTML = `
      <span>Page ${state.page} of ${totalPages}</span>
      <div class="pager__pages">
        <button class="pager__btn" data-page="prev" ${state.page === 1 ? "disabled" : ""}>Prev</button>
        ${pages
          .map(
            (p) =>
              `<button class="pager__btn ${p === state.page ? "is-active" : ""}" data-page="${p}">${p}</button>`
          )
          .join("")}
        <button class="pager__btn" data-page="next" ${
          state.page === totalPages ? "disabled" : ""
        }>Next</button>
      </div>`;
    host.querySelectorAll("[data-page]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const v = btn.dataset.page;
        if (v === "prev") state.page = Math.max(1, state.page - 1);
        else if (v === "next") state.page = Math.min(totalPages, state.page + 1);
        else state.page = Number(v);
        render();
        document.querySelector("[data-table-card]").scrollIntoView({ block: "nearest" });
      })
    );
  }

  function bindRowActions() {
    document
      .querySelectorAll("[data-view]")
      .forEach((b) => b.addEventListener("click", () => viewStudent(Number(b.dataset.view))));
    document
      .querySelectorAll("[data-edit]")
      .forEach((b) => b.addEventListener("click", () => openForm(Number(b.dataset.edit))));
    document
      .querySelectorAll("[data-remove]")
      .forEach((b) => b.addEventListener("click", () => removeStudent(Number(b.dataset.remove))));
  }

  /* ---------- View modal ---------- */
  async function viewStudent(id) {
    const s = await api.getStudent(id);
    if (!s) return;
    const [courses, marks] = await Promise.all([api.getCourses(), api.getMarks()]);
    const enrolled = courses.filter((c) => c.semester === Number(s.semester)).slice(0, 4);
    const mark = marks.find((m) => m.studentId === s.id);
    /* A teacher only ever sees the marks of their OWN subject */
    const sub = SMS.mySubject;
    const score = mark && sub ? mark[sub.key] : null;
    const marksText = !sub
      ? "Subject not set"
      : score == null
      ? `${sub.label}: not entered yet`
      : `${sub.label}: ${score}/100 · Grade ${SMS.gradeFor(score)} (${score >= 40 ? "Pass" : "Fail"})`;

    SMS.openModal(
      `<div class="modal__head">
         <div>
           <h2 class="modal__title" id="pv-title">Student profile</h2>
           <p>Read-only snapshot from the ERP record</p>
         </div>
         <button class="icon-btn" type="button" data-close-modal aria-label="Close">×</button>
       </div>
       <div class="modal__body">
         <div class="pv">
           <div class="pv__side">
             <span class="avatar avatar--lg" style="background:linear-gradient(140deg,hsl(${avatarHue(
               s.name
             )} 42% 46%),hsl(${avatarHue(s.name)} 46% 28%))" aria-hidden="true">${initials(
        s.name
      )}</span>
             <div class="pv__name">${escapeHtml(s.name)}</div>
             <div class="pv__role">${escapeHtml(s.roll || `ID ${s.id}`)}</div>
             <span class="pill ${statusClass(s.status)}">${escapeHtml(s.status)}</span>
           </div>
           <div class="pv__body">
             <div class="pv__section">
               <h4>Academic</h4>
               <dl class="kv">
                 <dt>Student ID</dt><dd>${escapeHtml(s.id)}</dd>
                 <dt>Department</dt><dd>${escapeHtml(s.department)}</dd>
                 <dt>Semester</dt><dd>Semester ${escapeHtml(s.semester)}</dd>
                 <dt>Attendance</dt><dd>${SMS.pctText(s.attendance)}</dd>
                 <dt>Marks</dt><dd>${escapeHtml(marksText)}</dd>
               </dl>
             </div>
             <div class="pv__section">
               <h4>Contact</h4>
               <dl class="kv">
                 <dt>Email</dt><dd>${escapeHtml(s.email)}</dd>
                 <dt>Phone</dt><dd>${escapeHtml(s.phone)}</dd>
                 <dt>Gender</dt><dd>${escapeHtml(s.gender || "—")}</dd>
                 <dt>Address</dt><dd>${escapeHtml(s.address || "—")}</dd>
               </dl>
             </div>
             <div class="pv__section">
               <h4>Enrolled courses</h4>
               <div class="chip-row">${
                 enrolled.length
                   ? enrolled.map((c) => `<span class="chip">${escapeHtml(c.name)}</span>`).join("")
                   : '<span class="chip">No courses for this semester</span>'
               }</div>
             </div>
           </div>
         </div>
       </div>
       <div class="modal__foot">
         <button class="btn btn--ghost" type="button" data-close-modal>Close</button>
         <a class="btn btn--primary" href="profile.html?id=${s.id}">Open full profile</a>
       </div>`,
      { size: "lg", labelledBy: "pv-title" }
    );
  }

  /* ---------- Add / edit form ---------- */
  const FIELDS = [
    { name: "name", label: "Full name", type: "text", required: true },
    { name: "id", label: "Student ID", type: "number", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone", type: "tel", required: true },
    { name: "department", label: "Department", type: "select", required: true },
    { name: "semester", label: "Semester", type: "select", required: true },
    { name: "gender", label: "Gender", type: "select", required: true },
    { name: "address", label: "Address", type: "textarea", required: false, full: true },
  ];

  function optionsFor(name) {
    if (name === "department") return state.departments;
    if (name === "semester") return [1, 2, 3, 4, 5, 6, 7, 8];
    return ["Male", "Female", "Other"];
  }

  async function openForm(id) {
    const editing = id != null;
    const s = editing ? await api.getStudent(id) : null;
    const overlay = SMS.openModal(
      `<div class="modal__head">
         <div>
           <h2 class="modal__title" id="form-title">${editing ? "Edit student" : "Add student"}</h2>
           <p>${editing ? "Update the record and save changes." : "Enrol a new student into the ERP."}</p>
         </div>
         <button class="icon-btn" type="button" data-close-modal aria-label="Close">×</button>
       </div>
       <form class="modal__body" novalidate data-form>
         <div class="form-grid">
           ${FIELDS.map((f) => {
             const val = s ? s[f.name] ?? "" : "";
             let control;
             if (f.type === "select") {
               control = `<select class="input" id="f-${f.name}" name="${f.name}">
                 <option value="">Select ${f.label.toLowerCase()}</option>
                 ${optionsFor(f.name)
                   .map(
                     (o) =>
                       `<option value="${escapeHtml(o)}" ${
                         String(val) === String(o) ? "selected" : ""
                       }>${f.name === "semester" ? `Semester ${o}` : escapeHtml(o)}</option>`
                   )
                   .join("")}
               </select>`;
             } else if (f.type === "textarea") {
               control = `<textarea class="input" id="f-${f.name}" name="${
                 f.name
               }" rows="2">${escapeHtml(val)}</textarea>`;
             } else {
               control = `<input class="input" id="f-${f.name}" name="${f.name}" type="${
                 f.type
               }" value="${escapeHtml(val)}" ${editing && f.name === "id" ? "readonly" : ""}>`;
             }
             return `<div class="field ${f.full ? "field--full" : ""}">
               <label for="f-${f.name}">${f.label}${f.required ? " *" : ""}</label>
               ${control}
               <span class="field__error" data-error="${f.name}"></span>
             </div>`;
           }).join("")}
         </div>
       </form>
       <div class="modal__foot">
         <button class="btn btn--ghost" type="button" data-close-modal>Cancel</button>
         <button class="btn btn--primary" type="button" data-submit>${
           editing ? "Save changes" : "Add student"
         }</button>
       </div>`,
      { size: "lg", labelledBy: "form-title" }
    );

    const form = overlay.querySelector("[data-form]");
    form.addEventListener("submit", (e) => e.preventDefault());
    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        submit();
      }
    });
    overlay.querySelector("[data-submit]").addEventListener("click", submit);

    async function submit() {
      const data = {};
      new FormData(form).forEach((v, k) => (data[k] = typeof v === "string" ? v.trim() : v));
      const errors = validate(data, editing);
      overlay.querySelectorAll("[data-error]").forEach((el) => (el.textContent = ""));
      overlay.querySelectorAll(".input").forEach((el) => el.classList.remove("input--invalid"));
      const keys = Object.keys(errors);
      if (keys.length) {
        keys.forEach((k) => {
          const err = overlay.querySelector(`[data-error="${k}"]`);
          if (err) err.textContent = errors[k];
          const input = overlay.querySelector(`[name="${k}"]`);
          if (input) input.classList.add("input--invalid");
        });
        overlay.querySelector(`[name="${keys[0]}"]`).focus();
        SMS.toast("Please fix the highlighted fields", "error");
        return;
      }
      data.semester = Number(data.semester);
      if (editing) {
        const updated = await api.updateStudent(id, data);
        const idx = state.all.findIndex((x) => x.id === updated.id);
        state.all[idx] = updated;
        SMS.toast("Student Updated", "success");
      } else {
        const created = await api.createStudent({ ...data, roll: rollFor(data) });
        state.all.unshift(created);
        SMS.toast(`Student Added · Roll No. ${created.roll}`, "success");
      }
      SMS.closeModal();
      render();
    }
  }

  /* Roll no. = department code + student ID, e.g. Computer Science + 2121 -> CS-2121 */
  const DEPT_CODES = { "Computer Science": "CS", "Information Technology": "IT", Electronics: "EC", Mechanical: "ME", Civil: "CV" };
  const rollFor = (d) => `${DEPT_CODES[d.department] || d.department.slice(0, 2).toUpperCase()}-${d.id}`;

  function validate(d, editing) {
    const e = {};
    if (!d.name || d.name.length < 3) e.name = "Enter at least 3 characters.";
    if (!d.id) e.id = "Student ID is required.";
    else if (!editing && state.all.some((s) => s.id === Number(d.id)))
      e.id = "This student ID already exists.";
    else if (!editing && state.all.some((s) => String(s.roll || "").toUpperCase() === rollFor(d).toUpperCase()))
      e.id = "A student with this roll number already exists.";
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(d.email || "")) e.email = "Enter a valid email address.";
    if (!/^\d{10}$/.test((d.phone || "").replace(/\D/g, "")))
      e.phone = "Enter a 10 digit phone number.";
    if (!d.department) e.department = "Choose a department.";
    if (!d.semester) e.semester = "Choose a semester.";
    if (!d.gender) e.gender = "Choose a gender.";
    return e;
  }

  /* ---------- Soft remove ---------- */
  async function removeStudent(id) {
    const s = state.all.find((x) => x.id === id);
    const ok = await SMS.confirmDialog({
      title: "Remove student?",
      message: `${s.name} will be removed from your class list.`,
      confirmLabel: "Remove student",
    });
    if (!ok) return;
    await api.removeStudent(id);
    state.removed.add(id);
    render();
    SMS.toast("Student removed successfully", "success");
  }

  /* ---------- Filters ---------- */
  function bindToolbar() {
    const search = document.querySelector("[data-search]");
    search.addEventListener(
      "input",
      SMS.debounce(() => {
        state.query = search.value;
        state.page = 1;
        render();
      }, 140)
    );
    const dept = document.querySelector("[data-filter-dept]");
    dept.innerHTML =
      `<option value="">All departments</option>` +
      state.departments.map((d) => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join("");
    dept.addEventListener("change", () => {
      state.department = dept.value;
      state.page = 1;
      render();
    });
    const sem = document.querySelector("[data-filter-sem]");
    sem.innerHTML =
      `<option value="">All semesters</option>` +
      [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option value="${n}">Semester ${n}</option>`).join("");
    sem.addEventListener("change", () => {
      state.semester = sem.value;
      state.page = 1;
      render();
    });
    document.querySelector("[data-add-student]").addEventListener("click", () => openForm());
    document.querySelector("[data-reset]").addEventListener("click", () => {
      search.value = "";
      dept.value = "";
      sem.value = "";
      Object.assign(state, { query: "", department: "", semester: "", page: 1 });
      render();
      SMS.toast("Filters cleared", "info");
    });
  }

  async function init() {
    SMS.breadcrumb([{ label: "Home", href: "index.html" }, { label: "Students" }]);
    document.querySelector("[data-tbody]").innerHTML = SMS.skeletonRows(6, COLUMNS.length);
    state.departments = await api.getDepartments();
    state.all = await api.getStudents();
    bindToolbar();
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
