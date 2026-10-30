# Brindo: Design Direction

Brindo means "I toast". The brand is the clink: the second when glasses meet and everyone in the room is together. It is for every kind of event, from a wedding to a fifth birthday to a company dinner, so it must feel celebratory without belonging to any one occasion.

The goal is **premium, confident and effortless**. Premium here means three colors used with discipline, big precise type, generous space, and interactions that feel expensive: smooth, quick, exact. Effortless means a host understands every screen in two seconds and a guest answers in one tap.

## What it must never look like

Template-site clichés: clip-art hearts, emoji, stock illustrations, stock photos of people, script fonts, glitter or confetti, rainbow or purple-blue gradients, gradient text, heavy gray drop shadows, skeuomorphic envelopes, cluttered sections, cards inside cards inside cards. Also not a generic SaaS page: no meaningless 3D blobs, no fake dashboards, no walls of icons in circles. If a choice feels like a Canva template or a startup template, change it.

## Principles

1. **Three colors, used with discipline.** Bone for background, onyx for text, wine for buttons and the brand mark. Everything else is a tint of one of the three. Wine is precious: it marks the one thing to do on a screen.
2. **Type does the work.** Large display headlines, strong size contrast, short lines. Hierarchy comes from size, weight and color, never from case.
3. **Space is the luxury.** One idea per section. Generous padding. Nothing touches.
4. **Motion with meaning.** Quick, eased, purposeful. Things respond to the finger immediately. One signature moment per experience.
5. **Phone first, speed is luxury.** Most hosts and guests are on mid-range Android phones inside Viber, Messenger or WhatsApp. A slow page is not premium.
6. **Georgian is first-class.** Design and test with real Georgian text. The Georgian script has no real case, so `text-transform: uppercase` is never used on Georgian text.

## Color

The brand palette is exactly three colors. Defined in `src/styles/brand.css`, exposed to Tailwind and shadcn/ui under their standard names.

| Token | Value | Use |
|---|---|---|
| `--bone` | #F6F1EA | Background |
| `--onyx` | #1A1414 | Text, inverted section background |
| `--wine` | #7A1F2B | Primary buttons, brand mark, links, focus, selection, errors |

Tints (no new hues; each is one of the three mixed with transparency, with another of the three, or lifted with white):

| Token | Value | Derived from | Use |
|---|---|---|---|
| `--lift` | #FBF9F7 | bone lifted 40% toward white | Cards, inputs, popovers |
| `--sunken` | #EDE8E1 | onyx 4% over bone | Secondary surfaces, hover fills |
| `--onyx-muted` | #696461 | onyx 64% over bone | Secondary text (5.2:1) |
| `--line` | #E0DBD5 | onyx 10% over bone | Dividers, card borders (decorative only) |
| `--stroke` | #88837F | onyx 50% over bone | Input and checkbox borders (3.3:1, WCAG 1.4.11) |
| `--wine-tint` | #EDE0DB | wine 8% over bone | Selected rows, badges, soft highlights |
| `--wine-press` | #621C25 | wine with onyx | Primary button hover and press |
| `--bone-muted` | #A7A19D | bone 64% over onyx | Secondary text on inverted sections (7.1:1) |
| `--bone-line` | #393332 | bone 14% over onyx | Dividers on inverted sections |

Rules:
- One wine button per view. Secondary actions are outline or ghost.
- Inverted sections (onyx background, bone text) are allowed for emphasis: footer, final call to action, the pricing card. On onyx, primary buttons are bone with onyx text; wine is not used on onyx (1.8:1).
- Errors use wine plus an icon and text; color alone never carries meaning.
- Every text/background pair is checked by `npm run check:contrast`, which fails under WCAG AA.
- Templates have their own palettes (see "Invitation templates") and are exempt from the three-color rule.

## Typography

- **One typeface:** TBC Contractica CAPS from `/assets/fonts/` (Regular, Medium, Bold), loaded with `next/font/local`, for everything: headlines, body, UI, the dashboard, invitations and OG images. No second family.
- **Scale (fluid, clamp):** hero 44 to 80px, h2 32 to 60px, h3 20 to 26px, body 16 to 18px, small 14px, eyebrow 13px. Line-height: display 1.05 to 1.1, body 1.6 (Georgian needs room).
- **Eyebrow:** 13px medium, wine, sentence case, preceded by a 6px wine dot. Never uppercase.
- Tabular numerals for dates, prices, counts and countdowns.
- `font-synthesis: none`: never fake bold or italic.

## Shape, depth, icons

- 4px base grid; spacing in multiples of 4. Section rhythm: 96px on phones, 160px on desktop.
- Radius: buttons and chips are pills; inputs 14px; cards 24px; dialogs and sheets 28px; the phone mockup 44px.
- Borders: 1px. `--line` for decoration, `--stroke` for form controls.
- Depth: surfaces are separated by tint and line first. A soft onyx-tinted shadow is allowed only on floating layers (sticky navbar after scroll, menus, popovers, dialogs, toasts, the phone mockup). No gray drop shadows on cards or text.
- Light: a soft radial wine glow (wine at 6 to 12% opacity, pre-rendered radial gradient) may sit behind a hero or a key visual. No blur filters on large areas; `backdrop-filter` only on the navbar.
- Grid backdrop (home page hero, pricing card, final call to action): onyx hairlines at 7% (bone on onyx) fading out from the middle, and a few cells that slowly fill with a wine tint and fade again (opacity only, still under reduced motion). Adapted from Aceternity UI's grid background and Magic UI's animated grid pattern. Not on every section.
- Icons: lucide-react, 1.5px stroke, 20px default. No filled icons, no emoji, no icons inside colored circles.

## Logo

Mark: the clink. Two glass rims (outline circles) that just touch, with one small wine bubble rising from the point of contact. Wordmark: lowercase "brindo" from the display font's outlines in onyx (bone on dark), with the dot of the "i" in wine, the same bubble. Lockup: mark left, wordmark right. The mark on a wine tile (bone rims, bone bubble) is the favicon and app icon. On hover, the rims press 1px together and the bubble rises 2px.

## Components

shadcn/ui (Radix primitives) is the base, restyled to the tokens above. Components adapted from Aceternity UI and 21st.dev are allowed on the marketing site when they serve a section and follow the rules here (three colors, transform/opacity motion, reduced motion, phone performance). Nothing is used as shipped; every component is restyled.

- **Button:** pill. Sizes 40, 48 (default), 56px (hero). Primary wine with a hairline inner top highlight; hover darkens to `--wine-press`; press scales to 0.98. Optional trailing arrow that nudges 2px on hover. Secondary: 1px onyx 20% outline. Ghost: no border, `--sunken` on hover. Inverted: bone on onyx.
- **Input / textarea / select:** 52px tall, 14px radius, `--lift` fill, 1px `--stroke` border, label above (14px medium), hint below (muted). Focus: wine border plus a 3px wine ring at 20%. Error: wine border, icon and message, announced via `aria-describedby`.
- **Choice cards** (onboarding answers, RSVP buttons): large tappable cards with a label and optional hint; selected state uses `--wine-tint` fill and a wine border.
- **Cards:** `--lift`, 1px `--line`, 24px radius, 24 to 32px padding. Never nested.
- **Dashboard shell:** left sidebar (264px) on desktop with the logo, navigation, a primary "create event" button, and the account at the bottom. On phones, a fixed bottom bar (64px plus safe area) with 3 to 4 items and a central create button.
- **Toasts:** sonner, bottom center on phones, bottom right on desktop.

## Motion system

- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` for entrances and transitions; linear only for continuous drifts (marquees).
- Durations: micro 150 to 220ms, UI transitions 250 to 350ms, section reveals 600 to 800ms.
- Animate **only `transform` and `opacity`** (and clip-path/mask for text reveals). Never width, height, top, left or color transitions on large areas. Accordions open without animating height.
- Stagger 60 to 90ms between siblings. Scroll reveals fire once.
- Use the `motion` library or CSS.
- Respect `prefers-reduced-motion`: movement becomes a simple fade; marquees stop; parallax and particles are off.
- **Signature moment (marketing):** in the hero, the two circles of the mark drift together and touch, and a soft wine glow blooms from the point of contact, once.
- **Signature moment (guests):** the Toast on the invitation page when a guest answers "მოვდივარ" (see templates).

## Marketing site (Georgian)

Section order: navbar, hero, problem, how it works (3 steps with visuals), event types, live demo (a real template in a phone mockup), testimonials, pricing, FAQ, final call to action, footer.

- **Navbar:** logo, 3 to 4 anchor links, "შესვლა" (ghost) and one wine button. Transparent at the top; after scrolling it becomes a floating pill with `--lift` at 85% and a light backdrop blur. On phones, a menu button opens a full-height sheet.
- **Hero:** a short, concrete headline about the outcome (one link, everyone answers, you see who is coming), a one-sentence subline, one wine button, and a trust line under it. Right side (below on phones): the product in a phone mockup with a live answers counter. The rating line appears under the button only when real reviews exist (see SPEC.md).
- Copy is short, warm and confident. All Georgian copy lives in `content/copy.ka.ts`, marked DRAFT, for proofreading by a native speaker.

## Invitation templates

Templates are the product guests see; they keep their own palettes and are not bound by the three-color brand rule. Their tokens live in `src/styles/template-tokens.css` and their kit in `src/templates/ui/`.

An invitation is **one card, not a long page**. A guest sees what is happening, when, where and the other details, then answers. Two parts, rendered from the same structured content:

- **Poster:** the event-type kicker, the title as large as the poster allows (sized on the server from the font's advance widths, so no word overflows), the date line, and the photo.
- **Panel:** When (big day numeral, month, weekday and time, Add to calendar), Where (venue, address, Google Maps and Apple Maps) and the dress code; the host's message beside the program; then the RSVP card and a quiet footer.

On phones they stack: the poster, then the panel, about two screens for the fullest invitation. From 1024px they sit side by side (poster 42%, panel 58%) and fill the screen: the page never scrolls, the RSVP card is pinned to the bottom of the panel, and the details above it scroll on their own only if a host wrote a lot (a soft fade at their edge shows there is more).

### Template 1: Lumière (light)
Ivory panel; the poster is a paper card with a champagne hairline and a second hairline inset 5px. The photo sits in an arched window outlined in champagne. Ink type, champagne details. Tone: morning light in a gallery.

### Template 2: Noir (dark)
Ink background, graphite RSVP card, champagne type and hairlines. The photo fills the poster under a wash of ink that holds the title; on desktop it melts into the panel on its right edge. Without a photo, a moonlit halo from the top. The title is flat champagne (no gradient text) with one slow light sweep. Tone: a candlelit dinner.

### Shared details
- Dates are wall-clock times in Asia/Tbilisi. No countdown.
- Venue: name, address, two links: "Google Maps" and "Apple Maps" (universal links that open the app if installed).
- "Add to calendar" link that downloads a valid .ics file.
- Program as a compact list with times in tabular numerals.
- RSVP card: first name and surname side by side, a party-size stepper with 48px targets (how many of you, family included), and two buttons side by side, მოვდივარ and არ მოვდივარ. A guest who is not coming still gives their name. In a wide card the names and the stepper share one row.
- **The Toast:** when a guest answers "მოვდივარ", two line-drawn glasses rise, tilt and meet; a soft light burst and up to 40 rising bubbles (canvas, 30fps cap, paused when hidden); a warm line and the guest's name; `navigator.vibrate(12)` where supported; about 2.5 seconds; never loops. For "არ მოვდივარ": a quiet fade and a gentle line of thanks. Either way the guest can change their answer.
- Footer: a quiet "Made with Brindo" wordmark linking to the marketing site (with the referral code if there is one).

## Performance budgets

- Invitation pages: LCP under 2.0s on a mid-range Android over 4G; CLS under 0.05; initial JavaScript for `/i/[slug]` under 150KB gzipped. Server-render everything possible.
- Marketing home page: LCP under 2.5s on the same phone; heavy visuals are lazy and below the fold.
- Fonts: subset to Georgian and Latin, WOFF2, `font-display: swap` with a metric-matched fallback. TTF copies are kept for OG images.
- Images: `next/image`, AVIF or WebP, uploads resized client-side to at most 1600px.
- No autoplay video. No large blur filters. One ambient animation at a time.

## Accessibility

AA contrast, visible focus rings (2px wine with offset; bone on onyx), tap targets at least 44px, `lang="ka"` on the document, meaningful alt text, full keyboard operation, reduced-motion support, and form errors announced to screen readers.
