import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Secrets stay on the server. Next.js already fails a build when a Client Component imports a
 * module marked "server-only"; these checks also catch it in `npm test`, name the import chain, and
 * pin down where the service-role key and the payment provider may be used at all.
 */

const ROOT = resolve(__dirname, "../..");
const SRC = join(ROOT, "src");

/** Modules that hold or use secrets. No client code may reach them, directly or through others. */
const SERVER_ONLY = [
  "src/lib/supabase/service.ts",
  "src/lib/payments/index.ts",
  "src/lib/payments/dodo.ts",
  "src/lib/payments/store.ts",
  "src/lib/payments/checkout.ts",
  "src/lib/payments/webhook.ts",
];

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });

const rel = (path: string) => relative(ROOT, path).split("\\").join("/");
const source = (path: string) => readFileSync(path, "utf8");

/** A module's directive ("use client" / "use server"), if its first statement is one. */
function directive(code: string): string | null {
  const body = code.replace(/^(\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/, "");
  return body.match(/^["'](use client|use server)["']/)?.[1] ?? null;
}

/** Runtime imports only: `import type` and `export type` disappear at build time. */
function imports(code: string): string[] {
  const specs: string[] = [];
  const statement = /^\s*(import|export)\s+(?!type\s)(?:[^"';]*?\sfrom\s+)?["']([^"']+)["']/gm;
  for (const match of code.matchAll(statement)) specs.push(match[2]);
  for (const match of code.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) specs.push(match[1]);
  return specs;
}

function resolveImport(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith("@content/")) base = join(ROOT, "content", spec.slice("@content/".length));
  else if (spec.startsWith(".")) base = resolve(dirname(from), spec);
  else return null; // a package
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Every module a client entry pulls into the browser bundle, with the chain that reached it. */
function clientGraph(entry: string): Map<string, string[]> {
  const seen = new Map<string, string[]>([[entry, [rel(entry)]]]);
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.shift()!;
    for (const spec of imports(source(file))) {
      const target = resolveImport(file, spec);
      if (!target || seen.has(target)) continue;
      const chain = [...seen.get(file)!, rel(target)];
      seen.set(target, chain);
      // A "use server" module reaches the browser only as a reference to call; its imports stay on the server.
      if (directive(source(target)) !== "use server") queue.push(target);
    }
  }
  return seen;
}

const all = files(SRC);
const clientEntries = all.filter((file) => directive(source(file)) === "use client");

describe("security boundaries", () => {
  it("finds the client components to check", () => {
    expect(clientEntries.length).toBeGreaterThan(5);
    const editor = clientEntries.find((f) => rel(f).endsWith("edit/editor.tsx"));
    expect(editor).toBeDefined();
    // The walker follows real imports (otherwise the next test would pass vacuously).
    expect([...clientGraph(editor!).keys()].map(rel)).toContain("src/lib/invitations/schema.ts");
  });

  it("no client component reaches the service-role client or the payment provider", () => {
    const leaks: string[] = [];
    for (const entry of clientEntries) {
      for (const [file, chain] of clientGraph(entry)) {
        if (SERVER_ONLY.includes(rel(file))) leaks.push(chain.join(" -> "));
      }
    }
    expect(leaks).toEqual([]);
  });

  it("every secret-holding module is marked server-only", () => {
    for (const file of SERVER_ONLY) {
      expect(source(join(ROOT, file)), file).toMatch(/^import "server-only";/m);
    }
  });

  it("reads the service-role key in exactly one place", () => {
    const readers = all.filter((file) => source(file).includes("SUPABASE_SERVICE_ROLE_KEY")).map(rel);
    expect(readers).toEqual(["src/lib/supabase/service.ts"]);
  });

  it("never exposes a secret through a NEXT_PUBLIC_ variable", () => {
    const publicNames = [...all, join(ROOT, ".env.example")]
      .filter(existsSync)
      .flatMap((file) => [...source(file).matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)].map((m) => m[0]));
    expect(publicNames.filter((name) => /SERVICE|SECRET|DODO|WEBHOOK|API_KEY/.test(name))).toEqual([]);
  });

  it("business logic depends on the PaymentProvider interface, not on Dodo", () => {
    const providerAware = all.filter((file) => /src[\\/]lib[\\/]payments[\\/]/.test(file));
    for (const file of providerAware) {
      const name = rel(file);
      if (name === "src/lib/payments/index.ts" || name === "src/lib/payments/dodo.ts") continue;
      const deps = imports(source(file));
      expect(deps.filter((d) => /dodo/i.test(d)), name).toEqual([]);
    }
    // Outside src/lib/payments, only the wiring module may be used to get a provider.
    const direct = all.filter((file) => !/src[\\/]lib[\\/]payments[\\/]/.test(file) && imports(source(file)).some((d) => /payments\/dodo|dodopayments/.test(d)));
    expect(direct.map(rel)).toEqual([]);
  });
});
