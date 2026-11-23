import React, { useEffect, useRef, useState } from "react";
import { request } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { DashboardMetrics } from "./DashboardOverview";

const base = "/academic";
const control =
  "w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60";
const button =
  "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60";
const panel = "portal-card p-4";
const options = (rows, key, label) => rows.map((row) => [row[key], row[label]]);
const sectionLabel = (s) =>
  [s.department, s.term, "Sem " + s.semester, s.section_name ?? s.name].join(" · ");
const localDate = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

function useRows(path, revision) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    let active = true;
    if (path)
      request(base + path)
        .then((data) => {
          if (active) setResult({ path, revision, data });
        })
        .catch((error) => {
          if (active) setResult({ path, revision, error: error.message });
        });
    return () => {
      active = false;
    };
  }, [path, revision]);
  return result?.path === path ? result : {};
}
function Select({ label, value, onChange, choices }) {
  return (
    <label className="grid gap-1">
      {label}
      <select
        className={control}
        disabled={!choices.length}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Choose…</option>
        {choices.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
function EntryForm({ title, path, fields, refresh }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const missing = fields.filter(([, , type]) => Array.isArray(type) && !type.length);
  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await request(base + path, { method: "POST", body });
      form.reset();
      setMessage("Saved.");
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  const anchor = path.split("/").pop();
  const disclosure = useRef(null);
  useEffect(() => {
    function openTarget() {
      if (window.location.hash === "#" + anchor) {
        disclosure.current.open = true;
        disclosure.current.scrollIntoView?.({ block: "start" });
      }
    }
    openTarget();
    window.addEventListener("hashchange", openTarget);
    return () => window.removeEventListener("hashchange", openTarget);
  }, [anchor]);
  return (
    <details ref={disclosure} id={anchor} className={panel + " scroll-mt-20"}>
      <summary className="cursor-pointer font-semibold">{title}</summary>
      <form onSubmit={submit} className="mt-4 grid max-w-2xl gap-3 sm:grid-cols-2">
        {missing.length > 0 && (
          <p className="text-sm text-muted-foreground sm:col-span-2">
            Set up these records first: {missing.map(([, label]) => label.toLowerCase()).join(", ")}
            .
          </p>
        )}
        {fields.map(([name, label, type = "text"]) => (
          <label key={name} className="grid gap-1">
            {label}
            {Array.isArray(type) ? (
              <select
                required
                defaultValue=""
                className={control}
                name={name}
                disabled={!type.length}
              >
                <option value="">Choose…</option>
                {type.map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
            ) : (
              <input
                required
                className={control}
                type={type}
                name={name}
                min={type === "number" ? 1 : undefined}
                max={name === "period" ? 10 : undefined}
                minLength={type === "password" ? 12 : undefined}
                autoComplete={type === "password" ? "new-password" : "off"}
              />
            )}
          </label>
        ))}
        <button disabled={busy || missing.length > 0} className={button + " w-fit sm:col-span-2"}>
          {busy ? "Saving…" : title}
        </button>
      </form>
      {message && (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </details>
  );
}
function Register({ sections, refresh }) {
  return (
    <EntryForm
      title="Register student"
      path="/students"
      refresh={refresh}
      fields={[
        ["sectionId", "Section", sections],
        ["roll", "Roll number / login"],
        ["name", "Full name"],
        ["email", "Email", "email"],
        ["phone", "Phone", "tel"],
        ["gender", "Gender", ["Male", "Female", "Other"].map((v) => [v, v])],
        ["password", "Initial password (12 or more characters)", "password"],
      ]}
    />
  );
}
function AssignOfferingForm({ catalog: c, offerings, refresh }) {
  const [sectionId, setSectionId] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const anchor = "offerings";
  const disclosure = useRef(null);
  useEffect(() => {
    function openTarget() {
      if (window.location.hash === "#" + anchor && disclosure.current) {
        disclosure.current.open = true;
        disclosure.current.scrollIntoView?.({ block: "start" });
      }
    }
    openTarget();
    window.addEventListener("hashchange", openTarget);
    return () => window.removeEventListener("hashchange", openTarget);
  }, [anchor]);

  const selectedSection = c.sections.find((s) => String(s.id) === String(sectionId));
  const availableCourses = c.courses.filter((course) => {
    if (!selectedSection) return true;
    if (selectedSection.department && course.department) {
      return course.department === selectedSection.department;
    }
    return true;
  });
  const availableTeachers = c.teachers.filter((t) => {
    if (!selectedSection) return true;
    if (selectedSection.department && t.department) {
      return t.department === selectedSection.department;
    }
    return true;
  });

  const existingOffering = offerings.find(
    (o) => String(o.section_id) === String(sectionId) && o.code === courseCode,
  );

  async function submit(e) {
    e.preventDefault();
    if (!sectionId || !courseCode || !teacherId) return;
    if (existingOffering) {
      setError(`Course ${courseCode} is already assigned to this section.`);
      return;
    }
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await request(base + "/offerings", {
        method: "POST",
        body: { sectionId: Number(sectionId), courseCode, teacherId },
      });
      setMessage("Course offering successfully assigned to section.");
      setCourseCode("");
      setTeacherId("");
      refresh();
    } catch (err) {
      setError(err.message || "Failed to assign course offering");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details ref={disclosure} id={anchor} className={panel + " scroll-mt-20"}>
      <summary className="cursor-pointer font-semibold">Assign teacher and course</summary>
      <form onSubmit={submit} className="mt-4 grid max-w-2xl gap-3 sm:grid-cols-2">
        <label className="grid gap-1 sm:col-span-2">
          Section
          <select
            required
            className={control}
            value={sectionId}
            onChange={(e) => {
              setSectionId(e.target.value);
              setCourseCode("");
              setTeacherId("");
            }}
          >
            <option value="">Choose academic section…</option>
            {c.sections.map((s) => (
              <option key={s.id} value={s.id}>
                {sectionLabel(s)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          Course
          <select
            required
            className={control}
            value={courseCode}
            disabled={!sectionId || availableCourses.length === 0}
            onChange={(e) => setCourseCode(e.target.value)}
          >
            <option value="">
              {!sectionId
                ? "Select section first…"
                : availableCourses.length
                  ? "Choose course…"
                  : "No matching courses"}
            </option>
            {availableCourses.map((course) => (
              <option key={course.code} value={course.code}>
                {course.code} · {course.name} (Sem {course.semester})
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          Teacher
          <select
            required
            className={control}
            value={teacherId}
            disabled={!sectionId || availableTeachers.length === 0}
            onChange={(e) => setTeacherId(e.target.value)}
          >
            <option value="">
              {!sectionId
                ? "Select section first…"
                : availableTeachers.length
                  ? "Choose teacher…"
                  : "No matching teachers"}
            </option>
            {availableTeachers.map((t) => (
              <option key={t.teacher_id} value={t.teacher_id}>
                {t.name} ({t.teacher_id} · {t.department || "Faculty"})
              </option>
            ))}
          </select>
        </label>

        {existingOffering && (
          <p role="alert" className="text-xs text-amber-600 dark:text-amber-400 sm:col-span-2">
            Notice: Course {courseCode} is already assigned to this section.
          </p>
        )}

        <button
          disabled={busy || !sectionId || !courseCode || !teacherId || !!existingOffering}
          className={button + " w-fit sm:col-span-2"}
        >
          {busy ? "Assigning…" : "Assign teacher and course"}
        </button>
      </form>
      {message && (
        <p role="status" className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </details>
  );
}
function Admin({ catalog: c, offerings, refresh }) {
  const departments = c.departments.map((d) => [d.id, `${d.name} (${d.code || d.id})`]),
    subjects = options(c.subjects, "subject_key", "label");
  const sections = c.sections.map((s) => [s.id, sectionLabel(s)]),
    code = ["code", "Code"],
    name = ["name", "Name"],
    dept = ["departmentId", "Department", departments],
    subject = ["subject", "Subject", subjects],
    semester = ["semester", "Semester", "number"];
  const forms = [
    ["Add department", "/catalog/departments", [code, name]],
    ["Add subject", "/catalog/subjects", [code, name]],
    [
      "Add academic term",
      "/catalog/terms",
      [
        code,
        name,
        ["year", "Academic year"],
        ["term", "Term", ["Odd", "Even", "Summer"].map((v) => [v, v])],
      ],
    ],
    [
      "Create section",
      "/sections",
      [
        name,
        dept,
        ["termId", "Academic term", c.terms.map((t) => [t.id, `${t.name} (${t.term} ${t.year})`])],
        semester,
      ],
    ],
    [
      "Add course",
      "/catalog/courses",
      [code, name, dept, subject, semester, ["credits", "Credits", "number"]],
    ],
    [
      "Create teacher account",
      "/teachers",
      [
        ["login", "Faculty ID / login"],
        name,
        dept,
        subject,
        ["password", "Initial password (12 or more characters)", "password"],
      ],
    ],
    [
      "Schedule lecture",
      "/lectures",
      [
        [
          "offeringId",
          "Teaching assignment",
          offerings.map((o) => [o.id, sectionLabel(o) + " · " + o.code + " · " + o.teacher_id]),
        ],
        ["date", "Date", "date"],
        ["period", "Lecture period (1–10)", "number"],
      ],
    ],
  ];
  const groups = [
    ["Academic catalog", forms.slice(0, 3)],
    ["Sections and courses", forms.slice(3, 5)],
    ["Accounts and teaching assignments", forms.slice(5, 6)],
    ["Dated lectures", forms.slice(6)],
  ];
  return groups.map(([label, entries], index) => (
    <section key={label} className="grid gap-2">
      <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
      {entries.map(([title, path, fields]) => (
        <EntryForm key={path} {...{ title, path, fields, refresh }} />
      ))}
      {index === 2 && (
        <>
          <AssignOfferingForm catalog={c} offerings={offerings} refresh={refresh} />
          <Register sections={sections} refresh={refresh} />
        </>
      )}
    </section>
  ));
}
function MarkRoster({ lecture, revision, refresh, future, refreshingLecture }) {
  const roster = useRows("/lectures/" + lecture.id + "/roster", revision);
  const [marks, setMarks] = useState({}),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [editing, setEditing] = useState(false);
  const submitted = Boolean(lecture.submitted_at);
  const editable = !future && (!submitted || editing);
  const pending = refreshingLecture || roster.revision !== revision;
  const statusFor = (r) => marks[r.enrollment_id] ?? r.status ?? "";
  async function submit(e) {
    e.preventDefault();
    if (pending || busy || !editable) return;
    setBusy(true);
    setError("");
    try {
      await request(base + "/lectures/" + lecture.id + "/attendance", {
        method: submitted ? "PUT" : "POST",
        body: {
          records: roster.data.map((r) => ({
            enrollmentId: r.enrollment_id,
            status: statusFor(r),
          })),
        },
      });
      setEditing(false);
      setMarks({});
      setMessage(submitted ? "Attendance corrections saved." : "Attendance submitted.");
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (roster.error && roster.revision === revision)
    return (
      <p role="alert">
        {roster.error}{" "}
        <button className="underline" onClick={refresh}>
          Retry
        </button>
      </p>
    );
  if (pending)
    return <p role="status">{message ? message + " Refreshing roster…" : "Loading roster…"}</p>;
  if (!roster.data.length) return <p>No students were enrolled for this lecture date.</p>;
  return (
    <form onSubmit={submit} className={panel + " grid gap-3"}>
      <h3 className="font-semibold">
        {editing ? "Correct attendance" : submitted ? "Submitted attendance" : "Lecture roster"}
      </h3>
      {future && (
        <p className="text-sm text-muted-foreground">
          Attendance can be marked on or after the lecture date.
        </p>
      )}
      {roster.data.map((r) => (
        <label
          className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm"
          key={r.enrollment_id}
        >
          <span>
            {r.roll} · {r.name}
          </span>
          {!editable ? (
            <span>{r.status ?? "No record"}</span>
          ) : (
            <select
              required
              className={control + " sm:w-40"}
              value={statusFor(r)}
              disabled={busy}
              onChange={(e) => setMarks({ ...marks, [r.enrollment_id]: e.target.value })}
            >
              <option value="">Choose…</option>
              <option>Present</option>
              <option>Absent</option>
            </select>
          )}
        </label>
      ))}
      {editable && (
        <button
          disabled={busy || (submitted && !roster.data.some((r) => statusFor(r) !== r.status))}
          className={button + " w-fit"}
        >
          {busy ? "Saving…" : submitted ? "Save corrections" : "Submit attendance"}
        </button>
      )}
      {submitted && !future && (
        <button
          type="button"
          disabled={busy}
          className="w-fit text-sm font-medium underline"
          onClick={() => {
            setEditing(!editing);
            setMarks({});
            setError("");
            setMessage("");
          }}
        >
          {editing ? "Cancel corrections" : "Correct attendance"}
        </button>
      )}
      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
function Teacher({ offerings, revision, refresh, selection }) {
  const initialOffering =
    offerings.find((o) => o.id === selection?.offeringId) ??
    (offerings.length === 1 ? offerings[0] : undefined);
  const [section, setSection] = useState(() => String(initialOffering?.section_id ?? "")),
    [course, setCourse] = useState(() => String(initialOffering?.id ?? "")),
    [date, setDate] = useState(() => selection?.date || localDate()),
    [session, setSession] = useState(() => String(selection?.sessionId ?? "")),
    [newPeriod, setNewPeriod] = useState("1"),
    [scheduleBusy, setScheduleBusy] = useState(false),
    [scheduleMsg, setScheduleMsg] = useState("");
  const sections = [...new Map(offerings.map((o) => [o.section_id, sectionLabel(o)])).entries()];
  const lectures = useRows(
    course && date ? "/lectures?offeringId=" + course + "&date=" + date : null,
    revision,
  );
  const lecture = lectures.data?.find((l) => String(l.id) === session);

  async function scheduleLecture(e) {
    e.preventDefault();
    setScheduleBusy(true);
    setScheduleMsg("");
    try {
      await request(base + "/lectures", {
        method: "POST",
        body: { offeringId: Number(course), date, period: Number(newPeriod) },
      });
      setScheduleMsg("Period " + newPeriod + " scheduled.");
      refresh();
    } catch (err) {
      setScheduleMsg(err.message);
    } finally {
      setScheduleBusy(false);
    }
  }

  return (
    <>
      {sections.length === 0 ? (
        <p className={panel}>
          No teaching assignments yet. Contact the academic office to get a class assigned.
        </p>
      ) : (
        <div className="grid gap-3">
          <div className={panel + " grid items-end gap-3 sm:grid-cols-3"}>
            <Select
              label="Assigned class"
              choices={sections}
              value={section}
              onChange={(v) => {
                setSection(v);
                const assigned = offerings.filter((o) => String(o.section_id) === v);
                setCourse(assigned.length === 1 ? String(assigned[0].id) : "");
                setSession("");
              }}
            />
            <Select
              label="Course"
              choices={offerings
                .filter((o) => String(o.section_id) === section)
                .map((o) => [o.id, o.code + " · " + o.course_name])}
              value={course}
              onChange={(v) => {
                setCourse(v);
                setSession("");
              }}
            />
            <label className="grid gap-1">
              Lecture date
              <input
                className={control}
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSession("");
                }}
              />
            </label>
          </div>
          {lectures.error && (
            <p role="alert">
              {lectures.error}{" "}
              <button className="underline" onClick={refresh}>
                Retry
              </button>
            </p>
          )}
          {course && date && !lectures.error && lectures.revision !== revision && (
            <p role="status">Loading lectures…</p>
          )}
          {course && date && (
            <form onSubmit={scheduleLecture} className="flex flex-wrap gap-2 items-center text-sm">
              <label className="flex items-center gap-2">
                Lecture period
                <input
                  required
                  type="number"
                  min="1"
                  max="10"
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                  className="w-16 border p-1 rounded"
                />
              </label>
              <button
                disabled={scheduleBusy}
                className="border px-2 py-1 rounded bg-muted hover:bg-muted/80"
              >
                + Add period
              </button>
              {scheduleMsg && (
                <span role="status" className="text-muted-foreground">
                  {scheduleMsg}
                </span>
              )}
            </form>
          )}
          {lectures.data?.length === 0 ? (
            <p>No lectures scheduled for this date.</p>
          ) : (
            lectures.data?.length > 0 && (
              <Select
                label="Scheduled lecture"
                choices={(lectures.data ?? []).map((l) => [
                  l.id,
                  "Period " + l.session_slot + (l.submitted_at ? " · submitted" : ""),
                ])}
                value={session}
                onChange={setSession}
              />
            )
          )}
          {session && lectures.data && lectures.revision === revision && !lecture && (
            <p role="status">This lecture is unavailable. Choose another scheduled lecture.</p>
          )}
          {lecture && (
            <MarkRoster
              key={lecture.id}
              {...{ lecture, revision, refresh }}
              future={date > localDate()}
              refreshingLecture={lectures.revision !== revision}
            />
          )}
        </div>
      )}
      {sections.length > 0 && <Register sections={sections} refresh={refresh} />}
    </>
  );
}
export default function AcademicWorkspace({ selection, overview = false }) {
  const { role } = useAuth(),
    [revision, setRevision] = useState(0);
  const refresh = () => setRevision((n) => n + 1);
  const catalog = useRows(role === "admin" ? "/catalog" : null, revision);
  const offerings = useRows(role !== "student" ? "/offerings" : null, revision);
  const attendance = useRows(role === "student" ? "/my-attendance" : null, revision);
  const error = catalog.error || offerings.error || attendance.error;
  return (
    <section className="grid min-w-0 gap-4 max-w-4xl">
      <h2 className="font-bold text-xl">
        {
          {
            admin: "Academic administration",
            teacher: "Class attendance",
            student: "My attendance",
          }[role]
        }
      </h2>
      {error && (
        <p role="alert">
          {error}{" "}
          <button className="underline" onClick={refresh}>
            Retry
          </button>
        </p>
      )}
      {!error &&
        ((role === "admin" && (!catalog.data || !offerings.data)) ||
          (role === "teacher" && !offerings.data) ||
          (role === "student" && !attendance.data)) && (
          <p role="status">Loading academic records…</p>
        )}
      {role === "admin" && catalog.data && offerings.data && (
        <>
          {overview && (
            <DashboardMetrics
              items={[
                ["Departments", catalog.data.departments.length],
                ["Sections", catalog.data.sections.length],
                ["Teacher accounts", catalog.data.teachers.length],
                ["Course assignments", offerings.data.length],
              ]}
            />
          )}
          <Admin catalog={catalog.data} offerings={offerings.data} refresh={refresh} />
        </>
      )}
      {role === "teacher" && offerings.data && (
        <>
          {overview && (
            <DashboardMetrics
              items={[
                ["Assigned courses", new Set(offerings.data.map((o) => o.code)).size],
                ["Assigned sections", new Set(offerings.data.map((o) => o.section_id)).size],
              ]}
            />
          )}
          <Teacher offerings={offerings.data} {...{ revision, refresh, selection }} />
        </>
      )}
      {attendance.data &&
        (attendance.data.length ? (
          <div
            className="overflow-x-auto rounded-xl border border-border bg-card"
            role="region"
            aria-label="Subject-wise attendance"
            tabIndex={0}
          >
            <table className="w-full min-w-[32rem] text-sm [&_td]:border-t [&_td]:border-border [&_td]:p-3 [&_th]:p-3">
              <thead>
                <tr>
                  {["Course", "Term", "Present", "Lectures", "Attendance"].map((h) => (
                    <th key={h} className="text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendance.data.map((r) => (
                  <tr key={r.term + r.code}>
                    <td>
                      {r.code} · {r.name}
                    </td>
                    <td>{r.term}</td>
                    <td>{r.present}</td>
                    <td>{r.lectures}</td>
                    <td>{r.percentage == null ? "No lectures marked" : r.percentage + "%"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No course enrollments yet.</p>
        ))}
    </section>
  );
}
