import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Building2, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import DataTable from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";

export const Route = createFileRoute("/departments")({
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

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
    setError(null);
    setSuccessMsg(null);
    try {
      if (editingDept) {
        await api.departments.update(editingDept.id, formData);
        setSuccessMsg(`Department ${formData.name} updated.`);
      } else {
        await api.departments.create(formData);
        setSuccessMsg(`Department ${formData.name} created.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Are you sure you want to delete ${dept.name}?`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await api.departments.delete(dept.id);
      setSuccessMsg(`Department ${dept.name} deleted.`);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  const columns = [
    {
      header: "Code",
      key: "code",
      sortable: true,
      className: "w-24 font-mono font-bold text-foreground",
    },
    {
      header: "Department Name",
      key: "name",
      sortable: true,
      render: (val) => <span className="font-semibold text-foreground">{val}</span>,
    },
    {
      header: "Head of Department (HOD)",
      key: "hodName",
      sortable: true,
      render: (val) => <span className="font-medium text-xs">{val || "To be appointed"}</span>,
    },
    {
      header: "Campus Building",
      key: "building",
      sortable: true,
      render: (val) => <span className="text-xs text-muted-foreground">{val || "Main Academic Block"}</span>,
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Academic Departments Master</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage academic divisions, HOD faculty leads, and infrastructure allocation
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
        >
          <Building2 className="w-4 h-4" />
          Add Department
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
        data={departments}
        keyField="id"
        searchPlaceholder="Search departments by code, name, or HOD..."
        searchFields={["code", "name", "hodName", "building"]}
        loading={loading}
        emptyMessage="No departments found."
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground rounded-2xl border border-border max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold">
              {editingDept ? `Edit Department: ${editingDept.code}` : "Add Academic Department"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-5">
              Enter official department identity and administrative metadata.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Department Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background font-mono"
                  placeholder="CSE"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Full Department Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  placeholder="Computer Science & Engineering"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Head of Department (HOD)</label>
                <input
                  type="text"
                  value={formData.hodName}
                  onChange={(e) => setFormData({ ...formData, hodName: e.target.value })}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  placeholder="Dr. Sudha Rao"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Campus Building Location</label>
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  placeholder="Academic Block A"
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
                  {editingDept ? "Save Changes" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
