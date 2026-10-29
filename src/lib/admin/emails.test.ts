import { describe, expect, it } from "vitest";
import { isAdminEmail, parseAdminEmails } from "./emails";

describe("admin emails", () => {
  it("reads a comma- or space-separated list, ignoring case and junk", () => {
    expect([...parseAdminEmails(" Folada@example.com, ana@example.com;x  ")].sort()).toEqual(["ana@example.com", "folada@example.com"]);
  });

  it("lets in only listed accounts", () => {
    expect(isAdminEmail("FOLADA@example.com", "folada@example.com")).toBe(true);
    expect(isAdminEmail("someone@example.com", "folada@example.com")).toBe(false);
  });

  it("lets in nobody when the setting is empty or unset", () => {
    expect(isAdminEmail("folada@example.com", "")).toBe(false);
    expect(isAdminEmail("folada@example.com", undefined)).toBe(false);
    expect(isAdminEmail(null, "folada@example.com")).toBe(false);
  });
});
