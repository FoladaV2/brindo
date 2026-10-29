# CLAUDE.md

The product is called **Brindo**. Read SPEC.md and DESIGN.md first. Build only what v1 scope lists. Work one stage at a time (SPEC.md lists the build stages), and stop at the end of each stage so I can review.

Design is a first-class requirement: premium, confident, effortless. Follow DESIGN.md exactly. The brand uses three colors only (bone, onyx, wine) and their documented tints; templates are exempt. After building any screen, screenshot it at 390px and 1440px, look at it critically against DESIGN.md, and fix what looks generic or cramped before reporting. Never use emoji, stock illustrations, gray drop shadows, gradient text or `text-transform: uppercase` on Georgian text (soft tinted shadows only on floating layers, as DESIGN.md says). Animate only transform and opacity, and respect reduced motion.

All Georgian copy goes in `content/copy.ka.ts`, marked DRAFT, for proofreading by a native speaker.

## Stack

Next.js (App Router, TypeScript), Supabase (Postgres, Auth, Storage), Tailwind, shadcn/ui (components in `src/components/ui/`, adapted from Aceternity UI and 21st.dev where useful), Dodo Payments, Vercel.

## Hard rules

### Security and data
- Enable RLS on every table. Never expose a table to the anon key without a policy. Never use the service-role key in client code.
- Guests are not logged in. RSVP goes only through a server route that validates input, finds the published invitation by slug, rate-limits requests, caps responses per invitation, and writes through the service-role key. The edit token returned to a guest must be long and random (use `crypto.randomBytes`, at least 24 bytes) and stored only as a hash.
- Store only guest first name, surname, attendance, and party size. No phone numbers or emails.
- Onboarding answers belong to the account owner only (RLS), and are used for aggregate marketing analysis.
- Validate all input on the server (use zod). Never trust client-supplied invitation ids or prices.
- Write tests that prove one host cannot read or modify another host's invitations, responses or onboarding answers.

### Payments
- All payment code sits behind a `PaymentProvider` interface with `createCheckout` and `verifyWebhook`. Dodo is the first implementation. Business logic never imports the Dodo SDK directly.
- The price comes from server config, never from the client.
- Webhook handler: verify the signature using the raw request body, then check `webhook_events` for the event id, then update order and invitation in one transaction. A duplicate or replayed event must be a no-op that returns 200.
- Do not write Dodo API details from memory. Read Dodo's current docs for checkout creation and webhook signature verification, and tell me if anything is unclear.
- No automated affiliate payouts. Only store `ref_code` on the order.

### Font and Georgian text
- Use the custom font from `/assets/fonts/` everywhere, including OG images. Load it on pages with `next/font/local`.
- OG images use `ImageResponse`, which needs a TTF or OTF copy of the font (not WOFF2). Keep the TTF in the repo and read it on the server.
- Every template must be tested with real Georgian text: long names, a full address, and a multi-line message. No Latin fallback glyphs should appear. If the font lacks a glyph, flag it and stop.
- Do not hard-code text in templates. All text comes from the content JSON.

### Honesty in marketing
- Never invent reviews, ratings, testimonials, customer counts or press logos. These sections render in production only from real data (see SPEC.md, "Marketing home page").

### Invitations on phones
- Design mobile-first. Most guests open links from Viber, Messenger, or WhatsApp on a phone.
- Every public invitation needs correct Open Graph tags: title, description, image.
- Keep page weight low. Resize and compress uploaded photos.

## Working style

- Commit after each stage with a clear message.
- Before writing a feature, state the plan in a few lines. Ask only if something is truly ambiguous; otherwise choose the simplest option and note it.
- Do not add features, dependencies, or abstractions that SPEC.md doesn't call for.
- When a stage is done, list what you tested and what you could not test (for example real payments, real phones) so I know what to verify by hand.

## Commands

- `npm run dev`: dev server (styleguide at /styleguide)
- `npm run build` / `npm run start`: production build and server
- `npm run lint`: ESLint
- `npm test`: unit tests (vitest)
- `npm run check:contrast`: WCAG AA check of every text/background token pair in `src/styles/brand.css` and `src/styles/template-tokens.css`
- `STYLEGUIDE_ENABLED=true npm run build && npm run test:e2e`: Playwright (screenshots go to `test-results/styleguide/`). The styleguide is decided at build time, so build with the flag first.
- `python scripts/build-wordmark.py > src/components/brand/wordmark-paths.ts`: regenerate the wordmark outlines from the font (needs `pip install fonttools`)
- `npx shadcn@latest add <component>`: add a shadcn/ui component (then restyle it to DESIGN.md)
- `npm run db:reset` / `npm run db:types`: rebuild the local database from migrations / regenerate types
