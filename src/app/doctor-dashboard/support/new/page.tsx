"use client";
import SupportShell from "@/components/support/SupportShell";
import NewTicketForm from "@/components/support/NewTicketForm";

const BASE = "/doctor-dashboard/support";

export default function DoctorNewTicketPage() {
  return (
    <SupportShell basePath={BASE} role="doctor">
      <NewTicketForm basePath={BASE} role="doctor" />
    </SupportShell>
  );
}
