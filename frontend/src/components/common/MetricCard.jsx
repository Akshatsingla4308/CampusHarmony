import React from "react";

export function MetricCard({ title, value, subtitle, icon: Icon, color = "primary", trend }) {
  const colorMap = {
    primary: "bg-primary/10 text-primary border-primary/20",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  };

  const badgeClass = colorMap[color] || colorMap.primary;

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${badgeClass}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight">{value ?? "—"}</div>
        {(subtitle || trend) && (
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
            {trend && <span className="font-medium text-emerald-600 dark:text-emerald-400">{trend}</span>}
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
