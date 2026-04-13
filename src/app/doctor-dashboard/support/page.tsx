"use client";
import SupportShell from "@/components/support/SupportShell";
import TicketList from "@/components/support/TicketList";

const BASE = "/doctor-dashboard/support";

export default function DoctorSupportPage() {
  return (
    <SupportShell basePath={BASE} role="doctor">
      <TicketList basePath={BASE} />
    </SupportShell>
  );
}
