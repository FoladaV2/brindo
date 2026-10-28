import type { NextRequest } from "next/server";
import { redirectWithCookies, updateSession } from "@/lib/supabase/proxy";

// Optimistic check only: dashboard pages verify the user again on the server.
export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!userId && pathname.startsWith("/dashboard")) return redirectWithCookies(request, response, "/login");
  if (userId && pathname === "/login") return redirectWithCookies(request, response, "/dashboard");
  return response;
}

// Guests never pay for an auth round trip: the proxy runs only where a couple's session matters.
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
