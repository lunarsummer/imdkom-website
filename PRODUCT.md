# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS + vanilla ES-module JavaScript. No framework. Tailwind v4 (`output.css`) from `public/assets/css/input.css` via `npm run build`. Firestore (public read of the component catalog, write admin-only). Page ships as `public/rakit-komputer.html`; data is read from Firestore collection `pc_components`; build state persists to `localStorage`; lead handoff is a WhatsApp `wa.me/6285601913435` deep link and an inline-print popup. Hosted on Netlify (public site).

## Users

Primary (all confirmed): Indonesian audience 15–35 who want to compose a PC spec — gaming and content-creation aspirants, office/school users needing a reliable work machine, and enthusiasts who enjoy configuring their own rig. They are non-adjacent-buyers (not on-shore e-commerce shoppers); they think in "kebutuhan & budget", not SKU.

## Product Purpose

Help anyone compose a compatible PC specification matched to actual need in minutes, for free, without installing anything. It exists as IMDKOM's lead magnet: a visitor who completes (or fails) a build has already built trust in IMDKOM, and the natural next step — having the shop assemble it at the workshop — happens over WhatsApp. This is a funnel asset, not an e-commerce storefront.

## Positioning

Kursus + rakit satu tempat. IMDKOM is the workshop, not a warehouse: hands-on learning and hands-on assembly under the same roof, with technician guidance over WhatsApp and a 2-month service warranty on work performed. This combination is the positioning claim a neighboring product cannot truthfully copy; it is also the anchor for any persuasion copy on the page.

## Operating Context

- Workshop physical location: Yogyakarta (Jl. Langenastran Kidul area, refer to /kontak). Visitors can self-serve at the bench or ship components in; assembly is also offered as a drop-off with a 2-month service warranty (`service.html`).
- Mentor-this-build is performed by the same active practitioners who teach the courses (`kursus.html`).
- Visitors arrive via search keywords like "rakit komputer Jogja", referrals, and the website footer/sticky-float WhatsApp button.
- English language mixing exists in the product name ("PC Builder Interaktif"); Indonesian is the body language and voice of new sections.
- Only Firebase is the data layer; analytics currently do not exist on the page (no gtag event is emitted for builds).

## Capabilities and Constraints

- `pc_components` is the source of truth for components; `aktif == true` filter applied client-side after a Firestore query (`orderBy order ASC`, `limit 200`). Shape: `{ id, kategori (cpu|mainboard|ram|storage|vga|psu|casing), nama, brand, spesifikasi { … }, aktif, order }`. Tiers (`spesifikasi.tier`) exist only for Intel Gen-14 and Ryzen 9000 CPUs (admin-backfilled via `migrate-tiers-*.html`); no prices exist anywhere.
- Compatibility evaluated client-side: socket match (CPU↔mainboard), RAM type (mainboard↔RAM), storage interface support, VGA length vs casing max, PSU wattage headroom (≈1.3×). Use-case guide cascades constraints per category.
- Persistence is `localStorage["imdkom_pc_build"]` (ids only). Cold-load restore is not revalidated against `aktif:false` (known bug to fix in this redesign).
- Print/PDF path opens a popup document with inline styles; the popup uses `window.print()` and an external QR generator (`api.qrserver.com`).
- WhatsApp is the only lead capture channel; the hard-coded number is `6285601913435`.
- No analytics / events / conversion tracking; no lead table exists in Firestore for builds.
- Brand/mobile chrome (inline navbar markup, rich footer `.kursus-footer`, floating WhatsApp button `#floatingWhatsApp`) is inherited from the shared public theme and must not be forked on this page.

## Brand Commitments

Black (`#0d0d0d`/`#000000`), white `#ffffff`, safety yellow `#FFAB00`; `Bebas Neue` for display headings, `Space Grotesk` for interactive/label type, `Poppins`+`Inter` for body, `Anton` available but not preferred for new sections. Logo mark `assets/images/logo/imd.svg`. IMDKOM self-positions as a workshop/learning center, not a marketplace: tone should be workshop-direct, confident, uncluttered, polite Indonesian. The page interior is allowed a distinct new world; nav and footer are shared chrome and remain visually identical to the rest of the site.

## Evidence on Hand

- `public/service.html` — 2-month service warranty (fact under public warranty); workshop services black/yellow world; gallery (340×340 items).
- `public/kursus.html` — teaching offered in vocational/private & regular formats; kurikulum Microsoft Office→desain→pemrograman; mentor-practitioner positioning; "GALERI" Bebas Neue display.
- `public/kontak.html` — WA 0856-0191-3435, IG `@imdkom_yk`, Yogyakarta address.
- `public/assets/images/hero/hero-default.png` — used across the site as OG image/fallback.
- `public/index.html` settings include `/assets/images/logo/imd.svg` and brand copy.
- No testimonials, no device-count, no partner logos, no pricing — **do not invent these on the page**.

## Product Principles

1. **Help first, sell second.** The tool must be genuinely useful to a visitor even if they never buy from IMDKOM; every decision trends to clarity and zero friction in reaching a valid spec.
2. **No fake proof.** Claims on this page are only those IMDKOM makes publicly elsewhere (garansi 2 bulan, praktisi aktif/kursus+rakit, workshop Jogja, WA direct). No invented stats, logos, prices, or testimonials.
3. **Programmatic rigor over marketing soup.** Compatibility filtering, use-case guidance, and a printable deliverable are the product — copy and visuals exist to make that machine legible and fast.
4. **Lead, don't close.** The end state is a trusted IMDKOM brand and a WhatsApp message; the conversion question is "does the visitor reach for the phone?", not "was a SKU sold?".
5. **One cohesive working chrome.** Nav, rich footer, and floating WhatsApp are shared across public pages and remain unchanged on this page; visual energy belongs inside the page body only.

## Accessibility & Inclusion

Commit to WCAG AA on body text and interactive controls; keyboard can operate every step/tier/filter via focus-visible ring; reduced-motion paths respected for decorative pulses/marquees; 44px minimum target size on coarse pointers; no color-only signaling (icons + text with every state); `prefers-reduced-motion` honored for any decorative motion; skeletons and step progress are announced via `aria-live` regions where practical.
