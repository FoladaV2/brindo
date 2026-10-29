import { NextResponse, type NextRequest } from "next/server";
import { parseRefCode, REF_COOKIE, REF_MAX_AGE_SECONDS } from "@/lib/referral";
import { redirectWithCookies, updateSession } from "@/lib/supabase/proxy";

// Optimistic check only: dashboard pages verify the user again on the server.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authPage = pathname === "/login" || pathname === "/register";
  const hostOnly = pathname.startsWith("/dashboard") || pathname === "/onboarding";
  const couplePage = hostOnly || authPage;

  // Any other page reaches the proxy only because it has ?ref: keep the code, skip the auth round trip.
  if (!couplePage) return rememberReferral(request, NextResponse.next());

  const { response, userId } = await updateSession(request);
  if (!userId && hostOnly) return redirectWithCookies(request, response, "/login");
  if (userId && authPage) return redirectWithCookies(request, response, "/dashboard");
  return rememberReferral(request, response);
}

/** ?ref=CODE on any page: a first-party cookie for 60 days, read when the couple pays. */
function rememberReferral(request: NextRequest, response: NextResponse) {
  const code = parseRefCode(request.nextUrl.searchParams.get("ref"));
  if (code) {
    response.cookies.set(REF_COOKIE, code, {
      maxAge: REF_MAX_AGE_SECONDS,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }
  return response;
}

// Guests never pay for an auth round trip: the proxy runs only where a couple's session matters,
// and on any page opened with ?ref (to store the referral code). Never on assets or API routes.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding",
    "/login",
    "/register",
    { source: "/((?!_next/|api/|favicon|icon|robots).*)", has: [{ type: "query", key: "ref" }] },
  ],
};
