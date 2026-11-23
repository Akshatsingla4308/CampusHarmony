import { Link, createFileRoute } from "@tanstack/react-router";
import AcademicWorkspace from "../components/AcademicWorkspace";
import { useAuth } from "../context/AuthContext";

export const Route = createFileRoute("/")({ component: Dashboard });

const shortcuts = {
  admin: [
    ["Weekly timetable", "/timetable"],
    ["Academic reports", "/defaulters"],
    ["Manage complaints", "/complaints"],
  ],
  teacher: [
    ["Today's lectures", "/timetable"],
    ["Enter marks", "/marks"],
    ["Class analytics", "/defaulters"],
  ],
  student: [
    ["Class timetable", "/timetable"],
    ["My marks", "/marks"],
    ["Attendance insights", "/defaulters"],
    ["My complaints", "/complaints"],
  ],
};

function Dashboard() {
  const { role } = useAuth();
  return (
    <div className="grid max-w-3xl gap-6">
      <nav
        aria-label="Academic shortcuts"
        className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(4,minmax(0,1fr))]"
      >
        {shortcuts[role]?.map(([label, to]) => (
          <Link
            key={to}
            to={to}
            className="rounded-lg border border-border bg-card p-3 text-sm font-semibold hover:border-primary hover:text-primary"
          >
            {label}
          </Link>
        ))}
      </nav>
      <AcademicWorkspace />
    </div>
  );
}
