import { copy } from "@content/copy.ka";
import { fill } from "@/lib/text";

/** "49 ლარი" from { amount: 4900, currency: "GEL" }. Used in running text (payment pages, errors). */
export function formatPrice({ amount, currency }: { amount: number; currency: string }): string {
  const value = amount % 100 === 0 ? String(amount / 100) : (amount / 100).toFixed(2);
  return currency === "GEL" ? fill(copy.payment.price, { amount: value }) : `${value} ${currency}`;
}

/** "49 ₾": the short form for prices set large (home page). Both brand fonts have the lari sign. */
export function formatPriceShort({ amount, currency }: { amount: number; currency: string }): string {
  const value = amount % 100 === 0 ? String(amount / 100) : (amount / 100).toFixed(2);
  return currency === "GEL" ? `${value} ₾` : `${value} ${currency}`;
}

/**
 * The price shown on the marketing pages. Server only: it reads the same variables that
 * paymentSettings() charges with (docs/payments.md), falling back to the SPEC price.
 */
export function listedPrice(env: Record<string, string | undefined> = process.env): { amount: number; currency: string } {
  const amount = Number(env.PRICE_AMOUNT_MINOR);
  const currency = env.PRICE_CURRENCY?.trim() || "GEL";
  return { amount: Number.isInteger(amount) && amount > 0 ? amount : 4900, currency };
}
