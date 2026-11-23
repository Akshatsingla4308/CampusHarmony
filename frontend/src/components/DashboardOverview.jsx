import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { api } from "../lib/api";
import ErrorMessage from "./common/ErrorMessage";
import LoadingState from "./common/LoadingState";

const getAttendanceOverview = () => api.analytics.getAdminOverview();
const getMyComplaints = () => api.complaints.getMy();

export function DashboardMetrics({ items }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
      {items.map(([label, value]) => (
        <div key={label} className="portal-card p-3 sm:p-4">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function OverviewPanel({ title, to, action, load, children }) {
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    load().then(
      (data) => {
        if (active) setResult({ data });
      },
      (error) => {
        if (active) setResult({ error });
      },
    );
    return () => {
      active = false;
    };
  }, [load, revision]);

  return (
    <section className="portal-card min-w-0 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-base font-semibold">{title}</h2>
        <Link to={to} className="text-sm font-medium text-primary underline underline-offset-4">
          {action}
        </Link>
      </div>
      {!result ? (
        <LoadingState message={`Loading ${title.toLowerCase()}…`} />
      ) : result.error ? (
        <ErrorMessage
          error={result.error}
          onRetry={() => {
            setResult(null);
            setRevision((n) => n + 1);
          }}
        />
      ) : (
        children(result.data)
      )}
    </section>
  );
}

function TodaySchedule({ teacher }) {
  return (
    <OverviewPanel
      title="Today's lectures"
      to="/timetable"
      action="Open timetable"
      load={api.timetable.getTodaySchedule}
    >
      {({ lectures }) =>
        lectures.length ? (
          <ul className="divide-y divide-border">
            {lectures.map((lecture) => (
              <li
                key={lecture.entry_id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="break-words font-medium">{lecture.course_name}</p>
                  <p className="text-muted-foreground">
                    {lecture.start_time?.slice(0, 5)}–{lecture.end_time?.slice(0, 5)} ·{" "}
                    {lecture.room || "Room to be assigned"}
                    {teacher && lecture.section_name && ` · ${lecture.section_name}`}
                  </p>
                </div>
                {teacher && (
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                    {lecture.attendance_status === "Cancelled"
                      ? "Cancelled"
                      : lecture.submitted_at || lecture.attendance_status === "Completed"
                        ? "Attendance saved"
                        : "Attendance pending"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No lectures scheduled for today.</p>
        )
      }
    </OverviewPanel>
  );
}

export default function DashboardOverview({ role }) {
  if (role === "admin")
    return (
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <OverviewPanel
          title="Attendance overview"
          to="/defaulters"
          action="View reports"
          load={getAttendanceOverview}
        >
          {({ overall }) => (
            <DashboardMetrics
              items={[
                ["Lectures recorded", overall.totalConductedLectures],
                [
                  "Average attendance",
                  overall.totalConductedLectures
                    ? `${overall.averageAttendance}%`
                    : "No lectures yet",
                ],
                ["Below threshold", overall.defaultersCount],
              ]}
            />
          )}
        </OverviewPanel>
        <OverviewPanel
          title="Complaints"
          to="/complaints"
          action="Review complaints"
          load={api.complaints.getAdminStats}
        >
          {(data) => (
            <DashboardMetrics
              items={[
                ["Open", data.open],
                ["In progress", data.inProgress],
              ]}
            />
          )}
        </OverviewPanel>
      </div>
    );
  if (role === "teacher") return <TodaySchedule teacher />;
  if (role !== "student") return null;
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <TodaySchedule />
      <OverviewPanel
        title="Attendance standing"
        to="/defaulters"
        action="View insights"
        load={api.analytics.getStudentInsights}
      >
        {(data) => (
          <DashboardMetrics
            items={[
              ["Enrolled subjects", data.enrolledCoursesCount],
              [
                "Average attendance",
                data.courses.some(
                  (c) => c.conducted_lectures > 0 && c.attendance_percentage != null,
                )
                  ? `${data.overallPercentage}%`
                  : "No lectures yet",
              ],
              ["Subjects below threshold", data.defaulterCoursesCount],
            ]}
          />
        )}
      </OverviewPanel>
      <OverviewPanel
        title="Recent assessments"
        to="/marks"
        action="View all marks"
        load={api.marks.getMyMarks}
      >
        {(marks) =>
          marks.length ? (
            <ul className="divide-y divide-border">
              {[...marks]
                .sort((a, b) => b.assessment_date.localeCompare(a.assessment_date))
                .slice(0, 3)
                .map((mark) => (
                  <li
                    key={`${mark.course_code}-${mark.assessment_id}`}
                    className="flex justify-between gap-2 py-2.5 text-sm"
                  >
                    <span>
                      {mark.assessment_title}{" "}
                      <span className="text-muted-foreground">· {mark.course_code}</span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {mark.marks_obtained}/{mark.max_marks}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No assessment results yet.</p>
          )
        }
      </OverviewPanel>
      <OverviewPanel
        title="My complaints"
        to="/complaints"
        action="Track complaints"
        load={getMyComplaints}
      >
        {(complaints) =>
          complaints.length ? (
            <DashboardMetrics
              items={[
                ["Open", complaints.filter((c) => c.status === "Open").length],
                ["In progress", complaints.filter((c) => c.status === "In Progress").length],
              ]}
            />
          ) : (
            <p className="text-sm text-muted-foreground">You have no submitted complaints.</p>
          )
        }
      </OverviewPanel>
    </div>
  );
}
