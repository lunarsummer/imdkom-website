// ============================================================
// sync-navbar.mjs — Inject komponen navbar ke semua halaman publik
// Membaca components/navbar.html (sumber kebenaran) lalu menuliskan
// blok navbar inline ke setiap public/*.html yang punya marker:
//   <!-- NAVBAR:sticky --> ... <!-- /NAVBAR -->
// Jika marker belum ada, marker dibuat menggantikan <div id="navbarMount"
// data-variant="sticky|fixed"></div> yang lama.
// ============================================================
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC = fileURLToPath(new URL('..', import.meta.url));
const MASTER = join(PUBLIC, 'components', 'navbar.html');

const VARIANT_CLASS = {
  sticky: 'bg-white border-b border-gray-200 py-3 sticky top-0 z-40',
  fixed: 'bg-white/80 backdrop-blur-md border-b border-white/40 py-3 fixed top-0 left-0 right-0 z-50 is-fixed'
};

const master = readFileSync(MASTER, 'utf8');

const pages = readdirSync(PUBLIC).filter(f => f.endsWith('.html'));

let changed = 0;
for (const page of pages) {
  const file = join(PUBLIC, page);
  let html = readFileSync(file, 'utf8');

  const oldMount = html.match(/<div\s+id="navbarMount"\s+data-variant="(sticky|fixed)"\s*>\s*<\/div>/);
  const newMarker = html.match(/<!-- NAVBAR:(sticky|fixed) -->/);
  const variant = oldMount ? oldMount[1] : (newMarker ? newMarker[1] : null);
  if (!variant) continue;

  const nav = master.replace('NAVBAR_VARIANT_CLASS', VARIANT_CLASS[variant]);
  const block = `<!-- NAVBAR:${variant} -->\n${nav}\n<!-- /NAVBAR -->`;

  const blockRe = /<!-- NAVBAR:(?:sticky|fixed) -->[\s\S]*?<!-- \/NAVBAR -->/;
  if (blockRe.test(html)) {
    html = html.replace(blockRe, block);
  } else if (oldMount) {
    html = html.replace(oldMount[0], block);
  } else {
    continue;
  }

  writeFileSync(file, html, 'utf8');
  changed++;
  console.log('synced', page);
}

console.log(`\n${changed} halaman tersinkron.`);
