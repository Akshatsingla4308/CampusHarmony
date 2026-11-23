import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, GraduationCap, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import DataTable from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";

export const Route = createFileRoute("/teachers")({
  component: TeachersPage,
});

function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    departmentId: 1,
    subject: "computerScience",
    email: "",
    phone: "",
    cabin: "",
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

  const openAddModal = () => window.location.assign("/#teachers");

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      departmentId: teacher.departmentId || 1,
      subject: teacher.subject || "computerScience",
      email: teacher.email || "",
      phone: teacher.phone || "",
      cabin: teacher.cabin || "",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      if (editingTeacher) {
        await api.teachers.update(editingTeacher.id, formData);
        setSuccessMsg(`Faculty ${formData.name} updated successfully.`);
      } else {
        await api.teachers.create(formData);
        setSuccessMsg(`Faculty ${formData.name} onboarded successfully.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  const handleDelete = async (teacher) => {
    if (!window.confirm(`Are you sure you want to remove faculty member ${teacher.name}?`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await api.teachers.delete(teacher.id);
      setSuccessMsg(`Faculty ${teacher.name} removed.`);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  const columns = [
    {
      header: "ID",
      key: "id",
      sortable: true,
      className: "w-16 font-mono text-xs",
    },
    {
      header: "Faculty Name",
      key: "name",
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-semibold text-foreground">{val}</div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
        </div>
      ),
    },
    {
      header: "Department",
      key: "departmentId",
      sortable: true,
      render: (val, row) => {
        const d = departments.find((dept) => dept.id === val);
        return <span className="font-medium">{d ? d.name : "Computer Science"}</span>;
      },
    },
    {
      header: "Subject Specialization",
      key: "subject",
      sortable: true,
      render: (val) => <span className="px-2 py-0.5 rounded bg-muted text-xs font-medium capitalize">{val}</span>,
    },
    {
      header: "Cabin Office",
      key: "cabin",
      sortable: true,
      render: (val) => <span className="font-mono text-xs">{val || "Faculty Wing"}</span>,
    },
    {
      header: "Contact",
      key: "phone",
      render: (val) => <span className="text-xs text-muted-foreground">{val || "—"}</span>,
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
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
            title="Delete Faculty"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Faculty & Instructors Directory</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage academic instructors, department assignments, and cabin allocations
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
        >
          <GraduationCap className="w-4 h-4" />
          Onboard New Faculty
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && <ErrorMessage error={error} onRetry={loadData} />}

      <DataTable
        columns={columns}
        data={teachers}
        keyField="id"
        searchPlaceholder="Search by faculty name, subject, or cabin..."
        searchFields={["name", "subject", "cabin", "email"]}
        loading={loading}
        emptyMessage="No faculty records found."
      />

      {/* Add / Edit Faculty Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground rounded-2xl border border-border max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold">
              {editingTeacher ? `Edit Faculty: ${editingTeacher.name}` : "Onboard New Faculty"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-5">
              Enter official academic department and contact details.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  placeholder="Dr. Sudha Rao"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Department *</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: parseInt(e.target.value, 10) })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Specialization Subject *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                    placeholder="computerScience"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                    placeholder="faculty@college.edu"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                    placeholder="9876543200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Cabin Office / Room</label>
                <input
                  type="text"
                  value={formData.cabin}
                  onChange={(e) => setFormData({ ...formData, cabin: e.target.value })}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  placeholder="Block 2, Room 304"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-input hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                >
                  {editingTeacher ? "Save Changes" : "Confirm Onboarding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
