import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, GraduationCap, CheckCircle2, UserPlus, BookOpen, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { api, request } from "../lib/api";
import DataTable from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";
import Modal from "../components/common/Modal";

export const Route = createFileRoute("/teachers")({
  component: TeachersPage,
});

function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    login: "",
    name: "",
    departmentId: 1,
    subject: "computerScience",
    email: "",
    phone: "",
    cabin: "",
    password: "Teacher@123456",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teachRes, deptRes] = await Promise.all([api.teachers.getAll(), api.departments.getAll()]);
      setTeachers(Array.isArray(teachRes) ? teachRes : []);
      setDepartments(Array.isArray(deptRes) ? deptRes : []);
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
    setEditingTeacher(null);
    setFormData({
      login: "",
      name: "",
      departmentId: departments[0]?.id || 1,
      subject: "Computer Science",
      email: "",
      phone: "",
      cabin: "",
      password: "Teacher@123456",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      login: teacher.id || "",
      name: teacher.name || "",
      departmentId: teacher.departmentId || 1,
      subject: teacher.subject || "Computer Science",
      email: teacher.email || "",
      phone: teacher.phone || "",
      cabin: teacher.cabin || "",
      password: "",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTeacher) {
        await api.teachers.update(editingTeacher.id, {
          name: formData.name.trim(),
          departmentId: Number(formData.departmentId),
          subject: formData.subject.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          cabin: formData.cabin.trim(),
        });
        toast.success(`Faculty profile for ${formData.name} updated successfully.`);
      } else {
        await request("/academic/teachers", {
          method: "POST",
          body: {
            login: formData.login.trim().toLowerCase(),
            name: formData.name.trim(),
            password: formData.password || "Teacher@123456",
            departmentId: Number(formData.departmentId),
            subject: formData.subject.trim(),
          },
        });
        toast.success(`Faculty member ${formData.name} (${formData.login}) onboarded successfully.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to save faculty record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (teacher) => {
    if (!window.confirm(`Are you sure you want to remove faculty member ${teacher.name} (${teacher.id})?`)) return;
    try {
      await api.teachers.delete(teacher.id);
      toast.success(`Faculty member ${teacher.name} removed successfully.`);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to remove faculty member.");
    }
  };

  const columns = [
    {
      header: "Faculty ID",
      key: "id",
      sortable: true,
      render: (val) => <span className="font-mono font-bold text-foreground text-xs">{val}</span>,
    },
    {
      header: "Full Name",
      key: "name",
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-semibold text-foreground text-sm">{val}</div>
          <div className="text-xs text-muted-foreground">{row.email || `${row.id}@campus.edu`}</div>
        </div>
      ),
    },
    {
      header: "Department",
      key: "department",
      sortable: true,
      render: (val, row) => {
        const d = departments.find((dept) => dept.id === row.departmentId);
        return <span className="font-medium text-xs">{d ? d.name : val || "Engineering"}</span>;
      },
    },
    {
      header: "Subject / Specialization",
      key: "subject",
      sortable: true,
      render: (val) => (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <BookOpen className="w-3 h-3" />
          {val}
        </span>
      ),
    },
    {
      header: "Cabin / Office",
      key: "cabin",
      render: (val) => <span className="text-xs text-muted-foreground">{val || "Faculty Wing"}</span>,
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
            title="Edit Faculty"
            aria-label={`Edit ${row.name}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
            title="Delete Faculty"
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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Faculty & Staff Directory</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage teaching faculty profiles, department associations, and user accounts.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="portal-button-primary gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Register Faculty Member
        </button>
      </div>

      {error && <ErrorMessage error={error} onRetry={loadData} />}

      {/* Main Faculty Table */}
      <DataTable
        columns={columns}
        data={teachers}
        keyField="id"
        searchPlaceholder="Search by faculty name, ID, or subject..."
        searchFields={["id", "name", "subject"]}
        loading={loading}
        emptyMessage="No faculty members found matching your search."
      />

      {/* Add / Edit Faculty Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? `Edit Faculty: ${editingTeacher.name}` : "Register Faculty Member"}
        description={
          editingTeacher
            ? "Update faculty profile and contact details."
            : "Onboard an instructor, link them to a department, and create their login credentials."
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="portal-label" htmlFor="fac-login">Faculty ID / Login *</label>
              <input
                id="fac-login"
                type="text"
                required
                value={formData.login}
                onChange={(e) => setFormData({ ...formData, login: e.target.value.toLowerCase() })}
                className="portal-input font-mono"
                placeholder="e.g. prof_sharma"
                disabled={Boolean(editingTeacher)}
              />
            </div>
            <div>
              <label className="portal-label" htmlFor="fac-name">Full Name *</label>
              <input
                id="fac-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="portal-input"
                placeholder="e.g. Dr. Rajesh Sharma"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="portal-label" htmlFor="fac-dept">Academic Department *</label>
              <select
                id="fac-dept"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: parseInt(e.target.value, 10) })}
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
              <label className="portal-label" htmlFor="fac-subject">Subject Specialization *</label>
              <input
                id="fac-subject"
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="portal-input"
                placeholder="e.g. Computer Science, Data Structures"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="portal-label" htmlFor="fac-email">Email Address</label>
              <input
                id="fac-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="portal-input"
                placeholder="faculty@campus.edu"
              />
            </div>
            <div>
              <label className="portal-label" htmlFor="fac-phone">Phone / Extension</label>
              <input
                id="fac-phone"
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="portal-input"
                placeholder="9876543210"
              />
            </div>
          </div>

          <div>
            <label className="portal-label" htmlFor="fac-cabin">Cabin / Office Room</label>
            <input
              id="fac-cabin"
              type="text"
              value={formData.cabin}
              onChange={(e) => setFormData({ ...formData, cabin: e.target.value })}
              className="portal-input"
              placeholder="e.g. Room 402, Block A"
            />
          </div>

          {!editingTeacher && (
            <div>
              <label className="portal-label" htmlFor="fac-password">Initial Password (12+ characters) *</label>
              <input
                id="fac-password"
                type="password"
                required
                minLength={12}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="portal-input"
                placeholder="e.g. Teacher@123456"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Faculty member uses this password along with their Faculty ID to sign in.
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
              {saving ? "Saving…" : (editingTeacher ? "Save Changes" : "Confirm Faculty Registration")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TeachersPage;
