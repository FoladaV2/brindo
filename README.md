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
- Previews (same flag as the styleguide): `/preview/lumiere` (long names, long address, full message, photo, program, opened by a guest) and `/preview/lumiere/short` (short names, no photo or program, no guest). `.ics` files: `/preview/calendar/full.ics`, `/preview/calendar/short.ics`.
- Client components in templates get their strings as props and never import `content/copy.ka.ts`, so the invitation page doesn't download the whole copy file.

## Couples' editor and public pages

- `/dashboard`: the couple's invitations. `/dashboard/invitations/new` asks for the names (they make the link), then opens the editor at `/dashboard/invitations/[id]/edit`.
- The editor autosaves drafts (debounced) through the `saveDraft` server action. Drafts are checked with `invitationDraftSchema` (fields may be empty); the full `invitationContentSchema` decides what is complete. The live preview is `/dashboard/invitations/[id]/frame` in an iframe, updated by `postMessage`.
- Photos are resized in the browser (at most 1600px, WebP or JPEG at 0.82) and uploaded straight to Storage under `invitation-photos/<user id>/<random>.webp`. `NEXT_PUBLIC_SUPABASE_URL` must be set at build time: `next.config.ts` allows `next/image` to load only that bucket.
- `/i/[slug]`: published invitations for everyone; an unpublished one only for its owner (with a "Preview" ribbon), 404 for everyone else. The check runs in `generateMetadata`, which blocks for every client (`htmlLimitedBots` in `next.config.ts`), so the 404 is a real status code and link-preview bots get the tags in `<head>`.
- Link preview image: `/i/[slug]/og?v=<last edit>` (published only, cached publicly). `OG_OUT=<folder> npx vitest run src/lib/invitations/og.test.ts` writes sample images for a visual check; `/preview/og/full` serves one in dev.
- Publishing waits for payment. In development (or builds with `STYLEGUIDE_ENABLED=true`) the editor shows a `DEV: mark as published` toggle.
- `e2e/editor.spec.ts` needs a seeded Supabase (`supabase start` and `supabase db reset`, or `.env.local`); without one those tests skip.

## Payments

The editor's **Pay and publish** creates a pending order and sends the couple to Dodo's hosted checkout. `/api/webhooks/dodo` verifies the signature and publishes the invitation in one database transaction, and `/dashboard/invitations/[id]/done` waits for that from the database. `?ref=CODE` on any page is kept in a cookie for 60 days and saved on the order. The flow, environment variables, review outcomes and an end-to-end test-mode walkthrough are in [docs/payments.md](docs/payments.md).

## Fonts

- Display: TBC Contractica CAPS (`assets/fonts/`). The TTFs are kept for OG images; pages load WOFF2 subsets (Latin + Georgian, about 25 KB each). To regenerate a subset:

  ```bash
  python -m fontTools.subset assets/fonts/TBCContracticaCAPS-Regular.ttf \
    --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201E,U+2022,U+2026,U+2039-203A,U+10D0-10FF,U+1C90-1CBF,U+2116" \
    --layout-features='*' --flavor=woff2 --output-file=assets/fonts/TBCContracticaCAPS-Regular.woff2
  ```

- Body and UI: Noto Sans Georgian via `next/font/google` (Georgian and Latin subsets).

Hero names are sized on the server from the display font's advance widths, so they fill the width without overflowing and without JS. Regenerate the width table if the font changes:

```bash
python scripts/build-display-metrics.py > src/lib/invitations/display-metrics.ts
```

Coverage of the display font: all 33 modern Georgian letters, Latin, digits. It lacks the archaic letters (U+10F1–10FA), most Mtavruli capitals and "№". Never apply `text-transform: uppercase` to Georgian.

## Copy

All Georgian text lives in `content/copy.ka.ts` and is a DRAFT pending native proofreading.
