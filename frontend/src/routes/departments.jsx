import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Building2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import DataTable from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";
import Modal from "../components/common/Modal";

export const Route = createFileRoute("/departments")({
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    hodName: "",
    building: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.departments.getAll();
      setDepartments(Array.isArray(res) ? res : []);
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
    setEditingDept(null);
    setFormData({ code: "", name: "", hodName: "", building: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      code: dept.code,
      name: dept.name,
      hodName: dept.hodName || "",
      building: dept.building || "",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingDept) {
        await api.departments.update(editingDept.id, formData);
        toast.success(`Department ${formData.name} updated successfully.`);
      } else {
        await api.departments.create(formData);
        toast.success(`Department ${formData.name} (${formData.code}) created successfully.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to save department.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Are you sure you want to delete ${dept.name}?`)) return;
    try {
      await api.departments.delete(dept.id);
      toast.success(`Department ${dept.name} deleted.`);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete department.");
    }
  };

  const columns = [
    {
      header: "Code",
      key: "code",
      sortable: true,
      className: "w-24 font-mono font-bold text-foreground text-xs",
    },
    {
      header: "Department Name",
      key: "name",
      sortable: true,
      render: (val) => <span className="font-semibold text-foreground text-sm">{val}</span>,
    },
    {
      header: "Head of Dept (HOD)",
      key: "hodName",
      sortable: true,
      render: (val) => <span className="text-xs font-medium">{val || "To be appointed"}</span>,
    },
    {
      header: "Building / Location",
      key: "building",
      sortable: true,
      render: (val) => <span className="text-xs text-muted-foreground">{val || "Main Campus"}</span>,
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
            title="Edit Department"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
            title="Delete Department"
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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Academic Departments</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage academic faculties, department codes, and administrative heads.
          </p>
        </div>
        <button onClick={openAddModal} className="portal-button-primary gap-2">
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {error && <ErrorMessage error={error} onRetry={loadData} />}

      {/* Main Departments Table */}
      <DataTable
        columns={columns}
        data={departments}
        keyField="id"
        searchPlaceholder="Search departments by name or code..."
        searchFields={["code", "name", "hodName"]}
        loading={loading}
        emptyMessage="No departments configured yet."
      />

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? `Edit Department: ${editingDept.code}` : "Add Academic Department"}
        description="Configure an academic department within the university hierarchy."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="portal-label" htmlFor="dept-code">Department Code *</label>
            <input
              id="dept-code"
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="portal-input font-mono"
              placeholder="e.g. CSE, ECE, ME"
              disabled={Boolean(editingDept)}
            />
          </div>

          <div>
            <label className="portal-label" htmlFor="dept-name">Full Department Name *</label>
            <input
              id="dept-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="portal-input"
              placeholder="e.g. Computer Science & Engineering"
            />
          </div>

          <div>
            <label className="portal-label" htmlFor="dept-hod">Head of Department (HOD)</label>
            <input
              id="dept-hod"
              type="text"
              value={formData.hodName}
              onChange={(e) => setFormData({ ...formData, hodName: e.target.value })}
              className="portal-input"
              placeholder="e.g. Dr. Sudha Rao"
            />
          </div>

          <div>
            <label className="portal-label" htmlFor="dept-building">Campus Building Location</label>
            <input
              id="dept-building"
              type="text"
              value={formData.building}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              className="portal-input"
              placeholder="e.g. Academic Block A, Level 3"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="portal-button"
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="portal-button-primary">
              {saving ? "Saving…" : (editingDept ? "Save Changes" : "Create Department")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DepartmentsPage;
