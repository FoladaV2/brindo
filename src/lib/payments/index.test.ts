import { afterEach, describe, expect, it, vi } from "vitest";
import { paymentProvider, paymentSettings } from "./index";

afterEach(() => vi.unstubAllEnvs());

describe("payment configuration", () => {
  it("reads the product and price from the environment", () => {
    vi.stubEnv("DODO_PRODUCT_ID", "pdt_test");
    vi.stubEnv("PRICE_AMOUNT_MINOR", "4900");
    vi.stubEnv("PRICE_CURRENCY", "");
    expect(paymentSettings()).toEqual({ productId: "pdt_test", price: { amount: 4900, currency: "GEL" } });
  });

  it("names the variables that are missing or invalid", () => {
    vi.stubEnv("DODO_PRODUCT_ID", "");
    vi.stubEnv("PRICE_AMOUNT_MINOR", "49.5");
    expect(() => paymentSettings()).toThrow(/DODO_PRODUCT_ID, PRICE_AMOUNT_MINOR/);
  });

  it("builds a provider with blank optional settings left out", () => {
    vi.stubEnv("DODO_PAYMENTS_API_KEY", "sk_test");
    vi.stubEnv("DODO_PAYMENTS_WEBHOOK_KEY", "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw");
    vi.stubEnv("DODO_PAYMENTS_ENVIRONMENT", "");
    vi.stubEnv("DODO_BRAND_ID", "");
    expect(paymentProvider().name).toBe("dodo");
    vi.stubEnv("DODO_PAYMENTS_ENVIRONMENT", "production");
    expect(() => paymentProvider()).toThrow(/DODO_PAYMENTS_ENVIRONMENT/);
  });
});
