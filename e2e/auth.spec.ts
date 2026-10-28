import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { NO_SUPABASE, SEED, supabase } from "./supabase";

// Email and password, no email confirmation: registering signs the couple in at once.
// Needs Supabase (the proxy and the actions talk to it); see e2e/supabase.ts.

const PASSWORD = "ღვინო-და-პური-2027";

test.describe("registration and password sign-in", () => {
  test.skip(!supabase, NO_SUPABASE);

  test("a new couple registers, lands on the dashboard, signs out and signs back in", async ({ page }) => {
    const email = `register-${randomUUID()}@example.com`;
    await page.goto("/register");
    await page.screenshot({ path: "test-results/auth/register.png" });
    await page.getByLabel("ელფოსტა").fill(email);
    await page.getByLabel("პაროლი", { exact: true }).fill(PASSWORD);
    await page.getByLabel("გაიმეორეთ პაროლი").fill(PASSWORD);
    await page.getByRole("button", { name: "ანგარიშის შექმნა" }).click();
    await page.waitForURL("**/dashboard");
    await expect(page.getByText(email)).toBeVisible();

    await page.getByRole("button", { name: "გასვლა" }).click();
    await page.waitForURL("**/login");
    await page.getByLabel("ელფოსტა").fill(email.toUpperCase());
    await page.getByLabel("პაროლი").fill(PASSWORD);
    await page.getByRole("button", { name: "შესვლა", exact: true }).click();
    await page.waitForURL("**/dashboard");
  });

  test("registering an email that already has an account says so", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("ელფოსტა").fill(SEED.nino.email);
    await page.getByLabel("პაროლი", { exact: true }).fill(PASSWORD);
    await page.getByLabel("გაიმეორეთ პაროლი").fill(PASSWORD);
    await page.getByRole("button", { name: "ანგარიშის შექმნა" }).click();
    await expect(page.getByRole("alert")).toHaveText("ამ ელფოსტით ანგარიში უკვე არსებობს.");
    await expect(page).toHaveURL(/\/register$/);
  });

  test("a wrong password gets one answer that doesn't say whether the email exists", async ({ page }) => {
    for (const email of [SEED.nino.email, `nobody-${randomUUID()}@example.com`]) {
      await page.goto("/login");
      await page.getByLabel("ელფოსტა").fill(email);
      await page.getByLabel("პაროლი").fill("not-the-password");
      await page.getByRole("button", { name: "შესვლა", exact: true }).click();
      await expect(page.getByRole("alert")).toHaveText("ელფოსტა ან პაროლი არასწორია.");
    }
  });

  test("register validates on the server: short password, mismatch", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("ელფოსტა").fill("nino@example.com");
    await page.getByLabel("პაროლი", { exact: true }).fill("1234");
    await page.getByLabel("გაიმეორეთ პაროლი").fill("1234");
    await page.getByRole("button", { name: "ანგარიშის შექმნა" }).click();
    await expect(page.getByText("პაროლი უნდა შედგებოდეს მინიმუმ 8 სიმბოლოსგან")).toBeVisible();
    await page.getByLabel("პაროლი", { exact: true }).fill(PASSWORD);
    await page.getByLabel("გაიმეორეთ პაროლი").fill(`${PASSWORD}!`);
    await page.getByRole("button", { name: "ანგარიშის შექმნა" }).click();
    await expect(page.getByText("პაროლები არ ემთხვევა")).toBeVisible();
  });
});
