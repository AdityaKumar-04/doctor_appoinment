"use client";
import SupportShell from "@/components/support/SupportShell";
import NewTicketForm from "@/components/support/NewTicketForm";

const BASE = "/dashboard/support";

export default function PatientNewTicketPage() {
  return (
    <SupportShell basePath={BASE} role="patient">
      <NewTicketForm basePath={BASE} role="patient" />
    </SupportShell>
  );
}
