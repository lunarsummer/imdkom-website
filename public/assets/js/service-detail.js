// ============================================================
// Service Detail — Logic Halaman Detail Layanan
// ============================================================

import { 
    db, collection, getDocs, query, where, orderBy, limit, doc, getDoc 
} from './firebase.js';
import { escapeHtml, formatRupiah } from './utils.js';
import { optimizeCloudinaryUrl } from './cloudinary.js';

// ============================================================
// KONFIGURASI PRICELIST
// ============================================================
const PRICELIST_LIMIT = 5;
const pricelistState = {};
let pricelistGroupedData = {};

// ============================================================
// GET SERVICE SLUG FROM URL
// ============================================================
function getServiceSlugFromUrl() {
    // 1. PRIORITAS: data attribute di container
    const container = document.getElementById('serviceHeroContainer');
    const dataSlug = container?.dataset?.serviceSlug;
    if (dataSlug) {
        console.log('✅ Slug:', dataSlug, '(dari data attribute)');
        return dataSlug;
    }

    // 2. URL param ?slug=xxx
    const urlParams = new URLSearchParams(window.location.search);
    const slugFromParam = urlParams.get('slug');
    if (slugFromParam) {
        console.log('✅ Slug:', slugFromParam, '(dari URL param)');
        return slugFromParam;
    }

    // 3. Mapping filename → slug
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);

    const slugMap = {
        'service-laptop': 'laptop',
        '/service-laptop': 'laptop',
        'service-pc': 'pc',
        '/service-pc': 'pc',
        'service-printer': 'printer',
        '/service-printer': 'printer',
        'service-panggil': 'panggil',
        '/service-panggil': 'panggil',
        'sparepart': 'sparepart',
        '/sparepart': 'sparepart',
        'upgrade': 'upgrade',
        'upgrade.html': 'upgrade',
        'instalasi': 'instalasi',
        'instalasi.html': 'instalasi'
    };

    if (slugMap[filename]) {
        console.log('✅ Slug:', slugMap[filename], '(dari mapping)');
        return slugMap[filename];
    }

    // 4. Fallback: regex
    const match = path.match(/service-([a-z-]+)(?:\.html)?$/i);
    if (match) {
        console.log('✅ Slug:', match[1], '(dari regex)');
        return match[1];
    }

    // 5. Fallback 2
    const lastPart = path.split('/').filter(Boolean).pop();
    if (lastPart) {
        const cleaned = lastPart.replace(/^service-/, '').replace(/\.html$/, '');
        if (cleaned) {
            console.log('✅ Slug:', cleaned, '(dari path terakhir)');
            return cleaned;
        }
    }

    console.error('❌ Slug tidak ditemukan:', path);
    return null;
}

// ============================================================
// LOAD SERVICE DETAIL
// ============================================================
export async function loadServiceDetail() {
    const container = document.getElementById('serviceHeroContainer');
    if (!container) return;

    const slug = getServiceSlugFromUrl();
    if (!slug) {
        console.error('Service slug not found');
        return;
    }

    try {
        const q = query(
            collection(db, 'services'),
            where('slug', '==', slug),
            where('aktif', '==', true),
            limit(1)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-500">Layanan tidak ditemukan.</p>
                    <a href="/service" class="text-brand hover:underline mt-2 inline-block">← Kembali ke Service</a>
                </div>
            `;
            return;
        }

        const serviceDoc = snapshot.docs[0];
        const data = serviceDoc.data();

        document.title = `${data.nama} | IMDKOM Yogyakarta`;

        const breadcrumbName = document.getElementById('breadcrumbName');
        if (breadcrumbName) breadcrumbName.textContent = data.nama;

        container.innerHTML = `
            <div class="flex flex-col md:flex-row items-start gap-6 md:gap-8">
                <div class="w-full md:w-auto">
                    <div class="w-20 h-20 md:w-24 md:h-24 bg-brand/10 rounded-3xl flex items-center justify-center">
                        <i data-lucide="${data.icon || 'wrench'}" class="w-10 h-10 md:w-12 md:h-12 text-brand"></i>
                    </div>
                </div>

                <div class="flex-1">
                    <div class="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-xs font-medium text-brand mb-4">
                        <i data-lucide="wrench" class="w-3.5 h-3.5"></i>
                        ${escapeHtml(data.kategori || 'Layanan')}
                    </div>

                    <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand leading-tight">
                        ${escapeHtml(data.nama || 'Service')}
                    </h1>

                    <p class="text-base sm:text-lg text-gray-600 mt-4 max-w-2xl">
                        ${escapeHtml(data.deskripsi || '')}
                    </p>

                    ${data.hargaMulai ? `
                        <div class="mt-4 inline-flex items-center gap-2 bg-success/10 border border-success/30 px-4 py-2 rounded-xl">
                            <i data-lucide="tag" class="w-4 h-4 text-success"></i>
                            <span class="text-sm font-semibold text-success">Mulai ${formatRupiah(data.hargaMulai)}</span>
                        </div>
                    ` : ''}

                    <div class="flex flex-wrap gap-3 mt-6">
                        <button onclick="openConsultationModal('${data.slug}', '${escapeHtml(data.nama)}')"
                                class="inline-flex items-center gap-2 bg-brand hover:bg-brand-light text-white font-medium px-6 py-3 rounded-xl transition-all shadow-lg shadow-brand/20">
                            <i data-lucide="message-circle" class="w-4 h-4"></i>
                            Konsultasi
                        </button>
                        <a href="https://wa.me/6285601913435?text=Halo%20IMDKOM%2C%20saya%20ingin%20booking%20${encodeURIComponent(data.nama)}"
                           target="_blank"
                           class="inline-flex items-center gap-2 border border-brand text-brand hover:bg-brand hover:text-white font-medium px-6 py-3 rounded-xl transition-all">
                            <i data-lucide="calendar-check" class="w-4 h-4"></i>
                            Booking Service
                        </a>
                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (error) {
        console.error('Error loading service detail:', error);
    }
}

// ============================================================
// LOAD PRICELIST
// ============================================================
export async function loadPricelist() {
    const container = document.getElementById('pricelistContainer');
    if (!container) return;

    const slug = getServiceSlugFromUrl();
    if (!slug) return;

    try {
        const q = query(
            collection(db, 'pricelists'),
            where('serviceSlug', '==', slug),
            where('aktif', '==', true),
            orderBy('kategori', 'asc'),
            orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500 text-sm">Pricelist belum tersedia.</p>
                </div>
            `;
            return;
        }

        const grouped = {};
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const kat = data.kategori || 'Umum';
            if (!grouped[kat]) grouped[kat] = [];
            grouped[kat].push({ id: docSnap.id, ...data });
        });

        pricelistGroupedData = grouped;

        Object.keys(grouped).forEach(kat => {
            pricelistState[kat] = PRICELIST_LIMIT;
        });

        let html = '';
        let kategoriIndex = 0;

        Object.keys(grouped).forEach((kategori) => {
            const items = grouped[kategori];
            const totalItems = items.length;
            const visibleItems = items.slice(0, PRICELIST_LIMIT);
            const hasMore = totalItems > PRICELIST_LIMIT;
            const remaining = totalItems - PRICELIST_LIMIT;

            html += `
                <div class="pl-group" data-kategori-group="${escapeHtml(kategori)}">
                    <div class="pl-head">
                        <i data-lucide="tag" class="w-4 h-4"></i>
                        <h3>${escapeHtml(kategori)}</h3>
                        <span class="pl-count">${totalItems} item</span>
                    </div>

                    <div class="pl-table-scroll">
                        <table class="pl-table">
                            <thead>
                                <tr>
                                    <th>Layanan</th>
                                    <th class="pl-center pl-col-hide">Estimasi</th>
                                    <th class="pl-center pl-col-hide">Garansi</th>
                                    <th class="pl-right">Start From</th>
                                </tr>
                            </thead>
                            <tbody id="pricelist-body-${kategoriIndex}">
                                ${renderPricelistRows(visibleItems)}
                            </tbody>
                        </table>
                    </div>

                    ${hasMore ? `
                        <div class="pl-loadmore-wrap">
                            <button type="button"
                                    class="pl-loadmore load-more-btn"
                                    data-kategori="${escapeHtml(kategori)}"
                                    data-index="${kategoriIndex}"
                                    data-total="${totalItems}"
                                    onclick="loadMorePricelist(this)">
                                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                                <span class="load-more-text">Muat Lebih Banyak (${remaining} tersisa)</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;

            kategoriIndex++;
        });

        container.innerHTML = html;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

    } catch (error) {
        console.error('Error loading pricelist:', error);
        container.innerHTML = `<p class="text-center text-red-500 text-sm py-8">Gagal memuat pricelist.</p>`;
    }
}

// ============================================================
// RENDER BARIS TABEL PRICELIST
// ============================================================
function renderPricelistRows(items) {
    let html = '';

    items.forEach((item) => {
        const hasPromo = item.hargaPromo && item.hargaPromo < item.harga;

        html += `
            <tr>
                <td data-label="Layanan">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="pl-name">${escapeHtml(item.nama)}</span>
                        ${hasPromo ? `<span class="promo-shine">PROMO</span>` : ''}
                    </div>
                    ${item.deskripsi ? `<p class="pl-desc">${escapeHtml(item.deskripsi)}</p>` : ''}
                    <div class="pl-meta">
                        ${item.estimasi ? `<span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i>${escapeHtml(item.estimasi)}</span>` : ''}
                        ${item.garansi && item.garansi !== '-' ? `<span class="pl-warranty"><i data-lucide="shield-check" class="w-3 h-3"></i>${escapeHtml(item.garansi)}</span>` : ''}
                    </div>
                </td>
                <td class="pl-center pl-col-hide" data-label="Estimasi">
                    ${item.estimasi ? escapeHtml(item.estimasi) : '-'}
                </td>
                <td class="pl-center pl-col-hide" data-label="Garansi">
                    ${item.garansi && item.garansi !== '-' ? `<span class="pl-warranty">${escapeHtml(item.garansi)}</span>` : '-'}
                </td>
                <td class="pl-price" data-label="Start From">
                    ${hasPromo ? `
                        <span class="pl-price-strike">${formatRupiah(item.harga)}</span>
                        <span class="pl-price-final">${formatRupiah(item.hargaPromo)}</span>
                    ` : `
                        <span class="pl-price-normal">${formatRupiah(item.harga)}</span>
                    `}
                </td>
            </tr>
        `;
    });

    return html;
}

// ============================================================
// LOAD MORE PRICELIST
// ============================================================
window.loadMorePricelist = function(button) {
    const kategori = button.dataset.kategori;
    const index = parseInt(button.dataset.index);
    const total = parseInt(button.dataset.total);
    const tbody = document.getElementById(`pricelist-body-${index}`);

    if (!tbody) return;

    const items = pricelistGroupedData[kategori];
    if (!items) return;

    const currentCount = pricelistState[kategori] || PRICELIST_LIMIT;
    const newCount = Math.min(currentCount + PRICELIST_LIMIT, total);
    const newItems = items.slice(currentCount, newCount);

    tbody.insertAdjacentHTML('beforeend', renderPricelistRows(newItems));

    pricelistState[kategori] = newCount;

    const remaining = total - newCount;
    if (remaining <= 0) {
        button.parentElement.remove();
    } else {
        const textEl = button.querySelector('.load-more-text');
        if (textEl) {
            textEl.textContent = `Muat Lebih Banyak (${remaining} tersisa)`;
        }
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

// ============================================================
// LOAD DOCUMENTATIONS — MARQUEE (jalan ke kiri, smooth)
// ============================================================
export async function loadDocumentations() {
    const track = document.getElementById('documentationTrack');
    if (!track) return;

    const slug = getServiceSlugFromUrl();
    if (!slug) return;

    try {
        const q = query(
            collection(db, 'documentations'),
            where('serviceSlug', '==', slug),
            where('aktif', '==', true),
            orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            const section = document.getElementById('documentationSection');
            if (section) section.style.display = 'none';
            return;
        }

        let itemsHtml = '';

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();

            // Support multi-foto: gambarList (baru) atau gambar (lama)
            let images = [];
            if (data.gambarList && Array.isArray(data.gambarList) && data.gambarList.length > 0) {
                images = data.gambarList;
            } else if (data.gambar) {
                images = [data.gambar];
            }

            // Render SETIAP gambar sebagai item marquee
            images.forEach((imgUrl) => {
                if (!imgUrl) return;

                const thumbUrl = optimizeCloudinaryUrl(imgUrl, {
                    width: 500,
                    height: 500,
                    crop: 'fill'
                });

                itemsHtml += `
                    <div class="dokumentasi-marquee-item">
                        <img src="${thumbUrl}"
                             alt="${escapeHtml(data.nama || 'Dokumentasi')}"
                             loading="eager"
                             onerror="this.onerror=null; this.src='assets/images/placeholder.svg';" />
                    </div>
                `;
            });
        });

        if (!itemsHtml) {
            const section = document.getElementById('documentationSection');
            if (section) section.style.display = 'none';
            return;
        }

        // Duplikat 2x untuk seamless loop
        track.innerHTML = itemsHtml + itemsHtml;

    } catch (error) {
        console.error('Error loading documentations:', error);
        const section = document.getElementById('documentationSection');
        if (section) section.style.display = 'none';
    }
}


// ============================================================
// INIT — pasang semua loader
// Pakai readyState check supaya tetap jalan meski module di-defer
// ============================================================
let serviceDetailInitialized = false;

export async function initServiceDetail() {
    if (serviceDetailInitialized) return;
    serviceDetailInitialized = true;

    try {
        await loadServiceDetail();
    } catch (e) {
        console.error('loadServiceDetail error:', e);
    }

    try {
        await loadPricelist();
    } catch (e) {
        console.error('loadPricelist error:', e);
    }

    try {
        await loadDocumentations();
    } catch (e) {
        console.error('loadDocumentations error:', e);
    }
}

// Auto-init: kalau DOM belum siap → tunggu DOMContentLoaded
// Kalau sudah siap → langsung init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initServiceDetail);
} else {
    initServiceDetail();
}