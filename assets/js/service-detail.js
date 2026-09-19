// ============================================================
// Service Detail — Logic Halaman Detail Layanan
// ============================================================

import { 
    db, collection, getDocs, query, where, orderBy, limit, doc, getDoc 
} from './firebase.js';
import { getImageUrl, escapeHtml, formatRupiah } from './utils.js';
import { openWhatsApp } from './whatsapp.js';

// ============================================================
// GET SERVICE SLUG FROM URL
// ============================================================
function getServiceSlugFromUrl() {
    // Cek dari URL param ?slug=laptop
    const urlParams = new URLSearchParams(window.location.search);
    const slugFromParam = urlParams.get('slug');
    if (slugFromParam) return slugFromParam;
    
    // Fallback: cek dari filename (service-laptop.html → laptop)
    const path = window.location.pathname;
    const match = path.match(/service-([a-z]+)\.html/);
    if (match) return match[1];
    
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
        // Query service by slug
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
                    <a href="service.html" class="text-brand hover:underline mt-2 inline-block">← Kembali ke Service</a>
                </div>
            `;
            return;
        }
        
        const serviceDoc = snapshot.docs[0];
        const data = serviceDoc.data();
        
        // Update page title
        document.title = `${data.nama} | IMDKOM Yogyakarta`;
        
        // Update breadcrumb
        const breadcrumbName = document.getElementById('breadcrumbName');
        if (breadcrumbName) breadcrumbName.textContent = data.nama;
        
        // Render hero
        container.innerHTML = `
            <div class="flex flex-col md:flex-row items-start gap-6 md:gap-8">
                <!-- Icon/Image -->
                <div class="w-full md:w-auto">
                    <div class="w-20 h-20 md:w-24 md:h-24 bg-brand/10 rounded-3xl flex items-center justify-center">
                        <i data-lucide="${data.icon || 'wrench'}" class="w-10 h-10 md:w-12 md:h-12 text-brand"></i>
                    </div>
                </div>
                
                <!-- Content -->
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
        
        // Init icons
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
    } catch (error) {
        console.error('Error loading service detail:', error);
    }
}

// ============================================================
// LOAD PRICELIST — Versi Tabel (Compact)
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
        
        // Group by kategori
        const grouped = {};
        snapshot.forEach((doc) => {
            const data = doc.data();
            const kat = data.kategori || 'Umum';
            if (!grouped[kat]) grouped[kat] = [];
            grouped[kat].push({ id: doc.id, ...data });
        });
        
        // Render semua kategori sebagai tabel
        let html = '';
        
        Object.keys(grouped).forEach((kategori) => {
            html += `
                <div class="glass rounded-2xl overflow-hidden mb-4">
                    <!-- Header Kategori -->
                    <div class="bg-brand text-white px-4 py-3 flex items-center gap-2">
                        <i data-lucide="tag" class="w-4 h-4"></i>
                        <h3 class="font-bold text-sm uppercase tracking-wide">${escapeHtml(kategori)}</h3>
                    </div>
                    
                    <!-- Tabel -->
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="bg-white/50 border-b border-gray-200">
                                    <th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Layanan</th>
                                    <th class="text-center px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider hidden sm:table-cell">Estimasi</th>
                                    <th class="text-center px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider hidden sm:table-cell">Garansi</th>
                                    <th class="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Harga</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            grouped[kategori].forEach((item) => {
                const hasPromo = item.hargaPromo && item.hargaPromo < item.harga;
                
                html += `
                    <tr class="border-b border-gray-100 hover:bg-white/60 transition-colors last:border-0">
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-medium text-gray-800">${escapeHtml(item.nama)}</span>
                                ${hasPromo ? `<span class="bg-brand-dark text-white text-[10px] font-bold px-2 py-0.5 rounded-full">PROMO</span>` : ''}
                            </div>
                            ${item.deskripsi ? `<p class="text-xs text-gray-500 mt-0.5">${escapeHtml(item.deskripsi)}</p>` : ''}
                            
                            <!-- Info mobile (muncul di bawah nama) -->
                            <div class="flex items-center gap-3 mt-1 text-[11px] text-gray-400 sm:hidden">
                                ${item.estimasi ? `<span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i>${escapeHtml(item.estimasi)}</span>` : ''}
                                ${item.garansi && item.garansi !== '-' ? `<span class="flex items-center gap-1"><i data-lucide="shield-check" class="w-3 h-3"></i>${escapeHtml(item.garansi)}</span>` : ''}
                            </div>
                        </td>
                        <td class="px-3 py-3 text-center text-gray-500 text-xs hidden sm:table-cell">
                            ${item.estimasi ? escapeHtml(item.estimasi) : '-'}
                        </td>
                        <td class="px-3 py-3 text-center text-gray-500 text-xs hidden sm:table-cell">
                            ${item.garansi && item.garansi !== '-' ? `<span class="inline-flex items-center gap-1 bg-success/10 text-success px-2 py-0.5 rounded-full text-[10px] font-semibold">${escapeHtml(item.garansi)}</span>` : '-'}
                        </td>
                        <td class="px-4 py-3 text-right">
                            ${hasPromo ? `
                                <div class="text-xs text-gray-400 line-through">${formatRupiah(item.harga)}</div>
                                <div class="text-sm font-bold text-brand-dark">${formatRupiah(item.hargaPromo)}</div>
                            ` : `
                                <div class="text-sm font-bold text-brand">${formatRupiah(item.harga)}</div>
                            `}
                        </td>
                    </tr>
                `;
            });
            
            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
    } catch (error) {
        console.error('Error loading pricelist:', error);
        container.innerHTML = `<p class="text-center text-red-500 text-sm py-8">Gagal memuat pricelist.</p>`;
    }
}

// ============================================================
// LOAD DOCUMENTATIONS
// ============================================================
export async function loadDocumentations() {
    const container = document.getElementById('documentationContainer');
    if (!container) return;
    
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
            // Hide entire section if no documentations
            const section = document.getElementById('documentationSection');
            if (section) section.style.display = 'none';
            return;
        }
        
        let html = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const imageUrl = getImageUrl(data.gambar);
            
            html += `
                <div class="group cursor-pointer" onclick="openImageModal('${imageUrl}', '${escapeHtml(data.nama || '')}')">
                    <div class="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square">
                        <img src="${imageUrl}" 
                             alt="${escapeHtml(data.nama || 'Dokumentasi')}" 
                             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                             loading="lazy" />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div class="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <p class="text-sm font-semibold">${escapeHtml(data.nama || '')}</p>
                            ${data.keterangan ? `<p class="text-xs text-white/80 mt-1">${escapeHtml(data.keterangan)}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading documentations:', error);
    }
}

// ============================================================
// IMAGE MODAL
// ============================================================
window.openImageModal = function(url, caption) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('imageModalImg');
    const cap = document.getElementById('imageModalCaption');
    
    if (modal && img) {
        img.src = url;
        if (cap) cap.textContent = caption || '';
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
};

window.closeImageModal = function() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
};

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadServiceDetail();
    await loadPricelist();
    await loadDocumentations();
});