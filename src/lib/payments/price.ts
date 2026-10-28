import { copy } from "@content/copy.ka";
import { fill } from "@/lib/text";

/** "49 ლარი" from { amount: 4900, currency: "GEL" }. Lari are written out: the fonts may lack "₾". */
export function formatPrice({ amount, currency }: { amount: number; currency: string }): string {
  const value = amount % 100 === 0 ? String(amount / 100) : (amount / 100).toFixed(2);
  return currency === "GEL" ? fill(copy.payment.price, { amount: value }) : `${value} ${currency}`;
}
