"use client";
import SupportShell from "@/components/support/SupportShell";
import NewTicketForm from "@/components/support/NewTicketForm";

const BASE = "/clinic-dashboard/support";

export default function ClinicNewTicketPage() {
  return (
    <SupportShell basePath={BASE} role="clinic">
      <NewTicketForm basePath={BASE} role="clinic" />
    </SupportShell>
  );
}
