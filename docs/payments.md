# Payments

A couple pays once (49 GEL) and their invitation goes live. Dodo Payments runs the checkout and is the merchant of record. Brindo is a brand under the Scriptor business on Dodo, so the checkout, receipts and card statement show Brindo.

## Flow

1. **Pay and publish** (the editor's button) calls the `payAndPublish` server action with the invitation id only. The action:
   - checks through RLS that the signed-in couple owns the invitation, that it is still a draft, and that its saved content is complete;
   - creates a `pending` row in `orders`, with the amount and currency taken from the environment (never from the client) and the `?ref` cookie's code, if there is one;
   - creates a Dodo checkout session for the configured product, with `order_id` and `invitation_id` in its metadata, and sends the browser there.

   Currency switching and discount codes are turned off on the session, so the charge is the product's price in GEL.
2. The couple pays on Dodo's hosted page. Dodo sends them to `/dashboard/invitations/[id]/done` and, separately, calls the webhook.
3. **`POST /api/webhooks/dodo`**:
   1. reads the raw body;
   2. verifies the Standard Webhooks signature over `webhook-id.webhook-timestamp.body` and rejects anything unsigned, tampered with, or more than 5 minutes old with a 401;
   3. calls `apply_payment_event()`, which does everything else in one database transaction:
      - inserts the event id into `webhook_events`. If the id is already there, the event is a retry or a replay: it returns `duplicate`, changes nothing, and the route answers 200;
      - on `payment.succeeded` for a pending or failed order, if the amount and currency match the order (tax may be included or added on top) and the invitation matches: marks the order `paid` and sets the invitation to `published` with `paid_at`;
      - on `payment.failed` or `payment.cancelled`: marks a pending order `failed`. A late failure never undoes a payment;
      - on `refund.succeeded`: a full refund marks the order `refunded`, and a partial refund leaves it `paid`. **The invitation is never unpublished automatically.**
      - disputes, `payment.processing`, other brands' payments and unknown events are recorded only.
   4. If the database fails, the route answers 500 and Dodo retries (up to 8 times over about a day).
4. **`/done`** never trusts the redirect. It reads the invitation and its latest order from the database:
   - **published:** the link, *Copy link*, and *Add guests*;
   - **pending:** "confirming your payment", refreshing every 2 seconds for about 40 seconds, then a calm "taking longer" message;
   - **failed or refunded:** a way back to the editor.

All payment code is behind `PaymentProvider` (`src/lib/payments/provider.ts`). `src/lib/payments/index.ts` is the only module that picks Dodo. Checkout and webhook logic receive a provider and never import Dodo, and `src/lib/security-boundaries.test.ts` checks that.

## What needs a person

Every event's outcome is stored in `webhook_events.outcome`, and anything that needs a decision is logged as `[payments] NEEDS REVIEW: …`. To list recent outcomes:

```sql
select received_at, event_type, provider_payment_id, outcome
from webhook_events
where outcome not in ('published', 'duplicate', 'recorded', 'order_failed', 'already_paid')
order by received_at desc;
```

| Outcome | Meaning | What to do |
|---|---|---|
| `amount_mismatch` | The paid amount or currency differs from the order. Not published. | Check the payment in Dodo. Publish by hand or refund. |
| `invitation_mismatch`, `unknown_order` | The payment doesn't match an order. Not published. | Investigate. |
| `paid_already_published`, `second_payment_for_order` | Possible double payment. | Refund one of the payments in Dodo. |
| `paid_invitation_missing` | The couple deleted the invitation before the payment landed. | Refund. |
| `order_refunded`, `partial_refund_recorded` | A refund. The invitation is still live. | Decide whether to unpublish. |
| `dispute.*` (outcome `recorded`) | A chargeback. | Respond in the Dodo dashboard. |

## Environment variables

Server only. None of these may have a `NEXT_PUBLIC_` prefix.

| Variable | Example | Notes |
|---|---|---|
| `DODO_PAYMENTS_ENVIRONMENT` | `test_mode` | `test_mode` or `live_mode`. Picks `test.dodopayments.com` or `live.dodopayments.com`. Defaults to `test_mode`. |
| `DODO_PAYMENTS_API_KEY` | | Developer → API Keys, in the same mode. |
| `DODO_PAYMENTS_WEBHOOK_KEY` | `whsec_…` | The webhook endpoint's signing secret (Developer → Webhooks), in the same mode. |
| `DODO_PRODUCT_ID` | `pdt_…` | The "Brindo — საქორწილო მოსაწვევი" product in the same mode. The live one is `pdt_0NqiU8Cm0ztUAQvaPb1s`. |
| `DODO_BRAND_ID` | `brnd_0NqiT3o18NCeoN8cRdC5v` | Optional. If set, payments for other brands on the Scriptor business are recorded and ignored. |
| `PRICE_AMOUNT_MINOR` | `4900` | In tetri. **Must equal the Dodo product's price**, or payments are held as `amount_mismatch`. |
| `PRICE_CURRENCY` | `GEL` | Defaults to `GEL`. |
| `NEXT_PUBLIC_SITE_URL` | `https://brindo.ge` | Already used elsewhere. Builds the return and cancel URLs. |

Test mode and live mode have separate products, API keys and webhook endpoints. Set all of them per environment: test-mode values for local development and previews, live values for production only.

Without these variables the editor still works: the Pay button stays disabled.

## Testing

- `npm test`: unit tests with a mocked provider. They cover signature checks (including the published Standard Webhooks test vector), event parsing, the checkout request, the webhook handler, and the import boundaries.
- `npm run test:db`: needs `supabase start`. Runs the webhook handler with a mocked provider against the real `apply_payment_event()`: publishing, replays, simultaneous deliveries, bad signatures, wrong amounts, refunds and permissions.

### A real test-mode payment, end to end

1. **Local stack:**

   ```bash
   supabase start
   supabase db reset          # applies all migrations, including payments
   ```

   Put the local keys and the Dodo test-mode values in `.env.local`, then run `npm run dev`.
2. **A public URL for the webhook.** For example, with Cloudflare's free quick tunnel:

   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

   It prints a URL like `https://something.trycloudflare.com`. Dodo's CLI can also forward test webhooks (`dodo wh listen`; see their CLI docs).
3. **In Dodo, in Test Mode:**
   - Developer → Webhooks → add `https://<tunnel>/api/webhooks/dodo`;
   - subscribe to `payment.*`, `refund.*` and `dispute.*`;
   - copy its secret into `DODO_PAYMENTS_WEBHOOK_KEY` and restart `npm run dev`.
4. Sign in, complete an invitation, and click **Pay and publish**. Pay with a Dodo test card: `4242 4242 4242 4242`, expiry 06/32, CVC 123.

   Test mode sends real receipt emails, so use an address you control.
5. **Expected:**
   - Dodo returns you to `/done`. It shows "confirming" for a moment, then the published state;
   - `/i/<slug>` opens in a private window;
   - in Supabase Studio (http://127.0.0.1:54323), the order is `paid` and `webhook_events` has one row with outcome `published`.
6. **Replay:** in Dodo's webhook delivery log, resend the same event. It should answer 200, with nothing changed and still one `webhook_events` row.
7. **Decline:** with a new invitation, pay with `4000 0000 0000 0002`. Nothing should be published.
8. **Refund:** refund the payment in Dodo. The order should become `refunded`, the invitation should stay published, and the log should show `NEEDS REVIEW`.

`dodo wh trigger` sends mock events without Brindo's metadata. They are recorded as `recorded` and change nothing, which is a quick way to check that signatures verify.

## Referral codes

`?ref=CODE` on any page (letters, digits, `-` and `_`, at most 32 characters) is stored in the `brindo_ref` cookie for 60 days by `src/proxy.ts`. A newer code replaces an older one. The code is copied onto the order when the couple pays. There are no payouts or dashboards: report from `orders.ref_code`.
