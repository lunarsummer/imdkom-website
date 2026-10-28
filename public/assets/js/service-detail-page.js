// ============================================================
// SERVICE DETAIL PAGE — service-detail.html?id=xxx
// Load service individual + modal konsultasi + modal booking
// ============================================================
import { db, doc, getDoc, collection, getDocs, query, where, orderBy } from './firebase.js';
import { openWhatsApp, openWhatsAppGeneric } from './whatsapp.js';
import { optimizeCloudinaryUrl } from './cloudinary.js';
import { PLACEHOLDER_IMAGE } from './placeholder.js';
import { formatRupiah, truncateText, escapeHtml } from './utils.js';

// ============================================================
// MAPPING KATEGORI → HALAMAN PRICELIST
// ============================================================
const KATEGORI_TO_URL = {
    'Service Laptop': 'service-laptop.html',
    'Service PC': 'service-pc.html',
    'Service Printer': 'service-printer.html',
    'Service Panggil': 'service-panggil.html',
    'Sparepart': 'sparepart.html'
};

function getPricelistUrlByKategori(kategori) {
    if (!kategori) return 'service.html';
    return KATEGORI_TO_URL[kategori.trim()] || 'service.html';
}

// ============================================================
// KONFIGURASI LOKASI & TARIF
// ============================================================
const IMDKOM_LOCATION = {
    lat: -7.743922,
    lng: 110.389871,
    name: 'IMDKOM - Jl. Kaliurang Km 7,3 No 38, Yogyakarta'
};

let visitRate = {
    radiusGratis: 7,
    biayaDasar: 20000,
    biayaPerKm: 2000
};

let currentLocation = {
    lat: null, lng: null, mapsLink: '',
    distance: null, visitCost: 0, visitCostFormatted: ''
};

// ============================================================
// LOAD TARIF DARI FIRESTORE
// ============================================================
export async function loadVisitRate() {
    try {
        const docSnap = await getDoc(doc(db, 'settings', 'general'));
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.radiusGratis !== undefined) visitRate.radiusGratis = data.radiusGratis;
            if (data.biayaDasar !== undefined) visitRate.biayaDasar = data.biayaDasar;
            if (data.biayaPerKm !== undefined) visitRate.biayaPerKm = data.biayaPerKm;
        }
    } catch (error) {
        console.warn('Gagal load tarif, pakai default:', error.message);
    }
}

// ============================================================
// LOAD SERVICE DETAIL
// ============================================================
export async function loadServiceDetail() {
    const container = document.getElementById('serviceDetailContainer');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        container.innerHTML = `
            <div class="text-center text-red-600 py-10">
                <p>Layanan tidak ditemukan. <a href="service.html" class="text-brand underline">Kembali ke katalog</a></p>
            </div>
        `;
        return;
    }

    try {
        const docSnap = await getDoc(doc(db, 'services', id));
        if (!docSnap.exists()) {
            container.innerHTML = `
                <div class="text-center text-red-600 py-10">
                    <p>Layanan tidak ditemukan. <a href="service.html" class="text-brand underline">Kembali ke katalog</a></p>
                </div>
            `;
            return;
        }

        const data = docSnap.data();
        const nama = data.nama || 'Layanan';
        const kategori = data.kategori || '';
        const deskripsi = data.deskripsi || '';
        const deskripsiSingkat = data.deskripsiSingkat || '';
        const hargaMulai = data.hargaMulai || '';
        const gambar = data.gambar || '';

        const imageUrl = gambar
            ? optimizeCloudinaryUrl(gambar, { width: 1200, height: 1500, crop: 'fill' })
            : PLACEHOLDER_IMAGE;

        const pricelistUrl = getPricelistUrlByKategori(kategori);

        // Set page title & OG tags
        const pageTitle = `${nama} | IMDKOM Yogyakarta`;
        const pageDesc = truncateText(deskripsiSingkat || deskripsi || 'Layanan service di IMDKOM Yogyakarta.', 160);
        const ogImage = gambar
            ? optimizeCloudinaryUrl(gambar, { width: 1200, height: 630, crop: 'fill' })
            : 'https://imdkom.com/assets/images/logo/imdkom.svg';

        document.title = pageTitle;
        setMeta('og:title', pageTitle);
        setMeta('og:description', pageDesc);
        setMeta('og:image', ogImage);
        setMeta('og:url', window.location.href);
        setMeta('og:type', 'article');
        setMetaName('description', pageDesc);
        setMetaName('twitter:card', 'summary_large_image');
        setMetaName('twitter:title', pageTitle);
        setMetaName('twitter:description', pageDesc);
        setMetaName('twitter:image', ogImage);

        // Update breadcrumb
        const breadcrumbEl = document.getElementById('breadcrumbServiceName');
        if (breadcrumbEl) breadcrumbEl.textContent = nama;

        // Render
        container.innerHTML = `
            <div class="flex flex-col lg:flex-row gap-8 lg:gap-12">
                <div class="lg:w-1/2">
                    <div class="relative">
                        <img src="${imageUrl}" alt="${escapeHtml(nama)}"
                             class="w-full aspect-[4/5] object-cover rounded-2xl shadow-sm"
                             loading="lazy"
                             onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';" />
                    </div>
                </div>

                <div class="lg:w-1/2">
                    ${kategori ? `<p class="text-sm text-gray-500">${escapeHtml(kategori)}</p>` : ''}
                    <h1 class="text-3xl md:text-4xl font-bold text-brand mt-1">${escapeHtml(nama)}</h1>

                    <p class="text-gray-600 mt-4">${escapeHtml(deskripsiSingkat || deskripsi)}</p>

                    ${hargaMulai ? `
                        <div class="bg-gray-50 rounded-xl p-4 mt-4">
                            <p class="text-xs text-gray-500 mb-1">Harga Mulai</p>
                            <p class="text-2xl font-bold text-brand">${formatRupiah(hargaMulai)}</p>
                        </div>
                    ` : ''}

                    <div class="mt-6 flex flex-wrap gap-3">
                        <button id="btnKonsultasi" class="bg-brand hover:bg-brand-light text-white font-medium px-8 py-3 rounded-xl transition-colors inline-flex items-center gap-2">
                            <i data-lucide="message-circle" class="w-4 h-4"></i>
                            Konsultasi
                        </button>
                        <button id="btnBooking" class="bg-brand-dark hover:bg-[#a0350a] text-white font-medium px-6 py-3 rounded-xl transition-colors inline-flex items-center gap-2">
                            <i data-lucide="calendar-check" class="w-4 h-4"></i>
                            Booking
                        </button>
                        <button id="btnShare" class="border border-gray-300 hover:border-gray-400 text-gray-700 font-medium px-6 py-3 rounded-xl transition-colors inline-flex items-center gap-2">
                            <i data-lucide="share-2" class="w-4 h-4"></i>
                            Bagikan
                        </button>
                    </div>

                    ${kategori ? `
                        <a href="${pricelistUrl}" class="mt-6 inline-flex items-center gap-2 text-brand hover:text-brand-light font-medium text-sm border-b-2 border-brand hover:border-brand-light transition-colors">
                            <i data-lucide="tag" class="w-4 h-4"></i>
                            Lihat Pricelist ${escapeHtml(kategori)}
                            <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </a>
                    ` : ''}
                </div>
            </div>

            ${deskripsi ? `
                <div class="mt-10 border-t border-gray-200 pt-8">
                    <h2 class="text-xl font-bold text-brand flex items-center gap-2">
                        <i data-lucide="file-text" class="w-5 h-5"></i>
                        Tentang Layanan Ini
                    </h2>
                    <p class="text-gray-700 mt-3 leading-relaxed whitespace-pre-line">${escapeHtml(deskripsi)}</p>
                </div>
            ` : ''}
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Attach events
        attachDetailEvents(data, nama, deskripsiSingkat || deskripsi, pricelistUrl);

        // Load rekomendasi layanan lain
        await loadRecommendations(docSnap.id);

    } catch (error) {
        console.error('Error loading service detail:', error);
        container.innerHTML = `
            <div class="text-center text-red-600 py-10">
                <p>Gagal memuat layanan. <a href="service.html" class="text-brand underline">Kembali ke katalog</a></p>
            </div>
        `;
    }
}

// ============================================================
// ATTACH EVENTS
// ============================================================
function attachDetailEvents(data, nama, deskripsi, pricelistUrl) {
    // Konsultasi
    document.getElementById('btnKonsultasi')?.addEventListener('click', () => {
        openConsultationModal(data.slug || data.id, nama);
    });

    // Booking
    document.getElementById('btnBooking')?.addEventListener('click', () => {
        openBookingModal(data.slug || data.id, nama);
    });

    // Share
    document.getElementById('btnShare')?.addEventListener('click', async () => {
        const shareUrl = window.location.href;
        const shareTitle = nama;
        const shareText = deskripsi || `Layanan ${nama} di IMDKOM`;

        if (navigator.share) {
            try {
                await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }
        try {
            await navigator.clipboard.writeText(shareUrl);
            showToast('Link berhasil disalin');
        } catch {
            window.prompt('Salin link ini:', shareUrl);
        }
    });
}

// ============================================================
// META HELPERS
// ============================================================
function setMeta(property, content) {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function setMetaName(name, content) {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

// ============================================================
// MODAL KONSULTASI
// ============================================================
export function openConsultationModal(slug, serviceName) {
    const modal = document.getElementById('consultationModal');
    if (!modal) return;
    document.getElementById('consultationService').value = slug;
    document.getElementById('consultationServiceLabel').textContent = serviceName;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

export function closeConsultationModal() {
    document.getElementById('consultationModal')?.classList.add('hidden');
    document.body.style.overflow = '';
}

// ============================================================
// MODAL BOOKING
// ============================================================
export function openBookingModal(slug, serviceName) {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;
    document.getElementById('bookingServiceSlug').value = slug;
    document.getElementById('bookingServiceLabel').textContent = serviceName;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

export function closeBookingModal() {
    document.getElementById('bookingModal')?.classList.add('hidden');
    document.body.style.overflow = '';
}

// ============================================================
// KALKULASI JARAK & BIAYA
// ============================================================
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateVisitCost(distanceKm) {
    const { radiusGratis, biayaDasar, biayaPerKm } = visitRate;
    if (distanceKm <= radiusGratis) {
        return { cost: 0, costFormatted: 'GRATIS', note: `Jarak ≤ ${radiusGratis} km, GRATIS 🎉`, isFree: true };
    }
    const extraKm = Math.ceil(distanceKm - radiusGratis);
    const totalCost = biayaDasar + (extraKm * biayaPerKm);
    return {
        cost: totalCost,
        costFormatted: `Rp ${totalCost.toLocaleString('id-ID')}`,
        note: `Biaya dasar Rp ${biayaDasar.toLocaleString('id-ID')} + ${extraKm} km × Rp ${biayaPerKm.toLocaleString('id-ID')}`,
        isFree: false
    };
}

function updateDistanceInfo() {
    const distanceValue = document.getElementById('distanceValue');
    const distanceCost = document.getElementById('distanceCost');
    const distanceNote = document.getElementById('distanceNote');
    const distanceInfo = document.getElementById('distanceInfo');

    if (!currentLocation.lat || !currentLocation.lng) {
        if (distanceInfo) distanceInfo.classList.add('hidden');
        return;
    }

    const distanceKm = calculateDistance(
        IMDKOM_LOCATION.lat, IMDKOM_LOCATION.lng,
        currentLocation.lat, currentLocation.lng
    );
    const costInfo = calculateVisitCost(distanceKm);

    currentLocation.distance = distanceKm;
    currentLocation.visitCost = costInfo.cost;
    currentLocation.visitCostFormatted = costInfo.costFormatted;

    if (distanceValue) distanceValue.textContent = `${distanceKm.toFixed(2)} km`;
    if (distanceCost) distanceCost.textContent = costInfo.costFormatted;
    if (distanceNote) distanceNote.textContent = costInfo.note;

    if (distanceInfo) {
        distanceInfo.style.background = costInfo.isFree ? 'rgba(5, 150, 105, 0.08)' : 'rgba(194, 65, 12, 0.06)';
        distanceInfo.style.border = costInfo.isFree ? '1px solid rgba(5, 150, 105, 0.2)' : '1px solid rgba(194, 65, 12, 0.15)';
    }
}

// ============================================================
// GEOLOCATION
// ============================================================
export function initGeolocation() {
    const checkbox = document.getElementById('useCurrentLocation');
    const success = document.getElementById('locationSuccess');
    const loading = document.getElementById('locationLoading');
    const error = document.getElementById('locationError');
    const errorText = document.getElementById('locationErrorText');
    const removeBtn = document.getElementById('removeLocation');

    if (!checkbox) return;

    checkbox.addEventListener('change', function() {
        if (this.checked) {
            success?.classList.add('hidden');
            error?.classList.add('hidden');

            if (!navigator.geolocation) {
                error?.classList.remove('hidden');
                if (errorText) errorText.textContent = 'Browser tidak mendukung fitur lokasi.';
                this.checked = false;
                return;
            }

            loading?.classList.remove('hidden');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    loading?.classList.add('hidden');
                    currentLocation.lat = position.coords.latitude;
                    currentLocation.lng = position.coords.longitude;
                    currentLocation.mapsLink = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`;
                    success?.classList.remove('hidden');
                    updateDistanceInfo();

                    const alamat = document.getElementById('bookingAlamat');
                    if (alamat && !alamat.value.trim()) {
                        alamat.value = `Lokasi via Google Maps: ${currentLocation.mapsLink}`;
                    }
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                },
                (err) => {
                    loading?.classList.add('hidden');
                    error?.classList.remove('hidden');
                    let msg = 'Gagal mendapatkan lokasi.';
                    if (err.code === err.PERMISSION_DENIED) msg = 'Izin lokasi ditolak.';
                    if (err.code === err.POSITION_UNAVAILABLE) msg = 'Informasi lokasi tidak tersedia.';
                    if (err.code === err.TIMEOUT) msg = 'Waktu permintaan lokasi habis.';
                    if (errorText) errorText.textContent = msg;
                    this.checked = false;
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            resetLocation();
        }
    });

    removeBtn?.addEventListener('click', () => {
        checkbox.checked = false;
        resetLocation();
    });
}

export function resetLocation() {
    currentLocation = {
        lat: null, lng: null, mapsLink: '',
        distance: null, visitCost: 0, visitCostFormatted: ''
    };
    ['locationSuccess', 'locationError', 'locationLoading'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
    });
    const alamat = document.getElementById('bookingAlamat');
    if (alamat) alamat.value = '';
}

// ============================================================
// TIPE SERVICE TOGGLE
// ============================================================
export function initTipeServiceToggle() {
    const radios = document.querySelectorAll('input[name="tipeService"]');
    const alamatField = document.getElementById('bookingAlamatField');
    const alamatInput = document.getElementById('bookingAlamat');

    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'Service Panggil') {
                alamatField?.classList.remove('hidden');
                if (alamatInput) alamatInput.required = true;
            } else {
                alamatField?.classList.add('hidden');
                if (alamatInput) alamatInput.required = false;
                resetLocation();
                const cb = document.getElementById('useCurrentLocation');
                if (cb) cb.checked = false;
            }
        });
    });
}

// ============================================================
// SUBMIT KONSULTASI
// ============================================================
export function initConsultationForm() {
    const form = document.getElementById('consultationForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const nama = document.getElementById('consultationNama').value.trim();
        const wa = document.getElementById('consultationWa').value.trim();
        const device = document.getElementById('consultationDevice').value.trim();
        const masalah = document.getElementById('consultationMasalah').value.trim();
        const serviceName = document.getElementById('consultationServiceLabel').textContent;

        if (!nama || !wa || !device || !masalah) {
            alert('Mohon lengkapi semua field.');
            return;
        }

        let message = `*KONSULTASI SERVICE - IMDKOM*\n\n`;
        message += `> Layanan: ${serviceName}\n`;
        message += `> Nama: ${nama}\n`;
        message += `> No. WhatsApp: ${wa}\n`;
        message += `> Device: ${device}\n`;
        message += `> Masalah: ${masalah}\n\n`;
        message += `Mohon dibantu konsultasinya. Terima kasih!`;

        openWhatsApp(message);
        closeConsultationModal();
        this.reset();
    });
}

// ============================================================
// SUBMIT BOOKING
// ============================================================
export function initBookingForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const tipeService = document.querySelector('input[name="tipeService"]:checked')?.value || 'Datang ke Toko';
        const nama = document.getElementById('bookingNama').value.trim();
        const wa = document.getElementById('bookingWa').value.trim();
        const alamat = document.getElementById('bookingAlamat').value.trim();
        const device = document.getElementById('bookingDevice').value.trim();
        const masalah = document.getElementById('bookingMasalah').value.trim();
        const tanggal = document.getElementById('bookingTanggal').value;
        const waktu = document.getElementById('bookingWaktu').value;
        const serviceName = document.getElementById('bookingServiceLabel').textContent;

        if (!nama || !wa || !device || !masalah) {
            alert('Mohon lengkapi semua field wajib.');
            return;
        }
        if (tipeService === 'Service Panggil' && !alamat) {
            alert('Mohon isi alamat untuk Service Panggil.');
            return;
        }

        let jadwalText = 'Fleksibel (dijadwalkan teknisi)';
        if (tanggal || waktu) {
            const parts = [];
            if (tanggal) {
                const d = new Date(tanggal);
                parts.push(d.toLocaleDateString('id-ID', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                }));
            }
            if (waktu) parts.push(`pukul ${waktu}`);
            jadwalText = parts.join(', ');
        }

        let message = `*BOOKING SERVICE - IMDKOM*\n\n`;
        message += `> Layanan: ${serviceName}\n`;
        message += `> Tipe: ${tipeService}\n`;
        message += `> Nama: ${nama}\n`;
        message += `> No. WhatsApp: ${wa}\n`;

        if (tipeService === 'Service Panggil' && alamat) {
            message += `> Alamat: ${alamat}\n`;
            if (currentLocation.mapsLink) message += `> Google Maps: ${currentLocation.mapsLink}\n`;
            if (currentLocation.distance) {
                message += `> Jarak: ${currentLocation.distance.toFixed(2)} km\n`;
                message += `> Biaya Kunjungan: ${currentLocation.visitCostFormatted}\n`;
            }
        }

        message += `> Device: ${device}\n`;
        message += `> Masalah: ${masalah}\n`;
        message += `> Jadwal: ${jadwalText}\n\n`;
        message += `Mohon konfirmasi booking saya. Terima kasih!`;

        openWhatsApp(message);
        closeBookingModal();
        this.reset();
        resetLocation();
        document.getElementById('bookingAlamatField')?.classList.add('hidden');
        const cb = document.getElementById('useCurrentLocation');
        if (cb) cb.checked = false;
    });
}

// ============================================================
// TOAST
// ============================================================
function showToast(message) {
    const existing = document.getElementById('shareToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'shareToast';
    toast.style.cssText = `
        position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
        background: #1a3c5e; color: white; padding: 12px 24px; border-radius: 12px;
        font-size: 14px; font-weight: 600; z-index: 9999;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2); max-width: 90vw; text-align: center;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// ============================================================
// LOAD REKOMENDASI LAYANAN LAIN
// - Prioritas: layanan dengan kategori sama
// - Sisa slot: layanan lain (urut `order`)
// - Total: 4 card
// ============================================================
export async function loadRecommendations(currentId) {
    const section = document.getElementById('recommendationSection');
    const container = document.getElementById('recommendationContainer');
    if (!section || !container) return;

    try {
        const q = query(
            collection(db, 'services'),
            where('aktif', '==', true),
            orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);

        const all = [];
        let currentKategori = '';
        snapshot.forEach(docSnap => {
            const data = { id: docSnap.id, ...docSnap.data() };
            all.push(data);
            if (docSnap.id === currentId) {
                currentKategori = data.kategori || '';
            }
        });

        const sameKategori = all.filter(s =>
            s.id !== currentId &&
            currentKategori &&
            s.kategori === currentKategori
        );

        const otherKategori = all.filter(s =>
            s.id !== currentId &&
            (!currentKategori || s.kategori !== currentKategori)
        );

        let recommendations = sameKategori.slice(0, 4);
        if (recommendations.length < 4) {
            const existingIds = new Set(recommendations.map(r => r.id));
            const fill = otherKategori
                .filter(s => !existingIds.has(s.id))
                .slice(0, 4 - recommendations.length);
            recommendations = recommendations.concat(fill);
        }

        if (recommendations.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        let html = '';
        recommendations.forEach((service) => {
            const imageUrl = service.gambar
                ? optimizeCloudinaryUrl(service.gambar, { width: 600, height: 750, crop: 'fill' })
                : PLACEHOLDER_IMAGE;

            const detailUrl = `service-detail.html?id=${service.id}`;
            const nama = service.nama || 'Layanan';
            const deskripsi = service.deskripsiSingkat || service.deskripsi || '';
            const harga = service.hargaMulai || '';

            html += `
                <a href="${escapeHtml(detailUrl)}" class="course-item block cursor-pointer hover:opacity-95 transition-opacity">
                    <div class="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-gray-100 mb-3">
                        <img src="${imageUrl}" alt="${escapeHtml(nama)}"
                             class="w-full h-full object-cover" loading="lazy"
                             onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';" />
                        ${service.kategori ? `
                            <span class="badge-kategori">${escapeHtml(service.kategori)}</span>
                        ` : ''}
                    </div>
                    <h5 class="text-base font-semibold text-brand line-clamp-1 leading-tight">
                        ${escapeHtml(nama)}
                    </h5>
                    <p class="text-xs text-gray-500 mt-1 line-clamp-1">
                        ${escapeHtml(service.kategori || '')}
                    </p>
                    <p class="text-sm text-gray-600 mt-2 line-clamp-2 leading-snug flex-1">
                        ${escapeHtml(deskripsi)}
                    </p>
                    ${harga ? `
                        <p class="text-xs text-gray-500 mt-2">
                            Mulai <span class="font-bold text-brand text-sm">${escapeHtml(harga)}</span>
                        </p>
                    ` : ''}
                    <p class="text-brand font-medium text-xs mt-2">Lihat Detail →</p>
                </a>
            `;
        });

        container.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (error) {
        console.error('Error loading recommendations:', error);
        section.style.display = 'none';
    }
}

// ============================================================
// EXPOSE KE WINDOW (untuk onclick di HTML)
// ============================================================
window.openConsultationModal = openConsultationModal;
window.closeConsultationModal = closeConsultationModal;
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;