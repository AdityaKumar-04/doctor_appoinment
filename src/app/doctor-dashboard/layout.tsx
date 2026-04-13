import DashboardShell from "@/components/layout/DashboardShell";

/**
 * Doctor dashboard layout.
 * Auth protection is handled entirely by middleware (src/middleware.ts).
 */
export default function DoctorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell role="doctor">
      {children}
    </DashboardShell>
  );
}
