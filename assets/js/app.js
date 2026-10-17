// ============================================================
// Aplikasi Public — Load data dari Firestore
// IMDKOM Yogyakarta
// ============================================================

import { db, collection, getDocs, query, where, orderBy, limit, getDoc, doc } from './firebase.js';
import { getImageUrl, truncateText, formatRupiah, escapeHtml } from './utils.js';
import { optimizeCloudinaryUrl } from './cloudinary.js';
import { openWhatsAppProgram, openWhatsAppService, openWhatsAppGeneric } from './whatsapp.js';

// ============================================================
// HELPER: Build image URL dengan fallback
// ============================================================
function buildImageUrl(gambarPath, options, fallback) {
    if (!gambarPath) return fallback;
    return optimizeCloudinaryUrl(gambarPath, options) || fallback;
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

            // Bangun URL detail
            const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
            const shareUrl = `${baseUrl}program-detail.html?id=${programId}`;

            const shareTitle = programName;
            const shareText = `Program Kursus IMDKOM: ${programName}`;

            // ==== COBA NATIVE SHARE API DULU ====
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

            // ==== FALLBACK: WHATSAPP ====
            const waText = `*${shareTitle}*\n\n${programDesc}\n\nDetail: ${shareUrl}`;
            const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;
            window.open(waUrl, '_blank', 'noopener,noreferrer');
        });
    });
}

// ============================================================
// LOAD PROGRAM KURSUS (Preview di Homepage) — 4:3
// ============================================================
export async function loadCoursePreview() {
    const container = document.getElementById('coursePreviewContainer');
    if (!container) return;

    try {
        const q = query(
            collection(db, 'programs'),
            where('aktif', '==', true),
            orderBy('order', 'asc'),
            limit(3)
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
            // 4:3 landscape — compact untuk preview homepage
            const imageUrl = buildImageUrl(
                data.gambar,
                { width: 800, height: 600, crop: 'fill' },
                'assets/images/programs/default.jpg'
            );
            
            html += `
                <div class="course-item border-b border-gray-200 pb-4">
                    <img src="${imageUrl}" alt="${escapeHtml(data.nama || 'Program')}" 
                         class="w-full aspect-[4/3] object-cover rounded-lg bg-gray-100 mb-3" loading="lazy" />
                    <h5 class="text-lg font-semibold text-brand">${escapeHtml(data.nama || 'Program')}</h5>
                    <p class="text-sm text-gray-500">${escapeHtml(data.kategori || '')}</p>
                    <p class="text-gray-600 text-sm mt-1">${escapeHtml(truncateText(data.deskripsiSingkat || data.deskripsi || '', 80))}</p>
                    <p class="font-semibold text-brand mt-1">${formatRupiah(data.harga)}</p>
                    <div class="flex flex-wrap gap-3 mt-2">
                        <a href="program-detail.html?id=${docSnap.id}" class="text-brand hover:text-brand-light font-medium text-sm border-b-2 border-brand hover:border-brand-light transition-colors">
                            Lihat Detail →
                        </a>
                        <button class="share-program-btn text-[#25d366] hover:text-[#1da851] font-medium text-sm border-b-2 border-[#25d366] hover:border-[#1da851] transition-colors inline-flex items-center gap-1"
                                data-program-id="${docSnap.id}"
                                data-program-name="${escapeHtml(data.nama || 'Program')}"
                                data-program-desc="${escapeHtml(truncateText(data.deskripsiSingkat || data.deskripsi || '', 100))}">
                            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Bagikan
                        </button>
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
// LOAD COMPUTER SERVICE (Preview di Homepage) — 4:3
// ============================================================
export async function loadServicePreview() {
    const container = document.getElementById('servicePreviewContainer');
    if (!container) return;

    try {
        const q = query(
            collection(db, 'services'),
            where('aktif', '==', true),
            orderBy('order', 'asc'),
            limit(3)
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
                { width: 800, height: 600, crop: 'fill' },
                'assets/images/services/default.jpg'
            );
            const serviceName = escapeHtml(data.nama || 'Layanan');
            
            html += `
                <div class="service-item border-b border-gray-200 pb-4">
                    <img src="${imageUrl}" alt="${serviceName}" 
                         class="w-full aspect-[4/3] object-cover rounded-lg bg-gray-100 mb-3" loading="lazy" />
                    <h5 class="text-lg font-semibold text-brand">${serviceName}</h5>
                    <p class="text-sm text-gray-500">${escapeHtml(data.kategori || '')}</p>
                    <p class="text-gray-600 text-sm mt-1">${escapeHtml(truncateText(data.deskripsi || '', 80))}</p>
                    ${data.hargaMulai ? `<p class="text-sm text-gray-500 mt-1">Mulai ${formatRupiah(data.hargaMulai)}</p>` : ''}
                    <button class="wa-service-btn mt-2 text-brand hover:text-brand-light font-medium text-sm border-b-2 border-brand hover:border-brand-light transition-colors" 
                            data-service="${serviceName}">
                        Tanya via WhatsApp →
                    </button>
                </div>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll('.wa-service-btn').forEach(btn => {
            btn.addEventListener('click', () => {
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

// ============================================================
// LOAD LANDING PAGE CONTENT
// ============================================================
export async function loadLandingPageContent() {
    try {
        const docRef = doc(db, 'landingPage', 'content');
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) return;
        
        const data = docSnap.data();
        
        // HERO
        if (data.hero) {
            const hero = data.hero;
            
            const heroHeading = document.getElementById('heroHeading');
            const heroSubheading = document.getElementById('heroSubheading');
            const heroDescription = document.getElementById('heroDescription');
            const heroSubtext = document.getElementById('heroSubtext');
            const heroCtaPrimaryMobile = document.getElementById('heroCtaPrimaryMobile');
            
            if (heroHeading && hero.heading) heroHeading.textContent = hero.heading;
            if (heroSubheading && hero.subheading) heroSubheading.textContent = hero.subheading;
            if (heroDescription && hero.deskripsi) heroDescription.textContent = hero.deskripsi;
            if (heroSubtext && hero.subtext) heroSubtext.textContent = hero.subtext;
            if (heroCtaPrimaryMobile && hero.ctaText) heroCtaPrimaryMobile.textContent = hero.ctaText;
            
            const heroHeadingDesktop = document.getElementById('heroHeadingDesktop');
            const heroSubheadingDesktop = document.getElementById('heroSubheadingDesktop');
            const heroDescriptionDesktop = document.getElementById('heroDescriptionDesktop');
            const heroSubtextDesktop = document.getElementById('heroSubtextDesktop');
            const heroCtaPrimary = document.getElementById('heroCtaPrimary');
            
            if (heroHeadingDesktop && hero.heading) heroHeadingDesktop.textContent = hero.heading;
            if (heroSubheadingDesktop && hero.subheading) heroSubheadingDesktop.textContent = hero.subheading;
            if (heroDescriptionDesktop && hero.deskripsi) heroDescriptionDesktop.textContent = hero.deskripsi;
            if (heroSubtextDesktop && hero.subtext) heroSubtextDesktop.textContent = hero.subtext;
            if (heroCtaPrimary && hero.ctaText) heroCtaPrimary.textContent = hero.ctaText;
            
            if (hero.gambar) {
                const heroOptimized = optimizeCloudinaryUrl(hero.gambar, { width: 1600, crop: 'limit' });
                
                const mobileImg = document.querySelector('#heroSection img[alt*="IMDKOM"]');
                if (mobileImg) mobileImg.src = heroOptimized;
                
                const heroImage = document.getElementById('heroImage');
                if (heroImage) heroImage.src = heroOptimized;
            }
        }
        
        // ABOUT
        if (data.about) {
            const about = data.about;
            const aboutTitle = document.getElementById('aboutTitle');
            const aboutDescription = document.getElementById('aboutDescription');
            
            if (aboutTitle && about.judul) aboutTitle.textContent = about.judul;
            if (aboutDescription && about.deskripsi) aboutDescription.textContent = about.deskripsi;
            
            if (about.gambar) {
                const img = document.getElementById('aboutImage');
                if (img) img.src = optimizeCloudinaryUrl(about.gambar, { width: 800, crop: 'limit' });
            }
        }
        
        // CONTACT
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
        
        // FOOTER
        if (data.footer && data.footer.copyright) {
            const footerCopy = document.getElementById('footerCopyright');
            if (footerCopy) footerCopy.textContent = data.footer.copyright;
        }
        
    } catch (error) {
        console.error('Error loading landing page content:', error);
    }
}

// ============================================================
// LOAD SINGLE PROGRAM (Detail) — 4:5 hero + meta OG dinamis
// ============================================================
export async function loadProgramDetail() {
    const container = document.getElementById('programDetailContainer');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) {
        container.innerHTML = '<div class="text-center text-red-600 py-10">Program tidak ditemukan.</div>';
        return;
    }

    try {
        const docSnap = await getDoc(doc(db, 'programs', id));
        if (!docSnap.exists()) {
            container.innerHTML = '<div class="text-center text-red-600 py-10">Program tidak ditemukan.</div>';
            return;
        }

        const data = docSnap.data();
        
        // 4:5 aspect — 1200x1500
        const imageUrl = buildImageUrl(
            data.gambar,
            { width: 1200, height: 1500, crop: 'fill' },
            'assets/images/programs/default.jpg'
        );

        // ============================================================
        // UPDATE META TAG OG (dinamis)
        // ============================================================
        const pageTitle = `${data.nama || 'Program'} | IMDKOM Yogyakarta`;
        const pageDesc = truncateText(data.deskripsiSingkat || data.deskripsi || 'Program pelatihan komputer di IMDKOM Yogyakarta.', 160);
        
        // OG image — 1200x630 (standar WhatsApp/FB)
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

        // Open Graph
        setMetaProperty('og:title', data.nama || 'Program Kursus');
        setMetaProperty('og:description', pageDesc);
        setMetaProperty('og:image', ogImageUrl);
        setMetaProperty('og:url', window.location.href);
        setMetaProperty('og:type', 'article');

        // Twitter Card
        setMetaName('twitter:card', 'summary_large_image');
        setMetaName('twitter:title', data.nama || 'Program Kursus');
        setMetaName('twitter:description', pageDesc);
        setMetaName('twitter:image', ogImageUrl);

        // ============================================================
        // RENDER HTML
        // ============================================================
        let materiHtml = '';
        if (data.materi && Array.isArray(data.materi)) {
            materiHtml = '<ul class="list-disc list-inside space-y-1 text-gray-600">';
            data.materi.forEach(item => {
                materiHtml += `<li>${escapeHtml(item)}</li>`;
            });
            materiHtml += '</ul>';
        }
        
        let benefitHtml = '';
        if (data.benefit && Array.isArray(data.benefit)) {
            benefitHtml = '<ul class="list-disc list-inside space-y-1 text-gray-600">';
            data.benefit.forEach(item => {
                benefitHtml += `<li>${escapeHtml(item)}</li>`;
            });
            benefitHtml += '</ul>';
        }

        container.innerHTML = `
            <div class="flex flex-col lg:flex-row gap-8 lg:gap-12">
                <div class="lg:w-1/2">
                    <img src="${imageUrl}" alt="${escapeHtml(data.nama || 'Program')}" 
                         class="w-full aspect-[4/5] object-cover rounded-lg shadow-sm detail-image" loading="lazy" />
                </div>
                <div class="lg:w-1/2">
                    <h1 class="text-3xl md:text-4xl font-bold text-brand">${escapeHtml(data.nama || 'Program')}</h1>
                    <p class="text-gray-500">${escapeHtml(data.kategori || '')}</p>
                    
                    <div class="border-b border-gray-200 py-4">
                        <h5 class="font-semibold text-gray-700">Deskripsi</h5>
                        <p class="text-gray-600 mt-1">${escapeHtml(data.deskripsi || '')}</p>
                    </div>
                    
                    <div class="border-b border-gray-200 py-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <h6 class="text-sm text-gray-500">Harga</h6>
                                <p class="font-semibold text-brand">${formatRupiah(data.harga)}</p>
                            </div>
                            <div>
                                <h6 class="text-sm text-gray-500">Durasi</h6>
                                <p class="text-gray-800">${escapeHtml(data.durasi || '-')}</p>
                            </div>
                        </div>
                    </div>
                    
                    ${materiHtml ? `
                        <div class="border-b border-gray-200 py-4">
                            <h5 class="font-semibold text-gray-700">Materi</h5>
                            ${materiHtml}
                        </div>
                    ` : ''}
                    
                    ${benefitHtml ? `
                        <div class="border-b border-gray-200 py-4">
                            <h5 class="font-semibold text-gray-700">Benefit</h5>
                            ${benefitHtml}
                        </div>
                    ` : ''}
                    
                    <div class="mt-6 flex flex-wrap gap-3">
                        <button class="wa-program-btn bg-brand hover:bg-brand-light text-white font-medium px-8 py-3 rounded transition-colors" 
                                data-program="${escapeHtml(data.nama || 'Program')}">
                            Tanya Program Ini
                        </button>
                        <button class="share-detail-btn bg-[#25d366] hover:bg-[#1da851] text-white font-medium px-6 py-3 rounded transition-colors inline-flex items-center gap-2"
                                data-program-id="${docSnap.id}"
                                data-program-name="${escapeHtml(data.nama || 'Program')}"
                                data-program-desc="${escapeHtml(truncateText(data.deskripsiSingkat || data.deskripsi || '', 100))}">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Bagikan
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Event: WhatsApp
        container.querySelector('.wa-program-btn').addEventListener('click', function() {
            openWhatsAppProgram(this.dataset.program);
        });

        // Event: Share
        const shareBtn = container.querySelector('.share-detail-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                const programName = this.dataset.programName;
                const programDesc = this.dataset.programDesc;
                const shareUrl = window.location.href;
                
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: programName,
                            text: `Program Kursus IMDKOM: ${programName}`,
                            url: shareUrl
                        });
                        return;
                    } catch (err) {
                        if (err.name === 'AbortError') return;
                    }
                }
                
                const waText = `*${programName}*\n\n${programDesc}\n\nDetail: ${shareUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank', 'noopener,noreferrer');
            });
        }

    } catch (error) {
        console.error('Error loading program detail:', error);
        container.innerHTML = '<div class="text-center text-red-600 py-10">Gagal memuat detail program.</div>';
    }
}

// ============================================================
// LOAD ALL PROGRAMS (Halaman Kursus) — 3:4 card
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
                <div class="col-span-full text-center text-gray-500 py-12">
                    <h4 class="text-xl font-medium">Belum ada program tersedia</h4>
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
                'assets/images/programs/default.jpg'
            );
            
            html += `
                <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <img src="${imageUrl}" alt="${escapeHtml(data.nama || 'Program')}" 
                         class="w-full aspect-[3/4] object-cover rounded-lg bg-gray-100 mb-3" loading="lazy" />
                    <h5 class="text-lg font-semibold text-brand">${escapeHtml(data.nama || 'Program')}</h5>
                    <p class="text-sm text-gray-500">${escapeHtml(data.kategori || '')}</p>
                    <p class="text-gray-600 text-sm mt-1">${escapeHtml(truncateText(data.deskripsiSingkat || data.deskripsi || '', 100))}</p>
                    <p class="font-semibold text-brand mt-1">${formatRupiah(data.harga)}</p>
                    <div class="flex flex-wrap gap-2 mt-3">
                        <a href="program-detail.html?id=${docSnap.id}" class="text-brand hover:text-brand-light font-medium text-sm border-b-2 border-brand hover:border-brand-light transition-colors">
                            Lihat Detail →
                        </a>
                        <button class="wa-program-btn text-[#25d366] hover:text-[#1da851] font-medium text-sm border-b-2 border-[#25d366] hover:border-[#1da851] transition-colors" 
                                data-program="${escapeHtml(data.nama || 'Program')}">
                            Tanya WhatsApp
                        </button>
                        <button class="share-program-btn text-[#3b82f6] hover:text-[#2563eb] font-medium text-sm border-b-2 border-[#3b82f6] hover:border-[#2563eb] transition-colors inline-flex items-center gap-1"
                                data-program-id="${docSnap.id}"
                                data-program-name="${escapeHtml(data.nama || 'Program')}"
                                data-program-desc="${escapeHtml(truncateText(data.deskripsiSingkat || data.deskripsi || '', 100))}">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                            </svg>
                            Bagikan
                        </button>
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

    } catch (error) {
        console.error('Error loading all programs:', error);
        container.innerHTML = `
            <div class="col-span-full text-center text-red-600 py-12">
                Gagal memuat program. Silakan refresh halaman.
            </div>
        `;
    }
}

// ============================================================
// LOAD ALL SERVICES (Halaman Service) — 3:4 card
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