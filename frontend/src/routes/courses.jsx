import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Layers, UserCheck, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";

export const Route = createFileRoute("/courses")({
  component: CoursesPage,
});

function CoursesPage() {
  const [activeTab, setActiveTab] = useState("offerings"); // "offerings" | "enrollments"
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal State for Course Creation
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    code: "",
    name: "",
    department: "Computer Science",
    departmentId: 1,
    faculty: "Dr. Sudha Rao",
    teacherId: 1,
    credits: 4,
    semester: 5,
    subjectKey: "computerScience",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [crsRes, deptRes, tchRes, stuRes] = await Promise.all([
        api.courses.getAll(),
        api.departments.getAll(),
        api.teachers.getAll(),
        api.students.getAll(),
      ]);

      setCourses(Array.isArray(crsRes) ? crsRes : []);
      setDepartments(Array.isArray(deptRes) ? deptRes : []);
      setTeachers(Array.isArray(tchRes) ? tchRes : []);
      setStudents(Array.isArray(stuRes) ? stuRes : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddCourseModal = () => {
    setEditingCourse(null);
    setCourseForm({
      code: `CS${500 + courses.length + 1}`,
      name: "",
      department: departments[0]?.name || "Computer Science",
      departmentId: departments[0]?.id || 1,
      faculty: teachers[0]?.name || "Dr. Sudha Rao",
      teacherId: teachers[0]?.id || 1,
      credits: 4,
      semester: 5,
      subjectKey: "computerScience",
    });
    setIsCourseModalOpen(true);
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      if (editingCourse) {
        await api.courses.update(editingCourse.id, courseForm);
        setSuccessMsg(`Course ${courseForm.code} updated.`);
      } else {
        await api.courses.create(courseForm);
        setSuccessMsg(`Course ${courseForm.code} created.`);
      }
      setIsCourseModalOpen(false);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Delete course ${course.code}: ${course.name}?`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await api.courses.delete(course.id);
      setSuccessMsg(`Course ${course.code} deleted.`);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  // Mock student course enrollment roster view based on enrolled students
  const enrollmentRoster = students.flatMap((s) => [
    {
      id: `${s.id}-1`,
      studentId: s.id,
      roll: s.roll,
      studentName: s.name,
      department: s.department,
      courseCode: s.department === "Computer Science" ? "CS501" : "MA501",
      courseName: s.department === "Computer Science" ? "Database Management Systems" : "Advanced Calculus",
      academicPeriod: "Odd 2026 (Sem 5)",
      status: s.status === "Active" ? "Enrolled" : "Probation",
    },
    {
      id: `${s.id}-2`,
      studentId: s.id,
      roll: s.roll,
      studentName: s.name,
      department: s.department,
      courseCode: s.department === "Computer Science" ? "CS502" : "PH501",
      courseName: s.department === "Computer Science" ? "Programming in Java" : "Quantum Mechanics",
      academicPeriod: "Odd 2026 (Sem 5)",
      status: "Enrolled",
    },
  ]);

  const courseColumns = [
    {
      header: "Code",
      key: "code",
      sortable: true,
      className: "w-28 font-mono font-bold text-foreground",
    },
    {
      header: "Course Title",
      key: "name",
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-semibold text-foreground">{val}</div>
          <div className="text-xs text-muted-foreground">Subject Key: {row.subjectKey || "general"}</div>
        </div>
      ),
    },
    {
      header: "Department",
      key: "department",
      sortable: true,
      render: (val) => <span className="font-medium text-xs">{val}</span>,
    },
    {
      header: "Faculty Instructor",
      key: "faculty",
      sortable: true,
      render: (val) => <span className="font-medium text-foreground">{val}</span>,
    },
    {
      header: "Sem",
      key: "semester",
      sortable: true,
      className: "w-20 text-center",
      render: (val) => <span className="px-2 py-0.5 rounded bg-muted text-xs font-semibold">Sem {val || 5}</span>,
    },
    {
      header: "Credits",
      key: "credits",
      sortable: true,
      className: "w-20 text-center",
      render: (val) => <span className="font-mono text-xs font-bold text-primary">{val || 4}</span>,
    },
    {
      header: "Actions",
      key: "id",
      className: "text-right",
      render: (val, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleDeleteCourse(row)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
            title="Delete Course"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const enrollmentColumns = [
    {
      header: "Roll No",
      key: "roll",
      sortable: true,
      className: "w-28 font-mono font-bold text-foreground",
    },
    {
      header: "Student",
      key: "studentName",
      sortable: true,
      render: (val) => <span className="font-semibold">{val}</span>,
    },
    {
      header: "Course Code",
      key: "courseCode",
      sortable: true,
      className: "font-mono font-medium text-xs",
    },
    {
      header: "Course Title",
      key: "courseName",
      sortable: true,
    },
    {
      header: "Academic Period",
      key: "academicPeriod",
      sortable: true,
      render: (val) => <span className="text-xs text-muted-foreground">{val}</span>,
    },
    {
      header: "Enrollment Status",
      key: "status",
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Course Offerings & Enrollments</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage institutional semester course catalog, instructor allocations, and student registrations
          </p>
        </div>
        {activeTab === "offerings" && (
          <button
            onClick={openAddCourseModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Course Offering
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("offerings")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "offerings"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Course Offerings ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab("enrollments")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "enrollments"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Student Enrollments Roster ({enrollmentRoster.length})
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && <ErrorMessage error={error} onRetry={loadData} />}

      {activeTab === "offerings" ? (
        <DataTable
          columns={courseColumns}
          data={courses}
          keyField="id"
          searchPlaceholder="Search courses by code, title, or instructor..."
          searchFields={["code", "name", "faculty", "department"]}
          loading={loading}
          emptyMessage="No course offerings found."
        />
      ) : (
        <DataTable
          columns={enrollmentColumns}
          data={enrollmentRoster}
          keyField="id"
          searchPlaceholder="Search enrollments by roll number, student name, or course..."
          searchFields={["roll", "studentName", "courseCode", "courseName"]}
          loading={loading}
          emptyMessage="No student course enrollments found."
        />
      )}

      {/* Add Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground rounded-2xl border border-border max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold">Add Course Offering</h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-5">
              Create a new course offering mapped to an academic department and teacher.
            </p>

            <form onSubmit={handleCourseSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background font-mono"
                    placeholder="CS503"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Semester *</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    required
                    value={courseForm.semester}
                    onChange={(e) => setCourseForm({ ...courseForm, semester: parseInt(e.target.value, 10) })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Course Title *</label>
                <input
                  type="text"
                  required
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  placeholder="Computer Networks"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Department *</label>
                  <select
                    value={courseForm.departmentId}
                    onChange={(e) => {
                      const dId = parseInt(e.target.value, 10);
                      const d = departments.find((dept) => dept.id === dId);
                      setCourseForm({
                        ...courseForm,
                        departmentId: dId,
                        department: d ? d.name : "Computer Science",
                      });
                    }}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Assigned Faculty *</label>
                  <select
                    value={courseForm.teacherId}
                    onChange={(e) => {
                      const tId = parseInt(e.target.value, 10);
                      const t = teachers.find((tc) => tc.id === tId);
                      setCourseForm({
                        ...courseForm,
                        teacherId: tId,
                        faculty: t ? t.name : "Dr. Sudha Rao",
                      });
                    }}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Credits *</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={courseForm.credits}
                    onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value, 10) })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Subject Key *</label>
                  <input
                    type="text"
                    required
                    value={courseForm.subjectKey}
                    onChange={(e) => setCourseForm({ ...courseForm, subjectKey: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background font-mono"
                    placeholder="computerScience"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-input hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
