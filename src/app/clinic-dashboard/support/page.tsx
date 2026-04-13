"use client";
import SupportShell from "@/components/support/SupportShell";
import TicketList from "@/components/support/TicketList";

const BASE = "/clinic-dashboard/support";

export default function ClinicSupportPage() {
  return (
    <SupportShell basePath={BASE} role="clinic">
      <TicketList basePath={BASE} />
    </SupportShell>
  );
}
