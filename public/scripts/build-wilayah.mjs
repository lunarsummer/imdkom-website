// ============================================================
// build-wilayah.mjs — Download & split data wilayah Indonesia
// Source: izzulabadi/api-wilayah-indonesia-2026 (MIT License)
//         Data: BPS + Kemendagri (via repo pemilik data)
// Output: public/assets/data/wilayah/
//   - provinces.json, regencies.json, districts.json  (dimuat sekali)
//   - villages/villages-XX.json                       (per provinsi, lazy)
// Jalankan: node scripts/build-wilayah.mjs
// ============================================================
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://cdn.jsdelivr.net/gh/izzulabadi/api-wilayah-indonesia-2026@v1.0.4/api';
const HERE = fileURLToPath(new URL('.', import.meta.url));
const OUT = join(HERE, '..', 'assets', 'data', 'wilayah');
const ATTR = `// Data: izzulabadi/api-wilayah-indonesia-2026 (MIT License)\n// Sumber: BPS & Kemendagri\n`;

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
};

console.log('Downloading data wilayah...');
const [provinces, regencies, districts, villages] = await Promise.all([
  fetchJson(`${BASE}/provinces.json`),
  fetchJson(`${BASE}/regencies.json`),
  fetchJson(`${BASE}/districts.json`),
  fetchJson(`${BASE}/villages.json`),
]);

console.log(`- provinces: ${provinces.length}`);
console.log(`- regencies: ${regencies.length}`);
console.log(`- districts: ${districts.length}`);
console.log(`- villages: ${villages.length}`);

mkdirSync(OUT, { recursive: true });
const villagesDir = join(OUT, 'villages');
mkdirSync(villagesDir, { recursive: true });

// Top-level files
writeFileSync(join(OUT, 'provinces.json'), JSON.stringify(provinces), 'utf8');
writeFileSync(join(OUT, 'regencies.json'), JSON.stringify(regencies), 'utf8');
writeFileSync(join(OUT, 'districts.json'), JSON.stringify(districts), 'utf8');
writeFileSync(join(OUT, 'README.md'), `# Data Wilayah Indonesia\n\nData: [izzulabadi/api-wilayah-indonesia-2026](https://github.com/izzulabadi/api-wilayah-indonesia-2026) (MIT License)\nSumber: BPS & Kemendagri\n`, 'utf8');

// Split villages by province (first 2 chars of districtId)
const byProvince = new Map();
for (const v of villages) {
  const prov = v.districtId.slice(0, 2);
  if (!byProvince.has(prov)) byProvince.set(prov, []);
  byProvince.get(prov).push(v);
}

// Clean old village splits
for (const f of (await import('node:fs')).readdirSync(villagesDir)) {
  if (f.startsWith('villages-')) rmSync(join(villagesDir, f), { force: true });
}

for (const [prov, list] of byProvince) {
  writeFileSync(join(villagesDir, `villages-${prov}.json`), JSON.stringify(list), 'utf8');
}
console.log(`- villages split ke ${byProvince.size} file provinsi`);

console.log('Selesai. Output di:', OUT);
