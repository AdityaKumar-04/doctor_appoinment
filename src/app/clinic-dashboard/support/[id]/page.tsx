import SupportShell from "@/components/support/SupportShell";
import TicketDetail from "@/components/support/TicketDetail";

const BASE = "/clinic-dashboard/support";

export default async function ClinicTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <SupportShell basePath={BASE} role="clinic">
      <TicketDetail ticketId={id} />
    </SupportShell>
  );
}
