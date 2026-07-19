# Monday drop ritual

Ops checklist so marketing can refresh the storefront in under 10 minutes
**without a deploy**. Uses the homepage builder + media library only.

Flags stay as configured (`homepage_builder` ON; `social_proof` / `bundles` /
`preorders` only when already validated in a safe environment).

---

## Before you start (~1 min)

1. Open **/admin/media** — upload the week’s hero / promo stills (WebP via the
   library pipeline). Note the URL for each asset after upload.
2. Open **/admin/homepage** — confirm the active hero + any collection / promo
   blocks you will touch.

---

## Hero swap (~3 min)

1. Edit the **Hero** block.
2. Click **Media** next to Image URL → pick the new hero still (saves the **URL**,
   not a media ID).
3. Confirm dual CTAs:
   - Primary: **Shop New In** → `/shop?sort=newest`
   - Secondary: **Best Sellers** → `/shop?sort=best-selling`
4. Save. Spot-check `/` on the storefront.

## Vibe / collection tiles (~3 min)

1. For each **Collection** block: set `categorySlug` to a size category
   (`small`, `medium`, `large` — see `docs/brand/catalog-categories-sourcing.md`)
   and refresh title/description copy around the week’s theme (themes are tags, not
   categories).
2. Optional: swap a **Featured** block’s product IDs to the week’s hero SKUs
   (catalog IDs only — never paste prices).

## Promo / bundles (~2 min)

1. Edit or add a **Promo** block (Media for image URL).
2. If `bundles` is **ON** and you want a deal push: CTA href = `/bundles`
   (storefront hides that CTA when the flag is off).
3. Otherwise point CTA at `/shop` or a category path.

## Announcements (optional)

1. **/admin/settings** → announcement rows (max 5 active).
2. Keep free-shipping copy in sync with the live threshold; UTMs on `href` are fine.

## Social proof (only if flag ON)

1. Confirm Instagram handle + post HTTPS URLs in settings.
2. Homepage already gates the section behind `social_proof` — no new block type.

---

## Done when

- [ ] Homepage hero image + CTAs match the week’s drop
- [ ] Collection / featured blocks reflect the vibe
- [ ] Promo CTA is correct (and `/bundles` only when bundles is ON)
- [ ] Quick mobile check of `/` and one shop deep-link (`?sort=newest`)
