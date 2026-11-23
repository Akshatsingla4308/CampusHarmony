import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { api, request } from "../lib/api";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";
import Modal from "../components/common/Modal";

export const Route = createFileRoute("/courses")({
  component: CoursesPage,
});

function CoursesPage() {
  const [activeTab, setActiveTab] = useState("courses"); // "courses" | "sections" | "offerings" | "enrollments"
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [catalog, setCatalog] = useState({ departments: [], terms: [], sections: [], teachers: [], courses: [] });
  const [offerings, setOfferings] = useState([]);
  const [enrollmentRoster, setEnrollmentRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modal States
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    code: "",
    name: "",
    faculty: "",
    credits: 4,
    semester: 1,
    status: "Upcoming",
    teacherId: "",
  });

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    name: "Section A",
    departmentId: 1,
    termId: 1,
    semester: 1,
  });

  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [offeringForm, setOfferingForm] = useState({
    sectionId: "",
    courseCode: "",
    teacherId: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [crsRes, deptRes, tchRes, catRes, offRes, stuRes] = await Promise.all([
        api.courses.getAll().catch(() => []),
        api.departments.getAll().catch(() => []),
        api.teachers.getAll().catch(() => []),
        request("/academic/catalog").catch(() => ({ departments: [], terms: [], sections: [], teachers: [], courses: [] })),
        request("/academic/offerings").catch(() => []),
        request("/dbms/views/enrollment-roster").catch(() => []),
      ]);

      setCourses(Array.isArray(crsRes) ? crsRes : []);
      setDepartments(Array.isArray(deptRes) ? deptRes : []);
      setTeachers(Array.isArray(tchRes) ? tchRes : []);
      setCatalog(catRes || { departments: [], terms: [], sections: [], teachers: [], courses: [] });
      setOfferings(Array.isArray(offRes) ? offRes : []);
      setEnrollmentRoster(
        Array.isArray(stuRes)
          ? stuRes.map((row) => ({
              id: row.enrollment_id,
              roll: row.student_roll,
              studentName: row.student_name,
              department: row.student_department,
              courseCode: row.course_code,
              courseName: row.course_name,
              academicPeriod: row.period_name,
              status: row.enrollment_status,
            }))
          : [],
      );
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Course Handlers
  const openAddCourseModal = () => {
    setEditingCourse(null);
    setCourseForm({
      code: "",
      name: "",
      faculty: teachers[0]?.name || "Faculty",
      credits: 4,
      semester: 1,
      status: "Upcoming",
      teacherId: teachers[0]?.id || "",
    });
    setIsCourseModalOpen(true);
  };

  const openEditCourseModal = (course) => {
    setEditingCourse(course);
    setCourseForm({
      code: course.code,
      name: course.name,
      faculty: course.faculty || "Faculty",
      credits: course.credits || 4,
      semester: course.semester || 1,
      status: course.status || "Upcoming",
      teacherId: course.teacherId || "",
    });
    setIsCourseModalOpen(true);
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCourse) {
        await api.courses.update(editingCourse.id || editingCourse.code, courseForm);
        toast.success(`Course ${courseForm.code} updated successfully.`);
      } else {
        await api.courses.create(courseForm);
        toast.success(`Course ${courseForm.code}: ${courseForm.name} created successfully.`);
      }
      setIsCourseModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to save course.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Delete course ${course.code}: ${course.name}?`)) return;
    try {
      await api.courses.delete(course.id || course.code);
      toast.success(`Course ${course.code} deleted successfully.`);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete course.");
    }
  };

  // Section Handlers
  const openAddSectionModal = () => {
    setSectionForm({
      name: "Section A",
      departmentId: departments[0]?.id || 1,
      termId: catalog.terms[0]?.id || 1,
      semester: 1,
    });
    setIsSectionModalOpen(true);
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await request("/academic/sections", {
        method: "POST",
        body: {
          name: sectionForm.name.trim(),
          departmentId: Number(sectionForm.departmentId),
          termId: Number(sectionForm.termId),
          semester: Number(sectionForm.semester),
        },
      });
      toast.success(`Section ${sectionForm.name} created successfully.`);
      setIsSectionModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to create section.");
    } finally {
      setSaving(false);
    }
  };

  // Offering Handlers
  const openAddOfferingModal = () => {
    const defaultSection = catalog.sections[0];
    setOfferingForm({
      sectionId: defaultSection ? String(defaultSection.id) : "",
      courseCode: catalog.courses[0]?.code || "",
      teacherId: catalog.teachers[0]?.teacher_id || "",
    });
    setIsOfferingModalOpen(true);
  };

  const handleOfferingSubmit = async (e) => {
    e.preventDefault();
    if (!offeringForm.sectionId || !offeringForm.courseCode || !offeringForm.teacherId) {
      toast.error("Please select a section, course, and faculty member.");
      return;
    }
    setSaving(true);
    try {
      await request("/academic/offerings", {
        method: "POST",
        body: {
          sectionId: Number(offeringForm.sectionId),
          courseCode: offeringForm.courseCode,
          teacherId: offeringForm.teacherId,
        },
      });
      toast.success(`Assigned course ${offeringForm.courseCode} to section successfully.`);
      setIsOfferingModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to assign course offering.");
    } finally {
      setSaving(false);
    }
  };

  // Columns Definitions
  const courseColumns = [
    {
      header: "Code",
      key: "code",
      sortable: true,
      className: "w-28 font-mono font-bold text-foreground text-xs",
    },
    {
      header: "Course Title",
      key: "name",
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-semibold text-foreground text-sm">{val}</div>
          <div className="text-xs text-muted-foreground">Credits: {row.credits} · Sem {row.semester}</div>
        </div>
      ),
    },
    {
      header: "Faculty",
      key: "faculty",
      sortable: true,
      render: (val) => <span className="font-medium text-xs">{val || "Unassigned"}</span>,
    },
    {
      header: "Semester",
      key: "semester",
      sortable: true,
      className: "w-20 text-center",
      render: (val) => <span className="px-2 py-0.5 rounded bg-muted text-xs font-semibold">Sem {val}</span>,
    },
    {
      header: "Credits",
      key: "credits",
      sortable: true,
      className: "w-20 text-center",
      render: (val) => <span className="font-mono text-xs font-bold text-primary">{val}</span>,
    },
    {
      header: "Status",
      key: "status",
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: "Actions",
      key: "code",
      className: "text-right",
      render: (val, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditCourseModal(row)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            title="Edit Course"
          >
            <Edit2 className="w-4 h-4" />
          </button>
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

  const sectionColumns = [
    {
      header: "Section ID",
      key: "id",
      sortable: true,
      className: "w-24 font-mono font-bold text-xs",
    },
    {
      header: "Section Name",
      key: "name",
      sortable: true,
      render: (val) => <span className="font-semibold text-foreground text-sm">{val}</span>,
    },
    {
      header: "Department",
      key: "department",
      sortable: true,
      render: (val) => <span className="font-medium text-xs">{val}</span>,
    },
    {
      header: "Academic Term",
      key: "term",
      sortable: true,
      render: (val) => <span className="text-xs text-muted-foreground">{val}</span>,
    },
    {
      header: "Semester",
      key: "semester",
      sortable: true,
      className: "w-24 text-center",
      render: (val) => <span className="px-2 py-0.5 rounded bg-muted text-xs font-semibold">Sem {val}</span>,
    },
  ];

  const offeringColumns = [
    {
      header: "Offering ID",
      key: "id",
      sortable: true,
      className: "w-24 font-mono font-bold text-xs",
    },
    {
      header: "Course",
      key: "course_name",
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-semibold text-foreground text-sm">{val}</div>
          <div className="text-xs font-mono text-primary font-bold">{row.code}</div>
        </div>
      ),
    },
    {
      header: "Section",
      key: "section_name",
      sortable: true,
      render: (val, row) => (
        <span className="font-medium text-xs">
          {row.department} · {val} (Sem {row.semester})
        </span>
      ),
    },
    {
      header: "Assigned Faculty",
      key: "teacher_id",
      sortable: true,
      render: (val) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium text-xs">
          <GraduationCap className="w-3.5 h-3.5" />
          {val}
        </span>
      ),
    },
    {
      header: "Term",
      key: "term",
      sortable: true,
      render: (val) => <span className="text-xs text-muted-foreground">{val}</span>,
    },
  ];

  const rosterColumns = [
    {
      header: "Enrollment ID",
      key: "id",
      sortable: true,
      className: "w-28 font-mono text-xs",
    },
    {
      header: "Roll Number",
      key: "roll",
      sortable: true,
      render: (val) => <span className="font-mono font-bold text-xs text-foreground">{val}</span>,
    },
    {
      header: "Student Name",
      key: "studentName",
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-semibold text-foreground text-sm">{val}</div>
          <div className="text-xs text-muted-foreground">{row.department}</div>
        </div>
      ),
    },
    {
      header: "Course Enrolled",
      key: "courseName",
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-medium text-xs text-foreground">{val}</div>
          <div className="font-mono text-[11px] text-muted-foreground">{row.courseCode}</div>
        </div>
      ),
    },
    {
      header: "Term",
      key: "academicPeriod",
      sortable: true,
      render: (val) => <span className="text-xs text-muted-foreground">{val}</span>,
    },
    {
      header: "Status",
      key: "status",
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Courses, Sections & Faculty Assignments
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Configure institutional courses, academic sections, and assign teaching faculty.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "courses" && (
            <button onClick={openAddCourseModal} className="portal-button-primary gap-2">
              <Plus className="w-4 h-4" />
              Create Course
            </button>
          )}
          {activeTab === "sections" && (
            <button onClick={openAddSectionModal} className="portal-button-primary gap-2">
              <Plus className="w-4 h-4" />
              Create Section
            </button>
          )}
          {activeTab === "offerings" && (
            <button onClick={openAddOfferingModal} className="portal-button-primary gap-2">
              <Plus className="w-4 h-4" />
              Assign Faculty to Section
            </button>
          )}
        </div>
      </div>

      {error && <ErrorMessage error={error} onRetry={loadData} />}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-px">
        {[
          { id: "courses", label: `Curriculum Courses (${courses.length})`, icon: BookOpen },
          { id: "sections", label: `Academic Sections (${catalog.sections.length})`, icon: Building2 },
          { id: "offerings", label: `Faculty Assignments (${offerings.length})`, icon: GraduationCap },
          { id: "enrollments", label: `Student Roster (${enrollmentRoster.length})`, icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Curriculum Courses */}
      {activeTab === "courses" && (
        <DataTable
          columns={courseColumns}
          data={courses}
          keyField="code"
          searchPlaceholder="Search courses by title, code, or faculty..."
          searchFields={["code", "name", "faculty"]}
          loading={loading}
          emptyMessage="No courses registered in the curriculum yet."
        />
      )}

      {/* Tab 2: Academic Sections */}
      {activeTab === "sections" && (
        <DataTable
          columns={sectionColumns}
          data={catalog.sections}
          keyField="id"
          searchPlaceholder="Search sections by name or department..."
          searchFields={["name", "department", "term"]}
          loading={loading}
          emptyMessage="No academic sections created yet."
        />
      )}

      {/* Tab 3: Faculty Course Offerings */}
      {activeTab === "offerings" && (
        <DataTable
          columns={offeringColumns}
          data={offerings}
          keyField="id"
          searchPlaceholder="Search assignments by course, section, or teacher..."
          searchFields={["course_name", "code", "section_name", "teacher_id"]}
          loading={loading}
          emptyMessage="No course offerings assigned to faculty yet."
        />
      )}

      {/* Tab 4: Student Enrollment Roster */}
      {activeTab === "enrollments" && (
        <DataTable
          columns={rosterColumns}
          data={enrollmentRoster}
          keyField="id"
          searchPlaceholder="Search student roster by roll, name, or course..."
          searchFields={["roll", "studentName", "courseName", "courseCode"]}
          loading={loading}
          emptyMessage="No course enrollment records found."
        />
      )}

      {/* Modal 1: Create / Edit Course */}
      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title={editingCourse ? `Edit Course: ${editingCourse.code}` : "Create Curriculum Course"}
        description="Add a new academic course module to the university curriculum."
      >
        <form onSubmit={handleCourseSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="portal-label" htmlFor="crs-code">Course Code *</label>
              <input
                id="crs-code"
                type="text"
                required
                value={courseForm.code}
                onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
                className="portal-input font-mono"
                placeholder="e.g. CS501"
                disabled={Boolean(editingCourse)}
              />
            </div>
            <div>
              <label className="portal-label" htmlFor="crs-name">Course Title *</label>
              <input
                id="crs-name"
                type="text"
                required
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                className="portal-input"
                placeholder="e.g. Database Systems"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="portal-label" htmlFor="crs-sem">Semester (1–8) *</label>
              <input
                id="crs-sem"
                type="number"
                min={1}
                max={8}
                required
                value={courseForm.semester}
                onChange={(e) => setCourseForm({ ...courseForm, semester: parseInt(e.target.value, 10) })}
                className="portal-input"
              />
            </div>
            <div>
              <label className="portal-label" htmlFor="crs-credits">Credits (1–10) *</label>
              <input
                id="crs-credits"
                type="number"
                min={1}
                max={10}
                required
                value={courseForm.credits}
                onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value, 10) })}
                className="portal-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="portal-label" htmlFor="crs-faculty">Default Faculty Instructor</label>
              <select
                id="crs-faculty"
                value={courseForm.teacherId}
                onChange={(e) => {
                  const tId = e.target.value;
                  const t = teachers.find((tch) => tch.id === tId);
                  setCourseForm({
                    ...courseForm,
                    teacherId: tId,
                    faculty: t ? t.name : "Faculty",
                  });
                }}
                className="portal-input"
              >
                <option value="">Choose Instructor…</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="portal-label" htmlFor="crs-status">Status</label>
              <select
                id="crs-status"
                value={courseForm.status}
                onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
                className="portal-input"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <button
              type="button"
              onClick={() => setIsCourseModalOpen(false)}
              className="portal-button"
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="portal-button-primary">
              {saving ? "Saving…" : (editingCourse ? "Save Changes" : "Create Course")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Create Section */}
      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title="Create Academic Section"
        description="Define a cohort section within a department and academic semester."
      >
        <form onSubmit={handleSectionSubmit} className="space-y-4">
          <div>
            <label className="portal-label" htmlFor="sec-name">Section Name *</label>
            <input
              id="sec-name"
              type="text"
              required
              value={sectionForm.name}
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
              className="portal-input"
              placeholder="e.g. Section A, Section B"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="portal-label" htmlFor="sec-dept">Department *</label>
              <select
                id="sec-dept"
                value={sectionForm.departmentId}
                onChange={(e) => setSectionForm({ ...sectionForm, departmentId: parseInt(e.target.value, 10) })}
                className="portal-input"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="portal-label" htmlFor="sec-term">Academic Term *</label>
              <select
                id="sec-term"
                value={sectionForm.termId}
                onChange={(e) => setSectionForm({ ...sectionForm, termId: parseInt(e.target.value, 10) })}
                className="portal-input"
              >
                {catalog.terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.code || `Term ${t.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="portal-label" htmlFor="sec-sem">Semester (1–8) *</label>
            <input
              id="sec-sem"
              type="number"
              min={1}
              max={8}
              required
              value={sectionForm.semester}
              onChange={(e) => setSectionForm({ ...sectionForm, semester: parseInt(e.target.value, 10) })}
              className="portal-input"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <button
              type="button"
              onClick={() => setIsSectionModalOpen(false)}
              className="portal-button"
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="portal-button-primary">
              {saving ? "Creating…" : "Create Section"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Assign Faculty to Section Course */}
      <Modal
        isOpen={isOfferingModalOpen}
        onClose={() => setIsOfferingModalOpen(false)}
        title="Assign Faculty to Course Offering"
        description="Bind an academic section, course module, and faculty member together."
      >
        <form onSubmit={handleOfferingSubmit} className="space-y-4">
          <div>
            <label className="portal-label" htmlFor="off-section">Target Academic Section *</label>
            <select
              id="off-section"
              required
              value={offeringForm.sectionId}
              onChange={(e) => setOfferingForm({ ...offeringForm, sectionId: e.target.value })}
              className="portal-input"
            >
              <option value="">Select Section…</option>
              {catalog.sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.department} · {sec.term} · Sem {sec.semester} · {sec.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="portal-label" htmlFor="off-course">Curriculum Course *</label>
            <select
              id="off-course"
              required
              value={offeringForm.courseCode}
              onChange={(e) => setOfferingForm({ ...offeringForm, courseCode: e.target.value })}
              className="portal-input"
            >
              <option value="">Select Course…</option>
              {catalog.courses.map((crs) => (
                <option key={crs.code} value={crs.code}>
                  {crs.code} — {crs.name} (Sem {crs.semester})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="portal-label" htmlFor="off-teacher">Assigned Faculty Member *</label>
            <select
              id="off-teacher"
              required
              value={offeringForm.teacherId}
              onChange={(e) => setOfferingForm({ ...offeringForm, teacherId: e.target.value })}
              className="portal-input"
            >
              <option value="">Select Faculty…</option>
              {catalog.teachers.map((t) => (
                <option key={t.teacher_id} value={t.teacher_id}>
                  {t.name} ({t.teacher_id})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <button
              type="button"
              onClick={() => setIsOfferingModalOpen(false)}
              className="portal-button"
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="portal-button-primary">
              {saving ? "Assigning…" : "Assign Offering"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CoursesPage;
