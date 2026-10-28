import { describe, expect, it } from "vitest";
import { emailSchema, registerError, signInSchema } from "./credentials";

const valid = { email: "nino@example.com", password: "ღვინო-და-პური", confirm: "ღვინო-და-პური" };

describe("registerError", () => {
  it("accepts a valid email and matching password of 8 or more characters", () => {
    expect(registerError(valid)).toBeNull();
    expect(registerError({ ...valid, password: "12345678", confirm: "12345678" })).toBeNull();
  });

  it("names the first problem", () => {
    expect(registerError({ ...valid, email: "not an email" })).toBe("invalidEmail");
    expect(registerError({ ...valid, password: "1234567", confirm: "1234567" })).toBe("passwordShort");
    expect(registerError({ ...valid, confirm: "something else" })).toBe("passwordMismatch");
  });

  it("rejects passwords longer than bcrypt's 72 bytes, counting Georgian letters as 3 bytes", () => {
    const georgian24 = "ა".repeat(24); // 72 bytes
    expect(registerError({ ...valid, password: georgian24, confirm: georgian24 })).toBeNull();
    const georgian25 = "ა".repeat(25); // 75 bytes
    expect(registerError({ ...valid, password: georgian25, confirm: georgian25 })).toBe("passwordLong");
  });
});

describe("emailSchema", () => {
  it("trims and lowercases, so the same address is one account", () => {
    expect(emailSchema.parse("  Nino@Example.COM ")).toBe("nino@example.com");
  });
});

describe("signInSchema", () => {
  it("needs an email and a non-empty password", () => {
    expect(signInSchema.safeParse({ email: "nino@example.com", password: "" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "nino@example.com", password: "x" }).success).toBe(true);
  });
});
