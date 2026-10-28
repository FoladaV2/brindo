/**
 * Referral capture: ?ref=CODE on any page is kept in a first-party cookie and copied onto the order
 * when the couple pays. Stored only; payouts are manual. The format matches orders.ref_code.
 */
export const REF_COOKIE = "brindo_ref";
export const REF_MAX_AGE_SECONDS = 60 * 24 * 60 * 60;

const REF_CODE = /^[A-Za-z0-9_-]{1,32}$/;

export function parseRefCode(value: string | null | undefined): string | null {
  return value && REF_CODE.test(value) ? value : null;
}
