import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, BookOpen, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import DataTable from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";

export const Route = createFileRoute("/subjects")({
  component: SubjectsPage,
});

function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubj, setEditingSubj] = useState(null);
  const [formData, setFormData] = useState({
    subjectKey: "",
    name: "",
    departmentId: 1,
    credits: 4,
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, deptRes] = await Promise.all([api.subjects.getAll(), api.departments.getAll()]);
      setSubjects(Array.isArray(subRes) ? subRes : []);
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
    setEditingSubj(null);
    setFormData({
      subjectKey: "",
      name: "",
      departmentId: departments[0]?.id || 1,
      credits: 4,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (subj) => {
    setEditingSubj(subj);
    setFormData({
      subjectKey: subj.subjectKey || subj.key,
      name: subj.name || subj.label,
      departmentId: subj.departmentId || 1,
      credits: subj.credits || 4,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      if (editingSubj) {
        await api.subjects.update(editingSubj.id, formData);
        setSuccessMsg(`Subject ${formData.name} updated.`);
      } else {
        await api.subjects.create(formData);
        setSuccessMsg(`Subject ${formData.name} created.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  const handleDelete = async (subj) => {
    if (!window.confirm(`Are you sure you want to delete ${subj.name}?`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await api.subjects.delete(subj.id);
      setSuccessMsg(`Subject ${subj.name} deleted.`);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  const columns = [
    {
      header: "Subject Key",
      key: "subjectKey",
      sortable: true,
      className: "w-36 font-mono font-bold text-foreground text-xs",
      render: (val, row) => <span>{val || row.key || "—"}</span>,
    },
    {
      header: "Subject Title",
      key: "name",
      sortable: true,
      render: (val, row) => <span className="font-semibold text-foreground">{val || row.label || "—"}</span>,
    },
    {
      header: "Department",
      key: "departmentId",
      sortable: true,
      render: (val) => {
        const d = departments.find((dept) => dept.id === val);
        return <span className="font-medium text-xs">{d ? d.name : "Computer Science"}</span>;
      },
    },
    {
      header: "Credits",
      key: "credits",
      sortable: true,
      className: "w-24 text-center",
      render: (val) => (
        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs">
          {val || 4} Credits
        </span>
      ),
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
            title="Edit Subject"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
            title="Delete Subject"
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
          <h2 className="text-xl font-bold tracking-tight">Academic Subjects Catalog</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage institutional curriculum subjects, credit weights, and department relationships
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
        >
          <BookOpen className="w-4 h-4" />
          Add Subject
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
        data={subjects}
        keyField="id"
        searchPlaceholder="Search subjects by key, name, or credits..."
        searchFields={["subjectKey", "name", "credits"]}
        loading={loading}
        emptyMessage="No subjects registered in catalog."
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground rounded-2xl border border-border max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold">
              {editingSubj ? `Edit Subject: ${formData.subjectKey}` : "Add Curriculum Subject"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-5">
              Define academic subject key, title, and institutional credits.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Subject Key (Unique Identifier) *</label>
                <input
                  type="text"
                  required
                  value={formData.subjectKey}
                  onChange={(e) => setFormData({ ...formData, subjectKey: e.target.value })}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background font-mono"
                  placeholder="dataStructures"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  placeholder="Data Structures & Algorithms"
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
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Credits *</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value, 10) })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  />
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
                  {editingSubj ? "Save Changes" : "Register Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
