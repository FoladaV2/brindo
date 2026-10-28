import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@content/copy.ka";
import { startCheckout, type CheckoutDeps, type CheckoutInput } from "./checkout";
import { formatPrice } from "./price";
import type { PaymentProvider } from "./provider";

const ID = "0b7e8d6c-5f4e-4d3c-9b2a-7e6d5c4b3a29";
const draft = { id: ID, status: "draft", content: copy.samples.short };

function deps(overrides: Partial<CheckoutDeps> = {}) {
  const provider: PaymentProvider = {
    name: "dodo",
    createCheckout: vi.fn(async () => ({ sessionId: "cks_1", url: "https://test.checkout.dodopayments.com/cks_1" })),
    verifyWebhook: vi.fn(),
    parseEvent: vi.fn(),
  };
  return {
    provider,
    productId: "pdt_brindo",
    price: { amount: 4900, currency: "GEL" },
    siteUrl: "https://brindo.ge/",
    findOwnInvitation: vi.fn(async (id: string) => (id === ID ? draft : null)),
    createOrder: vi.fn(async () => "order-1"),
    markOrderFailed: vi.fn(async () => {}),
    ...overrides,
  } satisfies CheckoutDeps;
}

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe("startCheckout", () => {
  it("creates a pending order at the configured price and a checkout carrying its ids", async () => {
    const d = deps();
    // Anything else the client sends is ignored: the input type has no price, and extra fields do nothing.
    const input = { invitationId: ID, customerEmail: "c@example.com", refCode: "ANA_2026", amount: 1, currency: "USD" } as CheckoutInput;
    const result = await startCheckout(input, d);

    expect(result).toEqual({ ok: true, url: "https://test.checkout.dodopayments.com/cks_1" });
    expect(d.createOrder).toHaveBeenCalledWith({ invitationId: ID, amount: 4900, currency: "GEL", refCode: "ANA_2026" });
    expect(d.provider.createCheckout).toHaveBeenCalledWith({
      orderId: "order-1",
      invitationId: ID,
      productId: "pdt_brindo",
      returnUrl: `https://brindo.ge/dashboard/invitations/${ID}/done`,
      cancelUrl: `https://brindo.ge/dashboard/invitations/${ID}/edit`,
      customerEmail: "c@example.com",
    });
  });

  it("refuses an invitation the couple doesn't own, without creating an order", async () => {
    const d = deps();
    const result = await startCheckout({ invitationId: "11111111-2222-4333-8444-555555555555" }, d);
    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(d.createOrder).not.toHaveBeenCalled();
    expect(d.provider.createCheckout).not.toHaveBeenCalled();
  });

  it("refuses ids that are not uuids before looking anything up", async () => {
    const d = deps();
    expect(await startCheckout({ invitationId: "../../orders" }, d)).toEqual({ ok: false, error: "not_found" });
    expect(d.findOwnInvitation).not.toHaveBeenCalled();
  });

  it("refuses published and incomplete invitations", async () => {
    const published = deps({ findOwnInvitation: async () => ({ ...draft, status: "published" }) });
    expect(await startCheckout({ invitationId: ID }, published)).toEqual({ ok: false, error: "already_published" });
    const incomplete = deps({ findOwnInvitation: async () => ({ ...draft, content: { partners: ["ანა", "ლუკა"] } }) });
    expect(await startCheckout({ invitationId: ID }, incomplete)).toEqual({ ok: false, error: "incomplete" });
    expect(published.createOrder).not.toHaveBeenCalled();
    expect(incomplete.createOrder).not.toHaveBeenCalled();
  });

  it("drops a malformed referral code instead of failing", async () => {
    const d = deps();
    await startCheckout({ invitationId: ID, refCode: "x'; drop table orders;--" }, d);
    expect(d.createOrder).toHaveBeenCalledWith(expect.objectContaining({ refCode: null }));
  });

  it("marks the order failed if the provider can't create a checkout", async () => {
    const d = deps();
    vi.mocked(d.provider.createCheckout).mockRejectedValueOnce(new Error("503"));
    expect(await startCheckout({ invitationId: ID }, d)).toEqual({ ok: false, error: "failed" });
    expect(d.markOrderFailed).toHaveBeenCalledWith("order-1");
  });
});

describe("formatPrice", () => {
  it("writes lari out in Georgian and keeps tetri when there are any", () => {
    expect(formatPrice({ amount: 4900, currency: "GEL" })).toBe("49 ლარი");
    expect(formatPrice({ amount: 4950, currency: "GEL" })).toBe("49.50 ლარი");
    expect(formatPrice({ amount: 1500, currency: "USD" })).toBe("15 USD");
  });
});
