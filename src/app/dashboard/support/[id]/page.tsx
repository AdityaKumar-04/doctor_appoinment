import SupportShell from "@/components/support/SupportShell";
import TicketDetail from "@/components/support/TicketDetail";

const BASE = "/dashboard/support";

export default async function PatientTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <SupportShell basePath={BASE} role="patient">
      <TicketDetail ticketId={id} />
    </SupportShell>
  );
}
