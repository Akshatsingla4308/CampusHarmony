import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  Plus,
  PlayCircle,
  XCircle,
  MapPin,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Layers,
  ChevronRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import { api, request } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/common/LoadingState";
import ErrorMessage from "../components/common/ErrorMessage";

export const Route = createFileRoute("/timetable")({
  component: TimetablePage,
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const PERIOD_DEFAULTS = [
  { period: 1, start: "09:00", end: "09:50" },
  { period: 2, start: "10:00", end: "10:50" },
  { period: 3, start: "11:00", end: "11:50" },
  { period: 4, start: "12:00", end: "12:50" },
  { period: 5, start: "13:40", end: "14:30" },
  { period: 6, start: "14:30", end: "15:20" },
  { period: 7, start: "15:20", end: "16:10" },
  { period: 8, start: "16:10", end: "17:00" },
];

export function TimetablePage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Common data
  const [todaySchedule, setTodaySchedule] = useState({ dayOfWeek: "", date: "", lectures: [] });
  const [weeklySlots, setWeeklySlots] = useState([]);

  // Admin specific data
  const [catalog, setCatalog] = useState({ departments: [], terms: [], sections: [], teachers: [] });
  const [offerings, setOfferings] = useState([]);
  const [adminMode, setAdminMode] = useState("section"); // "section" or "teacher"
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [newSlot, setNewSlot] = useState({
    offeringId: "",
    dayOfWeek: "Monday",
    periodNumber: 1,
    startTime: "09:00",
    endTime: "09:50",
    room: "",
  });

  // Cancel lecture modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  // Mobile day selection (phones)
  const [mobileDay, setMobileDay] = useState(() => {
    const dayIdx = new Date().getDay();
    return DAYS[dayIdx === 0 ? 0 : dayIdx - 1] || "Monday";
  });

  // Initial Load
  useEffect(() => {
    loadData();
  }, [role, selectedSection, selectedTeacher, adminMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (role === "admin") {
        // Load catalog and offerings
        const [catData, offData] = await Promise.all([
          request("/academic/catalog"),
          request("/academic/offerings"),
        ]);
        setCatalog(catData);
        setOfferings(offData);

        let activeSection = selectedSection;
        if (!activeSection && catData.sections && catData.sections.length > 0) {
          activeSection = String(catData.sections[0].id);
          setSelectedSection(activeSection);
        }

        let activeTeacher = selectedTeacher;
        if (!activeTeacher && catData.teachers && catData.teachers.length > 0) {
          activeTeacher = catData.teachers[0].teacher_id;
          setSelectedTeacher(activeTeacher);
        }

        if (adminMode === "section" && activeSection) {
          const slots = await api.timetable.getSectionSchedule(activeSection);
          setWeeklySlots(slots);
        } else if (adminMode === "teacher" && activeTeacher) {
          const slots = await api.timetable.getTeacherScheduleAdmin(activeTeacher);
          setWeeklySlots(slots);
        }
      } else {
        // Teacher or Student
        const [todayData, mySlots] = await Promise.all([
          api.timetable.getTodaySchedule(),
          api.timetable.getMySchedule(),
        ]);
        setTodaySchedule(todayData);
        setWeeklySlots(mySlots);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load timetable data");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (pNum) => {
    const num = Number(pNum);
    const def = PERIOD_DEFAULTS.find((p) => p.period === num);
    setNewSlot((prev) => ({
      ...prev,
      periodNumber: num,
      startTime: def ? def.start : prev.startTime,
      endTime: def ? def.end : prev.endTime,
    }));
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setModalSaving(true);
    setModalError(null);
    try {
      if (!newSlot.offeringId) {
        throw new Error("Please select a course offering");
      }
      await api.timetable.createEntry({
        offeringId: Number(newSlot.offeringId),
        dayOfWeek: newSlot.dayOfWeek,
        periodNumber: Number(newSlot.periodNumber),
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        room: newSlot.room ? newSlot.room.trim() : null,
      });

      setSuccessMsg("Timetable entry created successfully!");
      setShowAddModal(false);
      setNewSlot({
        offeringId: "",
        dayOfWeek: "Monday",
        periodNumber: 1,
        startTime: "09:00",
        endTime: "09:50",
        room: "",
      });
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to create timetable slot");
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm("Are you sure you want to remove this timetable slot?")) return;
    try {
      await api.timetable.deleteEntry(id);
      setSuccessMsg("Timetable slot removed successfully");
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete timetable slot");
    }
  };

  const handleConduct = async (slot) => {
    try {
      setLoading(true);
      const res = await api.timetable.conductLecture(slot.entry_id || slot.id);
      navigate({
        to: "/attendance",
        search: { offeringId: res.offeringId, date: res.date, sessionId: res.sessionId },
      });
    } catch (err) {
      setError(err.message || "Failed to conduct lecture");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCancel = (lecture) => {
    setCancelTarget(lecture);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelTarget) return;
    try {
      await api.timetable.cancelLecture({
        offeringId: cancelTarget.offering_id,
        date: todaySchedule.date || new Date().toISOString().split("T")[0],
        period: cancelTarget.period_number,
        reason: cancelReason || "Cancelled by faculty",
      });
      setSuccessMsg("Lecture marked as cancelled.");
      setCancelModalOpen(false);
      setCancelTarget(null);
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to cancel lecture");
    }
  };

  // Group weekly slots by day and period
  const timetableGrid = useMemo(() => {
    const grid = {};
    for (const day of DAYS) {
      grid[day] = {};
    }
    for (const slot of weeklySlots) {
      if (grid[slot.day_of_week]) {
        grid[slot.day_of_week][slot.period_number] = slot;
      }
    }
    return grid;
  }, [weeklySlots]);

  // Available offerings for selected section in Admin modal
  const sectionOfferings = useMemo(() => {
    if (!selectedSection) return [];
    return offerings.filter((o) => String(o.section_id) === String(selectedSection));
  }, [offerings, selectedSection]);

  if (loading && weeklySlots.length === 0 && !todaySchedule.lectures) {
    return <LoadingState message="Loading timetable & academic schedules..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            {role === "admin"
              ? "Timetable & Lecture Scheduling Management"
              : role === "teacher"
              ? "Faculty Teaching Schedule"
              : "My Class Timetable"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {role === "admin"
              ? "Institutional weekly timetable scheduler with conflict prevention, room management & lecture tracking"
              : role === "teacher"
              ? "Weekly assigned lectures with fast-track one-click attendance conduction"
              : "Weekly lecture schedule, room assignments, faculty details & today's lectures"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-muted text-foreground transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {role === "admin" && (
            <button
              onClick={() => {
                setModalError(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Schedule Lecture Slot
            </button>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TODAY'S LECTURES SECTION (FOR TEACHERS & STUDENTS) */}
      {role !== "admin" && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Today's Lectures ({todaySchedule.dayOfWeek || "Today"}, {todaySchedule.date})
              </h2>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              {todaySchedule.lectures ? todaySchedule.lectures.length : 0} Lectures Scheduled
            </span>
          </div>

          {!todaySchedule.lectures || todaySchedule.lectures.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-lg bg-muted/20">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-foreground">No lectures scheduled for today</p>
              <p className="text-xs text-muted-foreground mt-1">Enjoy your free time or prepare for upcoming classes</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaySchedule.lectures.map((lec) => {
                const isCompleted = lec.attendance_status === "Completed" || lec.submitted_at;
                const isCancelled = lec.attendance_status === "Cancelled";

                return (
                  <div
                    key={lec.entry_id || lec.id}
                    className={`border rounded-lg p-4 flex flex-col justify-between transition-all ${
                      isCancelled
                        ? "bg-red-500/5 border-red-500/30"
                        : isCompleted
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : "bg-background border-border hover:border-primary/50 shadow-xs"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                          Period {lec.period_number}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lec.start_time?.slice(0, 5)} - {lec.end_time?.slice(0, 5)}
                        </span>
                      </div>

                      <h3 className="font-semibold text-foreground text-base">
                        {lec.course_code}: {lec.course_name}
                      </h3>

                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          <span>Section: <strong className="text-foreground">{lec.section_name}</strong></span>
                        </div>
                        {role === "student" && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>Faculty: <strong className="text-foreground">{lec.teacher_name}</strong></span>
                          </div>
                        )}
                        {lec.room && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Room / Lab: <strong className="text-foreground">{lec.room}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isCancelled
                            ? "bg-red-500/15 text-red-600 dark:text-red-400"
                            : isCompleted
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {isCancelled ? "Cancelled" : isCompleted ? "Attendance Submitted" : "Scheduled"}
                      </span>

                      {role === "teacher" && !isCancelled && !isCompleted && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleConduct(lec)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            Conduct
                          </button>
                          <button
                            onClick={() => handleOpenCancel(lec)}
                            title="Cancel lecture"
                            className="p-1 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      {role === "teacher" && isCompleted && (
                        <button
                          type="button"
                          onClick={() => {
                            navigate({
                              to: "/attendance",
                              search: {
                                offeringId: lec.offering_id,
                                date: todaySchedule.date || new Date().toISOString().split("T")[0],
                                sessionId: lec.id || lec.entry_id,
                              },
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          View Roster
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ADMIN CONTROLS: Section / Faculty Filter */}
      {role === "admin" && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                Schedule View:
              </span>
              <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                <button
                  onClick={() => setAdminMode("section")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    adminMode === "section"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Section Timetable
                </button>
                <button
                  onClick={() => setAdminMode("teacher")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    adminMode === "teacher"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Faculty Schedule
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {adminMode === "section" ? (
                <div className="flex items-center gap-2">
                  <label htmlFor="admin-section-select" className="text-xs font-medium text-muted-foreground">Section:</label>
                  <select
                    id="admin-section-select"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="text-xs rounded-md border border-input bg-background px-3 py-1.5 text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    {catalog.sections &&
                      catalog.sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.department} • Sem {s.semester} • {s.term})
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <label htmlFor="admin-faculty-select" className="text-xs font-medium text-muted-foreground">Faculty Member:</label>
                  <select
                    id="admin-faculty-select"
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    className="text-xs rounded-md border border-input bg-background px-3 py-1.5 text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    {catalog.teachers &&
                      catalog.teachers.map((t) => (
                        <option key={t.teacher_id} value={t.teacher_id}>
                          {t.name} ({t.teacher_id})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WEEKLY TIMETABLE GRID */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              Weekly Master Timetable (Monday – Saturday)
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {weeklySlots.length} lecture slots in active weekly routine
          </span>
        </div>

        {/* Mobile Day Selector (Phones & Small Screens) */}
        <div className="p-3 border-b border-border bg-muted/10 sm:hidden">
          <div className="flex items-center justify-between gap-1">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setMobileDay(d)}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                  mobileDay === d
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            {PERIOD_DEFAULTS.map((p) => {
              const slot = timetableGrid[mobileDay]?.[p.period];
              if (!slot) return null;
              return (
                <div key={p.period} className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary">{slot.course_code}: {slot.course_name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">P{p.period} ({p.start}-{p.end})</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                    <span>{slot.teacher_name || slot.section_name}</span>
                    {slot.room && <span className="font-medium text-foreground">{slot.room}</span>}
                  </div>
                </div>
              );
            })}
            {!PERIOD_DEFAULTS.some((p) => timetableGrid[mobileDay]?.[p.period]) && (
              <p className="text-center py-4 text-xs text-muted-foreground">
                No lectures scheduled on {mobileDay}.
              </p>
            )}
          </div>
        </div>

        {/* Master Weekly Table (Desktop & Tablet) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="p-3 font-semibold text-foreground w-28 border-r border-border">
                  Day \ Period
                </th>
                {PERIOD_DEFAULTS.map((p) => (
                  <th key={p.period} className="p-3 font-semibold text-foreground min-w-[130px] border-r border-border last:border-r-0">
                    <div>Period {p.period}</div>
                    <div className="text-[10px] font-normal text-muted-foreground font-mono">
                      {p.start} - {p.end}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day} className="border-b border-border/70 hover:bg-muted/10 transition-colors">
                  <td className="p-3 font-semibold text-foreground bg-muted/20 border-r border-border">
                    {day}
                  </td>
                  {PERIOD_DEFAULTS.map((p) => {
                    const slot = timetableGrid[day]?.[p.period];
                    return (
                      <td key={p.period} className="p-2 border-r border-border/70 last:border-r-0 align-top">
                        {slot ? (
                          <div className="bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-md p-2 space-y-1 transition-colors relative group">
                            <div className="font-semibold text-primary text-xs">
                              {slot.course_code}
                            </div>
                            <div className="text-[11px] font-medium text-foreground line-clamp-1" title={slot.course_name}>
                              {slot.course_name}
                            </div>

                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                              {adminMode === "section" || role === "student" ? (
                                <>
                                  <User className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{slot.teacher_name}</span>
                                </>
                              ) : (
                                <>
                                  <Layers className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">Sec: {slot.section_name}</span>
                                </>
                              )}
                            </div>

                            {slot.room && (
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 shrink-0 text-amber-500" />
                                <span>{slot.room}</span>
                              </div>
                            )}

                            {role === "admin" && (
                              <div className="pt-1 mt-1 border-t border-primary/10 flex justify-end">
                                <button
                                  onClick={() => handleDeleteSlot(slot.entry_id)}
                                  className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors"
                                  title="Delete slot"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-16 flex items-center justify-center text-[11px] text-muted-foreground/40 italic">
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCHEDULE LECTURE SLOT MODAL (ADMIN ONLY) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Schedule Recurring Lecture Slot
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSlot} className="space-y-3 text-xs">
              <div>
                <label htmlFor="offering-select" className="block font-medium text-foreground mb-1">
                  Course Offering (Section & Assigned Teacher):
                </label>
                <select
                  id="offering-select"
                  value={newSlot.offeringId}
                  onChange={(e) => setNewSlot({ ...newSlot, offeringId: e.target.value })}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  <option value="">-- Select Course Offering --</option>
                  {sectionOfferings.map((o) => {
                    const teacherObj = catalog.teachers?.find((t) => t.teacher_id === o.teacher_id);
                    const teacherName = teacherObj ? teacherObj.name : o.teacher_id;
                    return (
                      <option key={o.id} value={o.id}>
                        {o.code}: {o.course_name} (Sec: {o.section_name} • Faculty: {teacherName})
                      </option>
                    );
                  })}
                </select>
                {sectionOfferings.length === 0 && (
                  <p className="text-[11px] text-amber-500 mt-1">
                    No offerings found for current section. Please assign courses to this section first.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="day-select" className="block font-medium text-foreground mb-1">Day of Week:</label>
                  <select
                    id="day-select"
                    value={newSlot.dayOfWeek}
                    onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="period-select" className="block font-medium text-foreground mb-1">Period Number:</label>
                  <select
                    id="period-select"
                    value={newSlot.periodNumber}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    {PERIOD_DEFAULTS.map((p) => (
                      <option key={p.period} value={p.period}>
                        Period {p.period} ({p.start} - {p.end})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="start-time-input" className="block font-medium text-foreground mb-1">Start Time (HH:MM):</label>
                  <input
                    id="start-time-input"
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label htmlFor="end-time-input" className="block font-medium text-foreground mb-1">End Time (HH:MM):</label>
                  <input
                    id="end-time-input"
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="room-input" className="block font-medium text-foreground mb-1">Classroom / Lab Location:</label>
                <input
                  id="room-input"
                  type="text"
                  placeholder="e.g. Lab 204, Lecture Hall 1"
                  value={newSlot.room}
                  onChange={(e) => setNewSlot({ ...newSlot, room: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Optional. The system automatically detects and prevents classroom collisions.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-md border border-input bg-background hover:bg-muted text-foreground transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving || sectionOfferings.length === 0}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors disabled:opacity-50"
                >
                  {modalSaving ? "Verifying & Saving..." : "Save Lecture Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL LECTURE MODAL (TEACHER) */}
      {cancelModalOpen && cancelTarget && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-semibold text-destructive flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Cancel Scheduled Lecture
              </h3>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Cancelling lecture for <strong>{cancelTarget.course_code}: {cancelTarget.course_name}</strong> (Period {cancelTarget.period_number}) on {todaySchedule.date}.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Reason for Cancellation:</label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Faculty medical leave, institutional holiday, department symposium"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-input bg-background hover:bg-muted text-foreground font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimetablePage;
