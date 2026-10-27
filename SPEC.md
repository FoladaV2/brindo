# Brindo: v1 Spec

Product name: **Brindo** (Spanish for "I toast"). Design direction is in DESIGN.md; build prompts are in PROMPTS.md.

## Assumptions (change these before building)

These were not confirmed, so edit any that are wrong:

- Invitations are **Georgian-only** (no English/bilingual in v1).
- **2 templates** at launch, built on one template engine.
- **Price: 49 GEL** per invitation, one-time payment.
- **Affiliate cut: 20%** of the sale (placeholder, set your real number). Payouts are manual, monthly, after a 14-day hold.
- Payments via **Dodo Payments** behind a provider interface. Dodo's fees, payout terms, and whether Georgian buyers pay an extra bank fee are **unverified**; confirm with a real test purchase before launch.
- The custom font file's name and Georgian glyph coverage are unknown. Placeholder: `CustomFont`.

## Product

A couple signs in, picks a template, fills in their details (names, date, venue, photo, message), pays, and gets a shareable link. Guests open the link on their phone, see the invitation, and RSVP without creating an account. The couple sees who is coming.

## Stack

Next.js (App Router, TypeScript), Supabase (Postgres, Auth, Storage), Tailwind, Dodo Payments, deployed on Vercel. Supabase must be on a paid plan once any paying customer exists, because free projects can pause and a paused invitation on a wedding day is unacceptable.

## v1 scope (build only this)

1. Couple auth (email magic link; add Google later if wanted).
2. Template engine + 2 templates, driven by structured content (JSON), not hand-edited HTML.
3. Invitation editor: names, date and time, venue, one photo, short message, guest list.
4. Public invitation page at `/i/[slug]` with correct Open Graph preview.
5. Guest RSVP via unguessable per-guest token link.
6. Dodo checkout and webhook that marks an invitation as paid and publishes it.
7. Minimal couple view: read-only list of guests with RSVP status and party size. No analytics.
8. Referral capture only: store `?ref=CODE` in a cookie and on the order. No affiliate dashboard, no automated payouts.
9. Draft preview: the owner can see their unpublished invitation (with a quiet "Preview" ribbon) before paying.
10. "Add to calendar" (.ics) button on each invitation.
11. A Georgian marketing landing page, plus draft Terms and Privacy pages (needs native proofreading and legal review).

## Explicitly NOT in v1

Affiliate dashboard or automated payouts, other event categories (birthdays, baptisms), bilingual content, custom domains, analytics, email or SMS sending to guests, template marketplace. Add these only after the first paying customers.

## Pre-sell (before or alongside the build)

Sell the first 5 couples by bank transfer and fulfil by hand. Do not wait for the payment integration to find out whether anyone will pay. Record what they ask for; it decides what v2 is.

## Data model

- `invitations`: id, owner_id (auth user), slug (unique), template_id, content (jsonb), status (`draft` | `paid` | `published`), paid_at, created_at
- `guests`: id, invitation_id, name, token (unguessable, unique), max_party_size
- `rsvps`: guest_id (unique), attending (bool), party_size, updated_at
- `orders`: id, invitation_id, provider (`dodo`), provider_payment_id (unique), amount, currency, status, ref_code (nullable), created_at
- `webhook_events`: event_id (primary key), received_at (for idempotency)

Store as little guest data as possible: name, attendance, party size. No phone numbers, no emails.

## Access rules

- RLS enabled on every table. Couples can read and write only rows of invitations they own.
- Guests never touch tables directly. RSVP goes through a server route that validates the token with the service-role key, rate-limits, and writes one row.
- The public invitation page only renders invitations with status `published`.
- Payment webhooks only run server-side with the service-role key.

## Payment flow

1. Couple clicks Pay. Server creates a Dodo checkout session with the invitation id in metadata and returns the URL.
2. Dodo calls `/api/webhooks/dodo`. The handler verifies the signature, checks `webhook_events` for the event id, and if new, marks the order and invitation paid and published, then records the event, all in one transaction.
3. A retried or duplicate webhook must change nothing.
4. All of this sits behind a `PaymentProvider` interface (`createCheckout`, `verifyWebhook`) so Dodo can be swapped for BOG or Payze later.

## Build stages (commit after each, run `/clear` between)

1. Schema, RLS policies, auth, and tests that prove a couple cannot read another couple's data.
2. Template engine and the first template, rendered from sample content with real Georgian text.
3. Editor and public invitation page with OG image (custom font, TTF).
4. Guest RSVP flow with tokens and rate limiting.
5. Dodo checkout, webhook, idempotency. Test with a real test-mode payment and a replayed webhook.
6. Second template, minimal couple view.
7. Polish, security pass (RLS review, rate limits, input validation), deploy, then send a real invitation to a real phone and open it in Viber and Messenger.

## Definition of done for v1

- A test couple can sign up, build, pay, publish, and share a link.
- A guest on a phone can open the link, see correct Georgian text in the custom font, and RSVP once.
- The link preview in Viber and Messenger shows the right title, image, and font.
- A replayed webhook does not double-activate anything.
- One couple cannot see another couple's guests.
