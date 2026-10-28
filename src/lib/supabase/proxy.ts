import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Refreshes the couple's session cookie and returns who is signed in. Called from src/proxy.ts.
 * Returns the response the proxy must send (or copy cookies from) so refreshed tokens reach the browser.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // getClaims verifies the JWT signature (refreshing it if expired), unlike getSession.
  const { data } = await supabase.auth.getClaims();
  return { response, userId: data?.claims.sub ?? null };
}

/** Redirect that keeps any refreshed session cookies from `from`. */
export function redirectWithCookies(request: NextRequest, from: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  for (const key of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(key);
    if (value) redirect.headers.set(key, value);
  }
  return redirect;
}
