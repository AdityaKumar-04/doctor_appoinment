import DashboardShell from "@/components/layout/DashboardShell";

/**
 * Admin layout.
 * Auth protection is handled entirely by middleware (src/middleware.ts).
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell role="admin">
      {children}
    </DashboardShell>
  );
}
