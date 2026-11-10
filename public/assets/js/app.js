// ============================================================
// Aplikasi Public — Load data dari Firestore
// IMDKOM Yogyakarta
// ============================================================

import { db, collection, getDocs, query, where, orderBy, limit, getDoc, doc } from './firebase.js';
import { truncateText, formatRupiah, escapeHtml } from './utils.js';
import { optimizeCloudinaryUrl } from './cloudinary.js';
import { openWhatsAppProgram, openWhatsAppService, openWhatsAppGeneric } from './whatsapp.js';

// ============================================================
// CACHE PROGRAM — untuk filter client-side
// ============================================================
let __programsCache = [];
let __displayLimit = 8;
let __filteredPrograms = [];

// ============================================================
// HELPER: Build image URL dengan fallback
// ============================================================
function buildImageUrl(gambarPath, options, fallback) {
    if (!gambarPath) return fallback;
    return optimizeCloudinaryUrl(gambarPath, options) || fallback;
}

// ============================================================
// HELPER: Parse harga promo & label
// ============================================================
function getPromoInfo(data) {
    const hasPromo = data.hargaPromo && String(data.hargaPromo).trim() !== '';
    return {
        hasPromo,
        label: hasPromo ? (data.labelPromo?.trim() || 'PROMO') : '',
        hargaAsli: data.harga || '',
        hargaPromo: hasPromo ? data.hargaPromo : ''
    };
}

// ============================================================
// HELPER: Render harga (dengan/tanpa promo)
// ============================================================
function renderHarga(data, options = {}) {
    const { size = 'md', align = 'left' } = options;
    const promo = getPromoInfo(data);

    const sizeClasses = {
        sm: { asli: 'text-xs', promo: 'text-sm', normal: 'text-sm' },
        md: { asli: 'text-sm', promo: 'text-base', normal: 'text-base' },
        lg: { asli: 'text-base', promo: 'text-2xl', normal: 'text-2xl' }
    };
    const s = sizeClasses[size] || sizeClasses.md;
    const alignClass = align === 'right' ? 'text-right' : '';

    if (promo.hasPromo) {
        return `
            <div class="${alignClass}">
                <div class="${s.asli} text-gray-500 line-through">${formatRupiah(promo.hargaAsli)}</div>
                <div class="${s.promo} font-bold text-brand">${formatRupiah(promo.hargaPromo)}</div>
            </div>
        `;
    }
    return `<div class="${alignClass} ${s.normal} font-bold text-brand">${formatRupiah(promo.hargaAsli)}</div>`;
}

// ============================================================
// HELPER: Share Program (native share + fallback WhatsApp)
// ============================================================
function attachShareHandler(container) {
    container.querySelectorAll('.share-program-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            const programId = this.dataset.programId;
            const programName = this.dataset.programName;
            const programDesc = this.dataset.programDesc;

            const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
            const shareUrl = `${baseUrl}program-detail.html?id=${programId}`;

            const shareTitle = programName;
            const shareText = `Program Kursus IMDKOM: ${programName}`;

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: shareTitle,
                        text: shareText,
                        url: shareUrl
                    });
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return;
                    console.log('Native share error, fallback ke WhatsApp:', err);
                }
            }

            const waText = `*${shareTitle}*\n\n${programDesc}\n\nDetail: ${shareUrl}`;
            const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;
            window.open(waUrl, '_blank', 'noopener,noreferrer');
        });
    });
}

// ============================================================
// LOAD PROGRAM KURSUS (Preview di Homepage) — 4:5
// ============================================================
export async function loadCoursePreview() {
    const container = document.getElementById('coursePreviewContainer');
    if (!container) return;

    try {
        const q = query(
            collection(db, 'programs'),
            where('aktif', '==', true),
            orderBy('order', 'asc'),
            limit(4)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="col-span-full text-center text-gray-500 py-8">
                    Belum ada program tersedia. Silakan cek kembali nanti.
                </div>
            `;
            return;
        }

        let html = '';
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const imageUrl = buildImageUrl(
                data.gambar,
                { width: 600, height: 750, crop: 'fill' },
                'assets/images/programs/default.jpg'
            );
            const promo = getPromoInfo(data);
            
            html += `
    <div class="program-card">
        <a href="program-detail.html?id=${docSnap.id}" class="block program-image-link" aria-label="Lihat detail ${escapeHtml(data.nama || 'Program')}">
            <div class="program-image-wrapper">
                <img src="${imageUrl}"
                     alt="${escapeHtml(data.nama || 'Program')}"
                     class="w-full h-full object-cover"
                     loading="eager" />
                ${promo.hasPromo ? `
                    <span class="badge-promo"><span>${escapeHtml(promo.label)}</span></span>
                ` : ''}
                ${data.kategori ? `
                    <span class="badge-kategori">${escapeHtml(data.kategori)}</span>
                ` : ''}
            </div>
        </a>

        <div class="program-card-body">
            <a href="program-detail.html?id=${docSnap.id}" class="block group">
                <h3 class="program-card-title">
                    ${escapeHtml(data.nama || 'Program')}
                </h3>
            </a>
            <p class="text-xs text-gray-500 mt-1">${escapeHtml(data.kategori || '')}</p>
            <p class="text-sm text-gray-600 mt-1.5 line-clamp-2 flex-1">
                ${escapeHtml(data.deskripsiSingkat || data.deskripsi || '')}
            </p>
            <div class="mt-2">
                ${renderHarga(data, { size: 'md' })}
            </div>
            <div class="mt-3 flex gap-1.5">
                <a href="program-detail.html?id=${docSnap.id}" class="program-btn-primary" style="flex:1">
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                    Lihat Detail
                </a>
                <button class="share-program-btn program-btn-ghost" style="flex:none"
                        data-program-id="${docSnap.id}"
                        data-program-name="${escapeHtml(data.nama || 'Program')}"
                        data-program-desc="${escapeHtml(truncateText(data.deskripsiSingkat || data.deskripsi || '', 100))}"
                        title="Bagikan">
                    <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        </div>
    </div>
`;
        });
        container.innerHTML = html;
        attachShareHandler(container);
    } catch (error) {
        console.error('Error loading courses:', error);
        container.innerHTML = `
            <div class="col-span-full text-center text-red-600 py-8">
                Gagal memuat program. Silakan refresh halaman.
            </div>
        `;
    }
}

// ============================================================
// LOAD COMPUTER SERVICE (Preview di Homepage) — 4:5
// ============================================================
export async function loadServicePreview() {
    const container = document.getElementById('servicePreviewContainer');
    if (!container) return;

    try {
        const q = query(
            collection(db, 'services'),
            where('aktif', '==', true),
            orderBy('order', 'asc'),
            limit(4)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="col-span-full text-center text-gray-500 py-8">
                    Belum ada layanan tersedia. Silakan cek kembali nanti.
                </div>
            `;
            return;
        }

        let html = '';
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const imageUrl = buildImageUrl(
                data.gambar,
                { width: 600, height: 750, crop: 'fill' },
                'assets/images/services/default.jpg'
            );
            const serviceName = escapeHtml(data.nama || 'Layanan');
            
            // ⭐ Homepage card → service-detail.html?id=xxx
            const targetUrl = `service-detail.html?id=${docSnap.id}`;
            
            html += `
    <div class="program-card">
        <a href="${targetUrl}" class="block program-image-link" aria-label="Lihat detail ${serviceName}">
            <div class="program-image-wrapper">
                <img src="${imageUrl}"
                     alt="${serviceName}"
                     class="w-full h-full object-cover"
                     loading="eager" />
                ${data.kategori ? `
                    <span class="badge-kategori">${escapeHtml(data.kategori)}</span>
                ` : ''}
            </div>
        </a>

        <div class="program-card-body">
            <a href="${targetUrl}" class="block group">
                <h3 class="program-card-title">${serviceName}</h3>
            </a>
            <p class="text-xs text-gray-500 mt-1">${escapeHtml(data.kategori || '')}</p>
            <p class="text-sm text-gray-600 mt-1.5 line-clamp-2 flex-1">
                ${escapeHtml(data.deskripsi || '')}
            </p>
            ${data.hargaMulai ? `
                <p class="text-xs text-gray-500 mt-2">Mulai dari</p>
                <p class="text-sm font-bold text-[#0d0d0d]">${formatRupiah(data.hargaMulai)}</p>
            ` : ''}
            <div class="mt-3 flex gap-1.5">
                <a href="${targetUrl}" class="program-btn-primary" style="flex:1">
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                    Lihat Detail
                </a>
                <button class="wa-service-btn program-btn-ghost" style="flex:none"
                        data-service="${serviceName}"
                        title="Tanya via WhatsApp">
                    <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        </div>
    </div>
`;
        });
        container.innerHTML = html;

        container.querySelectorAll('.wa-service-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                openWhatsAppService(btn.dataset.service);
            });
        });
        
    } catch (error) {
        console.error('Error loading services:', error);
        container.innerHTML = `
            <div class="col-span-full text-center text-red-600 py-8">
                Gagal memuat layanan. Silakan refresh halaman.
            </div>
        `;
    }
}

// ============================================================
// LOAD TESTIMONIALS
// ============================================================
export async function loadTestimonials() {
    const section = document.getElementById('testimonialsSection');
    const container = document.getElementById('testimonialsContainer');
    if (!section || !container) return;

    try {
        const q = query(
            collection(db, 'testimonials'),
            where('aktif', '==', true),
            orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        let html = '';
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const avatarUrl = data.foto
                ? optimizeCloudinaryUrl(data.foto, { width: 200, height: 200, crop: 'fill' })
                : 'assets/images/testimonials/default-avatar.jpg';
            
            html += `
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <div class="flex items-center gap-3 mb-3">
                        <img src="${avatarUrl}" alt="${escapeHtml(data.nama || '')}" 
                             class="w-12 h-12 rounded-full object-cover" loading="lazy" />
                        <div>
                            <h6 class="font-semibold text-gray-800">${escapeHtml(data.nama || 'Anonim')}</h6>
                            ${data.program ? `<p class="text-sm text-gray-500">${escapeHtml(data.program)}</p>` : ''}
                        </div>
                    </div>
                    <p class="text-gray-600">"${escapeHtml(data.teks || '')}"</p>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading testimonials:', error);
        section.style.display = 'none';
    }
}

// ============================================================
// LOAD FAQ
// ============================================================
export async function loadFaqs() {
    const section = document.getElementById('faqSection');
    const container = document.getElementById('faqContainer');
    if (!section || !container) return;

    try {
        const q = query(
            collection(db, 'faqs'),
            where('aktif', '==', true),
            orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        let html = '';
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            html += `
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <button class="faq-toggle w-full text-left flex justify-between items-center" data-target="faq-${docSnap.id}">
                        <span class="font-medium text-gray-800">${escapeHtml(data.pertanyaan || '')}</span>
                        <svg class="w-5 h-5 text-gray-400 transition-transform faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    <div id="faq-${docSnap.id}" class="faq-answer mt-2 hidden">
                        <p class="text-gray-600">${escapeHtml(data.jawaban || '')}</p>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        document.querySelectorAll('.faq-toggle').forEach(btn => {
            btn.addEventListener('click', function() {
                const targetId = this.dataset.target;
                const answer = document.getElementById(targetId);
                const icon = this.querySelector('.faq-icon');
                
                answer.classList.toggle('hidden');
                icon.classList.toggle('rotate-180');
            });
        });

    } catch (error) {
        console.error('Error loading FAQs:', error);
        section.style.display = 'none';
    }
}

// LOAD LANDING PAGE CONTENT
// ============================================================
export async function loadLandingPageContent() {
    try {
        const docRef = doc(db, 'landingPage', 'content');
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) return;
        
        const data = docSnap.data();
        
        // ============================================================
        // HERO
        // ============================================================
        if (data.hero) {
            const hero = data.hero;
            
            const heroHeading = document.getElementById('heroHeading');
            const heroSubheading = document.getElementById('heroSubheading');
            const heroDescription = document.getElementById('heroDescription');
            const heroCtaPrimaryMobile = document.getElementById('heroCtaPrimaryMobile');
            
            if (heroHeading && hero.heading) heroHeading.textContent = hero.heading;
            if (heroSubheading && hero.subheading) heroSubheading.textContent = hero.subheading;
            if (heroDescription && hero.deskripsi) heroDescription.textContent = hero.deskripsi;
            if (heroCtaPrimaryMobile && hero.ctaText) heroCtaPrimaryMobile.textContent = hero.ctaText;
            
            const heroHeadingDesktop = document.getElementById('heroHeadingDesktop');
            const heroSubheadingDesktop = document.getElementById('heroSubheadingDesktop');
            const heroDescriptionDesktop = document.getElementById('heroDescriptionDesktop');
            const heroCtaPrimary = document.getElementById('heroCtaPrimary');
            
            if (heroHeadingDesktop && hero.heading) heroHeadingDesktop.textContent = hero.heading;
            if (heroSubheadingDesktop && hero.subheading) heroSubheadingDesktop.textContent = hero.subheading;
            if (heroDescriptionDesktop && hero.deskripsi) heroDescriptionDesktop.textContent = hero.deskripsi;
            if (heroCtaPrimary && hero.ctaText) heroCtaPrimary.textContent = hero.ctaText;
            
            if (hero.gambar) {
                const heroOptimized = optimizeCloudinaryUrl(hero.gambar, { width: 1600, crop: 'limit' });
                const mobileImg = document.querySelector('#heroSection img[alt*="IMDKOM"]');
                if (mobileImg) mobileImg.src = heroOptimized;
                const desktopImg = document.getElementById('heroImageDesktop');
                if (desktopImg) desktopImg.src = heroOptimized;
            }
        }

        // ============================================================
        // SECTION STICKERS — render ke section + global
        // ============================================================
        // ============================================================
        // ABOUT
        // ============================================================
        if (data.about) {
            const about = data.about;
            const aboutTitle = document.getElementById('aboutTitle');
            const aboutDescription = document.getElementById('aboutDescription');
            
            if (aboutTitle && about.judul) aboutTitle.textContent = about.judul;
            if (aboutDescription && about.deskripsi) aboutDescription.textContent = about.deskripsi;
        }

        // ABOUT HIGHLIGHTS
        if (Array.isArray(data.aboutHighlights) && data.aboutHighlights.length > 0) {
            const container = document.getElementById('aboutHighlightsContainer');
            if (container) {
                const sorted = [...data.aboutHighlights].sort((a, b) => (a.order || 0) - (b.order || 0));
                container.innerHTML = sorted.map(h => `
                    <div class="about-highlight-card reveal-item">
                        <div class="about-highlight-icon">
                            <i data-lucide="${escapeHtml(h.icon || 'star')}" class="w-6 h-6"></i>
                        </div>
                        <div class="about-highlight-content">
                            <h3 class="about-highlight-title">${escapeHtml(h.judul || '')}</h3>
                            <p class="about-highlight-desc">${escapeHtml(h.deskripsi || '')}</p>
                        </div>
                    </div>
                `).join('');

                if (typeof lucide !== 'undefined') lucide.createIcons();

                const newItems = container.querySelectorAll('.reveal-item');
                if (newItems.length > 0 && typeof IntersectionObserver !== 'undefined') {
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                entry.target.classList.add('revealed');
                                observer.unobserve(entry.target);
                            }
                        });
                    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
                    newItems.forEach(el => observer.observe(el));
                }
            }
        }
        
        // ============================================================
        // CONTACT
        // ============================================================
        if (data.contact) {
            const contact = data.contact;
            if (contact.whatsapp) {
                const footerWA = document.getElementById('footerWhatsApp');
                if (footerWA) footerWA.textContent = `WhatsApp: ${contact.whatsapp}`;
            }
            if (contact.instagram) {
                const footerIG = document.getElementById('footerInstagram');
                if (footerIG) footerIG.textContent = `Instagram: ${contact.instagram}`;
            }
        }
        
        // ============================================================
        // FOOTER
        // ============================================================
        if (data.footer && data.footer.copyright) {
            const footerCopy = document.getElementById('footerCopyright');
            if (footerCopy) footerCopy.textContent = data.footer.copyright;
        }
        
    } catch (error) {
        console.error('Error loading landing page content:', error);
    }
}

// ============================================================
// HELPER: Ikon benefit berdasarkan kata kunci
// ============================================================
function getBenefitIcon(text) {
    const t = String(text).toLowerCase();
    if (t.includes('sertifikat')) return 'award';
    if (t.includes('modul') || t.includes('materi')) return 'book-open';
    if (t.includes('online') || t.includes('akses')) return 'globe';
    if (t.includes('konsultasi') || t.includes('bimbingan')) return 'message-circle';
    if (t.includes('kerja') || t.includes('karir')) return 'briefcase';
    if (t.includes('garansi')) return 'shield-check';
    if (t.includes('fleksibel') || t.includes('jadwal')) return 'calendar';
    if (t.includes('custom') || t.includes('disesuaikan')) return 'sliders';
    return 'check-circle';
}

// ============================================================
// LOAD SINGLE PROGRAM (Detail)
// ============================================================
export async function loadProgramDetail() {
    const container = document.getElementById('programDetailContainer');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) {
        container.innerHTML = '<div class="detail-error">Program tidak ditemukan.</div>';
        return;
    }

    try {
        const docSnap = await getDoc(doc(db, 'programs', id));
        if (!docSnap.exists()) {
            container.innerHTML = '<div class="detail-error">Program tidak ditemukan.</div>';
            return;
        }

        const data = docSnap.data();
        const promo = getPromoInfo(data);

        const imageUrl = buildImageUrl(
            data.gambar,
            { width: 1200, height: 1500, crop: 'fill' },
            'assets/images/programs/default.jpg'
        );

        const pageTitle = `${data.nama || 'Program'} | IMDKOM Yogyakarta`;
        const pageDesc = truncateText(data.deskripsiSingkat || data.deskripsi || 'Program pelatihan komputer di IMDKOM Yogyakarta.', 160);

        const ogImageUrl = data.gambar
            ? optimizeCloudinaryUrl(data.gambar, { width: 1200, height: 630, crop: 'fill' })
            : 'https://imdkom.com/assets/images/logo/imdkom.svg';

        document.title = pageTitle;

        const setMetaProperty = (property, content) => {
            let el = document.querySelector(`meta[property="${property}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute('property', property);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };

        const setMetaName = (name, content) => {
            let el = document.querySelector(`meta[name="${name}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute('name', name);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };

        setMetaProperty('og:title', data.nama || 'Program Kursus');
        setMetaProperty('og:description', pageDesc);
        setMetaProperty('og:image', ogImageUrl);
        setMetaProperty('og:url', `${window.location.origin}/program-detail?id=${id}`);
        setMetaProperty('og:type', 'article');
        setMetaName('description', pageDesc);
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.rel = 'canonical';
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.href = `${window.location.origin}/program-detail?id=${id}`;
        setMetaName('twitter:card', 'summary_large_image');
        setMetaName('twitter:title', data.nama || 'Program Kursus');
        setMetaName('twitter:description', pageDesc);
        setMetaName('twitter:image', ogImageUrl);

        let materiHtml = '';
        if (data.materi && Array.isArray(data.materi) && data.materi.length > 0) {
            materiHtml = '<div class="pd-checklist">';
            data.materi.forEach(item => {
                materiHtml += `
                    <div class="pd-check-item">
                        <svg class="pd-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>${escapeHtml(item)}</span>
                    </div>
                `;
            });
            materiHtml += '</div>';
        }

        let benefitHtml = '';
        if (data.benefit && Array.isArray(data.benefit) && data.benefit.length > 0) {
            benefitHtml = '<div class="pd-benefit-grid">';
            data.benefit.forEach(item => {
                const icon = getBenefitIcon(item);
                benefitHtml += `
                    <div class="pd-benefit-card">
                        <div class="pd-benefit-icon">
                            <i data-lucide="${icon}" class="w-4 h-4"></i>
                        </div>
                        <span class="pd-benefit-text">${escapeHtml(item)}</span>
                    </div>
                `;
            });
            benefitHtml += '</div>';
        }

        const totalPertemuan = parseInt(data.totalPertemuan) || 0;
        const jamPerSesi = parseFloat(data.jamPerSesi) || 0;
        const totalJam = totalPertemuan * jamPerSesi;

        let durasiSesiHtml = '';
        if (totalPertemuan > 0 || jamPerSesi > 0 || data.durasi) {
            durasiSesiHtml = `
                <div class="pd-stats">
                    ${data.durasi ? `
                        <div class="pd-stat">
                            <div class="pd-stat-label">
                                <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                                <span>Durasi</span>
                            </div>
                            <p class="pd-stat-value">${escapeHtml(data.durasi)}</p>
                        </div>
                    ` : ''}
                    ${totalPertemuan > 0 ? `
                        <div class="pd-stat">
                            <div class="pd-stat-label">
                                <i data-lucide="calendar-days" class="w-3.5 h-3.5"></i>
                                <span>Pertemuan</span>
                            </div>
                            <p class="pd-stat-value">${totalPertemuan}x</p>
                        </div>
                    ` : ''}
                    ${jamPerSesi > 0 ? `
                        <div class="pd-stat">
                            <div class="pd-stat-label">
                                <i data-lucide="timer" class="w-3.5 h-3.5"></i>
                                <span>Jam / Sesi</span>
                            </div>
                            <p class="pd-stat-value">${jamPerSesi} jam</p>
                        </div>
                    ` : ''}
                    ${totalJam > 0 ? `
                        <div class="pd-stat">
                            <div class="pd-stat-label">
                                <i data-lucide="bar-chart-3" class="w-3.5 h-3.5"></i>
                                <span>Total Jam</span>
                            </div>
                            <p class="pd-stat-value">${totalJam} jam</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        let levelHtml = '';
        if (data.level) {
            levelHtml = `
                <span class="pd-level">
                    <i data-lucide="signal" class="w-3.5 h-3.5"></i>
                    ${escapeHtml(data.level)}
                </span>
            `;
        }

        let hargaSectionHtml = '';
        if (promo.hasPromo) {
            hargaSectionHtml = `
                <div class="pd-price pd-price-promo">
                    <div class="pd-price-label">
                        <i data-lucide="tag" class="w-3.5 h-3.5"></i>
                        <span>${escapeHtml(promo.label)}</span>
                    </div>
                    <div class="pd-price-row">
                        <span class="pd-price-strike">${formatRupiah(promo.hargaAsli)}</span>
                        <span class="pd-price-final">${formatRupiah(promo.hargaPromo)}</span>
                    </div>
                </div>
            `;
        } else {
            hargaSectionHtml = `
                <div class="pd-price">
                    <p class="pd-price-caption">Biaya Program</p>
                    <p class="pd-price-final">${formatRupiah(promo.hargaAsli)}</p>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="pd-hero">
                <div class="pd-media">
                    <div class="pd-media-wrap">
                        <img src="${imageUrl}" alt="${escapeHtml(data.nama || 'Program')}"
                             class="pd-img" loading="eager" fetchpriority="high" />
                        ${promo.hasPromo ? `
                            <span class="badge-promo badge-promo-lg"><span>${escapeHtml(promo.label)}</span></span>
                        ` : ''}
                    </div>
                </div>
                <div class="pd-body">
                    <div class="pd-kicker-row">
                        ${data.kategori ? `<span class="pd-kicker">${escapeHtml(data.kategori)}</span>` : ''}
                        ${levelHtml}
                    </div>
                    <h1 class="pd-title ant">${escapeHtml(data.nama || 'Program')}</h1>
                    <p class="pd-desc">${escapeHtml(data.deskripsiSingkat || '')}</p>

                    ${hargaSectionHtml}
                    ${durasiSesiHtml}

                    <div class="pd-ctas">
                        <button class="daftar-program-btn pd-btn pd-btn-primary" data-program-id="${docSnap.id}">
                            <i data-lucide="user-plus" class="w-4 h-4"></i>
                            Daftar Sekarang
                        </button>
                        <button class="wa-program-btn pd-btn pd-btn-wa" data-program="${escapeHtml(data.nama || 'Program')}">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Tanya Program Ini
                        </button>
                        <button class="share-detail-btn pd-btn pd-btn-ghost"
                                data-program-name="${escapeHtml(data.nama || 'Program')}"
                                data-program-desc="${escapeHtml(truncateText(data.deskripsiSingkat || data.deskripsi || '', 100))}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                            </svg>
                            Bagikan
                        </button>
                    </div>
                </div>
            </div>

            ${materiHtml ? `
                <div class="pd-section">
                    <h2 class="pd-section-title">
                        <i data-lucide="book-open" class="pd-section-icon"></i>
                        Materi Pembelajaran
                    </h2>
                    ${materiHtml}
                </div>
            ` : ''}

            ${benefitHtml ? `
                <div class="pd-section">
                    <h2 class="pd-section-title">
                        <i data-lucide="gift" class="pd-section-icon"></i>
                        Yang Anda Dapatkan
                    </h2>
                    ${benefitHtml}
                </div>
            ` : ''}

            ${data.deskripsi ? `
                <div class="pd-section">
                    <h2 class="pd-section-title">
                        <i data-lucide="file-text" class="pd-section-icon"></i>
                        Tentang Program Ini
                    </h2>
                    <p class="pd-about">${escapeHtml(data.deskripsi)}</p>
                </div>
            ` : ''}

        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

        const waBtn = container.querySelector('.wa-program-btn');
        if (waBtn) {
            waBtn.addEventListener('click', function() {
                openWhatsAppProgram(this.dataset.program);
            });
        }

        const shareBtn = container.querySelector('.share-detail-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                const programName = this.dataset.programName;
                const programDesc = this.dataset.programDesc;
                const shareUrl = window.location.href;
                
                if (navigator.share) {
                    try {
                        await navigator.share({ title: programName, text: `Program Kursus IMDKOM: ${programName}`, url: shareUrl });
                        return;
                    } catch (err) {
                        if (err.name === 'AbortError') return;
                    }
                }
                const waText = `*${programName}*\n\n${programDesc}\n\nDetail: ${shareUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank', 'noopener,noreferrer');
            });
        }

        const daftarBtn = container.querySelector('.daftar-program-btn');
        if (daftarBtn) {
            daftarBtn.addEventListener('click', function() {
                window.location.href = 'register.html?program=' + this.dataset.programId;
            });
        }

        await loadRecommendations(id);

    } catch (error) {
        console.error('Error loading program detail:', error);
        container.innerHTML = '<div class="detail-error">Gagal memuat detail program.</div>';
    }
}

// ============================================================
// LOAD REKOMENDASI PROGRAM LAIN
// ============================================================
async function loadRecommendations(currentId) {
    const section = document.getElementById('recommendationSection');
    const container = document.getElementById('recommendationContainer');
    if (!section || !container) return;

    try {
        const q = query(
            collection(db, 'programs'),
            where('aktif', '==', true),
            orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);

        const promos = [];
        const others = [];

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const hasPromo = data.hargaPromo && String(data.hargaPromo).trim() !== '';
            const item = { id: docSnap.id, ...data };

            if (hasPromo) {
                promos.push(item);
            } else {
                others.push(item);
            }
        });

        let recommendations = promos.slice(0, 4);

        if (recommendations.length < 4) {
            const sisaSlot = 4 - recommendations.length;
            const existingIds = new Set(recommendations.map(p => p.id));
            const nonPromoFill = others
                .filter(p => !existingIds.has(p.id))
                .slice(0, sisaSlot);
            recommendations = recommendations.concat(nonPromoFill);
        }

        if (recommendations.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        let html = '';
        recommendations.forEach((prog) => {
            const imageUrl = buildImageUrl(
                prog.gambar,
                { width: 600, height: 750, crop: 'fill' },
                'assets/images/programs/default.jpg'
            );
            const promo = getPromoInfo(prog);

            html += `
                <a href="program-detail.html?id=${prog.id}" class="rec-card">
                    <div class="rec-media">
                        <img src="${imageUrl}" alt="${escapeHtml(prog.nama || 'Program')}"
                             class="rec-img" loading="eager" />
                        ${promo.hasPromo ? `
                            <span class="badge-promo"><span>${escapeHtml(promo.label)}</span></span>
                        ` : ''}
                    </div>
                    <h3 class="rec-title">${escapeHtml(prog.nama || 'Program')}</h3>
                    ${prog.kategori ? `<p class="rec-cat">${escapeHtml(prog.kategori)}</p>` : ''}
                    <div class="rec-price">${renderHarga(prog, { size: 'md' })}</div>
                    <span class="rec-cta">Lihat Detail</span>
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
// LOAD ALL PROGRAMS (Halaman Kursus)
// ============================================================
export async function loadAllPrograms() {
    const container = document.getElementById('allProgramsContainer');
    if (!container) return;

    try {
        const q = query(
            collection(db, 'programs'),
            where('aktif', '==', true),
            orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="col-span-full text-center text-gray-500 py-16">
                    <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="book-open" class="w-10 h-10 text-gray-300"></i>
                    </div>
                    <h4 class="text-xl font-medium text-gray-700">Belum ada program tersedia</h4>
                    <p class="mt-1 text-sm">Silakan cek kembali nanti.</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        __programsCache = [];
        snapshot.forEach((docSnap) => {
            __programsCache.push({ id: docSnap.id, ...docSnap.data() });
        });

        __displayLimit = 8;
        __filteredPrograms = __programsCache;
        renderProgramCards(__filteredPrograms, true);

    } catch (error) {
        console.error('Error loading all programs:', error);
        container.innerHTML = `
            <div class="col-span-full text-center text-red-600 py-12">
                <i data-lucide="alert-circle" class="w-12 h-12 mx-auto text-red-300 mb-3"></i>
                <p class="font-medium">Gagal memuat program</p>
                <p class="text-gray-500 text-xs mt-1">${error.message}</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// ============================================================
// RENDER PROGRAM CARDS
// ============================================================
function renderProgramCards(programs, isInitialLoad = false) {
    const container = document.getElementById('allProgramsContainer');
    const loadMoreWrapper = document.getElementById('loadMoreWrapper');
    if (!container) return;

    if (programs.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center text-gray-500 py-16">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="search-x" class="w-10 h-10 text-gray-300"></i>
                </div>
                <h4 class="text-xl font-medium text-gray-700">Tidak ada program yang cocok</h4>
                <p class="mt-1 text-sm">Coba ubah kata kunci atau filter kategori.</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (loadMoreWrapper) loadMoreWrapper.style.display = 'none';
        return;
    }

    const programsToRender = programs.slice(0, __displayLimit);

    let html = '';
    programsToRender.forEach((data) => {
        const imageUrl = buildImageUrl(
            data.gambar,
            { width: 600, height: 750, crop: 'fill' },
            'assets/images/programs/default.jpg'
        );
        const promo = getPromoInfo(data);

        const totalPertemuan = parseInt(data.totalPertemuan) || 0;
        const durasi = data.durasi || '';
        const infoParts = [];
        if (durasi) infoParts.push(`<i data-lucide="clock" class="w-3 h-3 inline"></i> ${escapeHtml(durasi)}`);
        if (totalPertemuan > 0) infoParts.push(`<i data-lucide="calendar-days" class="w-3 h-3 inline"></i> ${totalPertemuan}x`);

        html += `
    <div class="program-card">
        <a href="program-detail.html?id=${data.id}" 
           class="block program-image-link"
           aria-label="Lihat detail ${escapeHtml(data.nama || 'Program')}">
            <div class="program-image-wrapper">
                <img src="${imageUrl}" 
                     alt="${escapeHtml(data.nama || 'Program')}" 
                     loading="lazy" />
                ${promo.hasPromo ? `
                    <span class="badge-promo">${escapeHtml(promo.label)}</span>
                ` : ''}
                ${data.kategori ? `
                    <span class="badge-kategori">${escapeHtml(data.kategori)}</span>
                ` : ''}
            </div>
        </a>

        <div class="program-card-body">
            <a href="program-detail.html?id=${data.id}" 
               class="block group">
                <h3 class="program-card-title">
                    ${escapeHtml(data.nama || 'Program')}
                </h3>
            </a>
                    

                    
                    <div class="mt-auto pt-2">
                        ${renderHarga(data, { size: 'md' })}
                    </div>
                    
                    ${infoParts.length > 0 ? `
                        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1.5">
                            ${infoParts.join('')}
                        </div>
                    ` : ''}
                    
                    <div class="mt-3 space-y-1.5">
                        <a href="program-detail.html?id=${data.id}" 
                           class="program-btn-primary">
                            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                            Lihat Detail
                        </a>
                        
                        <div class="grid grid-cols-2 gap-1.5">
                            <button class="program-btn-wa wa-program-btn"
                                    data-program="${escapeHtml(data.nama || 'Program')}">
                                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                WA
                            </button>
                            
                            <button class="program-btn-ghost share-program-btn"
                                    data-program-id="${data.id}"
                                    data-program-name="${escapeHtml(data.nama || 'Program')}"
                                    data-program-desc="${escapeHtml(truncateText(data.deskripsiSingkat || data.deskripsi || '', 100))}">
                                <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
                                Bagikan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;

    container.querySelectorAll('.wa-program-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            openWhatsAppProgram(this.dataset.program);
        });
    });

    attachShareHandler(container);

    if (typeof lucide !== 'undefined') lucide.createIcons();

    if (loadMoreWrapper) {
        if (programs.length > __displayLimit) {
            loadMoreWrapper.style.display = 'block';
        } else {
            loadMoreWrapper.style.display = 'none';
        }
    }
}

// ============================================================
// LOAD MORE PROGRAMS
// ============================================================
export function loadMorePrograms() {
    __displayLimit += 8;
    renderProgramCards(__filteredPrograms);
    
    const filterInfo = document.getElementById('filterInfo');
    if (filterInfo && filterInfo.textContent) {
        filterInfo.textContent = `Menampilkan ${Math.min(__filteredPrograms.length, __displayLimit)} dari ${__filteredPrograms.length} program`;
    }
}

// ============================================================
// FILTER PROGRAMS
// ============================================================
export function filterPrograms() {
    const searchInput = document.getElementById('searchInput');
    const filterKategori = document.getElementById('filterKategori');
    const filterInfo = document.getElementById('filterInfo');

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const kategori = filterKategori ? filterKategori.value : '';

    let filtered = __programsCache;

    if (kategori) {
        filtered = filtered.filter(p => p.kategori === kategori);
    }

    if (searchTerm) {
        filtered = filtered.filter(p => {
            const nama = (p.nama || '').toLowerCase();
            const desk = (p.deskripsiSingkat || p.deskripsi || '').toLowerCase();
            const kat = (p.kategori || '').toLowerCase();
            return nama.includes(searchTerm) || desk.includes(searchTerm) || kat.includes(searchTerm);
        });
    }

    __displayLimit = 8;
    __filteredPrograms = filtered;

    if (filterInfo) {
        if (searchTerm || kategori) {
            filterInfo.textContent = `Menampilkan ${Math.min(filtered.length, __displayLimit)} dari ${filtered.length} program`;
        } else {
            filterInfo.textContent = '';
        }
    }

    renderProgramCards(__filteredPrograms, true);
}

// ============================================================
// GET CATEGORIES
// ============================================================
export function getCategories() {
    const set = new Set();
    __programsCache.forEach(p => {
        if (p.kategori && p.kategori.trim()) {
            set.add(p.kategori.trim());
        }
    });
    return Array.from(set).sort();
}

// ============================================================
// LOAD ALL SERVICES (Halaman Service)
// ============================================================
export async function loadAllServices() {
    const container = document.getElementById('allServicesContainer');
    if (!container) return;

    try {
        const q = query(
            collection(db, 'services'),
            where('aktif', '==', true),
            orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="col-span-full text-center text-gray-500 py-12">
                    <h4 class="text-xl font-medium">Belum ada layanan tersedia</h4>
                    <p class="mt-1">Silakan cek kembali nanti.</p>
                </div>
            `;
            return;
        }

        let html = '';
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const imageUrl = buildImageUrl(
                data.gambar,
                { width: 600, height: 800, crop: 'fill' },
                'assets/images/services/default.jpg'
            );
            const serviceName = escapeHtml(data.nama || 'Layanan');
            
            html += `
                <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <img src="${imageUrl}" alt="${serviceName}" 
                         class="w-full aspect-[3/4] object-cover rounded-lg bg-gray-100 mb-3" loading="lazy" />
                    <h5 class="text-lg font-semibold text-brand">${serviceName}</h5>
                    <p class="text-sm text-gray-500">${escapeHtml(data.kategori || '')}</p>
                    <p class="text-gray-600 text-sm mt-1">${escapeHtml(truncateText(data.deskripsi || '', 100))}</p>
                    ${data.hargaMulai ? `<p class="text-sm text-gray-500 mt-1">Mulai ${formatRupiah(data.hargaMulai)}</p>` : ''}
                    <button class="wa-service-btn mt-3 text-brand hover:text-brand-light font-medium text-sm border-b-2 border-brand hover:border-brand-light transition-colors" 
                            data-service="${serviceName}">
                        Tanya via WhatsApp →
                    </button>
                </div>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll('.wa-service-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                openWhatsAppService(this.dataset.service);
            });
        });

    } catch (error) {
        console.error('Error loading all services:', error);
        container.innerHTML = `
            <div class="col-span-full text-center text-red-600 py-12">
                Gagal memuat layanan. Silakan refresh halaman.
            </div>
        `;
    }
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    
    if (path.endsWith('index.html') || path === '/' || path === '') {
        await loadLandingPageContent();
        await loadCoursePreview();
        await loadServicePreview();
        await loadTestimonials();
        await loadFaqs();
    }
    
    if (path.endsWith('kursus.html')) {
        await loadAllPrograms();
    }
    
    if (path.endsWith('program-detail.html')) {
        await loadProgramDetail();
    }
    
    if (path.endsWith('service.html')) {
        await loadAllServices();
    }
});