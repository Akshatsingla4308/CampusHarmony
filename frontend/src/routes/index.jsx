import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

// The app itself is a standalone HTML/CSS/vanilla-JS project served from
// /sms/. This route only forwards visitors to its entry page.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sunrise Institute Student Management System" },
      {
        name: "description",
        content:
          "College ERP dashboard for students, attendance, courses and marks, built with HTML, CSS and vanilla JavaScript.",
      },
      { property: "og:title", content: "Sunrise Institute Student Management System" },
      {
        property: "og:description",
        content: "Student, attendance, course and marks management in one responsive college ERP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/sms/login.html");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">
        Opening the Student Management System…{" "}
        <a className="underline" href="/sms/login.html">
          Continue
        </a>
      </p>
    </div>
  );
}
