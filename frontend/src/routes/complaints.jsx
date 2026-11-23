import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Send,
  User,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  MessageSquare,
  X,
  History,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";

export const Route = createFileRoute("/complaints")({
  component: ComplaintsPage,
});

const CATEGORIES = [
  "Academic",
  "Attendance",
  "Examination / Marks",
  "Faculty / Teaching",
  "Infrastructure",
  "Administrative",
  "Other",
];

const STATUS_CONFIG = {
  Open: {
    label: "Open",
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    dot: "bg-amber-500",
    icon: Clock,
  },
  "In Progress": {
    label: "In Progress",
    badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    dot: "bg-blue-500",
    icon: RefreshCw,
  },
  Resolved: {
    label: "Resolved",
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  Closed: {
    label: "Closed",
    badge: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
    dot: "bg-zinc-500",
    icon: CheckCircle2,
  },
};

export default function ComplaintsPage() {
  const { user, role } = useAuth();

  if (role === "student") {
    return <StudentComplaintsView user={user} />;
  }

  if (role === "admin") {
    return <AdminComplaintsView user={user} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 text-center">
      <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
      <h2 className="text-xl font-bold">Faculty Access Restricted</h2>
      <p className="text-muted-foreground mt-2">
        Student Grievances and Complaints are managed directly between students and university administration.
      </p>
    </div>
  );
}

// =============================================================================
// STUDENT COMPLAINTS & GRIEVANCE VIEW
// =============================================================================
function StudentComplaintsView({ user }) {
  const [complaints, setComplaints] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Submission Form State
  const [category, setCategory] = useState("Academic");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [relatedOfferingId, setRelatedOfferingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, coursesRes] = await Promise.all([
        api.complaints.getMy({ status: statusFilter === "ALL" ? "" : statusFilter, search: searchQuery }),
        api.complaints.getMyCourses(),
      ]);
      setComplaints(listRes || []);
      setEnrolledCourses(coursesRes || []);
    } catch (err) {
      setError(err.message || "Failed to load grievance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenDetails = async (id) => {
    setLoadingDetails(true);
    try {
      const data = await api.complaints.getDetails(id);
      setSelectedComplaint(data);
    } catch (err) {
      setError(err.message || "Could not load complaint details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!subject.trim() || subject.trim().length < 3) {
      setFormError("Subject must be at least 3 characters");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setFormError("Description must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        category,
        subject: subject.trim(),
        description: description.trim(),
        relatedOfferingId: relatedOfferingId ? Number(relatedOfferingId) : null,
      };
      const res = await api.complaints.submit(payload);
      setSuccessMsg(`Grievance submitted successfully with Reference: ${res.referenceNumber}`);
      setShowSubmitModal(false);
      setSubject("");
      setDescription("");
      setRelatedOfferingId("");
      setCategory("Academic");
      await loadData();
      setTimeout(() => setSuccessMsg(""), 8000);
    } catch (err) {
      setFormError(err.message || "Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const counts = useMemo(() => {
    return {
      total: complaints.length,
      open: complaints.filter((c) => c.status === "Open").length,
      inProgress: complaints.filter((c) => c.status === "In Progress").length,
      resolved: complaints.filter((c) => c.status === "Resolved" || c.status === "Closed").length,
    };
  }, [complaints]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Student Complaints & Grievance Portal</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Submit, track, and receive official administrative responses on academic, evaluation, or campus grievances.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 shadow transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Grievance
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs font-medium text-muted-foreground">Total Grievances</div>
          <div className="text-2xl font-bold mt-1">{counts.total}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs font-medium text-amber-600 dark:text-amber-400">Open</div>
          <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{counts.open}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">In Progress</div>
          <div className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{counts.inProgress}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Resolved / Closed</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{counts.resolved}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "Open", "In Progress", "Resolved", "Closed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {st === "ALL" ? "All Grievances" : st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reference, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-xs font-medium rounded-lg text-foreground transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Grievance Roster */}
      {loading ? (
        <LoadingState message="Loading your submitted grievances..." />
      ) : complaints.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-lg font-semibold text-foreground">No Grievances Found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {statusFilter === "ALL"
              ? "You have not submitted any academic or campus complaints yet."
              : `No complaints found matching status "${statusFilter}".`}
          </p>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
          >
            <PlusCircle className="w-4 h-4" />
            Submit a New Grievance
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {complaints.map((c) => {
            const conf = STATUS_CONFIG[c.status] || STATUS_CONFIG["Open"];
            const StatusIcon = conf.icon;
            return (
              <div
                key={c.id}
                className="bg-card p-5 rounded-xl border border-border hover:border-primary/40 transition-colors shadow-sm flex flex-col md:flex-row justify-between gap-4 items-start md:items-center"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-muted text-foreground border border-border">
                      {c.reference_number}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-medium bg-primary/10 text-primary">
                      {c.category}
                    </span>
                    {c.course_code && (
                      <span className="text-xs px-2 py-0.5 rounded font-mono bg-muted text-muted-foreground">
                        {c.course_code}: {c.course_name}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${conf.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                      {c.status}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-foreground truncate">{c.subject}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>

                  {c.latest_response && (
                    <div className="mt-2 text-xs bg-muted/60 p-2.5 rounded-lg border border-border/60 flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground">Latest Official Response: </span>
                        <span className="text-muted-foreground">{c.latest_response}</span>
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-muted-foreground flex items-center gap-4 pt-1">
                    <span>Submitted: {new Date(c.created_at).toLocaleDateString()}</span>
                    {c.resolved_at && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Resolved: {new Date(c.resolved_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenDetails(c.id)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input hover:bg-muted text-xs font-medium transition-colors"
                >
                  View Details & History
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Grievance Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Submit Grievance / Complaint</h2>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div>
                <label htmlFor="complaint-category" className="block text-xs font-medium text-foreground mb-1">
                  Grievance Category *
                </label>
                <select
                  id="complaint-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="complaint-course" className="block text-xs font-medium text-foreground mb-1">
                  Related Course Offering (Optional)
                </label>
                <select
                  id="complaint-course"
                  value={relatedOfferingId}
                  onChange={(e) => setRelatedOfferingId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">-- None / General Campus Matter --</option>
                  {enrolledCourses.map((c) => (
                    <option key={c.offering_id} value={c.offering_id}>
                      {c.course_code}: {c.course_name} ({c.section_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="complaint-subject" className="block text-xs font-medium text-foreground mb-1">
                  Subject / Summary *
                </label>
                <input
                  id="complaint-subject"
                  type="text"
                  placeholder="e.g. Discrepancy in Midterm CA-1 Score"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                  required
                  maxLength={150}
                />
              </div>

              <div>
                <label htmlFor="complaint-description" className="block text-xs font-medium text-foreground mb-1">
                  Detailed Grievance Description *
                </label>
                <textarea
                  id="complaint-description"
                  rows={4}
                  placeholder="Provide precise details, exam dates, lecture periods, or context to help administration resolve your grievance..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                  required
                  minLength={10}
                  maxLength={4000}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-input hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Grievance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Details & History Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedComplaint(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-muted text-foreground border border-border">
                {selectedComplaint.reference_number}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-primary/10 text-primary">
                {selectedComplaint.category}
              </span>
              {selectedComplaint.status && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_CONFIG[selectedComplaint.status]?.badge}`}>
                  {selectedComplaint.status}
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">{selectedComplaint.subject}</h2>

            <div className="bg-muted/40 p-4 rounded-lg border border-border/60 text-xs space-y-2 mb-6">
              <div className="font-medium text-foreground">Grievance Description:</div>
              <p className="text-muted-foreground whitespace-pre-wrap">{selectedComplaint.description}</p>
              {selectedComplaint.course_code && (
                <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex gap-4">
                  <span>Related Course: <strong className="text-foreground">{selectedComplaint.course_code} - {selectedComplaint.course_name}</strong></span>
                </div>
              )}
            </div>

            {/* Audit History Timeline */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground border-b border-border pb-2">
                <History className="w-4 h-4 text-primary" />
                Official Activity & Response Timeline
              </div>

              {selectedComplaint.activities?.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No administrative updates logged yet.</p>
              ) : (
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {selectedComplaint.activities?.map((act, i) => (
                    <div key={act.id || i} className="relative pl-8 text-xs">
                      <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-card border-2 border-primary -translate-x-1/2" />
                      <div className="bg-card p-3 rounded-lg border border-border shadow-xs">
                        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                          <span className="font-semibold text-foreground">
                            {act.actor_name} ({act.actor_role === "admin" ? "Administration" : "Student"})
                          </span>
                          <span>{new Date(act.created_at).toLocaleString()}</span>
                        </div>
                        {act.new_status && act.previous_status && (
                          <div className="text-[11px] text-primary mt-1 font-mono">
                            Status: {act.previous_status} → {act.new_status}
                          </div>
                        )}
                        {act.response_text && (
                          <p className="mt-1.5 text-foreground whitespace-pre-wrap bg-muted/30 p-2 rounded">
                            {act.response_text}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 text-foreground"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ADMINISTRATOR GRIEVANCE MANAGEMENT DASHBOARD
// =============================================================================
function AdminComplaintsView({ user }) {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Action Drawer
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState("In Progress");
  const [statusNote, setStatusNote] = useState("");
  const [replyText, setReplyText] = useState("");
  const [processingAction, setProcessingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.complaints.getAdminList({
          status: statusFilter === "ALL" ? "" : statusFilter,
          category: categoryFilter === "ALL" ? "" : categoryFilter,
          search: searchQuery,
          fromDate,
          toDate,
        }),
        api.complaints.getAdminStats(),
      ]);
      setComplaints(listRes || []);
      setStats(statsRes || null);
    } catch (err) {
      setError(err.message || "Failed to load grievance administration data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, fromDate, toDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const openComplaintModal = async (complaintId) => {
    try {
      const full = await api.complaints.getDetails(complaintId);
      setActiveComplaint(full);
      setNewStatus(full.status === "Open" ? "In Progress" : full.status);
      setStatusNote("");
      setReplyText("");
      setActionSuccess("");
    } catch (err) {
      setError(err.message || "Could not retrieve grievance details");
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!activeComplaint) return;
    setProcessingAction(true);
    try {
      await api.complaints.updateStatus(activeComplaint.id, {
        status: newStatus,
        responseText: statusNote.trim() || undefined,
      });
      setActionSuccess(`Status updated to ${newStatus}`);
      const refreshed = await api.complaints.getDetails(activeComplaint.id);
      setActiveComplaint(refreshed);
      setStatusNote("");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to update complaint status");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!activeComplaint || !replyText.trim()) return;
    setProcessingAction(true);
    try {
      await api.complaints.addResponse(activeComplaint.id, {
        responseText: replyText.trim(),
      });
      setActionSuccess("Official administrative response recorded");
      const refreshed = await api.complaints.getDetails(activeComplaint.id);
      setActiveComplaint(refreshed);
      setReplyText("");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to post administrative response");
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Institutional Grievance Management Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Review incoming student complaints, delegate investigations, publish official responses, and maintain regulatory grievance audit trails.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs font-medium text-muted-foreground">Total Grievances</div>
          <div className="text-2xl font-bold mt-1">{stats?.total ?? 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs font-medium text-amber-600 dark:text-amber-400">Open Actions</div>
          <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{stats?.open ?? 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">In Progress</div>
          <div className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{stats?.inProgress ?? 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Resolved</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{stats?.resolved ?? 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Closed</div>
          <div className="text-2xl font-bold mt-1 text-zinc-600 dark:text-zinc-400">{stats?.closed ?? 0}</div>
        </div>
      </div>

      {/* Category Breakdown Chips */}
      {stats?.byCategory && (
        <div className="bg-card p-4 rounded-xl border border-border space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Grievances by Category
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byCategory).map(([cat, cnt]) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? "ALL" : cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span>{cat}</span>
                <span className="bg-background/80 px-1.5 py-0.2 rounded-full font-bold text-[10px] text-foreground">
                  {cnt}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-card p-4 rounded-xl border border-border space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">Status:</span>
            {["ALL", "Open", "In Progress", "Resolved", "Closed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {st === "ALL" ? "All" : st}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search roll, student, reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-xs font-medium rounded-lg text-foreground transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1 rounded border border-input bg-background text-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <span>To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1 rounded border border-input bg-background text-foreground"
            />
          </div>
          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="text-xs text-primary hover:underline ml-2"
            >
              Clear Dates
            </button>
          )}
        </div>
      </div>

      {/* Complaints Table */}
      {loading ? (
        <LoadingState message="Loading institutional complaints..." />
      ) : complaints.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-lg font-semibold text-foreground">No Grievances Match Filters</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Try adjusting your status or category filters, or clearing search criteria.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-muted-foreground border-b border-border font-semibold">
                <tr>
                  <th className="p-3">Reference #</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {complaints.map((c) => {
                  const conf = STATUS_CONFIG[c.status] || STATUS_CONFIG["Open"];
                  return (
                    <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-foreground">
                        {c.reference_number}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{c.student_name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{c.student_roll}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-medium bg-primary/10 text-primary">
                          {c.category}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate" title={c.subject}>
                        <div className="font-medium text-foreground truncate">{c.subject}</div>
                        {c.course_code && (
                          <div className="text-[11px] text-muted-foreground font-mono">{c.course_code}</div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${conf.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => openComplaintModal(c.id)}
                          className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-lg transition-colors shadow-xs"
                        >
                          Review & Action
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Grievance Review & Action Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-xl border border-border shadow-2xl p-6 relative">
            <button
              onClick={() => setActiveComplaint(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-muted text-foreground border border-border">
                {activeComplaint.reference_number}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-primary/10 text-primary">
                {activeComplaint.category}
              </span>
              {activeComplaint.status && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_CONFIG[activeComplaint.status]?.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[activeComplaint.status]?.dot}`} />
                  {activeComplaint.status}
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-foreground mb-1">{activeComplaint.subject}</h2>
            <div className="text-xs text-muted-foreground mb-4">
              Student: <strong className="text-foreground">{activeComplaint.student_name}</strong> ({activeComplaint.student_roll}) | Department: {activeComplaint.department_name}
            </div>

            {actionSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Description Box */}
            <div className="bg-muted/40 p-4 rounded-lg border border-border/60 text-xs space-y-2 mb-6">
              <div className="font-semibold text-foreground">Grievance Description:</div>
              <p className="text-muted-foreground whitespace-pre-wrap">{activeComplaint.description}</p>
              {activeComplaint.course_code && (
                <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex gap-4">
                  <span>Related Course: <strong className="text-foreground">{activeComplaint.course_code} - {activeComplaint.course_name}</strong></span>
                </div>
              )}
            </div>

            {/* Administrative Action Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Status Update Card */}
              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-primary" />
                  Update Workflow Status
                </div>
                <form onSubmit={handleUpdateStatus} className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">Target Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-input bg-background"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">Status Note (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Forwarded to examination committee"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-input bg-background"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={processingAction}
                    className="w-full py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded transition-colors disabled:opacity-50"
                  >
                    {processingAction ? "Updating..." : "Commit Status Change"}
                  </button>
                </form>
              </div>

              {/* Response Message Card */}
              <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-primary" />
                  Publish Official Response
                </div>
                <form onSubmit={handleSendReply} className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">Response Content</label>
                    <textarea
                      rows={3}
                      placeholder="Enter official resolution details, findings, or instructions for the student..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-input bg-background"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={processingAction || !replyText.trim()}
                    className="w-full py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium rounded transition-colors disabled:opacity-50"
                  >
                    {processingAction ? "Publishing..." : "Send Official Response"}
                  </button>
                </form>
              </div>
            </div>

            {/* Audit History Timeline */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
                <History className="w-3.5 h-3.5 text-primary" />
                Chronological Audit History
              </div>

              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border max-h-60 overflow-y-auto">
                {activeComplaint.activities?.map((act, i) => (
                  <div key={act.id || i} className="relative pl-8 text-xs">
                    <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-card border-2 border-primary -translate-x-1/2" />
                    <div className="bg-card p-2.5 rounded border border-border shadow-2xs">
                      <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                        <span className="font-semibold text-foreground">
                          {act.actor_name} ({act.actor_role})
                        </span>
                        <span>{new Date(act.created_at).toLocaleString()}</span>
                      </div>
                      {act.new_status && act.previous_status && (
                        <div className="text-[11px] text-primary mt-1 font-mono">
                          Status Transition: {act.previous_status} → {act.new_status}
                        </div>
                      )}
                      {act.response_text && (
                        <p className="mt-1 text-foreground whitespace-pre-wrap bg-muted/40 p-2 rounded text-[11px]">
                          {act.response_text}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveComplaint(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 text-foreground"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
