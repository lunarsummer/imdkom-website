// ============================================================
// SERVICES KATALOG — service.html
// Load services + filter + load more + share + galeri + lightbox
// ============================================================
import { db, collection, getDocs, query, where, orderBy, limit } from './firebase.js';
import { openWhatsAppGeneric, openWhatsApp } from './whatsapp.js';
import { optimizeCloudinaryUrl } from './cloudinary.js';
import { PLACEHOLDER_IMAGE } from './placeholder.js';

const PAGE_SIZE = 8;

const state = {
    allServices: [],
    filteredServices: [],
    displayedCount: 0,
    filterKategori: '',
    searchQuery: ''
};

// ============================================================
// HELPERS
// ============================================================
function getServiceDetailUrl(service) {
    if (!service.id) {
        console.warn('[services-katalog] Service tanpa id:', service);
        return '#';
    }
    return `/service-detail?id=${service.id}`;
}

function getServiceShareUrl(service) {
    const base = window.location.origin;
    const path = getServiceDetailUrl(service);
    if (path === '#') return window.location.href;
    return `${base}/${path.replace(/^\//, '')}`;
}

function getServiceImage(service) {
    if (service.gambar) {
        return optimizeCloudinaryUrl(service.gambar, { width: 600, height: 750, crop: 'fill' });
    }
    return PLACEHOLDER_IMAGE;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================================
// LOAD SERVICES
// ============================================================
export async function loadServicesKatalog() {
    const container = document.getElementById('servicesCatalogContainer');
    if (!container) return;

    try {
        const q = query(
            collection(db, 'services'),
            where('aktif', '==', true),
            orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);

        state.allServices = [];
        snapshot.forEach(docSnap => {
            state.allServices.push({ id: docSnap.id, ...docSnap.data() });
        });

        state.filteredServices = [...state.allServices];
        state.displayedCount = 0;

        populateKategoriFilter();
        renderServices(true);
        updateFilterInfo();

    } catch (error) {
        console.error('Load services error:', error);
        container.innerHTML = `
            <div class="col-span-full text-center text-red-600 py-12">
                <p class="text-sm">Gagal memuat layanan. Silakan refresh halaman.</p>
            </div>
        `;
    }
}

// ============================================================
// FILTER KATEGORI
// ============================================================
function populateKategoriFilter() {
    const select = document.getElementById('filterKategori');
    if (!select) return;

    const kategoriSet = new Set();
    state.allServices.forEach(s => {
        if (s.kategori && String(s.kategori).trim()) {
            kategoriSet.add(String(s.kategori).trim());
        }
    });

    select.innerHTML = '<option value="">Semua Kategori</option>';
    [...kategoriSet].sort().forEach(kat => {
        const opt = document.createElement('option');
        opt.value = kat;
        opt.textContent = kat;
        select.appendChild(opt);
    });
}

// ============================================================
// FILTER & SEARCH
// ============================================================
export function filterServices() {
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterKategori');

    state.searchQuery = (searchInput?.value || '').toLowerCase().trim();
    state.filterKategori = (filterSelect?.value || '').trim();

    state.filteredServices = state.allServices.filter(s => {
        const matchSearch = !state.searchQuery
            || (s.nama || '').toLowerCase().includes(state.searchQuery)
            || (s.deskripsi || '').toLowerCase().includes(state.searchQuery)
            || (s.deskripsiSingkat || '').toLowerCase().includes(state.searchQuery);

        const matchKategori = !state.filterKategori
            || String(s.kategori || '').trim() === state.filterKategori;

        return matchSearch && matchKategori;
    });

    state.displayedCount = 0;
    renderServices(true);
    updateFilterInfo();
}

function updateFilterInfo() {
    const info = document.getElementById('filterInfo');
    if (!info) return;

    const total = state.filteredServices.length;
    if (total === 0) {
        info.textContent = 'Tidak ada layanan yang cocok.';
    } else if (state.searchQuery || state.filterKategori) {
        info.textContent = `Menampilkan ${Math.min(state.displayedCount, total)} dari ${total} layanan.`;
    } else {
        info.textContent = '';
    }
}

// ============================================================
// RENDER SERVICES
// ============================================================
function renderServices(reset = false) {
    const container = document.getElementById('servicesCatalogContainer');
    const loadMoreWrapper = document.getElementById('loadMoreWrapper');
    if (!container) return;

    if (reset) {
        container.innerHTML = '';
        state.displayedCount = 0;
    }

    const total = state.filteredServices.length;
    const nextBatch = state.filteredServices.slice(
        state.displayedCount,
        state.displayedCount + PAGE_SIZE
    );

    if (total === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center text-gray-500 py-16">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="search-x" class="w-10 h-10 text-gray-300"></i>
                </div>
                <h4 class="text-xl font-medium text-gray-700">Tidak ada layanan yang ditemukan</h4>
                <p class="mt-1 text-sm">Coba ubah kata kunci atau filter kategori.</p>
            </div>
        `;
        if (loadMoreWrapper) loadMoreWrapper.style.display = 'none';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    nextBatch.forEach(service => {
        container.appendChild(createServiceCard(service));
    });

    state.displayedCount += nextBatch.length;

    if (loadMoreWrapper) {
        loadMoreWrapper.style.display =
            state.displayedCount < total ? 'block' : 'none';
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================================
// CREATE CARD
// ============================================================
function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'program-card';

    const imageUrl = getServiceImage(service);
    const detailUrl = getServiceDetailUrl(service);
    const shareUrl = getServiceShareUrl(service);
    const nama = service.nama || 'Layanan';
    const deskripsi = service.deskripsiSingkat || service.deskripsi || '';
    const kategori = service.kategori || '';

    card.innerHTML = `
        <a href="${escapeHtml(detailUrl)}" class="block program-image-link" aria-label="Lihat ${escapeHtml(nama)}">
            <div class="program-image-wrapper">
                <img src="${imageUrl}"
                     alt="${escapeHtml(nama)}"
                     loading="lazy"
                     onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';" />
                ${kategori ? `<span class="badge-kategori">${escapeHtml(kategori)}</span>` : ''}
            </div>
        </a>
        <div class="program-card-body">
            <a href="${escapeHtml(detailUrl)}" class="block group">
                <h3 class="program-card-title">
                    ${escapeHtml(nama)}
                </h3>
            </a>
            <p class="text-xs text-gray-500 mt-1 line-clamp-2 flex-1">
                ${escapeHtml(deskripsi)}
            </p>
            ${service.hargaMulai ? `
                <p class="text-xs text-gray-500 mt-2">
                    Mulai dari
                </p>
                <p class="text-sm font-bold text-brand">
                    ${escapeHtml(service.hargaMulai)}
                </p>
            ` : ''}
            <div class="mt-3 space-y-1.5">
                <a href="${escapeHtml(detailUrl)}"
                   class="program-btn-primary"
                   title="Lihat Detail">
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                    Lihat Detail
                </a>
                <div class="grid grid-cols-2 gap-1.5">
                    <button type="button"
                            class="program-btn-wa btn-wa"
                            data-nama="${escapeHtml(nama)}"
                            title="Tanya via WhatsApp">
                        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WA
                    </button>
                    <button type="button"
                            class="program-btn-ghost btn-share"
                            data-url="${escapeHtml(shareUrl)}"
                            data-title="${escapeHtml(nama)}"
                            data-text="${escapeHtml(deskripsi)}"
                            title="Bagikan">
                        <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
                        Share
                    </button>
                </div>
            </div>
        </div>
    `;

    card.querySelector('.btn-wa')?.addEventListener('click', () => {
        const message = `Halo IMDKOM, saya ingin bertanya tentang *${nama}*. Bisa dibantu?`;
        openWhatsApp(message);
    });

    card.querySelector('.btn-share')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        await handleShare({
            url: btn.dataset.url,
            title: btn.dataset.title,
            text: btn.dataset.text
        });
    });

    return card;
}

// ============================================================
// SHARE
// ============================================================
async function handleShare({ url, title, text }) {
    if (navigator.share) {
        try {
            await navigator.share({ title, text, url });
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('Web Share error:', err);
        }
    }

    try {
        await navigator.clipboard.writeText(url);
        showToast('Link berhasil disalin ke clipboard');
    } catch {
        window.prompt('Salin link ini:', url);
    }
}

function showToast(message) {
    const existing = document.getElementById('shareToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'shareToast';
    toast.style.cssText = `
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%);
        background: #1a3c5e;
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        max-width: 90vw;
        text-align: center;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2500);
}

// ============================================================
// LOAD MORE
// ============================================================
export function loadMoreServices() {
    renderServices(false);
    updateFilterInfo();
}

// ============================================================
// GALERI KEGIATAN — MARQUEE (untuk service.html)
// HANYA tampilkan dokumentasi service (bukan kursus)
// ============================================================
export async function loadGaleri() {
    const track = document.getElementById('galeriTrack');
    if (!track) return;

    // Slug yang diizinkan tampil di galeri service.html
    const SERVICE_SLUGS = ['laptop', 'pc', 'printer', 'panggil', 'sparepart'];

    try {
        const q = query(
            collection(db, 'documentations'),
            where('aktif', '==', true),
            orderBy('order', 'asc'),
            limit(50)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            track.innerHTML = `
                <div class="text-center text-gray-500 py-8 w-full">
                    <p class="text-sm">Belum ada dokumentasi kegiatan.</p>
                </div>
            `;
            return;
        }

        let itemsHtml = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data();

            // Skip kalau bukan service (misal kursus)
            if (!SERVICE_SLUGS.includes(data.serviceSlug)) return;

            const gambar = (data.gambarList && data.gambarList[0]) || data.gambar || '';
            if (!gambar) return;

            const imgUrl = optimizeCloudinaryUrl(gambar, { width: 500, height: 500, crop: 'fill' });

            itemsHtml += `
                <div class="galeri-marquee-item">
                    <img src="${imgUrl}"
                         alt="${escapeHtml(data.nama || 'Dokumentasi')}"
                         loading="eager"
                         onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';" />
                </div>
            `;
        });

        if (!itemsHtml) {
            track.innerHTML = `
                <div class="text-center text-gray-500 py-8 w-full">
                    <p class="text-sm">Belum ada dokumentasi kegiatan.</p>
                </div>
            `;
            return;
        }

        // Duplikat 2x untuk seamless loop
        track.innerHTML = itemsHtml + itemsHtml;

    } catch (error) {
        console.error('Load galeri error:', error);
        track.innerHTML = `
            <div class="text-center text-gray-500 py-8 w-full">
                <p class="text-sm">Gagal memuat galeri.</p>
            </div>
        `;
    }
}

// ============================================================
// LOAD DOKUMENTASI BY SLUG — generic
// @param slug — serviceSlug filter (misal 'kursus')
// @param targetId — ID container (default: 'documentationTrack')
// ============================================================
export async function loadDokumentasiBySlug(slug, targetId = 'documentationTrack') {
    const track = document.getElementById(targetId);
    if (!track) return;

    try {
        const q = query(
            collection(db, 'documentations'),
            where('aktif', '==', true),
            where('serviceSlug', '==', slug),
            orderBy('order', 'asc'),
            limit(10)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            track.innerHTML = '';
            const section = document.getElementById('documentationSection');
            if (section) section.style.display = 'none';
            return;
        }

        let itemsHtml = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const gambar = (data.gambarList && data.gambarList[0]) || data.gambar || '';
            if (!gambar) return;

            const imgUrl = optimizeCloudinaryUrl(gambar, { width: 500, height: 500, crop: 'fill' });

            itemsHtml += `
                <div class="tentang-marquee-item">
                    <img src="${imgUrl}"
                         alt="${escapeHtml(data.nama || 'Dokumentasi')}"
                         loading="lazy"
                         onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';" />
                </div>
            `;
        });

        if (!itemsHtml) {
            track.innerHTML = '';
            const section = document.getElementById('documentationSection');
            if (section) section.style.display = 'none';
            return;
        }

        // Duplikat 2x untuk seamless loop
        track.innerHTML = itemsHtml + itemsHtml;

    } catch (error) {
        console.error('Load dokumentasi error:', error);
        track.innerHTML = '';
        const section = document.getElementById('documentationSection');
        if (section) section.style.display = 'none';
    }
}

// ============================================================
// LOAD DOKUMENTASI SERVICE — semua slug service (tanpa kursus)
// Untuk tentang.html — galeri baris ke-2
// @param targetId — ID container (default: 'dokumentasiServiceTrack')
// ============================================================
export async function loadDokumentasiService(targetId = 'dokumentasiServiceTrack') {
    const track = document.getElementById(targetId);
    if (!track) return;

    const SERVICE_SLUGS = ['laptop', 'pc', 'printer', 'panggil', 'sparepart'];

    try {
        const q = query(
            collection(db, 'documentations'),
            where('aktif', '==', true),
            orderBy('order', 'asc'),
            limit(50)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            track.innerHTML = '';
            return;
        }

        let itemsHtml = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data();

            // Skip kalau bukan service
            if (!SERVICE_SLUGS.includes(data.serviceSlug)) return;

            const gambar = (data.gambarList && data.gambarList[0]) || data.gambar || '';
            if (!gambar) return;

            const imgUrl = optimizeCloudinaryUrl(gambar, { width: 400, height: 400, crop: 'fill' });

            itemsHtml += `
                <div class="tentang-marquee-item">
                    <img src="${imgUrl}"
                         alt="${escapeHtml(data.nama || 'Dokumentasi')}"
                         loading="lazy"
                         onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';" />
                </div>
            `;
        });

        if (!itemsHtml) {
            track.innerHTML = '';
            return;
        }

        // Duplikat 2x untuk seamless loop
        track.innerHTML = itemsHtml + itemsHtml;

    } catch (error) {
        console.error('Load dokumentasi service error:', error);
        track.innerHTML = '';
    }
}