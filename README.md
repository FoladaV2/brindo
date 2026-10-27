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

`/styleguide` shows every token and component on light and dark surfaces with real Georgian text. It is `noindex`, and in production it returns 404 unless the build ran with `STYLEGUIDE_ENABLED=true`.

## Fonts

- Display: TBC Contractica CAPS (`assets/fonts/`). The TTFs are kept for OG images; pages load WOFF2 subsets (Latin + Georgian, about 25 KB each). To regenerate a subset:

  ```bash
  python -m fontTools.subset assets/fonts/TBCContracticaCAPS-Regular.ttf \
    --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201E,U+2022,U+2026,U+2039-203A,U+10D0-10FF,U+1C90-1CBF,U+2116" \
    --layout-features='*' --flavor=woff2 --output-file=assets/fonts/TBCContracticaCAPS-Regular.woff2
  ```

- Body and UI: Noto Sans Georgian via `next/font/google` (Georgian and Latin subsets).

Coverage of the display font: all 33 modern Georgian letters, Latin, digits. It lacks the archaic letters (U+10F1–10FA), most Mtavruli capitals and "№". Never apply `text-transform: uppercase` to Georgian.

## Copy

All Georgian text lives in `content/copy.ka.ts` and is a DRAFT pending native proofreading.
