// ============================================================
// JOBS KATALOG — karir.html
// Load lowongan (collection 'jobs') + search + filter tipe/kategori
// + modal detail + apply WhatsApp + share
// Tambahkan ?demo=1 di URL untuk preview contoh data (tanpa database)
// ============================================================
import { db, collection, getDocs, query, where, orderBy } from './firebase.js';
import { openWhatsApp } from './whatsapp.js';
import { optimizeCloudinaryUrl } from './cloudinary.js';

const PAGE_SIZE = 6;

const DEMO_JOBS = [
    {
        id: 'demo-1',
        judul: 'IT Support Technician',
        tipe: 'Full Time',
        kategori: 'IT Support',
        lokasi: 'Yogyakarta (On-site)',
        gaji: 'Rp 3.500.000 – Rp 5.000.000',
        deadline: '',
        deskripsiSingkat: 'Memberikan dukungan teknis komputer & laptop pelanggan: diagnosa, perbaikan, dan konsultasi.',
        deskripsi: 'Kami mencari IT Support Technician yang sigap dan rapi dalam melayani pelanggan, baik di toko maupun layanan panggilan.',
        ketentuan: 'Usia minimal 17 tahun\nBisa bekerja on-site di toko Yogyakarta\nBersedia mengikuti SOP layanan IMDKOM',
        tanggungJawab: 'Menerima dan mendiagnosa kerusakan PC/laptop pelanggan\nMelakukan perbaikan hardware & software\nMemberikan estimasi biaya kepada pelanggan\nMencatat progres servis di sistem',
        kriteria: 'Menguasai troubleshooting Windows & penggantian komponen\nKomunikatif dan ramah terhadap pelanggan\nTeliti dan bertanggung jawab\nLebih diutamakan berpengalaman di bidang service komputer',
        gambar: '',
        order: 1,
        aktif: true
    },
    {
        id: 'demo-2',
        judul: 'Teknisi Hardware Freelance',
        tipe: 'Freelance',
        kategori: 'Hardware Repair',
        lokasi: 'Yogyakarta (On-site & Panggilan)',
        gaji: 'Negosiasi (per job)',
        deadline: '',
        deskripsiSingkat: 'Pengerjaan servis hardware fleksibel: perakitan PC, upgrade, dan perbaikan komponen.',
        deskripsi: 'Kerja freelance dengan skema per-job untuk teknisi yang handal merakit dan memperbaiki PC maupun laptop.',
        ketentuan: 'Memiliki peralatan sendiri minimal obeng, ESD wrist strap, dan multimeter\nBersedia datang sesuai penugasan',
        tanggungJawab: 'Merakit PC sesuai spesifikasi pelanggan\nMengganti & memperbaiki komponen (RAM, PSU, motherboard, storage)\nTesting & quality check sebelum diserahkan ke pelanggan',
        kriteria: 'Berpengalaman merakit PC (minimal 20 unit)\nMemahami alur booting & diagnosa hardware\nJujur dan komunikatif\nPortofolio pengerjaan diutamakan',
        gambar: '',
        order: 2,
        aktif: true
    },
    {
        id: 'demo-3',
        judul: 'Magang Administrasi Kursus',
        tipe: 'Magang',
        kategori: 'Administrasi',
        lokasi: 'Yogyakarta (Hybrid)',
        gaji: 'Uang saku',
        deadline: '',
        deskripsiSingkat: 'Membantu operasional administrasi kursus: pendaftaran siswa, jadwal, dan dokumentasi.',
        deskripsi: 'Program magang untuk siswa/mahasiswa yang ingin belajar operasional lembaga kursus komputer secara langsung.',
        ketentuan: 'Siswa/mahasiswa aktif jurusan Administrasi, Manajemen, atau Komputer\nMinimal 3 bulan (WFO hybrid)',
        tanggungJawab: 'Menginput data pendaftaran siswa\nMengatur jadwal kelas & tentor\nMembantu dokumentasi kegiatan kursus\nMerekap pembayaran',
        kriteria: 'Teliti dan rapi dalam administrasi\nMahir Microsoft Excel & Word\nRamah melayani pelanggan\nMau belajar dan aktif bertanya',
        gambar: '',
        order: 3,
        aktif: true
    }
];

const state = {
    allJobs: [],
    filteredJobs: [],
    displayedCount: 0,
    tipe: '',
    kategori: '',
    searchQuery: ''
};

// ============================================================
// HELPERS
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function nl2li(text) {
    return String(text || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
        .map(line => `<li>${escapeHtml(line.replace(/^[-•*]\s*/, ''))}</li>`)
        .join('');
}

function getJobImage(job) {
    if (job.gambar) {
        return optimizeCloudinaryUrl(job.gambar, { width: 800, height: 500, crop: 'fill' });
    }
    return '';
}

function formatDeadline(deadline) {
    if (!deadline) return '';
    try {
        const d = new Date(deadline);
        if (Number.isNaN(d.getTime())) return deadline;
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
        return deadline;
    }
}

// ============================================================
// DEEP LINK (?job=ID atau #/ID — dipakai oleh tombol Share)
// ============================================================
function getRequestedJobId() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('job');
    if (fromQuery) return fromQuery;
    const hashMatch = (window.location.hash || '').match(/^#\/(.+)$/);
    return hashMatch ? decodeURIComponent(hashMatch[1]) : '';
}

// ============================================================
// LOAD
// ============================================================
export async function loadJobs() {
    const container = document.getElementById('jobsContainer');
    if (!container) return;

    const useDemo = new URLSearchParams(window.location.search).has('demo');

    try {
        if (useDemo) {
            state.allJobs = [...DEMO_JOBS];
        } else {
            const q = query(
                collection(db, 'jobs'),
                where('aktif', '==', true),
                orderBy('order', 'asc')
            );
            const snapshot = await getDocs(q);
            state.allJobs = [];
            snapshot.forEach(docSnap => {
                state.allJobs.push({ id: docSnap.id, ...docSnap.data() });
            });
        }

        state.filteredJobs = [...state.allJobs];
        state.displayedCount = 0;

        populateKategoriFilter();
        renderJobs(true);
        updateFilterInfo();
        const wantedId = getRequestedJobId();
        if (wantedId) {
            const wanted = state.allJobs.find(j => j.id === wantedId);
            if (wanted) openJobDetail(wanted);
        }

    } catch (error) {
        console.error('Load jobs error:', error);
        container.innerHTML = `
            <div class="job-empty">
                <i data-lucide="cloud-off" class="w-12 h-12"></i>
                <h3 class="ant">Lowongan belum dapat dimuat</h3>
                <p>Periksa koneksi internet Anda, lalu muat ulang halaman.</p>
                <button type="button" class="job-btn job-btn-primary" onclick="window.location.reload()">
                    <i data-lucide="rotate-cw" class="w-4 h-4"></i> Muat Ulang
                </button>
            </div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// ============================================================
// FILTER
// ============================================================
function populateKategoriFilter() {
    const select = document.getElementById('jobCategoryFilter');
    if (!select) return;

    const kategoriSet = new Set();
    state.allJobs.forEach(job => {
        if (job.kategori && String(job.kategori).trim()) {
            kategoriSet.add(String(job.kategori).trim());
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

export function filterJobs() {
    const searchInput = document.getElementById('jobSearchInput');
    const categorySelect = document.getElementById('jobCategoryFilter');

    state.searchQuery = (searchInput?.value || '').toLowerCase().trim();
    state.kategori = (categorySelect?.value || '').trim();

    state.filteredJobs = state.allJobs.filter(job => {
        const tipeMatch = !state.tipe
            || String(job.tipe || '').trim().toLowerCase() === state.tipe.toLowerCase();

        const kategoriMatch = !state.kategori
            || String(job.kategori || '').trim() === state.kategori;

        const haystack = [job.judul, job.kategori, job.lokasi, job.deskripsiSingkat]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        const searchMatch = !state.searchQuery || haystack.includes(state.searchQuery);

        return tipeMatch && kategoriMatch && searchMatch;
    });

    state.displayedCount = 0;
    renderJobs(true);
    updateFilterInfo();
}

export function setJobTipeFilter(tipe) {
    state.tipe = tipe || '';
    document.querySelectorAll('.job-chip[data-tipe]').forEach(chip => {
        const active = chip.dataset.tipe === state.tipe;
        chip.classList.toggle('is-active', active);
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    filterJobs();
}

function updateFilterInfo() {
    const info = document.getElementById('jobFilterInfo');
    if (!info) return;

    const total = state.filteredJobs.length;
    const countEl = document.getElementById('jobCountBadge');
    if (countEl) countEl.textContent = String(total);

    if (total === 0) {
        info.textContent = 'Tidak ada lowongan yang cocok. Coba ubah kata kunci atau filternya.';
    } else if (state.searchQuery || state.tipe || state.kategori) {
        info.textContent = `Menampilkan ${Math.min(state.displayedCount, total)} dari ${total} posisi.`;
    } else {
        info.textContent = '';
    }
}

// ============================================================
// RENDER
// ============================================================
function renderJobs(reset = false) {
    const container = document.getElementById('jobsContainer');
    const loadMoreWrapper = document.getElementById('jobLoadMoreWrapper');
    if (!container) return;

    if (reset) {
        container.innerHTML = '';
        state.displayedCount = 0;
    }

    const total = state.filteredJobs.length;

    if (total === 0) {
        container.innerHTML = `
            <div class="job-empty">
                <i data-lucide="search-x" class="w-12 h-12"></i>
                <h3 class="ant">Belum ada posisi yang cocok</h3>
                <p>Coba kata kunci lain, atau kirim CV spontan — kami simpan untuk kebutuhan berikutnya.</p>
                <button type="button" class="job-btn job-btn-outline" id="spontaneousFromEmpty">
                    <i data-lucide="send" class="w-4 h-4"></i> Kirim CV Spontan
                </button>
            </div>`;
        document.getElementById('spontaneousFromEmpty')?.addEventListener('click', () => {
            openSpontaneousApplication();
        });
        if (loadMoreWrapper) loadMoreWrapper.style.display = 'none';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    const nextBatch = state.filteredJobs.slice(state.displayedCount, state.displayedCount + PAGE_SIZE);
    nextBatch.forEach(job => container.appendChild(createJobCard(job)));
    state.displayedCount += nextBatch.length;

    if (loadMoreWrapper) {
        loadMoreWrapper.style.display = state.displayedCount < total ? 'block' : 'none';
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

export function loadMoreJobs() {
    renderJobs(false);
    updateFilterInfo();
}

function createJobCard(job) {
    const card = document.createElement('article');
    card.className = 'job-card';

    const imageUrl = getJobImage(job);
    const judul = job.judul || 'Posisi';
    const tipe = job.tipe || 'Full Time';
    const kategori = job.kategori || '';
    const lokasi = job.lokasi || 'Yogyakarta';
    const deadline = formatDeadline(job.deadline);

    card.innerHTML = `
        ${imageUrl ? `
            <div class="job-card-thumb">
                <img src="${escapeHtml(imageUrl)}" alt="Ilustrasi ${escapeHtml(judul)}" loading="lazy" />
            </div>` : ''}
        <div class="job-card-body">
            <div class="job-card-topline">
                <span class="job-badge job-badge-tipe">${escapeHtml(tipe)}</span>
                ${kategori ? `<span class="job-badge job-badge-kategori">${escapeHtml(kategori)}</span>` : ''}
            </div>
            <h3 class="job-card-title ant">${escapeHtml(judul)}</h3>
            <ul class="job-card-meta">
                <li><i data-lucide="map-pin" class="w-4 h-4"></i>${escapeHtml(lokasi)}</li>
                ${job.gaji ? `<li><i data-lucide="banknote" class="w-4 h-4"></i>${escapeHtml(job.gaji)}</li>` : ''}
                ${deadline ? `<li><i data-lucide="calendar-clock" class="w-4 h-4"></i>Tutup ${escapeHtml(deadline)}</li>` : ''}
            </ul>
            <p class="job-card-desc">${escapeHtml(job.deskripsiSingkat || '')}</p>
            <div class="job-card-actions">
                <button type="button" class="job-btn job-btn-ghost" data-action="detail">
                    Detail <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
                <button type="button" class="job-btn job-btn-primary" data-action="apply">
                    <i data-lucide="send" class="w-4 h-4"></i> Lamar
                </button>
                <button type="button" class="job-icon-btn" data-action="share" aria-label="Bagikan lowongan ${escapeHtml(judul)}">
                    <i data-lucide="share-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `;

    card.querySelector('[data-action="detail"]')?.addEventListener('click', () => openJobDetail(job));
    card.querySelector('[data-action="apply"]')?.addEventListener('click', () => applyJob(job));
    card.querySelector('[data-action="share"]')?.addEventListener('click', () => shareJob(job));

    return card;
}

// ============================================================
// MODAL DETAIL
// ============================================================
let lastFocusedEl = null;

export function openJobDetail(job) {
    const modal = document.getElementById('jobDetailModal');
    if (!modal) return;

    const tipe = job.tipe || 'Full Time';
    const kategori = job.kategori || '';
    const deadline = formatDeadline(job.deadline);

    document.getElementById('jobModalTipe').textContent = tipe;
    document.getElementById('jobModalKategori').textContent = kategori;
    document.getElementById('jobModalTitle').textContent = job.judul || 'Posisi';
    document.getElementById('jobModalLokasi').textContent = job.lokasi || 'Yogyakarta';
    document.getElementById('jobModalGaji').textContent = job.gaji || 'Dibahas saat interview';
    document.getElementById('jobModalDeadline').textContent = deadline || 'Menunggu kandidat terbaik';
    document.getElementById('jobModalDeskripsi').textContent = job.deskripsi || '';

    const slot = (id, value, emptyText) => {
        const el = document.getElementById(id);
        if (!el) return;
        const html = nl2li(value);
        el.innerHTML = html
            ? `<ul class="job-modal-list">${html}</ul>`
            : `<p class="job-modal-empty">${emptyText}</p>`;
    };
    slot('jobModalKetentuan', job.ketentuan, 'Tidak ada ketentuan khusus.');
    slot('jobModalTanggungJawab', job.tanggungJawab, 'Akan dijelaskan saat interview.');
    slot('jobModalKriteria', job.kriteria, 'Akan dijelaskan saat interview.');

    const applyBtn = document.getElementById('jobApplyBtn');
    if (applyBtn) {
        applyBtn.onclick = () => applyJob(job);
    }
    const shareBtn = document.getElementById('jobShareBtn');
    if (shareBtn) {
        shareBtn.onclick = () => shareJob(job);
    }

    lastFocusedEl = document.activeElement;
    modal.classList.add('is-open');
    modal.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';

    const closeBtn = document.getElementById('jobModalClose');
    if (closeBtn) closeBtn.focus();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

export function closeJobDetail() {
    const modal = document.getElementById('jobDetailModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
        lastFocusedEl.focus();
    }
    lastFocusedEl = null;
}

// ============================================================
// APPLY (WhatsApp)
// ============================================================
export function applyJob(job) {
    const message = `Halo IMDKOM, saya tertarik melamar posisi *${job.judul || ''}* (${job.tipe || 'Full Time'}). Mohon informasi dan formulir lamarannya. Terima kasih.`;
    openWhatsApp(message);
}

export function openSpontaneousApplication() {
    const message = 'Halo IMDKOM, saya ingin mengirim CV spontan untuk bergabung. Mohon informasikan langkah selanjutnya. Terima kasih.';
    openWhatsApp(message);
}

// ============================================================
// SHARE
// ============================================================
export async function shareJob(job) {
    const url = `${window.location.origin}/karir?job=${encodeURIComponent(job.id || '')}`;
    const title = `Lowongan: ${job.judul || ''} — IMDKOM`;
    const text = job.deskripsiSingkat || `Lowongan ${job.judul || ''} di IMDKOM Yogyakarta`;

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
        showToast('Link lowongan disalin ke clipboard');
    } catch {
        window.prompt('Salin link ini:', url);
    }
}

function showToast(message) {
    const existing = document.getElementById('jobShareToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'jobShareToast';
    toast.className = 'job-toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2500);
}
