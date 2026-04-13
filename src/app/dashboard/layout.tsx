import DashboardShell from "@/components/layout/DashboardShell";

/**
 * Patient dashboard layout.
 * Auth protection is handled entirely by middleware (src/middleware.ts).
 * No client-side redirect needed here — eliminates auth flicker.
 */
export default function PatientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell role="patient">
      {children}
    </DashboardShell>
  );
}
