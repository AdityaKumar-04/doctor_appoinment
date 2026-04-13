import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // ── Route classification ───────────────────────────────────────────────────
  const isPatientRoute  = pathname === "/dashboard"
    || pathname.startsWith("/dashboard/")
    || pathname === "/appointments"
    || pathname.startsWith("/appointments/")
    || pathname.startsWith("/book/")
    || pathname === "/checkout"
    || pathname.startsWith("/checkout/");
  const isDoctorRoute   = pathname.startsWith("/doctor-dashboard");
  const isClinicRoute   = pathname.startsWith("/clinic-dashboard");
  const isAdminRoute    = pathname.startsWith("/admin");
  const isProtected     = isPatientRoute || isDoctorRoute || isClinicRoute || isAdminRoute;

  if (!isProtected) return response;

  // ── Not authenticated → redirect to login ─────────────────────────────────
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── Fetch role from DB (NEVER from user_metadata) ─────────────────────────
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? null;

  // ── Role-based isolation ──────────────────────────────────────────────────
  if (isPatientRoute && role !== "patient" && role !== "admin") {
    const redirectMap: Record<string, string> = {
      doctor: "/doctor-dashboard",
      clinic: "/clinic-dashboard",
    };
    return NextResponse.redirect(new URL(redirectMap[role ?? ""] ?? "/login", request.url));
  }

  if (isDoctorRoute && role !== "doctor" && role !== "admin") {
    return NextResponse.redirect(new URL(role === "patient" ? "/dashboard" : "/login", request.url));
  }

  if (isClinicRoute && role !== "clinic" && role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
