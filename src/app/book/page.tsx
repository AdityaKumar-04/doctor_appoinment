import { redirect } from "next/navigation";

/**
 * /book — no index content; redirect to doctor search.
 */
export default function BookIndexPage() {
  redirect("/doctors");
}
