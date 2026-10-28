import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Two ways in, both from the magic-link email:
//  - token_hash + type: our email template (works on any device or in-app browser).
//  - code: Supabase's default template (PKCE; works only in the browser that asked for the link).
const params = z.union([
  z.object({ token_hash: z.string().min(1).max(512), type: z.enum(["email", "magiclink", "signup"]) }),
  z.object({ code: z.string().min(1).max(512) }),
]);

export async function GET(request: NextRequest) {
  const parsed = params.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  const supabase = await createClient();

  let ok = false;
  if (parsed.success) {
    const { error } =
      "code" in parsed.data
        ? await supabase.auth.exchangeCodeForSession(parsed.data.code)
        : await supabase.auth.verifyOtp({ token_hash: parsed.data.token_hash, type: parsed.data.type });
    ok = !error;
  }

  const target = request.nextUrl.clone();
  target.search = "";
  target.pathname = ok ? "/dashboard" : "/login";
  if (!ok) target.searchParams.set("error", "link");
  return NextResponse.redirect(target);
}
