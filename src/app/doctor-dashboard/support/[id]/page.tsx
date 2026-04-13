import SupportShell from "@/components/support/SupportShell";
import TicketDetail from "@/components/support/TicketDetail";

const BASE = "/doctor-dashboard/support";

export default async function DoctorTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <SupportShell basePath={BASE} role="doctor">
      <TicketDetail ticketId={id} />
    </SupportShell>
  );
}
