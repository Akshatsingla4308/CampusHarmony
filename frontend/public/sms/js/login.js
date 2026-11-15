/* =========================================================
   login.js — Name + Roll No. sign-in.
   Integrated with Java Spring Boot REST Backend & MySQL
   ========================================================= */
(() => {
  "use strict";

  const THEME_KEY = "sms.theme";

  /* Apply saved theme */
  try {
    const t = JSON.parse(localStorage.getItem(THEME_KEY) || '"light"');
    document.documentElement.setAttribute("data-theme", t === "dark" ? "dark" : "light");
  } catch (e) { /* ignore */ }

  const themeBtn = document.querySelector("[data-theme-toggle]");
  const syncPressed = () =>
    themeBtn.setAttribute("aria-pressed", String(document.documentElement.getAttribute("data-theme") === "dark"));
  syncPressed();
  themeBtn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
    syncPressed();
  });

  /* Already signed in? Skip the form. */
  const AUTH = window.SMS_AUTH;
  const existing = AUTH.getSession();
  if (existing) {
    location.replace(AUTH.homeFor(existing.role));
    return;
  }

  const form = document.getElementById("login-form");
  const nameInput = document.getElementById("login-name");
  const rollInput = document.getElementById("login-roll");

  const subjectSelect = document.getElementById("login-subject");
  const deptSelect = document.getElementById("login-department");
  const semSelect = document.getElementById("login-semester");

  let mode = "signin"; /* "signin" | "register" */

  const ROLE = {
    student: { label: "Roll No.", placeholder: "e.g. CS-2101", error: "Please enter your roll number.", hint: "Enter your name and roll number to continue." },
    teacher: { label: "Teacher ID", placeholder: "e.g. T-1001", error: "Please enter your teacher ID.", hint: "Enter your name and teacher ID to open the teacher dashboard." },
  };
  const currentRole = () => form.elements.role.value;
  function applyMode() {
    const role = currentRole();
    const teacher = role === "teacher";
    const reg = mode === "register";
    document.querySelector("[data-login-title]").textContent = reg ? `Register as ${role}` : "Welcome back";
    document.querySelector("[data-submit]").textContent = reg ? "Register" : "Sign in";
    document.querySelector("[data-switch-wrap]").hidden = false;
    /* "Subject you teach" belongs to teacher registration ONLY. Department/semester are student registration ONLY. */
    const showSubject = teacher && reg;
    const showStudentFields = !teacher && reg;
    document.querySelector("[data-subject-field]").hidden = !showSubject;
    subjectSelect.disabled = !showSubject;
    document.querySelectorAll("[data-student-field]").forEach((el) => { el.hidden = !showStudentFields; });
    deptSelect.disabled = semSelect.disabled = !showStudentFields;
    document.querySelector("[data-switch-text]").textContent = reg
      ? "Already registered? "
      : teacher ? "New teacher? " : "New student? ";
    document.querySelector("[data-switch-mode]").textContent = reg ? "Sign in" : "Register here";
    document.querySelector("[data-login-hint]").textContent = reg
      ? (teacher
          ? "Enter your name, choose a Teacher ID and the subject you teach. Then sign in."
          : "Enter your name, roll number, department and semester. Then sign in.")
      : ROLE[role].hint;
  }
  document.querySelector("[data-switch-mode]").addEventListener("click", () => {
    mode = mode === "register" ? "signin" : "register";
    ["name", "roll", "subject", "department", "semester"].forEach((f) => setError(f, ""));
    applyMode();
    nameInput.focus();
  });

  /* Dropdowns (only used while registering) */
  deptSelect.innerHTML =
    `<option value="">Choose your department</option>` +
    AUTH.departments.map((d) => `<option value="${d}">${d}</option>`).join("");
  semSelect.innerHTML =
    `<option value="">Choose your semester</option>` +
    [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option value="${n}">Semester ${n}</option>`).join("");
  function populateSubjects(subs) {
    subjectSelect.innerHTML =
      `<option value="">Choose your subject</option>` +
      subs.map((sub) => `<option value="${sub.key}">${sub.label}</option>`).join("");
  }
  populateSubjects(AUTH.subjects);
  AUTH.fetchSubjects().then((subs) => {
    if (subs && subs.length) populateSubjects(subs);
  });

  function applyRole() {
    mode = "signin";
    const r = ROLE[currentRole()];
    document.querySelector("[data-id-label]").textContent = r.label;
    rollInput.placeholder = r.placeholder;
    applyMode();
    const demo = document.querySelector("[data-demo]");
    demo.textContent = currentRole() === "teacher" ? "Demo teacher: Dr. Sudha Rao · T-1001" : "Demo student: Rahul Sharma · CS-2101";
    setError("roll", "");
  }
  form.querySelectorAll('input[name="role"]').forEach((el) => el.addEventListener("change", applyRole));

  function setError(field, message) {
    const input = form.elements[field];
    const errEl = form.querySelector(`[data-error-for="${field}"]`);
    if (errEl) errEl.textContent = message || "";
    if (input) {
      input.classList.toggle("is-invalid", Boolean(message));
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }
  }

  function validateBasic() {
    const name = nameInput.value.trim().replace(/\s+/g, " ");
    const roll = rollInput.value.trim().toUpperCase();
    let ok = true;

    if (name.length < 2) {
      setError("name", "Please enter your full name.");
      ok = false;
    } else if (!/^\p{L}[\p{L}\p{M} .'-]*$/u.test(name)) {
      setError("name", "Name can only contain letters, spaces, . ' and -");
      ok = false;
    } else setError("name", "");

    if (!roll) {
      setError("roll", ROLE[currentRole()].error);
      ok = false;
    } else if (!/^[A-Z0-9][A-Z0-9/_-]{1,19}$/.test(roll)) {
      setError("roll", "ID can only contain letters, numbers, - / and _");
      ok = false;
    } else setError("roll", "");

    return ok ? { name, roll } : null;
  }

  [nameInput, rollInput, subjectSelect, deptSelect, semSelect].forEach((el) =>
    el.addEventListener("input", () => setError(el.name, ""))
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const basic = validateBasic();
    if (!basic) {
      (form.querySelector(".is-invalid") || nameInput).focus();
      return;
    }

    const submitBtn = form.querySelector("[data-submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Connecting...";

    try {
      if (mode === "register") {
        const isTeacher = currentRole() === "teacher";
        const extra = {};
        let bad = false;
        if (isTeacher) {
          extra.subject = subjectSelect.value;
          if (!extra.subject) { setError("subject", "Please choose the subject you teach."); bad = true; }
        } else {
          extra.department = deptSelect.value;
          extra.semester = semSelect.value;
          if (!extra.department) { setError("department", "Please choose your department."); bad = true; }
          if (!extra.semester) { setError("semester", "Please choose your semester."); bad = true; }
        }
        if (bad) return;

        if (isTeacher) {
          await AUTH.registerTeacherWithBackend({ id: basic.roll, name: basic.name, subject: extra.subject });
        } else {
          await AUTH.registerStudentWithBackend({ roll: basic.roll, name: basic.name, department: extra.department, semester: extra.semester });
        }

        mode = "signin";
        subjectSelect.value = deptSelect.value = semSelect.value = "";
        applyMode();
        const hint = document.querySelector("[data-login-hint]");
        hint.textContent = "Registered successfully! Now sign in with the same name and ID.";
        hint.classList.add("login__ok");
        setTimeout(() => hint.classList.remove("login__ok"), 6000);

      } else {
        // Authenticate via Spring Boot REST API
        let sessionData;
        try {
          sessionData = await AUTH.loginWithBackend({
            role: currentRole(),
            name: basic.name,
            roll: basic.roll,
          });
        } catch (apiErr) {
          // If backend returned business validation error (e.g. wrong name or ID), display it
          const msg = apiErr.message || "Login failed";
          if (msg.toLowerCase().includes("name")) {
            setError("name", msg);
          } else {
            setError("roll", msg);
          }
          (form.querySelector(".is-invalid") || nameInput).focus();
          return;
        }

        AUTH.saveSession(sessionData);
        location.replace(AUTH.homeFor(sessionData.role));
      }
    } catch (unexpected) {
      console.error("Login submission error:", unexpected);
      setError("roll", unexpected.message || "Could not connect to backend server.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = mode === "register" ? "Register" : "Sign in";
    }
  });

  applyRole();
  nameInput.focus();
})();
