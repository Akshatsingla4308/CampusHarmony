import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import {
  Award,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  BarChart3,
  TrendingUp,
  Save,
  Search,
  BookOpen,
  GraduationCap,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { api, request } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";

export const Route = createFileRoute("/marks")({
  validateSearch: ({ offeringId }) => {
    const valid = Number(offeringId);
    return Number.isSafeInteger(valid) && valid > 0 ? { offeringId: valid } : {};
  },
  component: MarksManagementPage,
});

function calculateGrade(obtained, max) {
  if (obtained === "" || obtained === null || obtained === undefined || !max) return "—";
  const pct = (Number(obtained) / Number(max)) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

function gradeColor(grade) {
  switch (grade) {
    case "A+":
    case "A":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "B":
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "C":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "D":
      return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30";
    case "F":
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function useSafeSearch() {
  try {
    return Route.useSearch();
  } catch {
    return {};
  }
}

// =============================================================================
// TEACHER WORKSPACE COMPONENT
// =============================================================================
function TeacherMarksWorkspace() {
  const search = useSafeSearch();
  const [offerings, setOfferings] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedOffering, setSelectedOffering] = useState("");
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [roster, setRoster] = useState([]);
  const [assessmentDetails, setAssessmentDetails] = useState(null);
  const [loadedAssessmentId, setLoadedAssessmentId] = useState("");
  const [marksState, setMarksState] = useState({}); // { [enrollmentId]: { marks: string, remarks: string } }
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [auditReason, setAuditReason] = useState("Evaluation submission");

  // Create Assessment Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    title: "",
    assessmentType: "CA-1",
    maxMarks: 50,
    assessmentDate: new Date().toISOString().split("T")[0],
  });
  const [createError, setCreateError] = useState(null);
  const [creating, setCreating] = useState(false);

  // 1. Load Teacher's Assigned Offerings
  useEffect(() => {
    async function loadOfferings() {
      setLoading(true);
      setError(null);
      try {
        const res = await request("/academic/offerings");
        const list = Array.isArray(res) ? res : [];
        setOfferings(list);
        if (list.length > 0) {
          const match = search?.offeringId && list.find((o) => o.id === search.offeringId);
          const activeOffering = match || list[0];
          setSelectedSection(String(activeOffering.section_id));
          setSelectedOffering(String(activeOffering.id));
        }
      } catch (err) {
        setError(err.message || "Failed to load assigned course offerings");
      } finally {
        setLoading(false);
      }
    }
    loadOfferings();
  }, [search?.offeringId]);

  // 2. Load Assessments when Course Offering changes
  useEffect(() => {
    let active = true;
    if (!selectedOffering) {
      setAssessments([]);
      setSelectedAssessmentId("");
      return;
    }
    async function loadAssessments() {
      try {
        const res = await api.marks.getOfferingAssessments(selectedOffering);
        if (!active) return;
        const list = Array.isArray(res) ? res : [];
        setAssessments(list);
        if (list.length > 0) {
          setSelectedAssessmentId(String(list[0].id));
        } else {
          setSelectedAssessmentId("");
          setRoster([]);
          setStats(null);
        }
      } catch (err) {
        if (active) setError(err.message || "Failed to load assessments for this course offering");
      }
    }
    loadAssessments();
    return () => { active = false; };
  }, [selectedOffering]);

  // 3. Load Student Roster & Stats when Assessment changes
  useEffect(() => {
    let active = true;
    if (!selectedAssessmentId) {
      setRoster([]);
      setAssessmentDetails(null);
      setStats(null);
      return;
    }
    async function loadAssessmentRoster() {
      setLoadingRoster(true);
      setError(null);
      setSuccessMsg(null);
      try {
        const [rosterRes, statsRes] = await Promise.all([
          api.marks.getAssessmentRoster(selectedAssessmentId),
          api.marks.getAssessmentStats(selectedAssessmentId),
        ]);
        if (!active) return;

        if (rosterRes) {
          setLoadedAssessmentId(selectedAssessmentId);
          setAssessmentDetails(rosterRes.assessment || null);
          const studentList = rosterRes.roster || [];
          setRoster(studentList);

          // Initialize local state mapping
          const initialMap = {};
          studentList.forEach((st) => {
            initialMap[st.enrollment_id] = {
              marks: st.marks_obtained !== null && st.marks_obtained !== undefined ? String(st.marks_obtained) : "",
              remarks: st.remarks || "",
            };
          });
          setMarksState(initialMap);
        }

        if (statsRes) {
          setStats(statsRes);
        }
      } catch (err) {
        if (active) setError(err.message || "Failed to load assessment student roster");
      } finally {
        if (active) setLoadingRoster(false);
      }
    }
    loadAssessmentRoster();
    return () => { active = false; };
  }, [selectedAssessmentId]);

  function selectOffering(offeringId) {
    if (offeringId === selectedOffering) return;
    setError(null);
    setSuccessMsg(null);
    setAssessments([]);
    setSelectedAssessmentId("");
    setLoadedAssessmentId("");
    setLoadingRoster(false);
    setSelectedOffering(offeringId);
  }

  // Handle Mark Input Change
  const handleMarkChange = (enrollmentId, val) => {
    setMarksState((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        marks: val,
      },
    }));
  };

  const handleRemarkChange = (enrollmentId, val) => {
    setMarksState((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        remarks: val,
      },
    }));
  };

  // Create New Assessment
  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    if (!selectedOffering) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await api.marks.createAssessment(selectedOffering, {
        title: newAssessment.title.trim(),
        assessmentType: newAssessment.assessmentType,
        maxMarks: Number(newAssessment.maxMarks),
        assessmentDate: newAssessment.assessmentDate,
      });

      setIsCreateModalOpen(false);
      setNewAssessment({
        title: "",
        assessmentType: "CA-1",
        maxMarks: 50,
        assessmentDate: new Date().toISOString().split("T")[0],
      });

      // Reload assessments and auto-select newly created one
      const updatedList = await api.marks.getOfferingAssessments(selectedOffering);
      setAssessments(updatedList || []);
      if (res && res.id) {
        setSelectedAssessmentId(String(res.id));
      }
      setSuccessMsg("Assessment created successfully.");
    } catch (err) {
      setCreateError(err.message || "Failed to create assessment");
    } finally {
      setCreating(false);
    }
  };

  // Save Marks Submission
  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!selectedAssessmentId || selectedAssessmentId !== loadedAssessmentId || !assessmentDetails || saving) return;

    const maxMarks = Number(assessmentDetails.max_marks);
    const recordsToSubmit = [];

    // Client-side validation
    for (const st of roster) {
      const entry = marksState[st.enrollment_id];
      if (entry && entry.marks !== "") {
        const numVal = Number(entry.marks);
        if (isNaN(numVal)) {
          setError(`Invalid numeric score for ${st.roll}: "${entry.marks}"`);
          return;
        }
        if (numVal < 0) {
          setError(`Marks cannot be negative for ${st.roll} (${st.name})`);
          return;
        }
        if (numVal > maxMarks) {
          setError(`Marks obtained (${numVal}) cannot exceed maximum marks (${maxMarks}) for ${st.roll}`);
          return;
        }
        recordsToSubmit.push({
          enrollmentId: st.enrollment_id,
          marksObtained: numVal,
          remarks: entry.remarks || "Evaluated",
        });
      }
    }

    if (recordsToSubmit.length === 0) {
      setError("Please enter marks for at least one student before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await api.marks.saveAssessmentMarks(selectedAssessmentId, {
        records: recordsToSubmit,
        reason: auditReason || "Teacher mark entry",
      });

      setSuccessMsg(
        `Successfully saved marks for ${recordsToSubmit.length} student(s) (${response?.inserted || 0} inserted, ${
          response?.updated || 0
        } updated).`
      );

      // Refresh roster and stats
      const [rosterRes, statsRes] = await Promise.all([
        api.marks.getAssessmentRoster(selectedAssessmentId),
        api.marks.getAssessmentStats(selectedAssessmentId),
      ]);
      if (rosterRes) {
        setRoster(rosterRes.roster || []);
      }
      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err) {
      setError(err.message || "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading teaching assignments..." />;

  // Group offerings by section
  const sectionOptions = [...new Map(offerings.map((o) => [o.section_id, o.section_name])).entries()];
  const currentSectionOfferings = offerings.filter((o) => String(o.section_id) === selectedSection);
  const currentOffering = offerings.find((o) => String(o.id) === selectedOffering);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl shadow-2xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Marks & Evaluations Management
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Course-offering evaluation grading, continuous assessments (CA-1, CA-2), and semester results.
          </p>
        </div>

        {selectedOffering && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-2xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Assessment
          </button>
        )}
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {offerings.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-2xl text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-foreground text-base">No Teaching Assignments Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Your teacher account has not been assigned to any course offerings or sections yet. Contact the academic administrator to assign course offerings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Scope Selection & Assessment List */}
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-card border border-border p-4 rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-foreground">
                Assigned Section / Class
                <select
                  value={selectedSection}
                  disabled={saving || creating}
                  onChange={(e) => {
                    const sec = e.target.value;
                    setSelectedSection(sec);
                    const matching = offerings.find((o) => String(o.section_id) === sec);
                    selectOffering(matching ? String(matching.id) : "");
                  }}
                  className="mt-1 w-full p-2 text-xs rounded-lg border border-input bg-background"
                >
                  {sectionOptions.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-foreground">
                Course Offering
                <select
                  value={selectedOffering}
                  disabled={saving || creating}
                  onChange={(e) => selectOffering(e.target.value)}
                  className="mt-1 w-full p-2 text-xs rounded-lg border border-input bg-background"
                >
                  {currentSectionOfferings.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.code} — {o.course_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Assessment Selector Card */}
            <div className="bg-card border border-border p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Assessments</span>
                <span className="text-[10px] text-muted-foreground font-mono font-bold bg-muted px-2 py-0.5 rounded">
                  {assessments.length} total
                </span>
              </div>

              {assessments.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  No assessments configured yet for this offering.
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="block mx-auto mt-2 text-primary font-semibold hover:underline"
                  >
                    + Create First Assessment
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto">
                  {assessments.map((ass) => {
                    const isSelected = String(ass.id) === selectedAssessmentId;
                    return (
                      <button
                        key={ass.id}
                        type="button"
                        disabled={saving || creating}
                        aria-pressed={isSelected}
                        onClick={() => setSelectedAssessmentId(String(ass.id))}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-2xs"
                            : "border-border hover:bg-muted/50 bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground truncate">{ass.title}</span>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                            {ass.max_marks} marks
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                          <span className="capitalize px-1.5 py-0.5 rounded bg-muted text-foreground font-medium text-[10px]">
                            {ass.assessment_type}
                          </span>
                          <span>·</span>
                          <span>{ass.assessment_date}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Class Performance Analytics Card */}
            {stats && stats.summary && stats.summary.submitted_count > 0 && (
              <div className="bg-card border border-border p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Class Statistics
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                    <div className="text-[10px] text-muted-foreground">Class Average</div>
                    <div className="text-base font-bold text-foreground font-mono mt-0.5">
                      {stats.summary.avg_marks} <span className="text-[10px] text-muted-foreground">/ {assessmentDetails?.max_marks}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                    <div className="text-[10px] text-muted-foreground">Average %</div>
                    <div className="text-base font-bold text-primary font-mono mt-0.5">
                      {stats.summary.avg_percentage}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                    <div className="text-[10px] text-muted-foreground">Highest Mark</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                      {stats.summary.max_marks_obtained}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                    <div className="text-[10px] text-muted-foreground">Lowest Mark</div>
                    <div className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                      {stats.summary.min_marks}
                    </div>
                  </div>
                </div>

                {/* Grade Distribution */}
                {stats.grades && stats.grades.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Grade Distribution</div>
                    <div className="flex flex-wrap gap-1.5">
                      {stats.grades.map((g) => (
                        <span
                          key={g.grade}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${gradeColor(g.grade)}`}
                        >
                          {g.grade}: {g.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Student Marks Roster Table */}
          <div className="lg:col-span-3 space-y-4">
            {loadingRoster || (selectedAssessmentId !== loadedAssessmentId && !error) ? (
              <LoadingState message="Loading enrolled student roster..." />
            ) : !selectedAssessmentId ? (
              <div className="bg-card border border-border p-12 rounded-2xl text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <h3 className="font-bold text-foreground text-sm">Select or Create an Assessment</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose an assessment from the left panel to load the student enrollment roster and enter marks.
                </p>
              </div>
            ) : (
              selectedAssessmentId === loadedAssessmentId && <form onSubmit={handleSaveMarks} className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
                {/* Roster Header */}
                <div className="p-4 bg-muted/30 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-sm">
                        {assessmentDetails?.title} — Grading Roster
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                        Max: {assessmentDetails?.max_marks} marks
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {currentOffering?.code} · {currentOffering?.course_name} · Section {currentOffering?.section_name} ({roster.length} enrolled students)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      Audit Note:
                      <input
                        type="text"
                        value={auditReason}
                        onChange={(e) => setAuditReason(e.target.value)}
                        placeholder="Reason for save/edit"
                        className="p-1 px-2 text-xs border rounded bg-background w-44"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={saving || roster.length === 0}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-2xs disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? "Saving..." : "Save Marks"}
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                      <tr>
                        <th className="py-3 px-4 w-28">Roll No</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4 w-32">Obtained Marks</th>
                        <th className="py-3 px-4 w-24 text-center">Max Marks</th>
                        <th className="py-3 px-4 w-20 text-center">Grade</th>
                        <th className="py-3 px-4">Remarks</th>
                        <th className="py-3 px-4 w-24 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {roster.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground">
                            No enrolled students found in this course offering section.
                          </td>
                        </tr>
                      ) : (
                        roster.map((st) => {
                          const currentMarks = marksState[st.enrollment_id]?.marks ?? "";
                          const currentRemarks = marksState[st.enrollment_id]?.remarks ?? "";
                          const grade = calculateGrade(currentMarks, assessmentDetails?.max_marks);
                          const isInvalid =
                            currentMarks !== "" &&
                            (isNaN(Number(currentMarks)) ||
                              Number(currentMarks) < 0 ||
                              Number(currentMarks) > Number(assessmentDetails?.max_marks));

                          return (
                            <tr
                              key={st.enrollment_id}
                              className={`hover:bg-muted/30 transition-colors ${
                                isInvalid ? "bg-rose-500/5" : ""
                              }`}
                            >
                              <td className="py-3 px-4 font-mono font-bold text-foreground">
                                {st.roll}
                              </td>
                              <td className="py-3 px-4 font-semibold text-foreground">
                                {st.name}
                              </td>
                              <td className="py-3 px-4">
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max={assessmentDetails?.max_marks}
                                    step="0.5"
                                    value={currentMarks}
                                    onChange={(e) => handleMarkChange(st.enrollment_id, e.target.value)}
                                    placeholder="Enter mark"
                                    className={`w-full p-1.5 px-2 text-xs font-mono font-bold rounded-lg border bg-background transition-all ${
                                      isInvalid
                                        ? "border-rose-500 text-rose-600 focus:ring-rose-500"
                                        : "border-input text-foreground focus:ring-primary"
                                    }`}
                                  />
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                                {assessmentDetails?.max_marks}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-block font-mono font-bold text-[10px] px-2 py-0.5 rounded border ${gradeColor(
                                    grade
                                  )}`}
                                >
                                  {grade}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={currentRemarks}
                                  onChange={(e) => handleRemarkChange(st.enrollment_id, e.target.value)}
                                  placeholder="Optional remarks"
                                  className="w-full p-1.5 px-2 text-xs rounded-lg border border-input bg-background text-muted-foreground"
                                />
                              </td>
                              <td className="py-3 px-4 text-center">
                                {st.is_saved ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Saved
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Save Bar */}
                <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between">
                  <div className="text-[11px] text-muted-foreground">
                    Tip: Enter obtained marks between 0 and {assessmentDetails?.max_marks}. Empty scores are kept unscored.
                  </div>
                  <button
                    type="submit"
                    disabled={saving || roster.length === 0}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-2xs disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "Saving..." : "Save Marks"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CREATE ASSESSMENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground rounded-2xl border border-border max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Create Course Assessment</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1"
              >
                ✕
              </button>
            </div>

            {createError && <div className="mt-3"><ErrorMessage message={createError} /></div>}

            <form onSubmit={handleCreateAssessment} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Assessment Title <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={newAssessment.title}
                  onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                  placeholder="e.g. CA-1 (SQL & Normalization)"
                  className="w-full p-2 border border-input rounded-lg bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Assessment Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newAssessment.assessmentType}
                    onChange={(e) => setNewAssessment({ ...newAssessment, assessmentType: e.target.value })}
                    className="w-full p-2 border border-input rounded-lg bg-background"
                  >
                    <option value="CA-1">CA-1 (Assignment 1)</option>
                    <option value="CA-2">CA-2 (Assignment 2)</option>
                    <option value="Midterm">Midterm Examination</option>
                    <option value="End-Semester">End-Semester Exam</option>
                    <option value="Quiz">Class Quiz</option>
                    <option value="Practical">Lab Practical / Viva</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Maximum Marks <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="500"
                    value={newAssessment.maxMarks}
                    onChange={(e) => setNewAssessment({ ...newAssessment, maxMarks: Number(e.target.value) })}
                    className="w-full p-2 border border-input rounded-lg bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Assessment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={newAssessment.assessmentDate}
                  onChange={(e) => setNewAssessment({ ...newAssessment, assessmentDate: e.target.value })}
                  className="w-full p-2 border border-input rounded-lg bg-background"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-muted font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-2xs disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// STUDENT MARKS VIEW COMPONENT
// =============================================================================
function StudentMarksPortal() {
  const [marksList, setMarksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStudentMarks() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.marks.getMyMarks();
        setMarksList(Array.isArray(res) ? res : []);
      } catch (err) {
        setError(err.message || "Failed to load academic assessment marks");
      } finally {
        setLoading(false);
      }
    }
    loadStudentMarks();
  }, []);

  if (loading) return <LoadingState message="Retrieving your evaluation results..." />;
  if (error) return <ErrorMessage message={error} />;

  // Group marks by semester and course
  const groupedCourses = {};
  marksList.forEach((m) => {
    const key = `${m.semester}_${m.course_code}`;
    if (!groupedCourses[key]) {
      groupedCourses[key] = {
        semester: m.semester,
        courseCode: m.course_code,
        courseName: m.course_name,
        sectionName: m.section_name,
        teacherName: m.teacher_name,
        periodName: m.period_name,
        assessments: [],
      };
    }
    groupedCourses[key].assessments.push(m);
  });

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border p-5 rounded-2xl shadow-2xs">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          My Assessment Marks & Academic Performance
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Official assessment marks, continuous evaluations, grades, and teacher feedback.
        </p>
      </div>

      {Object.keys(groupedCourses).length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-2xl text-center max-w-md mx-auto">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <h3 className="font-bold text-foreground text-sm">No Assessment Marks Available</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Your instructors have not recorded any marks for your enrolled courses yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedCourses).map((courseGroup) => {
            const totalObtained = courseGroup.assessments.reduce((acc, a) => acc + Number(a.marks_obtained), 0);
            const totalMax = courseGroup.assessments.reduce((acc, a) => acc + Number(a.max_marks), 0);
            const overallPct = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : "0.0";

            return (
              <div
                key={`${courseGroup.semester}_${courseGroup.courseCode}`}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs"
              >
                {/* Course Header */}
                <div className="p-4 bg-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">
                        {courseGroup.courseCode}
                      </span>
                      <h3 className="font-bold text-foreground text-sm">{courseGroup.courseName}</h3>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                      <span>Semester {courseGroup.semester}</span>
                      <span>·</span>
                      <span>Section {courseGroup.sectionName}</span>
                      <span>·</span>
                      <span>Instructor: {courseGroup.teacherName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold">Course Total</div>
                      <div className="text-sm font-bold font-mono text-foreground">
                        {totalObtained} / {totalMax}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-center min-w-16">
                      <div className="text-[9px] text-primary font-bold uppercase">Aggregate</div>
                      <div className="text-sm font-bold font-mono text-primary">{overallPct}%</div>
                    </div>
                  </div>
                </div>

                {/* Assessments Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Assessment Title</th>
                        <th className="py-3 px-4 w-28">Type</th>
                        <th className="py-3 px-4 w-28">Date</th>
                        <th className="py-3 px-4 w-32 text-center">Score / Max</th>
                        <th className="py-3 px-4 w-24 text-center">Percentage</th>
                        <th className="py-3 px-4 w-20 text-center">Grade</th>
                        <th className="py-3 px-4">Teacher Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {courseGroup.assessments.map((a) => (
                        <tr key={a.mark_id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-foreground">{a.assessment_title}</td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                              {a.assessment_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">{a.assessment_date}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                            {a.marks_obtained} <span className="text-muted-foreground text-[10px]">/ {a.max_marks}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                            {a.percentage}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block font-mono font-bold text-[10px] px-2 py-0.5 rounded border ${gradeColor(a.grade)}`}>
                              {a.grade}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground italic">
                            {a.remarks || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ADMINISTRATOR REPORTS COMPONENT
// =============================================================================
function AdminMarksReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.marks.getAdminMarksReports();
        setReports(Array.isArray(res) ? res : []);
      } catch (err) {
        setError(err.message || "Failed to load administrator marks performance reports");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading) return <LoadingState message="Loading university-wide marks reports..." />;
  if (error) return <ErrorMessage message={error} />;

  const filtered = reports.filter((r) => {
    const s = searchTerm.toLowerCase();
    return (
      r.course_code?.toLowerCase().includes(s) ||
      r.course_name?.toLowerCase().includes(s) ||
      r.section_name?.toLowerCase().includes(s) ||
      r.teacher_name?.toLowerCase().includes(s) ||
      r.assessment_title?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl shadow-2xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Institution Academic Evaluation Reports
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Section-wise performance, instructor submission audit, and class assessment averages.
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter courses or teachers..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Academic Term</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Assessment Title</th>
                <th className="py-3 px-4 text-center">Submissions</th>
                <th className="py-3 px-4 text-center">Average Score</th>
                <th className="py-3 px-4 text-center">Average %</th>
                <th className="py-3 px-4 text-center">Range (Min - Max)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    No academic assessment records found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.assessment_id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-foreground">{row.academic_period}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground">{row.course_code}</span>
                      <span className="block text-[11px] text-muted-foreground">{row.course_name}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">{row.section_name}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{row.teacher_name}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-foreground">{row.assessment_title}</span>
                      <span className="block text-[10px] text-muted-foreground">
                        {row.assessment_type} · Max: {row.max_marks}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                      {row.submissions_count}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-primary">
                      {row.avg_marks !== null ? row.avg_marks : "—"}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                      {row.avg_percentage !== null ? `${row.avg_percentage}%` : "—"}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                      {row.min_marks !== null && row.max_marks_obtained !== null
                        ? `${row.min_marks} - ${row.max_marks_obtained}`
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN MARKS PAGE WRAPPER
// =============================================================================
function MarksManagementPage() {
  const { role } = useAuth();

  if (role === "teacher") {
    return <TeacherMarksWorkspace />;
  }
  if (role === "student") {
    return <StudentMarksPortal />;
  }
  if (role === "admin") {
    return <AdminMarksReports />;
  }

  return (
    <div className="bg-card border border-border p-12 rounded-2xl text-center max-w-md mx-auto">
      <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
      <h3 className="font-bold text-foreground text-sm">Authentication Required</h3>
      <p className="text-xs text-muted-foreground mt-1">Please sign in to access marks and evaluations.</p>
    </div>
  );
}

export default MarksManagementPage;
