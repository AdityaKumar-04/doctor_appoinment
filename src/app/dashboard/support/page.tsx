"use client";
import SupportShell from "@/components/support/SupportShell";
import TicketList from "@/components/support/TicketList";

const BASE = "/dashboard/support";

export default function PatientSupportPage() {
  return (
    <SupportShell basePath={BASE} role="patient">
      <TicketList basePath={BASE} />
    </SupportShell>
  );
}
