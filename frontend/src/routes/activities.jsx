import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { Activity as ActivityIcon, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import DataTable from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";

export const Route = createFileRoute("/activities")({
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    studentRoll: "CS-2101",
    type: "Technical",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [actRes, stuRes] = await Promise.all([api.activities.getAll(), api.students.getAll()]);
      setActivities(Array.isArray(actRes) ? actRes : []);
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

  const openAddModal = () => {
    setFormData({
      title: "",
      studentRoll: students[0]?.roll || "CS-2101",
      type: "Technical",
      date: new Date().toISOString().split("T")[0],
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      await api.activities.create(formData);
      setSuccessMsg(`Activity "${formData.title}" logged successfully.`);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  const handleDelete = async (act) => {
    if (!window.confirm(`Delete activity "${act.title}"?`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await api.activities.delete(act.id);
      setSuccessMsg(`Activity removed.`);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  const columns = [
    {
      header: "Date",
      key: "date",
      sortable: true,
      className: "w-28 font-mono text-xs text-muted-foreground",
    },
    {
      header: "Activity Title",
      key: "title",
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-semibold text-foreground">{val}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">{row.description}</div>
        </div>
      ),
    },
    {
      header: "Student Roll",
      key: "studentRoll",
      sortable: true,
      className: "w-28 font-mono font-bold text-foreground",
    },
    {
      header: "Category",
      key: "type",
      sortable: true,
      className: "w-28",
      render: (val) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
          {val || "General"}
        </span>
      ),
    },
    {
      header: "Actions",
      key: "id",
      className: "text-right",
      render: (val, row) => (
        <button
          onClick={() => handleDelete(row)}
          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
          title="Delete Activity"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Campus Activities & Co-Curriculars</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log student achievements, technical hackathons, cultural festivals, and faculty mentorship
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Log Activity
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
        data={activities}
        keyField="id"
        searchPlaceholder="Search activities by title, student roll, or category..."
        searchFields={["title", "studentRoll", "type", "description"]}
        loading={loading}
        emptyMessage="No campus activities recorded."
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground rounded-2xl border border-border max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold">Log Student Activity</h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-5">
              Record extracurricular achievement or faculty mentorship participation.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Activity Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  placeholder="Smart India Hackathon 2026 Winner"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Participating Student *</label>
                  <select
                    value={formData.studentRoll}
                    onChange={(e) => setFormData({ ...formData, studentRoll: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background font-mono"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.roll}>
                        {s.roll} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Category *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Social">Social Outreach</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Date of Event *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Description *</label>
                <textarea
                  rows="3"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  placeholder="Brief details about the accomplishment..."
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
                  Log Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
