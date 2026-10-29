import { describe, expect, it } from "vitest";
import { deviceFrom, isBot, normalizePath, referrerHost } from "./page-view";

describe("normalizePath", () => {
  it("removes slugs, ids, queries and fragments", () => {
    expect(normalizePath("/i/anas-30-k7xq?ref=TAMADA")).toBe("/i/:slug");
    expect(normalizePath("/dashboard/invitations/0f8fad5b-d9cb-469f-a165-70867728950e/edit")).toBe("/dashboard/invitations/:id/edit");
    expect(normalizePath("/register#top")).toBe("/register");
    expect(normalizePath("/")).toBe("/");
  });

  it("skips tools, previews, the admin area and odd paths", () => {
    for (const path of ["/admin", "/admin/x", "/preview/lumiere", "/styleguide", "/api/rsvp", "/_next/static/x.js", "no-slash", "/i/a/og", "/<script>"]) {
      expect(normalizePath(path), path).toBeNull();
    }
  });
});

describe("visitors", () => {
  it("tells bots and link-preview fetchers apart from people", () => {
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148")).toBe(false);
    expect(isBot("facebookexternalhit/1.1")).toBe(true);
    expect(isBot("Viber/22.0")).toBe(true);
    expect(isBot(null)).toBe(true);
  });

  it("classes devices", () => {
    expect(deviceFrom("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile")).toBe("mobile");
    expect(deviceFrom("Mozilla/5.0 (Linux; Android 14; SM-S911B) Mobile Safari")).toBe("mobile");
    expect(deviceFrom("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe("tablet");
    expect(deviceFrom("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130")).toBe("desktop");
  });

  it("keeps only the referring site's host, never our own", () => {
    expect(referrerHost("https://l.instagram.com/?u=https%3A%2F%2Fbrindo.ge", "brindo.ge")).toBe("instagram.com");
    expect(referrerHost("https://www.google.com/search?q=brindo", "brindo.ge")).toBe("google.com");
    expect(referrerHost("https://brindo.ge/register", "brindo.ge")).toBeNull();
    expect(referrerHost("not a url", "brindo.ge")).toBeNull();
    expect(referrerHost(undefined, "brindo.ge")).toBeNull();
  });
});
