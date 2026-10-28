# Brindo: Design Direction

Brindo (from the Spanish word for "I toast") is the moment just before everyone raises a glass: anticipation, warmth, light. Every screen should feel like that moment.

The goal is **premium, sleek and luminous**. Premium here means restraint, space and precision, not decoration. "Luminous" means light is the main material: soft glows, light that sweeps across type, airy space, an uplifting mood.

## What it must never look like

Template-site clichés: clip-art hearts, emoji, stock illustrations, script fonts everywhere, glitter or confetti, purple-blue gradients, gold-gradient text, heavy drop shadows, skeuomorphic envelopes with flaps, carousels of stock couples, cluttered sections. If a choice feels like a Canva wedding template, change it.

## Principles

1. **Light is the material.** Soft radial halos, a single light sweep over key type, warm highlights. No hard shadows. Elevation is expressed by glow and hairlines, not by drop shadows.
2. **Restraint.** One accent color. Hairline (1px) borders. Generous whitespace. One idea per screen section.
3. **Typographic confidence.** Large display type, wide tracking on small labels, strong contrast between sizes. Type does most of the design work.
4. **Motion with meaning.** Slow, eased, purposeful. One signature moment per experience (see "The Toast"). Everything else is quiet.
5. **Phone first, speed is luxury.** Most guests open links inside Viber, Messenger or WhatsApp on mid-range phones. Fast, smooth, no jank. A slow page is not premium.
6. **Georgian is first-class.** Design and test with real Georgian text from the start. The Georgian script has no real uppercase/lowercase, so hierarchy comes from size, weight, spacing and color, never from case.

## Color tokens

Define as CSS variables, expose in the Tailwind theme. Names are fixed; hex values are the starting point and must be adjusted if a contrast check fails.

| Token | Value | Use |
|---|---|---|
| `--ivory` | #FAF6EF | Light background |
| `--paper` | #F3ECE0 | Raised surfaces on light |
| `--ink` | #14110F | Text on light, dark background |
| `--graphite` | #2A2622 | Raised surfaces on dark |
| `--champagne` | #D9BC84 | Accent: hairlines, glows, ornaments, large type on dark |
| `--champagne-deep` | #8A6A2F | Small accent text on light (verify AA) |
| `--rose-glow` | #E8CFC4 | Secondary glow only, never text |
| `--muted` | #6B635A | Secondary text on light |
| `--muted-dark` | #A89F93 | Secondary text on dark |
| `--hairline` | ink at 12% opacity (light), ivory at 14% (dark) | 1px borders and dividers |

Rules:
- Champagne is for ornament and large display type on dark. It fails contrast as small text on ivory; use `--champagne-deep` or ink for small text on light.
- Verify WCAG AA (4.5:1 body, 3:1 large text) for every text/background pair. Write a small script that checks the token pairs and fails the build if any pair is under the threshold.
- The halo: `radial-gradient(60% 50% at 50% 0%, rgba(217,188,132,0.35), transparent 70%)`. Use pre-rendered gradients, **not** large CSS blur filters or `backdrop-filter`; those janks on low-end Android.
- Grain: a static, tiny SVG noise overlay at 3 to 4% opacity on large surfaces for a paper feel. Never animated.

## Typography

- **Display:** the custom font in `/assets/fonts/`, used for names, headings, big numerals. Confirm it has full Georgian coverage; if a glyph is missing, stop and tell me.
- **UI and body:** a Georgian-capable humanist sans loaded with `next/font` (Noto Sans Georgian or a comparable font that supports both Georgian and Latin). 
- **Labels:** small Latin or Georgian labels at 11 to 12px with wide letter-spacing (0.2 to 0.24em) and medium weight. **Never apply `text-transform: uppercase` to Georgian text** (it can convert to Mtavruli capitals that the font may not have). Uppercase is allowed only on Latin-only strings.
- **Scale (fluid, with clamp):** display 56 to 120px, h2 32 to 56px, h3 22 to 28px, body 17 to 18px, label 11 to 12px. Line-height: display 1.0 to 1.1, body 1.6 to 1.7 (Georgian needs generous line height).
- Tabular numerals for dates and countdowns.
- Never fake bold or italic: if the custom font lacks a weight, don't synthesize it (`font-synthesis: none`).

## Spacing, shape, icons

- 8px grid. Section vertical rhythm on mobile: 96 to 128px; on desktop 144 to 200px.
- Radius: 2px for cards and inputs, full pill for primary buttons. No in-between radii.
- Borders are 1px hairlines. Shadows are glows (champagne at low opacity), never gray drop shadows.
- Icons: thin line icons, 1.25px stroke (lucide-react). No filled icons, no emoji.
- Ornament: a hairline divider with a small centered ring or diamond. That is the only decorative element.

## Logo

Lowercase wordmark "brindo" in the display font, converted to SVG outlines. The dot of the "i" is replaced by a small champagne circle, a rising bubble, which on hover rises 3px and eases back. Provide light and dark versions and a monogram (the "b" with the bubble). 

## Motion system

- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (soft deceleration) for entrances. Linear only for continuous drifts.
- Durations: micro 160 to 240ms, reveals 700 to 1100ms, ambient drifts 12 to 20s.
- Animate **only `transform` and `opacity`** (and clip-path/mask for text reveals). Never animate layout properties.
- Stagger 60 to 120ms between siblings.
- Use the `motion` library (the successor to Framer Motion) or CSS. Keep invitation-page JavaScript lean (see budgets).
- Respect `prefers-reduced-motion`: replace movement with simple fades and disable parallax and the particle effect.
- Scroll reveals fire once. Parallax is limited to ±6% on one photo.

### Patterns
- **Unveil (hero load):** names appear line by line, each line translating from 100% to 0 inside a clipped mask (1.1s), staggered 120ms. The halo fades in over 1.6s. After 400ms, a single soft light sweep crosses the names once (a masked gradient moving left to right over 1.8s) and never repeats.
- **Reveal on scroll:** opacity 0 to 1 and translateY 24px to 0, 800ms.
- **Buttons:** on press, scale 0.98. On hover (pointer devices only), a faint light sweep across the surface.
- **Inputs:** underline style. The underline draws from the left in champagne on focus. Labels float up.

### The Toast (the signature moment)
Triggered when a guest confirms attendance ("Yes"). This is the brand's one theatrical moment, so it must be beautiful and short (about 2.5 seconds), and it must run smoothly on a cheap phone.

1. The screen dims slightly to ink.
2. Two thin champagne line-drawn glasses (SVG, stroke drawn on over 500ms) rise, tilt toward each other and meet. At the touch, a soft circular light burst expands and fades (transform and opacity only).
3. Up to 40 tiny bubbles rise from the glasses (one canvas element or CSS, 60 particles max, capped at 30fps, paused when the tab is hidden).
4. Text fades in: a short warm line in Georgian ("გელოდებით!" style, final copy to be proofread), and the guest's name.
5. A short vibration (`navigator.vibrate(12)`) where supported. No sound.
6. A "Done" action dismisses it. The effect never loops.

For "No": no celebration. A quiet fade, a gentle, respectful line of thanks, and the guest can change their answer later.

## Invitation templates

Both templates render from the same structured content (names, date, time, venue, message, photo, program) and share a section order: Hero, Message, Date and Countdown, Venue, Program, Photo, RSVP, Footer.

### Template 1: Lumière (light)
Ivory background with paper-colored raised surfaces, ink text, champagne hairlines. Names are huge and stacked in the display font, with a small "&" in champagne between. A slow-drifting halo sits behind the hero. Wide margins, a lot of air. The photo is full-bleed with soft parallax and a hairline frame inset 16px. Tone: morning light in a gallery.

### Template 2: Noir (dark)
Ink background, graphite surfaces, champagne type and linework, a moonlit halo from the top. Slower and more dramatic motion. The names are in flat champagne (no gradient text) with the single light sweep. Tone: a candlelit dinner.

### Shared details
- Date shown as large numerals with the month and weekday as small labels, plus a countdown (days, hours, minutes, seconds in tabular numerals), computed in the event's timezone (Asia/Tbilisi), safe for hydration.
- Venue: name, address, two buttons: "Google Maps" and "Apple Maps" (universal links). 
- "Add to calendar" button that downloads a valid .ics file.
- Program as a vertical hairline timeline with times in tabular numerals.
- RSVP section is the visual climax: generous space, large Yes and No choices, party-size stepper with 48px targets.
- Footer: a quiet "Made with Brindo" wordmark linking to the marketing site (with the referral code if the couple has one).

## Marketing site (Georgian)

Editorial, wide, calm. A hero with a live Lumière invitation inside a minimal phone frame (the real component, not a screenshot), a large headline, one primary button. Then: how it works in 3 steps, template gallery, "why Brindo" in 3 points, one pricing card (49 GEL, one-time), FAQ, final call to action. Copy is short, warm and confident; sentences are short. All Georgian copy lives in one file (`content/copy.ka.ts`), marked DRAFT, for proofreading by a native speaker.

## Performance budgets (invitation pages)

- LCP under 2.0s on a mid-range Android over 4G; CLS under 0.05.
- Initial JavaScript for `/i/[slug]` under 150KB gzipped. Server-render everything possible; only the countdown, RSVP form and reveal logic are client components.
- Fonts: subset to Georgian and Latin, WOFF2, preloaded, `font-display: swap` with a metric-matched fallback to avoid layout shift. A TTF copy is kept for OG image generation.
- Images: `next/image`, AVIF or WebP, blur placeholders, uploads resized client-side to at most 1600px.
- No autoplay video. No large blur filters. One ambient animation at a time.

## Accessibility

AA contrast, visible focus rings (2px champagne-deep or ink offset), tap targets at least 44px, `lang="ka"` on the document, meaningful alt text, full keyboard operation, reduced-motion support, and form errors announced to screen readers.
