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
    return `service-detail.html?id=${service.id}`;
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
            <div class="col-span-full text-center text-gray-500 py-12">
                <i data-lucide="search-x" class="w-12 h-12 mx-auto text-gray-300 mb-3"></i>
                <p class="text-sm">Tidak ada layanan yang ditemukan.</p>
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
        <div class="program-image-wrapper">
            <a href="${escapeHtml(detailUrl)}" class="program-image-link" aria-label="Lihat ${escapeHtml(nama)}">
                <img src="${imageUrl}"
                     alt="${escapeHtml(nama)}"
                     loading="lazy"
                     onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';" />
            </a>
            ${kategori ? `<span class="badge-kategori">${escapeHtml(kategori)}</span>` : ''}
        </div>
        <div class="card-content p-3 flex flex-col flex-1">
            <a href="${escapeHtml(detailUrl)}" class="block group">
                <h3 class="font-bold text-brand text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-brand-light transition-colors">
                    ${escapeHtml(nama)}
                </h3>
            </a>
            <p class="card-desc text-xs text-gray-500 mt-1 line-clamp-2 flex-1">
                ${escapeHtml(deskripsi)}
            </p>
            ${service.hargaMulai ? `
                <p class="card-price text-xs text-gray-500 mt-2">
                    Mulai <strong class="font-bold text-brand text-sm">${escapeHtml(service.hargaMulai)}</strong>
                </p>
            ` : ''}

            <div class="program-card-actions">
                <a href="${escapeHtml(detailUrl)}"
                   class="btn-action btn-detail bg-brand text-white hover:bg-brand-light"
                   title="Lihat Detail">
                    <i data-lucide="arrow-right"></i>
                    <span>Lihat Detail</span>
                </a>
                <button type="button"
                        class="btn-action btn-wa bg-[#25d366] text-white hover:bg-[#1ebe5a]"
                        data-nama="${escapeHtml(nama)}"
                        title="Tanya via WhatsApp">
                    <i data-lucide="message-circle"></i>
                    <span>WA</span>
                </button>
                <button type="button"
                        class="btn-action btn-share bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        data-url="${escapeHtml(shareUrl)}"
                        data-title="${escapeHtml(nama)}"
                        data-text="${escapeHtml(deskripsi)}"
                        title="Bagikan">
                    <i data-lucide="share-2"></i>
                    <span>Share</span>
                </button>
            </div>
        </div>
    `;

    // Event: WhatsApp
    card.querySelector('.btn-wa')?.addEventListener('click', () => {
        const message = `Halo IMDKOM, saya ingin bertanya tentang *${nama}*. Bisa dibantu?`;
        openWhatsApp(message);
    });

    // Event: Share
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
// GALERI KEGIATAN
// ============================================================
export async function loadGaleri() {
    const container = document.getElementById('galeriContainer');
    if (!container) return;

    try {
        const q = query(
            collection(db, 'documentations'),
            where('aktif', '==', true),
            orderBy('order', 'asc'),
            limit(8)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            container.innerHTML = `
                <div class="col-span-full text-center text-gray-500 py-8">
                    <p class="text-sm">Belum ada dokumentasi kegiatan.</p>
                </div>
            `;
            return;
        }

        let html = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const gambar = (data.gambarList && data.gambarList[0]) || data.gambar || '';
            if (!gambar) return;

            const imgUrl = optimizeCloudinaryUrl(gambar, { width: 400, height: 400, crop: 'fill' });
            const totalFoto = (data.gambarList && data.gambarList.length) || 1;

            html += `
                <button type="button"
                        class="galeri-item group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                        data-img="${escapeHtml(gambar)}"
                        data-caption="${escapeHtml(data.nama || '')}">
                    <img src="${imgUrl}"
                         alt="${escapeHtml(data.nama || 'Dokumentasi')}"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                         loading="lazy"
                         onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';" />
                    ${totalFoto > 1 ? `
                        <span class="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <i data-lucide="image" class="w-3 h-3"></i>${totalFoto}
                        </span>
                    ` : ''}
                </button>
            `;
        });

        container.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        container.querySelectorAll('.galeri-item').forEach(btn => {
            btn.addEventListener('click', () => {
                openLightbox(btn.dataset.img, btn.dataset.caption);
            });
        });

    } catch (error) {
        console.error('Load galeri error:', error);
        container.innerHTML = `
            <div class="col-span-full text-center text-gray-500 py-8">
                <p class="text-sm">Gagal memuat galeri.</p>
            </div>
        `;
    }
}

function openLightbox(imgUrl, caption) {
    const modal = document.getElementById('imageLightbox');
    const img = document.getElementById('imageLightboxImg');
    const cap = document.getElementById('imageLightboxCaption');

    if (!modal || !img) return;

    img.src = imgUrl;
    if (cap) cap.textContent = caption || '';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

export function closeLightbox() {
    const modal = document.getElementById('imageLightbox');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}