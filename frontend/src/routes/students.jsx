import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, UserPlus, Eye, AlertCircle, CheckCircle2, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { api, request } from "../lib/api";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";
import Modal from "../components/common/Modal";

export const Route = createFileRoute("/students")({
  component: StudentsPage,
});

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    roll: "",
    name: "",
    sectionId: "",
    departmentId: 1,
    department: "Computer Science",
    semester: 1,
    email: "",
    phone: "",
    gender: "Male",
    status: "Active",
    password: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stuRes, deptRes, catRes] = await Promise.all([
        api.students.getAll(),
        api.departments.getAll(),
        request("/academic/catalog").catch(() => ({ sections: [] })),
      ]);
      setStudents(Array.isArray(stuRes) ? stuRes : []);
      setDepartments(Array.isArray(deptRes) ? deptRes : []);
      setSections(catRes?.sections || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      roll: "",
      name: "",
      sectionId: sections.length > 0 ? String(sections[0].id) : "",
      departmentId: departments[0]?.id || 1,
      department: departments[0]?.name || "Computer Science",
      semester: 1,
      email: "",
      phone: "",
      gender: "Male",
      status: "Active",
      password: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      roll: student.roll || "",
      name: student.name || "",
      sectionId: student.sectionId ? String(student.sectionId) : "",
      departmentId: student.departmentId || 1,
      department: student.department || "Computer Science",
      semester: student.semester || 1,
      email: student.email || "",
      phone: student.phone || "",
      gender: student.gender || "Male",
      status: student.status || "Active",
      password: "",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingStudent) {
        await api.students.update(editingStudent.id, {
          roll: formData.roll,
          name: formData.name,
          departmentId: formData.departmentId,
          department: formData.department,
          semester: formData.semester,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender,
          status: formData.status,
        });
        toast.success(`Student ${formData.name} (${formData.roll}) updated successfully.`);
      } else {
        if (!formData.sectionId) {
          toast.error("Please select an academic section for this student.");
          setSaving(false);
          return;
        }
        await request("/academic/students", {
          method: "POST",
          body: {
            sectionId: Number(formData.sectionId),
            roll: formData.roll.trim(),
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || "0000000000",
            gender: formData.gender,
            password: formData.password ? formData.password.trim() : "",
          },
        });
        toast.success(`Student ${formData.name} (${formData.roll}) enrolled and registered.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to save student record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Are you sure you want to delete student ${student.name} (${student.roll})?`)) return;
    try {
      await api.students.delete(student.id);
      toast.success(`Student ${student.name} removed successfully.`);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete student record.");
    }
  };

  const columns = [
    {
      header: "Roll No",
      key: "roll",
      sortable: true,
      render: (val) => <span className="font-mono font-bold text-foreground text-xs">{val}</span>,
    },
    {
      header: "Student Name",
      key: "name",
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-semibold text-foreground text-sm">{val}</div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
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
      header: "Semester",
      key: "semester",
      sortable: true,
      className: "text-center",
      render: (val) => <span className="px-2 py-0.5 rounded bg-muted font-medium text-xs">Sem {val}</span>,
    },
    {
      header: "Attendance",
      key: "attendance",
      sortable: true,
      render: (val, row) => {
        const pct = row.attendancePercentage !== undefined && row.attendancePercentage !== null
          ? row.attendancePercentage
          : (val !== undefined && val !== null ? val : "—");
        if (pct === "—") return <span className="text-xs text-muted-foreground">—</span>;
        const isDefaulter = Number(pct) < 75;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full ${isDefaulter ? "bg-rose-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(Number(pct), 100)}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${isDefaulter ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {pct}%
            </span>
          </div>
        );
      },
    },
    {
      header: "Status",
      key: "status",
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: "Actions",
      key: "id",
      className: "text-right",
      render: (val, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            title="Edit Student"
            aria-label={`Edit ${row.name}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
            title="Delete Student"
            aria-label={`Delete ${row.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Student Directory & Records</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage student enrollments, academic sections, and attendance performance.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="portal-button-primary gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Enroll New Student
        </button>
      </div>

      {error && <ErrorMessage error={error} onRetry={loadData} />}

      {/* Main Students Table */}
      <DataTable
        columns={columns}
        data={students}
        keyField="id"
        searchPlaceholder="Search by student name, roll number, department, or email..."
        searchFields={["roll", "name", "department", "email"]}
        loading={loading}
        emptyMessage="No students found matching your criteria."
      />

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? `Edit Student: ${editingStudent.roll}` : "Enroll New Student"}
        description={
          editingStudent
            ? "Update student academic records and contact details."
            : "Register a new student, assign them to a section, and automatically provision courses and user credentials."
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="portal-label" htmlFor="stu-roll">Roll Number / Login *</label>
              <input
                id="stu-roll"
                type="text"
                required
                value={formData.roll}
                onChange={(e) => setFormData({ ...formData, roll: e.target.value.toUpperCase() })}
                className="portal-input font-mono"
                placeholder="e.g. CS2026-001"
                disabled={Boolean(editingStudent)}
              />
            </div>
            <div>
              <label className="portal-label" htmlFor="stu-name">Full Name *</label>
              <input
                id="stu-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="portal-input"
                placeholder="e.g. Aarav Sharma"
              />
            </div>
          </div>

          {!editingStudent && (
            <div>
              <label className="portal-label" htmlFor="stu-section">Academic Section *</label>
              <select
                id="stu-section"
                required
                value={formData.sectionId}
                onChange={(e) => {
                  const sId = e.target.value;
                  const sec = sections.find((s) => String(s.id) === sId);
                  setFormData({
                    ...formData,
                    sectionId: sId,
                    department: sec?.department || formData.department,
                    semester: sec?.semester || formData.semester,
                  });
                }}
                className="portal-input"
              >
                <option value="">Select an Academic Section…</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.department} · {sec.term} · Sem {sec.semester} · {sec.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Student will automatically be enrolled in all curriculum courses for this section.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="portal-label" htmlFor="stu-email">Email Address *</label>
              <input
                id="stu-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="portal-input"
                placeholder="student@campus.edu"
              />
            </div>
            <div>
              <label className="portal-label" htmlFor="stu-phone">Phone Number</label>
              <input
                id="stu-phone"
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="portal-input"
                placeholder="9876543210"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="portal-label" htmlFor="stu-gender">Gender</label>
              <select
                id="stu-gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="portal-input"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="portal-label" htmlFor="stu-status">Academic Status</label>
              <select
                id="stu-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="portal-input"
              >
                <option value="Active">Active</option>
                <option value="Probation">Probation</option>
                <option value="Graduated">Graduated</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {!editingStudent && (
            <div>
              <label className="portal-label" htmlFor="stu-password">Initial Password (12+ characters) *</label>
              <input
                id="stu-password"
                type="password"
                required
                minLength={12}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="portal-input"
                placeholder="Enter initial student password (min 12 chars)"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Student uses this password along with their Roll Number to sign in.
              </p>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="portal-button"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="portal-button-primary"
            >
              {saving ? "Saving…" : (editingStudent ? "Save Changes" : "Confirm Enrollment")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default StudentsPage;
