import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { Award, Plus, Edit2, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { api } from "../lib/api";
import DataTable from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";

export const Route = createFileRoute("/marks")({
  component: MarksPage,
});

function MarksPage() {
  const [marksList, setMarksList] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Edit Marks Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudentMarks, setEditingStudentMarks] = useState(null);
  const [marksForm, setMarksForm] = useState({
    mathematics: 85,
    physics: 78,
    chemistry: 82,
    english: 90,
    computerScience: 92,
  });

  // Record Evaluation Modal
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evalForm, setEvalForm] = useState({
    studentId: 1,
    subjectKey: "CS501",
    academicPeriodId: 1,
    examType: "Midterm",
    marksObtained: 42,
    maxMarks: 50,
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [marksRes, stuRes] = await Promise.all([api.marks.getAll(), api.students.getAll()]);
      setMarksList(Array.isArray(marksRes) ? marksRes : []);
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

  const openEditModal = (row) => {
    setEditingStudentMarks(row);
    setMarksForm({
      mathematics: row.mathematics ?? 80,
      physics: row.physics ?? 75,
      chemistry: row.chemistry ?? 78,
      english: row.english ?? 85,
      computerScience: row.computerScience ?? 90,
    });
    setIsModalOpen(true);
  };

  const handleMarksSubmit = async (e) => {
    e.preventDefault();
    if (!editingStudentMarks) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await api.marks.update(editingStudentMarks.studentId, {
        studentId: editingStudentMarks.studentId,
        ...marksForm,
      });
      setSuccessMsg(`Marks updated for student #${editingStudentMarks.studentId}.`);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  const handleRecordEvaluation = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      await api.marks.recordEvaluation(evalForm);
      setSuccessMsg(`Logged ${evalForm.examType} examination score of ${evalForm.marksObtained}/${evalForm.maxMarks}.`);
      setIsEvalModalOpen(false);
      loadData();
    } catch (err) {
      setError(err);
    }
  };

  // Merge student details
  const enrichedMarks = marksList.map((m) => {
    const student = students.find((s) => s.id === m.studentId);
    const total =
      (m.mathematics || 0) +
      (m.physics || 0) +
      (m.chemistry || 0) +
      (m.english || 0) +
      (m.computerScience || 0);
    const avg = Math.round(total / 5);
    return {
      ...m,
      roll: m.roll || student?.roll || `STU-${m.studentId}`,
      name: m.name || student?.name || "Student",
      department: m.department || student?.department || "CSE",
      total,
      avg,
    };
  });

  const columns = [
    {
      header: "Roll No",
      key: "roll",
      sortable: true,
      className: "w-28 font-mono font-bold text-foreground",
    },
    {
      header: "Student Name",
      key: "name",
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-semibold text-foreground">{val}</div>
          <div className="text-xs text-muted-foreground">{row.department}</div>
        </div>
      ),
    },
    {
      header: "Math",
      key: "mathematics",
      sortable: true,
      className: "w-20 text-center font-mono font-medium",
    },
    {
      header: "Physics",
      key: "physics",
      sortable: true,
      className: "w-20 text-center font-mono font-medium",
    },
    {
      header: "Chemistry",
      key: "chemistry",
      sortable: true,
      className: "w-20 text-center font-mono font-medium",
    },
    {
      header: "English",
      key: "english",
      sortable: true,
      className: "w-20 text-center font-mono font-medium",
    },
    {
      header: "Comp Sci",
      key: "computerScience",
      sortable: true,
      className: "w-20 text-center font-mono font-bold text-primary",
    },
    {
      header: "Total / 500",
      key: "total",
      sortable: true,
      className: "w-24 text-center font-mono font-bold text-foreground",
    },
    {
      header: "Average %",
      key: "avg",
      sortable: true,
      render: (val) => (
        <span
          className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
            val >= 80 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-muted text-foreground"
          }`}
        >
          {val}%
        </span>
      ),
    },
    {
      header: "Actions",
      key: "studentId",
      className: "text-right",
      render: (val, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            title="Edit Subject Marks"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <Link
            to="/transcript"
            search={{ studentId: val }}
            className="p-1.5 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-md transition-colors"
            title="View Academic Transcript"
          >
            <FileText className="w-4 h-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Student Marks & Examinations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage subject evaluation scores, multi-exam assessments, and official academic averages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEvalModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Record Examination Evaluation
          </button>
        </div>
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
        data={enrichedMarks}
        keyField="studentId"
        searchPlaceholder="Search marks by student name, roll number, or department..."
        searchFields={["roll", "name", "department"]}
        loading={loading}
        emptyMessage="No student marks found."
      />

      {/* Edit 5-Subject Marks Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground rounded-2xl border border-border max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold">Edit Subject Marks: {editingStudentMarks?.roll}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-5">
              Update scores (0–100) for {editingStudentMarks?.name}.
            </p>

            <form onSubmit={handleMarksSubmit} className="space-y-3">
              {[
                { key: "mathematics", label: "Mathematics" },
                { key: "physics", label: "Physics" },
                { key: "chemistry", label: "Chemistry" },
                { key: "english", label: "English" },
                { key: "computerScience", label: "Computer Science" },
              ].map((subj) => (
                <div key={subj.key} className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">{subj.label}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={marksForm[subj.key]}
                    onChange={(e) =>
                      setMarksForm({ ...marksForm, [subj.key]: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-24 px-3 py-1 text-xs rounded-lg border border-input bg-background font-mono text-center"
                  />
                </div>
              ))}

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
                  Save Marks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Normalized Evaluation Modal */}
      {isEvalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground rounded-2xl border border-border max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold">Record Examination Evaluation</h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-5">
              Insert into normalized `student_marks` table with automatic DB grade calculation.
            </p>

            <form onSubmit={handleRecordEvaluation} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Select Student *</label>
                <select
                  value={evalForm.studentId}
                  onChange={(e) => setEvalForm({ ...evalForm, studentId: parseInt(e.target.value, 10) })}
                  className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.roll} — {s.name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Course / Subject Code *</label>
                  <input
                    type="text"
                    required
                    value={evalForm.subjectKey}
                    onChange={(e) => setEvalForm({ ...evalForm, subjectKey: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background font-mono"
                    placeholder="CS501"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Exam Type *</label>
                  <select
                    value={evalForm.examType}
                    onChange={(e) => setEvalForm({ ...evalForm, examType: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background"
                  >
                    <option value="Internal">Internal Assessment</option>
                    <option value="Midterm">Midterm Examination</option>
                    <option value="Endterm">Endterm Final Exam</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Marks Obtained *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={evalForm.marksObtained}
                    onChange={(e) =>
                      setEvalForm({ ...evalForm, marksObtained: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Maximum Marks *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={evalForm.maxMarks}
                    onChange={(e) =>
                      setEvalForm({ ...evalForm, maxMarks: parseFloat(e.target.value) || 100 })
                    }
                    className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-input bg-background font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEvalModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-input hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                >
                  Submit Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
