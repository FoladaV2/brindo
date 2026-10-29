import { describe, expect, it } from "vitest";
import { formatPrice, formatPriceShort, listedPrice } from "./price";

describe("price display", () => {
  it("writes lari out in running text and as ₾ when set large", () => {
    expect(formatPrice({ amount: 4900, currency: "GEL" })).toBe("49 ლარი");
    expect(formatPriceShort({ amount: 4900, currency: "GEL" })).toBe("49 ₾");
    expect(formatPriceShort({ amount: 4950, currency: "GEL" })).toBe("49.50 ₾");
    expect(formatPriceShort({ amount: 1500, currency: "USD" })).toBe("15 USD");
  });

  it("lists the configured price, falling back to 49 GEL", () => {
    expect(listedPrice({ PRICE_AMOUNT_MINOR: "5900", PRICE_CURRENCY: "GEL" })).toEqual({ amount: 5900, currency: "GEL" });
    expect(listedPrice({})).toEqual({ amount: 4900, currency: "GEL" });
    expect(listedPrice({ PRICE_AMOUNT_MINOR: "abc", PRICE_CURRENCY: " " })).toEqual({ amount: 4900, currency: "GEL" });
  });
});
