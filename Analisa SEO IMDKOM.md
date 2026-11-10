# Analisa & Perbaikan SEO — imdkomyogyakarta.netlify.app

Dibuat: 10 November 2026
Cakupan: review pasif halaman publik + file statis (HTML, header, robots.txt, sitemap.xml, asset).
Bukan hasil audit crawl tools berlisensi atau Google Search Console Anda.

---

## 1. Ringkasan eksekutif

Situs ini sudah punya fondasi SEO dasar: `robots.txt`, `sitemap.xml`, title & description di semua halaman utama, satu `<h1>` di hampir semua halaman, `lang="id"`, HTTPS, dan konten lokal yang jelas (kursus + service komputer di Yogyakarta).

Tetapi ada masalah penting yang menghambat ranking:

1. **Duplicate URL**: halaman yang sama bisa diakses via `/kursus` dan `/kursus.html` (keduanya 200 tanpa canonical/redirect).
2. **Tidak ada canonical** di semua halaman.
3. **Tidak ada structured data / JSON-LD** sama sekali (LocalBusiness, Course, Service, FAQPage, BreadcrumbList).
4. **Hero image 3,1 MB (PNG)** dipakai di halaman — membunuh LCP/Core Web Vitals. Padahal versi JPG 46 KB sudah ada.
5. **Homepage punya 2 `<h1>`** (versi mobile + desktop hero).
6. **Sitemap lemah**: tanpa `lastmod`, berisi `program-detail.html` tanpa `id` (halaman kosong/"Program tidak ditemukan").
7. **Tidak ada sinyal local SEO kuat**: NAP (alamat/telepon/jam buka) tidak konsisten — default Firestore memakai alamat contoh "Jl. Pendidikan No. 123", homepage tidak menampilkan alamat, dan tidak ada Google Business Profile / schema LocalBusiness.
8. **Subdomain gratis `netlify.app`** — secara SEO/trust kurang kuat dibanding domain sendiri (mis. `imdkom.id` / `imdkomyogya.com`).

Estimasi tingkat kesiapan SEO saat ini: **cukup untuk diindex, belum optimal untuk bersaing di query lokal kompetitif** seperti "kursus komputer Jogja", "service laptop Yogyakarta".

---

## 2. Temuan per kategori

### 2.1 Crawling & indexing

| Item | Status | Catatan |
|---|---|---|
| HTTPS | OK | Netlify + HSTS |
| robots.txt | OK, minimal | `Allow: /` + sitemap. Aman. |
| sitemap.xml | Ada, lemah | Tanpa `lastmod`, tanpa `changefreq`/`priority`; berisi URL bermasalah (lihat 2.6) |
| HTTP status | OK | Halaman utama 200 |
| Custom 404 | Tidak ada | Netlify default 404; UX/SEO kurang baik |
| Duplicate URL | **YA** | `/kursus` = `/kursus.html` (200 keduanya). Perlu canonical atau 301 |
| noindex tidak sengaja | Tidak terlihat | Bagus |
| Parameter URLs | `program-detail.html?id=...` | Halaman dinamis tidak bisa masuk sitemap — jangan masukkan tanpa id |

URL naming: pakai satu standar saja (pilih salah satu):
- **Opsi A (disarankan)**: clean URL `/kursus`, `/service`, `/tentang`, `/kontak`
- **Opsi B**: `.html`

Jika Opsi A: set Netlify redirects 301 `/kursus.html` → `/kursus`, update semua link, sitemap, canonical.

### 2.2 Canonical & duplicate content

- Tidak ada `<link rel="canonical">` di halaman manapun.
- `/` vs `/index.html` kemungkinan juga duplikat.
- Sitemap menunjuk ke `.html`, navbar fallback menunjuk ke `.html`, sedangkan beberapa link internal memakai `/kursus`, `/service` (clean).
- Akibat: sinyal ranking terpecah, Google memilih sendiri canonical (bisa salah).

Perbaikan:
- Tambah canonical di setiap halaman produksi.
- Redirect 301 satu standar URL.
- Samakan sitemap, canonical, dan internal link.

### 2.3 On-page SEO

**Title**
- `/` — "IMDKOM Yogyakarta - Kursus & Pelatihan • Service Komputer" (OK, ~58 char)
- `/kursus.html` — "Kursus & Pelatihan | IMDKOM" (kurang keyword lokal)
- `/service.html` — "Servis Komputer | IMDKOM Yogyakarta" (OK, bisa lebih spesifik: "Service Komputer & Laptop di Yogyakarta | IMDKOM")
- `/tentang.html` — "Tentang IMDKOM | Kursus & Pelatihan • Computer Service" (agak panjang, kurang kata kunci lokal)
- `/kontak.html` — "Kontak | IMDKOM" (lemah; tambah "Kontak IMDKOM Yogyakarta — Alamat & WhatsApp")
- `/karir.html` — panjang (>60 char), boleh dipersingkat

**Meta description**
- Ada di semua halaman yang dicek. Panjang umumnya wajar.
- Homepage description tidak menyebut lokasi spesifik (Sleman/Condongcatur/Jogja) — padahal SEO lokal.

**Heading**
- `/` punya **2 `<h1>`**: `heroHeading` (mobile) + `heroHeadingDesktop` (desktop). Keduanya ada di DOM; hidden via CSS bukan solusi untuk SEO.
  - Fix: jadikan satu `<h1>` responsif, atau salah satunya `<p>`/`<div>` dengan styling sama.
- Halaman lain: 1 `<h1>` — OK.

**Konten**
- Homepage: H1 "IMDKOM YOGYAKARTA" (brand term) — baik, tapi subheading harus jelas memuat keyword "Kursus Komputer & Service Laptop Yogyakarta".
- Keyword lokal belum konsisten: "Yogyakarta", "Jogja", "Sleman", "Condongcatur", "Depok", "Kaliurang".
- Konten tentang-kami bagus (tahun berdiri, izin Dinas Pendidikan, NPSN) — ini E-E-A-T positif, perlu diperjelas di schema dan halaman Tentang.
- Testimoni di homepage `display:none` dan hanya muncul jika ada dari Firestore — konten dinamis tidak diindex dengan andal; jangan bergantung pada konten tersembunyi/JS-only untuk klaim utama.

### 2.4 Open Graph & Twitter Card

- Homepage: OG title/description/url/image ada. OG image: `hero-default.jpg` (46 KB, bagus) tapi ukuran ideal OG = **1200×630**.
- `/karir.html`: OG ada + Twitter Card ada — bagus, tapi `og:image` memakai `hero-default.png` **3,1 MB**. Ganti ke JPG/WebP ≤ 300 KB.
- Halaman lain (`/kursus.html`, `/service.html`, `/tentang.html`, `/kontak.html`, `/service-laptop.html`): **tidak ada OG/Twitter Card** → share WhatsApp/FB/X tampil polos.
- Homepage & karir: `og:url` konsisten ke domain netlify — bagus.

Perbaikan:
- Buat 1 gambar OG khusus 1200×630 (logo + tagline + alamat singkat), pakai di semua halaman.
- Tambahkan Twitter Card `summary_large_image` di semua halaman.
- Tambahkan `og:site_name`, `og:locale=id_ID`, `og:image:alt`.

### 2.5 Structured data (JSON-LD) — tidak ada

Cek `application/ld+json` di `/`, `/kursus.html`, `/service.html`, `/tentang.html`, `/kontak.html`, `/service-laptop.html`, `/karir.html` → **0 semua**.

Yang seharusnya ada:
- `LocalBusiness` (atau `EducationalOrganization` + `LocalBusiness`) di homepage/kontak: nama, alamat, telepon, geo, openingHours, areaServed, sameAs (Instagram, Maps), aggregateRating (jika testimoni/rating nyata).
- `WebSite` + `url` + `potentialAction` (SearchAction opsional).
- `BreadcrumbList` di halaman dalam.
- `Course` untuk program kursus (program-detail) — meski Google tidak lagi menampilkan rich result Course secara luas, tetap membantu pemahaman entitas.
- `FAQPage` di section FAQ (kalau FAQ tampil server-side/ada di HTML).
- `Service`/`Offer` untuk pricelist service.

Contoh JSON-LD LocalBusiness (sesuaikan data asli — **jangan pakai alamat contoh**):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "IMDKOM Yogyakarta",
  "image": "https://imdkomyogyakarta.netlify.app/assets/images/og-image.jpg",
  "telephone": "+62856-0191-3435",
  "url": "https://imdkomyogyakarta.netlify.app/",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "JL. KALIURANG KM X",
    "addressLocality": "Yogyakarta",
    "addressRegion": "DI Yogyakarta",
    "postalCode": "55284",
    "addressCountry": "ID"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": -7.X, "longitude": 110.X },
  "openingHours": "Mo-Fr 08:00-17:00",
  "areaServed": ["Yogyakarta", "Sleman", "Depok", "Condongcatur"],
  "sameAs": ["https://www.instagram.com/imdkom_yk", "https://maps.app.goo.gl/xxxx"]
}
</script>
```

Verifikasi: Google Rich Results Test + Schema Markup Validator.

### 2.6 Sitemap — perbaiki

Masalah sekarang:
- Tanpa `<lastmod>` → Google tidak tahu prioritas update.
- Berisi `program-detail.html` **tanpa parameter** → halaman tersebut menampilkan "Program tidak ditemukan". Jangan masukkan URL kosong; kalau ingin, generate sitemap dinamis dari Firestore (`program-detail.html?id=<id>`).
- Tidak ada `changefreq`/`priority` (opsional tapi membantu).
- Tidak termasuk `/register.html` (mungkin memang tidak perlu diindex — putuskan sengaja).
- URL `.html` vs clean URL: samakan dengan canonical yang dipilih.

Contoh perbaikan:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://imdkomyogyakarta.netlify.app/</loc><lastmod>2026-11-10</lastmod><priority>1.0</priority></url>
  <url><loc>https://imdkomyogyakarta.netlify.app/kursus</loc><lastmod>2026-11-10</lastmod><priority>0.9</priority></url>
  ...
</urlset>
```

Idealnya sitemap digenerate otomatis saat build (Netlify build hook / script) membaca Firestore, bukan manual.

### 2.7 Performance / Core Web Vitals

Asset yang membebani:
- `assets/images/hero/hero-default.png` — **3.136.678 bytes (≈3,1 MB)**
- `assets/images/hero/hero-default.jpg` — 46.448 bytes (≈46 KB) ← pakai ini
- `assets/css/output.css` — 47 KB (OK)
- `assets/css/theme.css` — 14 KB (OK)
- `assets/js/app.js` — 65 KB (OK)
- `favicon.ico` — 46 KB (sebaiknya ikut 46 KB yang sama? sudah cukup)

Masalah:
- Hero PNG dipakai di mobile & desktop (`loading="eager"`, dua elemen) → LCP sangat lambat di 3G/4G.
- OG karir juga menunjuk PNG 3,1 MB.
- Banyak gambar program/service dari Firestore/Cloudinary — pastikan `loading="lazy"` (sudah ada di kebanyakan) dan gunakan `optimizeCloudinaryUrl` (sudah ada).
- lucide via `unpkg.com` tanpa defer di `<head>` — render blocking; tambahkan `defer` atau bundle.
- Firebase app.js module — OK modern, tapi konten utama (program/service) dirender via JS → **Google mungkin melihat halaman kosong "Memuat program…"** sebelum JS jalan. Untuk SEO penting, pertimbangkan SSR/pre-render (Netlify prerender, atau generate HTML statis saat build) minimal untuk halaman utama.

Perbaikan prioritas:
1. Ganti semua referensi `hero-default.png` → `hero-default.jpg` (atau WebP dengan `srcset`).
2. Tambah `fetchpriority="high"` + `width/height` pada hero image.
3. Compress semua asset; target hero ≤ 150 KB.
4. Prerender/SSR konten kursus & service (minimal statis fallback HTML).
5. Audit PageSpeed Insights (mobile) — target LCP < 2,5 s, CLS < 0,1.

### 2.8 Local SEO (paling penting untuk kasus ini)

IMDKOM adalah bisnis lokal — SEO-nya menang/kalah di Google Maps & local pack, bukan hanya web ranking.

Yang belum/perlu dicek:
1. **Google Business Profile** — klaim & verifikasi profil "IMDKOM Yogyakarta". Isi: kategori ("Sekolah komputer" + "Reparasi komputer"), jam buka, foto, Q&A, produk/servis.
2. **NAP konsisten** — Nama, Alamat, Telepon harus sama di: website, footer, GBP, Instagram, marketplace, direktori (Foursquare, Tokopedia, Shopee, dll).
   - Saat ini default Firestore memakai placeholder "Jl. Pendidikan No. 123, Yogyakarta" — **tolong diganti dengan alamat asli**, dan tampilkan di footer/kontak.
3. **Geo koordinat** di schema + embed Google Maps di halaman kontak.
4. **Halaman lokasi** — jika target area luas (Jogja + Sleman + Condongcatur), sebut area layanan eksplisit.
5. **Review** — minta pelanggan Google review; respons semua review; tampilkan testimonial **asli** di HTML (bukan JS-only).
6. **Kutipan/direktori** — daftarkan ke direktori bisnis lokal Indonesia (Indonesia.go.id? tidak; yang relevan: Google Business, Bing Places, Yellow Pages, Kumparan, dll).
7. **Konten lokal** — artikel/FAQ: "Biaya kursus komputer Jogja", "Service laptop terdekat Condongcatur", "Perbedaan service HP/PC", dll.

### 2.9 Domain & trust

- `*.netlify.app` gratis — Google tidak "melarang", tapi untuk bisnis lokal, custom domain meningkatkan trust & CTR.
- Pertimbangkan `imdkom.id` / `imdkomyogya.com`, 301 redirect dari netlify.app, update sitemap/canonical/GBP.
- Email profesional (mis. `halo@imdkom.id`) vs hanya WhatsApp — trust signal tambahan.

### 2.10 Aksesibilitas & teknis pendukung SEO

- `alt` gambar: banyak pakai `alt="IMDKOM - Kursus dan Service Komputer"` generik; logo `alt="Logo 1..6"` — ganti lebih deskriptif.
- `lang="id"` OK.
- `meta viewport` OK.
- Kontras warna: teks abu di atas gelap beberapa bagian — cek WCAG.
- Focus states untuk accessibility — sebagian OK.
- `prefers-reduced-motion` sudah dihormati di CSS — bagus.
- Form/CTA: semua CTA ke WhatsApp (`href="#"` pada beberapa tombol hero: `heroWhatsApp` awalnya `href="#"` lalu di-bind JS — ganti dengan `href="https://wa.me/..."` sebagai fallback bila JS gagal).

### 2.11 Analytics & Search Console — tidak terlihat

Tidak ada meta verification Google Search Console, tidak ada GA4/GTM.

Yang harus dilakukan:
1. Daftar Google Search Console (domain property) untuk `imdkomyogyakarta.netlify.app` (atau domain sendiri).
2. Submit sitemap.
3. Pantau: query, impressions, CTR, halaman terindex, Core Web Vitals.
4. Pasang GA4 atau setidaknya Netlify Analytics.
5. Bing Webmaster Tools (opsional tapi gratis).

---

## 3. Prioritas perbaikan (action plan)

### P0 — lakukan minggu ini (dampak terbesar)
1. Ganti hero PNG → hero JPG/WebP (3,1 MB → <150 KB).
2. Pilih satu standar URL (clean `/kursus`) + 301 redirect dari `.html`.
3. Tambah canonical di semua halaman.
4. Hilangkan duplikat `<h1>` di homepage.
5. Perbaiki `og:image` karir (PNG 3 MB → JPG 1200×630).
6. Hapus `program-detail.html` dari sitemap; tambahkan `lastmod`.
7. Klaim/perbarui Google Business Profile + samakan NAP di situs & footer.
8. Ganti alamat placeholder Firestore `Jl. Pendidikan No. 123` dengan alamat asli & tampilkan di website.

### P1 — minggu 2–3
9. Tambah JSON-LD: LocalBusiness (homepage/kontak), BreadcrumbList (halaman dalam), Course/Service (program/pricelist), FAQPage (FAQ).
10. Tambah OG/Twitter Card + `og:site_name`, `og:locale=id_ID` di semua halaman.
11. Perbaiki title/description: masukkan keyword lokal ("Kursus Komputer Jogja", "Service Laptop Yogyakarta", "Sleman/Condongcatur").
12. Daftarkan & verifikasi Google Search Console; submit sitemap.
13. Pasang GA4.
14. Prerender/SSR konten utama kursus & service agar bisa diindex penuh.

### P2 — bulan 1–2
15. Migrasi ke custom domain (`imdkom.id` / `imdkomyogya.com`) + 301 dari netlify.app.
16. Konten blog/artikel lokal SEO (min. 2–4 artikel/bulan).
17. Kumpulkan review Google; tampilkan testimoni asli di HTML.
18. Audit PageSpeed mobile sampai hijau (LCP < 2.5 s).
19. Custom 404 page dengan navigasi ke program/service/kontak.
20. Custom 404 + `_redirects` rapi + validasi semua internal link.
21. Audit keamanan terkait SEO: XSS/CSP (lihat catatan keamanan terpisah) karena situs yang kena deface kehilangan ranking.

### P3 — berkelanjutan
22. Monitor Search Console (query posisi 5–20 = peluang optimasi title/description).
23. Update konten/harga/program secara berkala (`lastmod` sitemap).
24. Backlink lokal: kerjasama sekolah, komunitas, media lokal, direktori.

---

## 4. Contoh perbaikan konkret

### 4.1 Canonical per halaman (contoh)
```html
<link rel="canonical" href="https://imdkomyogyakarta.netlify.app/kursus" />
```

### 4.2 Netlify `_redirects` (jika pilih clean URL)
```
/index.html      /                301
/kursus.html     /kursus          301
/service.html    /service         301
/tentang.html    /tentang         301
/kontak.html     /kontak          301
/rakit-komputer.html /rakit-komputer 301
/karir.html      /karir           301
/service-laptop.html /service-laptop 301
/service-pc.html     /service-pc     301
/service-printer.html /service-printer 301
/service-panggil.html /service-panggil 301
/sparepart.html       /sparepart       301
```

### 4.3 OG/Twitter template (semua halaman)
```html
<meta property="og:site_name" content="IMDKOM Yogyakarta" />
<meta property="og:locale" content="id_ID" />
<meta property="og:image" content="https://imdkomyogyakarta.netlify.app/assets/images/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="IMDKOM Yogyakarta — Kursus Komputer & Service Laptop" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="...og-image.jpg" />
```

### 4.4 Title & description usulan
- Home: `IMDKOM Yogyakarta | Kursus Komputer & Service Laptop di Jogja`
  Desc: `Lembaga kursus komputer & service laptop/PC/printer di Yogyakarta sejak 1997. Izin Dinas Pendidikan 098/Kpts/2021. Konsultasi gratis via WhatsApp 0856-0191-3435.`
- Kursus: `Kursus Komputer Jogja — Program Office, Privat, Sertifikasi | IMDKOM`
- Service: `Service Laptop & PC Jogja — Bergaransi 2 Bulan | IMDKOM`
- Kontak: `Kontak IMDKOM Yogyakarta — Alamat, WhatsApp, Jam Buka`

### 4.5 Riset keyword awal (Indonesia)
- kursus komputer jogja / yogyakarta
- kursus komputer condongcatur / sleman
- service laptop jogja / terdekat
- service laptop condongcatur / depok sleman
- kursus private komputer jogja
- bimbel komputer jogja
- service printer jogja
- rakit komputer jogja
- perbaikan laptop jogja

Gunakan Google Keyword Planner / Ubersuggest / GSC untuk validasi volume.

---

## 5. Checklist verifikasi setelah perbaikan

- [ ] `curl -I` semua URL → tidak ada duplikat 200 tanpa canonical
- [ ] Google Rich Results Test → JSON-LD valid (LocalBusiness, Breadcrumb)
- [ ] PageSpeed Insights mobile → LCP < 2.5 s, CLS < 0.1
- [ ] Search Console → sitemap submitted, halaman terindex bertambah
- [ ] `site:imdkomyogyakarta.netlify.app` → semua halaman penting muncul
- [ ] Share link ke WhatsApp → preview OG muncul (judul, deskripsi, gambar 1200×630)
- [ ] GBP → profil terverifikasi, jam/alamat/telepon benar
- [ ] NAP konsisten di website, footer, GBP, Instagram
- [ ] Semua CTA WhatsApp tetap bekerja walau JS gagal (fallback `href="https://wa.me/..."`)

---

## 6. Kesimpulan

Fondasi SEO situs ini sudah ada (robots, sitemap, title/description, lang, HTTPS), tapi belum siap bersaing di pencarian lokal karena: (1) URL duplikat tanpa canonical, (2) tidak ada structured data, (3) hero 3 MB merusak performa, (4) sinyal local SEO — terutama Google Business Profile & NAP — belum kuat/konsisten, dan (5) domain masih `.netlify.app` gratis.

Kerjakan P0 dulu: compress hero, satu standar URL + 301, canonical, Google Business Profile + NAP asli. Dampaknya biasanya terlihat dalam 2–4 minggu setelah halaman di-crawl ulang.
