import { Link, createFileRoute } from "@tanstack/react-router";
import AcademicWorkspace from "../components/AcademicWorkspace";
import DashboardOverview from "../components/DashboardOverview";
import { useAuth } from "../context/AuthContext";

export const Route = createFileRoute("/")({ component: Dashboard });

const shortcuts = {
  admin: [
    ["Add teacher", "/", "teachers"],
    ["Register student", "/", "students"],
    ["Manage courses", "/courses"],
    ["Assign faculty", "/", "offerings"],
    ["Create timetable", "/timetable"],
  ],
  teacher: [
    ["Mark attendance", "/attendance"],
    ["Enter marks", "/marks"],
    ["Class analytics", "/defaulters"],
  ],
  student: [
    ["Academic profile", "/profile"],
    ["Subject attendance", "/attendance"],
  ],
};

function Dashboard() {
  const { role, user } = useAuth();
  return (
    <div className="grid min-w-0 gap-6" key={role + ":" + user?.login}>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{user?.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {
            {
              admin: "Academic administration",
              teacher: "Teaching overview",
              student: `Student · ${user?.login}`,
            }[role]
          }
        </p>
      </div>
      <nav aria-label="Academic shortcuts" className="flex flex-wrap gap-2">
        {shortcuts[role]?.map(([label, to, hash]) =>
          hash ? (
            <a key={label} href={`#${hash}`} className="portal-button">
              {label}
            </a>
          ) : (
            <Link key={label} to={to} className="portal-button">
              {label}
            </Link>
          ),
        )}
      </nav>
      <DashboardOverview role={role} />
      <AcademicWorkspace overview />
    </div>
  );
}
