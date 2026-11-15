import React from "react";

export function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();

  let colorClasses = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";

  if (s === "active" || s === "enrolled" || s === "present" || s === "success" || s === "committed") {
    colorClasses = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  } else if (s === "probation" || s === "defaulter" || s === "absent" || s === "failed" || s === "rolled back") {
    colorClasses = "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800";
  } else if (s === "dropped" || s === "inactive") {
    colorClasses = "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800";
  } else if (s === "completed" || s === "graduated") {
    colorClasses = "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75"></span>
      {status || "Unknown"}
    </span>
  );
}

export default StatusBadge;
