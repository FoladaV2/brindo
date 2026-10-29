# Brindo: v1 Spec

Product name: **Brindo** (Spanish for "I toast"). Design direction is in DESIGN.md.

## Assumptions (change these before building)

- Site and invitations are **Georgian-only** (no English/bilingual in v1).
- **Price: 49 GEL** per event invitation, one-time payment.
- **Affiliate cut: 20%** of the sale (placeholder). Payouts are manual, monthly, after a 14-day hold.
- Payments via **Dodo Payments** behind a provider interface. Dodo's fees, payout terms, and whether Georgian buyers pay an extra bank fee are **unverified**; confirm with a real test purchase before launch.
- Display font: TBC Contractica CAPS (in `/assets/fonts/`). Body font: Noto Sans Georgian.

## Product

Brindo is for **every kind of event**: weddings, engagements, birthdays, christenings, anniversaries, corporate events and anything else people invite guests to.

1. A host signs up and answers a short onboarding (10 questions).
2. From the dashboard they create an event: pick the event type and a template, and fill in what is happening, where, when, and any other details.
3. They click Create and go straight to checkout. After paying 49 GEL they get **one link**.
4. They send that one link to everyone, in Viber, WhatsApp, Messenger, Facebook or anywhere else.
5. A guest opens the link on their phone and sees the invitation. Below it they enter their first name, surname and how many people are coming in total (including themselves), then press one of two big buttons: **მოვდივარ** or **ვერ მოვდივარ**. No account, no app.
6. The host's dashboard (a separate page per event) shows the total number of people coming, the list of who is coming with their party size, and the list of who is not (shown as "[სახელი გვარი] არ მოდის").

There are no per-guest links and no guest list to type in advance.

## Stack

Next.js (App Router, TypeScript), Supabase (Postgres, Auth, Storage), Tailwind, shadcn/ui (with components adapted from Aceternity UI and 21st.dev), Dodo Payments, deployed on Vercel. Supabase must be on a paid plan once any paying customer exists, because free projects can pause and a paused invitation on the day of the event is unacceptable.

## v1 scope (build only this)

1. Host auth (email and password, no email confirmation for now; add Google later if wanted).
2. Onboarding: 10 single-choice questions right after registration (see below). Answers are stored for marketing analysis. It can be skipped, and it ends by leading into creating the first event.
3. Dashboard: sidebar on desktop, bottom bar on phones. Sections: Events (list and create), each event's Responses page, Account.
4. Event types: wedding, engagement, birthday, christening, anniversary, corporate, other. Templates render any of them: the hero shows the event title (couple's names, the birthday person, the company) as the host writes it.
5. Template engine with templates driven by structured content (JSON), not hand-edited HTML. Templates keep their own look (DESIGN.md "Invitation templates"); they are not bound by the three-color brand palette.
6. Event editor: event type, title, date and time, venue, one photo, short message, optional program and dress code, RSVP deadline, and the maximum party size per reply (1 to 10, default 6).
7. Public invitation page at `/i/[slug]` with correct Open Graph preview, and the open RSVP form at the bottom.
8. Open RSVP (see "Open RSVP" below).
9. Dodo checkout and webhook that marks an invitation as paid and publishes it. The link is shown only after payment.
10. Responses page per event: total people coming, the "coming" list with party sizes, the "not coming" list, and the option to delete an entry (for jokes and duplicates). No charts.
11. Referral capture only: store `?ref=CODE` in a cookie and on the order. No affiliate dashboard, no automated payouts.
12. Draft preview: the host sees the exact page guests will see (with a quiet "Preview" ribbon) before paying, and can keep editing after paying; the link never changes.
13. "Add to calendar" (.ics) button on each invitation.
14. Georgian marketing home page (sections below), plus draft Terms and Privacy pages (needs native proofreading and legal review).

## Explicitly NOT in v1

Per-guest personal links, affiliate dashboard or automated payouts, bilingual content, custom domains, analytics dashboards for hosts, email or SMS sending to guests, template marketplace, merging duplicate responses.

## Open RSVP

- The form: first name, surname, party size (a − / + stepper starting at 1, capped by the event's maximum, labelled clearly as the total including the guest), and two buttons: მოვდივარ, ვერ მოვდივარ. Party size is ignored and stored as null for "not coming".
- One request, one server route: validate with zod, look up the published invitation by slug, check the RSVP deadline, rate-limit, write one row through the service-role key.
- The first answer returns an **edit token** (≥24 random bytes from `crypto.randomBytes`; only its hash is stored). The guest's browser keeps it, so opening the link again on the same phone shows their answer with a "change" option instead of a blank form. Changing an answer updates the same row.
- Abuse limits: per-IP rate limit per invitation, and a hard cap on responses per invitation (1,000). Hosts can delete entries.
- Possible duplicates (same normalized name) are flagged on the Responses page; nothing is merged automatically.

## Onboarding (10 questions)

One question per screen, one tap to answer, a progress bar, a "skip" link. Draft questions (final copy in `content/copy.ka.ts`):

1. What are you planning? (event types)
2. When is it? (within a month, 1 to 3 months, 3 to 6 months, later, not decided)
3. Roughly how many guests? (under 30, 30 to 80, 80 to 150, 150 to 300, over 300)
4. Whose event is it? (mine, a family member's, a friend's, I organize events professionally, my company's)
5. How do you usually invite people? (paper invitations, phone calls, messages in Viber/WhatsApp, Facebook event, not decided)
6. What is hardest about inviting guests? (counting who is coming, chasing replies, design, printing cost, time)
7. Which style do you like? (classic, modern and minimal, romantic, bold) — used to recommend a template
8. Your age range (18 to 24, 25 to 34, 35 to 44, 45 to 54, 55 and over)
9. Your city (Tbilisi, Batumi, Kutaisi, Rustavi, other city in Georgia, outside Georgia)
10. How did you hear about Brindo? (Instagram, TikTok, Facebook, a friend, I received a Brindo invitation, Google, other)

The final screen thanks them and opens event creation with the chosen event type pre-selected.

## Marketing home page

Navbar, hero (headline, subline, one primary button, trust line under the button), the problem Brindo solves, how it works in 3 steps with visuals, event types, a live invitation demo, testimonials, pricing (one card, 49 GEL, one-time), FAQ, final call to action, footer.

**Reviews and ratings must be real.** The rating line under the hero button and the testimonials section are fed from a content file. They render in production only when that file contains genuine reviews from real customers (with their permission). Until then, the hero shows true trust lines instead (one-time 49 GEL, guests need no app, secure payment). Sample reviews may appear only in development and the styleguide, visibly marked as samples.

## Data model

- `invitations`: id, owner_id (auth user), slug (unique), event_type, template_id, content (jsonb), max_party_size (1 to 10), status (`draft` | `paid` | `published`), paid_at, created_at
- `responses`: id, invitation_id, first_name, last_name, attending (bool), party_size (null when not attending), edit_token_hash (unique), created_at, updated_at
- `onboarding`: user_id (primary key, auth user), answers (jsonb, validated by zod), completed_at, skipped (bool)
- `orders`: id, invitation_id, provider (`dodo`), provider_payment_id (unique), amount, currency, status, ref_code (nullable), created_at
- `webhook_events`: event_id (primary key), received_at (for idempotency)
- `rate_limits`: key, window_start, count

Store as little guest data as possible: first name, surname, attendance, party size. No phone numbers, no emails.

## Access rules

- RLS enabled on every table. Hosts can read and write only their own invitations, the responses of their own invitations, and their own onboarding row.
- Guests never touch tables directly. RSVP goes through a server route that validates input, rate-limits, and writes through the service-role key.
- The public invitation page only renders invitations with status `published`.
- Payment webhooks only run server-side with the service-role key.

## Payment flow

1. Host clicks Create. Server creates a Dodo checkout session with the invitation id in metadata and returns the URL.
2. Dodo calls `/api/webhooks/dodo`. The handler verifies the signature, checks `webhook_events` for the event id, and if new, marks the order and invitation paid and published, then records the event, all in one transaction.
3. A retried or duplicate webhook must change nothing.
4. All of this sits behind a `PaymentProvider` interface (`createCheckout`, `verifyWebhook`) so Dodo can be swapped for BOG or Payze later.

## Build stages

Done: 1 to 7 (foundation, engine, editor, RSVP with per-guest links, payments, Noir template and guest overview), plus email and password accounts.

8. Rebrand foundation: three-color brand, shadcn/ui component set restyled to it, new logo, styleguide.
9. Marketing home page.
10. Sign-in and registration redesign, and the 10-question onboarding.
11. Open RSVP and all event types: `responses` table replaces `guests` and `rsvps`, templates render any event type, the guest form and edit token, the create flow and editor in the new design, the Responses page. (Done before the dashboard shell, because the shell's event cards show answer counts.)
12. Dashboard: sidebar and bottom bar, event list, account page, and the payment-success page with one-tap sharing.

## Definition of done for v1

- A test host can sign up, finish or skip onboarding, create an event, pay, and share one link.
- A guest on a phone can open the link, see correct Georgian text in the custom font, answer, and change their answer later from the same phone.
- The link preview in Viber and Messenger shows the right title, image, and font.
- A replayed webhook does not double-activate anything.
- One host cannot see another host's events, responses or onboarding answers.
