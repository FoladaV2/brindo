# Brindo

Digital wedding invitations for Georgian couples. Product scope is in `SPEC.md`, design direction in `DESIGN.md`, working rules in `CLAUDE.md`.

## Run it

```bash
npm install
npm run dev            # http://localhost:3000/styleguide
```

| Command | What it does |
|---|---|
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (vitest) |
| `npm run check:contrast` | Fails if any text/background token pair is below WCAG AA |
| `npm run test:e2e` | Playwright: screenshots, font fallback check, motion audit. Build with `STYLEGUIDE_ENABLED=true` first. |

First Playwright run on a new machine: `npx playwright install chromium`.

## Styleguide

`/styleguide` shows every token and component on light and dark surfaces with real Georgian text. It is `noindex`, and in production it returns 404 unless the build ran with `STYLEGUIDE_ENABLED=true`. The flag is inlined at build time (`next.config.ts`), so the server's runtime environment doesn't change it.

## Invitation templates

- Content schema: `src/lib/invitations/schema.ts` (zod). Templates receive only parsed content.
- Templates live in `src/templates/`: `registry.ts` lists them, `InvitationRenderer` picks one by id. Strings that aren't the couple's content come from `copy.invitation`.
- Both templates are the same component, `shared/Invitation.tsx`, with a small `Look` (surface, halo, timing, photo treatment). Lumière is the light surface; Noir is the dark one, and `noir/noir.css` gives it champagne display type and hairlines, a still moonlit halo and slower motion by overriding the motion variables. A new template is a `Look`, a stylesheet scoped by `[data-template]`, a registry entry and a thumbnail.
- Previews (same flag as the styleguide): `/preview/<template>` (long names, long address, full message, photo, program, opened by a guest; `?rsvp=yes|no|closed|closed-empty`) and `/preview/<template>/short` (short names, no photo or program, no guest), for `lumiere` and `noir`. `.ics` files: `/preview/calendar/full.ics`, `/preview/calendar/short.ics`.
- Template-picker thumbnails are screenshots of the short previews: with a server running, `node scripts/build-thumbnails.mjs http://localhost:3000` rewrites `public/templates/<id>.webp`.
- Client components in templates get their strings as props and never import `content/copy.ka.ts`, so the invitation page doesn't download the whole copy file.

## Accounts

- `/register` (email, password, password again) and `/login` (email, password). Email confirmation is off, so registering signs the couple in straight away. Locally that's `enable_confirmations = false` in `supabase/config.toml`; **in the hosted project, turn off Authentication → Sign In / Providers → Email → "Confirm email"**, or registration answers with an error (the server logs why).
- Passwords: at least 8 characters (here and `minimum_password_length`), at most 72 bytes (bcrypt).
- Sign-in and registration run in server actions, so Supabase sees the server's IP; per-visitor limits in our database (`src/lib/auth/limits.ts`) stop password guessing: 10 attempts per account and 30 per IP every 15 minutes, 5 registrations per IP per hour.
- No password reset yet (it needs email). Seeded couples sign in with `brindo-dev-2027`.

## Couples' editor and public pages

- `/dashboard`: the couple's invitations. `/dashboard/invitations/new` asks for the names (they make the link), then opens the editor at `/dashboard/invitations/[id]/edit`.
- The editor autosaves drafts (debounced) through the `saveDraft` server action. Drafts are checked with `invitationDraftSchema` (fields may be empty); the full `invitationContentSchema` decides what is complete. The live preview is `/dashboard/invitations/[id]/frame` in an iframe, updated by `postMessage`.
- Photos are resized in the browser (at most 1600px, WebP or JPEG at 0.82) and uploaded straight to Storage under `invitation-photos/<user id>/<random>.webp`. `NEXT_PUBLIC_SUPABASE_URL` must be set at build time: `next.config.ts` allows `next/image` to load only that bucket.
- `/dashboard/invitations/[id]/guests`: who is coming. Totals (invited, coming with the headcount, declined, awaiting), the list with filters, and a reminder helper that copies an editable message plus one guest's personal link at a time, for pasting into Viber (nothing is sent). Read-only: couples have no write access to RSVPs. It refetches when the tab regains focus. `/preview/guests` shows it with sample answers.
- `/i/[slug]`: published invitations for everyone; an unpublished one only for its owner (with a "Preview" ribbon), 404 for everyone else. The check runs in `generateMetadata`, which blocks for every client (`htmlLimitedBots` in `next.config.ts`), so the 404 is a real status code and link-preview bots get the tags in `<head>`.
- Link preview image: `/i/[slug]/og?v=<last edit>` (published only, cached publicly). `OG_OUT=<folder> npx vitest run src/lib/invitations/og.test.ts` writes sample images for a visual check; `/preview/og/full` serves one in dev (`?template=noir` for the dark card). The card follows the template's surface.
- Publishing waits for payment. In development (or builds with `STYLEGUIDE_ENABLED=true`) the editor shows a `DEV: mark as published` toggle.
- `e2e/editor.spec.ts` needs a seeded Supabase (`supabase start` and `supabase db reset`, or `.env.local`); without one those tests skip.

## Payments

The editor's **Pay and publish** creates a pending order and sends the couple to Dodo's hosted checkout. `/api/webhooks/dodo` verifies the signature and publishes the invitation in one database transaction, and `/dashboard/invitations/[id]/done` waits for that from the database. `?ref=CODE` on any page is kept in a cookie for 60 days and saved on the order. The flow, environment variables, review outcomes and an end-to-end test-mode walkthrough are in [docs/payments.md](docs/payments.md).

## Fonts

- Display: TBC Contractica CAPS (`assets/fonts/`). The TTFs are kept for OG images; pages load WOFF2 subsets (Latin + Georgian, about 25 KB each). To regenerate a subset:

  ```bash
  python -m fontTools.subset assets/fonts/TBCContracticaCAPS-Regular.ttf \
    --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201E,U+2022,U+2026,U+2039-203A,U+10D0-10FF,U+1C90-1CBF,U+2116,U+20BE" \
    --layout-features='*' --flavor=woff2 --output-file=assets/fonts/TBCContracticaCAPS-Regular.woff2
  ```

- Body and UI: Noto Sans Georgian via `next/font/google` (Georgian and Latin subsets).

Hero names are sized on the server from the display font's advance widths, so they fill the width without overflowing and without JS. Regenerate the width table if the font changes:

```bash
python scripts/build-display-metrics.py > src/lib/invitations/display-metrics.ts
```

Coverage of the display font: all 33 modern Georgian letters, Latin, digits. It has the lari sign (₾, kept in the subset). It lacks the archaic letters (U+10F1–10FA), most Mtavruli capitals and "№". Never apply `text-transform: uppercase` to Georgian.

## Copy

All Georgian text lives in `content/copy.ka.ts` and is a DRAFT pending native proofreading.
