import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

// Point the tests (and the app's own Supabase helpers they import) at a Supabase project.
// Uses .env.local (a hosted dev project) if present, otherwise the local stack from `supabase status`.
// Never point this at production: the tests create and delete users.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  let output: string;
  try {
    output = execSync("supabase status -o env", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    throw new Error("No Supabase project configured. Fill in .env.local (see .env.example) or run `supabase start`.");
  }
  const env = Object.fromEntries(
    output
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => [m[1], m[2]]),
  );
  process.env.NEXT_PUBLIC_SUPABASE_URL = env.API_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = env.SERVICE_ROLE_KEY;
}
