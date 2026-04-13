import { redirect } from "next/navigation";

/**
 * /appointments — canonical patient appointment URL.
 * Middleware protects this route (patients + admins only).
 * Real content lives at /dashboard/appointments inside the Dashboard shell.
 */
export default function AppointmentsPage() {
  redirect("/dashboard/appointments");
}
