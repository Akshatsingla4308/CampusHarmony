import { createFileRoute } from "@tanstack/react-router";
import AcademicWorkspace from "../components/AcademicWorkspace";
export const Route = createFileRoute("/attendance")({
  validateSearch: ({ offeringId, date, sessionId }) => {
    const validId = (id) => Number.isSafeInteger(Number(id)) && Number(id) > 0;
    return validId(offeringId) && validId(sessionId) && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? { offeringId: Number(offeringId), date, sessionId: Number(sessionId) }
      : {};
  },
  component: AttendancePage,
});

function AttendancePage() {
  const selection = Route.useSearch();
  return <AcademicWorkspace key={JSON.stringify(selection)} selection={selection} />;
}
