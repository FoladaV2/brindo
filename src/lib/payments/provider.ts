/**
 * The only payment API business logic sees. Dodo is the first implementation (dodo.ts); index.ts
 * picks it. Checkout and webhook code receive a PaymentProvider and never import a provider directly.
 */
export interface PaymentProvider {
  readonly name: "dodo";
  /** Starts a hosted checkout for one invitation. The price is the provider product's price. */
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  /** True only if the raw body was signed by the provider recently. Must run before parseEvent. */
  verifyWebhook(rawBody: string, headers: Headers): boolean;
  /** Turns a verified body into an event. Null if the body is not a webhook event at all. */
  parseEvent(rawBody: string, headers: Headers): PaymentEvent | null;
}

export type CheckoutRequest = {
  orderId: string;
  invitationId: string;
  productId: string;
  /** Where the provider sends the couple after paying. Never trusted as proof of payment. */
  returnUrl: string;
  cancelUrl: string;
  customerEmail?: string;
};

export type CheckoutSession = { sessionId: string; url: string };

/** Provider events, reduced to what Brindo acts on. Amounts are in minor units (tetri). */
export type PaymentEvent =
  | (EventBase & {
      kind: "payment_succeeded";
      orderId: string;
      invitationId: string;
      paymentId: string;
      amount: number;
      /** Tax included in amount, if the provider reports it. */
      tax: number | null;
      currency: string;
    })
  | (EventBase & { kind: "payment_failed"; orderId: string; invitationId: string; paymentId: string })
  | (EventBase & { kind: "refund_succeeded"; paymentId: string; partial: boolean })
  /** Recorded, never acted on: disputes, processing, other brands' payments, unknown types. */
  | (EventBase & { kind: "other"; paymentId: string | null });

type EventBase = {
  /** Unique per event and stable across retries: the idempotency key. */
  id: string;
  /** The provider's own event name, e.g. "payment.succeeded". */
  type: string;
};
