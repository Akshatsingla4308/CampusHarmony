import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, UserPlus, Eye, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";

export const Route = createFileRoute("/students")({
  component: StudentsPage,
});

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    roll: "",
    name: "",
    departmentId: 1,
    department: "Computer Science",
    semester: 5,
    email: "",
    phone: "",
    gender: "Male",
    status: "Active",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stuRes, deptRes] = await Promise.all([api.students.getAll(), api.departments.getAll()]);
      setStudents(Array.isArray(stuRes) ? stuRes : []);
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

  const openAddModal = () => window.location.assign("/#students");

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      roll: student.roll,
      name: student.name,
      departmentId: student.departmentId || 1,
      department: student.department || "Computer Science",
      semester: student.semester || 1,
      email: student.email || "",
      phone: student.phone || "",
      gender: student.gender || "Male",
      status: student.status || "Active",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      if (editingStudent) {
        await api.students.update(editingStudent.id, formData);
        setSuccessMsg(`Student ${formData.name} (${formData.roll}) updated successfully.`);
      } else {
        await api.students.create(formData);
        setSuccessMsg(`Student ${formData.name} (${formData.roll}) enrolled successfully.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Are you sure you want to delete ${student.name} (${student.roll})?`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await api.students.delete(student.id);
      setSuccessMsg(`Student ${student.name} deleted.`);
      loadData();
    } catch (err) {
      // Explain database retention trigger if fired!
      setError(err);
    }
  };

  const columns = [
    {
      header: "Roll No",
      key: "roll",
      sortable: true,
      render: (val) => <span className="font-mono font-bold text-foreground">{val}</span>,
    },
    {
      header: "Student Name",
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
      key: "department",
      sortable: true,
      render: (val) => <span className="font-medium">{val}</span>,
    },
    {
      header: "Sem",
      key: "semester",
      sortable: true,
      className: "text-center",
      render: (val) => <span className="px-2 py-0.5 rounded bg-muted font-medium text-xs">Sem {val}</span>,
    },
    {
      header: "Attendance",
      key: "attendance",
      sortable: true,
      render: (val) => {
        const pct = val !== null && val !== undefined ? val : 0;
        const isDefaulter = pct < 75;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${isDefaulter ? "bg-rose-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${isDefaulter ? "text-rose-600" : "text-emerald-600"}`}>
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
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
            title="Delete Student"
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
          <h2 className="text-xl font-bold tracking-tight">Student Directory & Records</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage academic enrollments, personal contact information, and attendance standing
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          Enroll New Student
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && <ErrorMessage error={error} onRetry={loadData} />}

      {/* Main Students Table */}
      <DataTable
        columns={columns}
        data={students}
        keyField="id"
        searchPlaceholder="Search by student name, roll number, or department..."
        searchFields={["roll", "name", "department", "email"]}
        loading={loading}
        emptyMessage="No students found matching your criteria."
      />

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground rounded-2xl border border-border max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold">
              {editingStudent ? `Edit Student: ${editingStudent.roll}` : "Enroll New Student"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-5">
              Enter official academic credentials to register into MySQL InnoDB tables.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.roll}
                    onChange={(e) => setFormData({ ...formData, roll: e.target.value.toUpperCase() })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background font-mono"
                    placeholder="CS-2101"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                    placeholder="Aditi Sharma"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Department *</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => {
                      const dId = parseInt(e.target.value, 10);
                      const d = departments.find((dept) => dept.id === dId);
                      setFormData({
                        ...formData,
                        departmentId: dId,
                        department: d ? d.name : "Computer Science",
                      });
                    }}
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
                  <label className="text-xs font-semibold text-foreground">Semester *</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value, 10) })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
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
                    placeholder="student@college.edu"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  >
                    <option value="Active">Active</option>
                    <option value="Probation">Probation</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
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
                  {editingStudent ? "Save Changes" : "Confirm Enrollment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
