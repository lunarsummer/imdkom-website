// ============================================================
// Aplikasi Public — Load data dari Firestore
// ============================================================

import { db, collection, getDocs, query, where, orderBy, limit, getDoc, doc } from './firebase.js';
import { getImageUrl, truncateText, formatRupiah, escapeHtml } from './utils.js';
import { openWhatsAppProgram, openWhatsAppService, openWhatsAppGeneric } from './whatsapp.js';

// ============================================================
// LOAD PROGRAM KURSUS (Preview di Homepage)
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
        snapshot.forEach((doc) => {
            const data = doc.data();
            const imageUrl = getImageUrl(data.gambar, 'assets/images/programs/default.jpg');
            
            html += `
                <div class="course-item border-b border-gray-200 pb-4">
                    <img src="${imageUrl}" alt="${escapeHtml(data.nama || 'Program')}" 
                         class="w-full h-48 object-cover rounded-lg bg-gray-100 mb-3" loading="lazy" />
                    <h5 class="text-lg font-semibold text-brand">${escapeHtml(data.nama || 'Program')}</h5>
                    <p class="text-sm text-gray-500">${escapeHtml(data.kategori || '')}</p>
                    <p class="text-gray-600 text-sm mt-1">${escapeHtml(truncateText(data.deskripsiSingkat || data.deskripsi || '', 80))}</p>
                    <p class="font-semibold text-brand mt-1">${formatRupiah(data.harga)}</p>
                    <a href="program-detail.html?id=${doc.id}" class="inline-block mt-2 text-brand hover:text-brand-light font-medium text-sm border-b-2 border-brand hover:border-brand-light transition-colors">
                        Lihat Detail →
                    </a>
                </div>
            `;
        });
        container.innerHTML = html;
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
// LOAD COMPUTER SERVICE (Preview di Homepage)
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
        snapshot.forEach((doc) => {
            const data = doc.data();
            const imageUrl = getImageUrl(data.gambar, 'assets/images/services/default.jpg');
            const serviceName = escapeHtml(data.nama || 'Layanan');
            
            html += `
                <div class="service-item border-b border-gray-200 pb-4">
                    <img src="${imageUrl}" alt="${serviceName}" 
                         class="w-full h-48 object-cover rounded-lg bg-gray-100 mb-3" loading="lazy" />
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
        snapshot.forEach((doc) => {
            const data = doc.data();
            const avatarUrl = getImageUrl(data.foto, 'assets/images/testimonials/default-avatar.jpg');
            
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
        snapshot.forEach((doc) => {
            const data = doc.data();
            html += `
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <button class="faq-toggle w-full text-left flex justify-between items-center" data-target="faq-${doc.id}">
                        <span class="font-medium text-gray-800">${escapeHtml(data.pertanyaan || '')}</span>
                        <svg class="w-5 h-5 text-gray-400 transition-transform faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    <div id="faq-${doc.id}" class="faq-answer mt-2 hidden">
                        <p class="text-gray-600">${escapeHtml(data.jawaban || '')}</p>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        // FAQ toggle
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
        
        if (data.hero) {
            const hero = data.hero;
            if (hero.heading) document.getElementById('heroHeading').textContent = hero.heading;
            if (hero.subheading) document.getElementById('heroSubheading').textContent = hero.subheading;
            if (hero.deskripsi) document.getElementById('heroDescription').textContent = hero.deskripsi;
            if (hero.subtext) document.getElementById('heroSubtext').textContent = hero.subtext;
            if (hero.gambar) {
                const img = document.getElementById('heroImage');
                if (img) img.src = getImageUrl(hero.gambar, 'assets/images/hero/hero-default.jpg');
            }
            if (hero.ctaText) {
                const cta = document.getElementById('heroCtaPrimary');
                if (cta) cta.textContent = hero.ctaText;
            }
        }
        
        if (data.about) {
            const about = data.about;
            if (about.judul) document.getElementById('aboutTitle').textContent = about.judul;
            if (about.deskripsi) document.getElementById('aboutDescription').textContent = about.deskripsi;
            if (about.gambar) {
                const img = document.getElementById('aboutImage');
                if (img) img.src = getImageUrl(about.gambar, 'assets/images/about/about-imdkom.jpg');
            }
        }
        
        if (data.contact) {
            const contact = data.contact;
            if (contact.whatsapp) {
                document.getElementById('footerWhatsApp').textContent = `WhatsApp: ${contact.whatsapp}`;
            }
            if (contact.instagram) {
                document.getElementById('footerInstagram').textContent = `Instagram: ${contact.instagram}`;
            }
        }
        
        if (data.footer && data.footer.copyright) {
            document.getElementById('footerCopyright').textContent = data.footer.copyright;
        }
        
    } catch (error) {
        console.error('Error loading landing page content:', error);
    }
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
        const imageUrl = getImageUrl(data.gambar, 'assets/images/programs/default.jpg');
        
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
                         class="w-full rounded-lg shadow-sm detail-image" loading="lazy" />
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
                    
                    <div class="mt-6">
                        <button class="wa-program-btn bg-brand hover:bg-brand-light text-white font-medium px-8 py-3 rounded transition-colors" 
                                data-program="${escapeHtml(data.nama || 'Program')}">
                            Tanya Program Ini
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.querySelector('.wa-program-btn').addEventListener('click', function() {
            openWhatsAppProgram(this.dataset.program);
        });

    } catch (error) {
        console.error('Error loading program detail:', error);
        container.innerHTML = '<div class="text-center text-red-600 py-10">Gagal memuat detail program.</div>';
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
                <div class="col-span-full text-center text-gray-500 py-12">
                    <h4 class="text-xl font-medium">Belum ada program tersedia</h4>
                    <p class="mt-1">Silakan cek kembali nanti.</p>
                </div>
            `;
            return;
        }

        let html = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const imageUrl = getImageUrl(data.gambar, 'assets/images/programs/default.jpg');
            
            html += `
                <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <img src="${imageUrl}" alt="${escapeHtml(data.nama || 'Program')}" 
                         class="w-full h-48 object-cover rounded-lg bg-gray-100 mb-3" loading="lazy" />
                    <h5 class="text-lg font-semibold text-brand">${escapeHtml(data.nama || 'Program')}</h5>
                    <p class="text-sm text-gray-500">${escapeHtml(data.kategori || '')}</p>
                    <p class="text-gray-600 text-sm mt-1">${escapeHtml(truncateText(data.deskripsiSingkat || data.deskripsi || '', 100))}</p>
                    <p class="font-semibold text-brand mt-1">${formatRupiah(data.harga)}</p>
                    <div class="flex flex-wrap gap-2 mt-3">
                        <a href="program-detail.html?id=${doc.id}" class="text-brand hover:text-brand-light font-medium text-sm border-b-2 border-brand hover:border-brand-light transition-colors">
                            Lihat Detail →
                        </a>
                        <button class="wa-program-btn text-[#25d366] hover:text-[#1da851] font-medium text-sm border-b-2 border-[#25d366] hover:border-[#1da851] transition-colors" 
                                data-program="${escapeHtml(data.nama || 'Program')}">
                            Tanya WhatsApp
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
        snapshot.forEach((doc) => {
            const data = doc.data();
            const imageUrl = getImageUrl(data.gambar, 'assets/images/services/default.jpg');
            const serviceName = escapeHtml(data.nama || 'Layanan');
            
            html += `
                <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <img src="${imageUrl}" alt="${serviceName}" 
                         class="w-full h-48 object-cover rounded-lg bg-gray-100 mb-3" loading="lazy" />
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