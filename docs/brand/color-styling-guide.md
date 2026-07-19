# Sqoosh — Color Palette & Styling Guide

> **Ocean Calm**: teal + mint + sand on warm cream. Calm, playful, and **gender-neutral** —
> the brand sells stress relief to everyone (students, office workers, gamers, gift buyers),
> so the palette must never read as "for girls" or "for kids".
> This doc maps 1:1 to `src/styles/tokens.css` (already applied).
> Conversion-psychology levers carried over from the old brand are in §6.

---

## 1. Design direction

**Feel:** a calm wellness brand with a sense of humor. Sea-glass teals and mints, warm sand
neutrals, one confident teal for actions, an apricot accent for warmth, chubby rounded corners.
Think Calm/Headspace's serenity + a toy's friendliness — cute comes from the product mascots'
faces, not from gendered colors.

**Anti-goals:** pink-dominant candy look (previous palette — read as feminine), luxury serif
elegance (Zaya), neon chaos, dark patterns, badge soup.

## 2. Color palette (Ocean Calm) → `tokens.css` (applied)

```css
:root {
  /* Brand colours */
  --color-brand-primary:   #129488;  /* Calm teal — CTAs, links, active states */
  --color-brand-secondary: #0c7266;  /* Deep teal — hover states */
  --color-brand-accent:    #f2a65a;  /* Warm apricot — badges, highlights, "new" */
  --color-brand-blush:     #e3f4f1;  /* Aqua wash — soft section backgrounds
                                        (variable name kept for compatibility) */

  /* Surfaces */
  --color-surface:         #fbfaf6;  /* Warm off-white page background */
  --color-surface-raised:  #ffffff;
  --color-surface-overlay: #22333a;

  /* Text */
  --color-text-primary:    #26343a;  /* Deep slate */
  --color-text-secondary:  #5d6b70;
  --color-text-muted:      #97a5a8;
  --color-text-inverse:    #ffffff;

  /* Borders */
  --color-border:          #e5ece9;
  --color-border-strong:   #cfddd8;

  /* Status */
  --color-status-success:  #3f9e77;
  --color-status-warning:  #c98a2e;
  --color-status-error:    #d95f5f;
  --color-status-info:     #4a8fbd;

  /* Border radius — chubby (squishy feel) */
  --radius:    0.75rem;
  --radius-lg: 1.25rem;
}
```

**Supporting pastels** (used in generated product imagery; add as tokens only if needed):

| Wash | Hex | Use |
| --- | --- | --- |
| Aqua | `#e3f4f1` | `medium` tile tint, section washes (= `--color-brand-blush`) |
| Mint | `#e9f8f2` | `small` tile tint, success washes |
| Sky | `#e7f2fb` | `large` tile tint, calm-content sections |
| Sand | `#f7f0e3` | Warm neutral wash, promo bands, food-tag chips |
| Slate | `#eef0fa` | Glow-tag chips, alt washes |

Rules: washes are backgrounds/tints only; **teal is the only action color**; apricot is the
only accent. Never more accent than CTA. Product illustrations may use any color (a pink
axolotl is fine — it's true to the animal); the **UI chrome** stays in this palette.

## 3. Typography

| Role | Current (Zaya fonts) | Target (Sqoosh) | Notes |
| --- | --- | --- | --- |
| Display (`--font-display`) | Playfair Display (serif) | **Baloo 2** (rounded, chubby) | Headings, hero, card prices |
| Body (`--font-sans`) | Jost | **Nunito** (rounded sans) | Body, forms, admin |
| Arabic | fallback | **Baloo Bhaijaan 2** | Rounded Arabic matching Baloo 2 |

All Google Fonts (swap in `next/font` config in `src/app/layout.tsx` — still pending).
Rounded fonts are friendly without being gendered. Display 500–700, body 400–700.

## 4. Shape, depth & motion

- **Radius:** chubby everywhere (tokens above). Pills for category chips.
- **Shadows:** one soft ambient shadow on raised cards (`0 4px 16px rgb(38 52 58 / 0.06)`).
- **Motion (CSS-only, rule #7):** `animate-fade-up`, `animate-pop`, `stagger`. `animate-pop`
  is the signature squash-and-stretch on add-to-cart/favorites. Respect
  `prefers-reduced-motion` (global).
- **Imagery:** products on the pastel washes above; every hero SKU gets a squish video when
  real photos arrive. Mascot faces carry the cuteness; soft coral cheeks (`#f6b092`), never
  pink-heavy scenes.

## 5. Component notes

| Component | Style |
| --- | --- |
| Buttons | Primary = teal → deep-teal hover; pill radius for primary CTAs |
| Badges | "New" = apricot · "Sale" = teal · "Glow 🌙" = slate wash · "Slow-rising" = sand wash |
| Category pills | Small = mint · Medium = aqua · Large = sky, slate text; theme tag chips as filters |
| Announcement bar | Aqua wash bg, slate text, rotating (settings-driven) |
| Skeletons | Unchanged compositions; inherit tokens |
| Empty states / 404 | Mascot blob ("Sqooshy") + playful copy |

## 6. Conversion psychology carried over

1. **One primary CTA per viewport** — teal.
2. **Anchoring** — `compareAtPrice` strikethrough near the price; charm points
   (95/145/195/245); sale badge sits at the price.
3. **Goal gradient** — free-shipping progress bar (500 EGP threshold); unlocked state in
   success green.
4. **Social proof** — stars + review count near title; UGC wall behind `social_proof`.
5. **Honest urgency only** — real stock, real drop dates; no fake timers.
6. **Thumb-zone mobile CTAs** — sticky buy bar (shipped).
7. **Trust facts near buy action** — COD · free shipping over 500 · squeeze-tested quality.

## 7. Accessibility

- Teal `#129488` on white ≈ 3.9:1 — fine for large/bold text and UI components; body text is
  always slate on light surfaces, never teal.
- White bold 16px+ labels on teal buttons pass WCAG for large text; if an audit flags them,
  darken primary toward `#0e7d73`.
- Icon buttons keep `aria-label`; forms keep real `<label>`s (rule #5).
