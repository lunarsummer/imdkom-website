// ============================================================
// Consultation — Logic Form Konsultasi
// ============================================================

import { db, collection, addDoc } from './firebase.js';
import { openWhatsApp } from './whatsapp.js';

// ============================================================
// OPEN MODAL
// ============================================================
window.openConsultationModal = function(slug = '', serviceName = '') {
    const modal = document.getElementById('consultationModal');
    if (!modal) return;

    const serviceInput = document.getElementById('consultationService');
    const serviceLabel = document.getElementById('consultationServiceLabel');

    if (serviceInput) serviceInput.value = slug;
    if (serviceLabel) serviceLabel.textContent = serviceName || 'Konsultasi Service';

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';

    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ============================================================
// CLOSE MODAL
// ============================================================
window.closeConsultationModal = function() {
    const modal = document.getElementById('consultationModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    document.body.style.overflow = '';
    document.body.style.overflowX = '';
    document.documentElement.style.overflowX = '';
};

// ============================================================
// INIT FORM — pasang submit handler
// Menggunakan readyState check agar tetap jalan
// meskipun module script di-defer (DOMContentLoaded sudah lewat)
// ============================================================
function initConsultationForm() {
    const form = document.getElementById('consultationForm');
    if (!form) return;

    // Guard: jangan pasang listener dua kali
    if (form.dataset.listenerAttached === 'true') return;
    form.dataset.listenerAttached = 'true';

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = this.querySelector('button[type="submit"]');
        const messageEl = document.getElementById('consultationMessage');

        if (!submitBtn || !messageEl) return;

        // Disable tombol & tampilkan status
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengirim...';
        messageEl.innerHTML = '';

        // Ambil data (safe access)
        const slug = document.getElementById('consultationService')?.value || '';
        const nama = document.getElementById('consultationNama')?.value.trim() || '';
        const wa = document.getElementById('consultationWa')?.value.trim() || '';
        const device = document.getElementById('consultationDevice')?.value.trim() || '';
        const masalah = document.getElementById('consultationMasalah')?.value.trim() || '';
        const serviceLabel = document.getElementById('consultationServiceLabel')?.textContent || 'Service';

        // Validasi
        if (!nama || !wa || !device || !masalah) {
            messageEl.innerHTML = `<p class="text-red-600 text-sm">Mohon lengkapi semua field.</p>`;
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
            return;
        }

        try {
            // Simpan ke Firestore
            const consultationData = {
                serviceSlug: slug,
                nama: nama,
                whatsapp: wa,
                device: device,
                masalah: masalah,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'consultations'), consultationData);

            // Format pesan WhatsApp
            let message = `*KONSULTASI SERVICE - IMDKOM*\n\n`;
            message += `> Layanan: ${serviceLabel}\n`;
            message += `> Nama: ${nama}\n`;
            message += `> No. WhatsApp: ${wa}\n`;
            message += `> Device: ${device}\n`;
            message += `> Masalah: ${masalah}\n\n`;
            message += `Mohon konfirmasi konsultasi saya. Terima kasih!`;

            // Buka WhatsApp
            openWhatsApp(message);

            // Sukses
            messageEl.innerHTML = `<p class="text-green-600 text-sm font-medium">✅ Konsultasi terkirim! Membuka WhatsApp...</p>`;

            // Reset form & close modal setelah delay
            setTimeout(() => {
                form.reset();
                closeConsultationModal();
                messageEl.innerHTML = '';
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHTML;
            }, 2000);

        } catch (error) {
            console.error('Error submitting consultation:', error);
            messageEl.innerHTML = `<p class="text-red-600 text-sm">Gagal mengirim: ${error.message}</p>`;
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
        }
    });
}

// ============================================================
// READY STATE HANDLING
// Kalau DOM belum siap → tunggu DOMContentLoaded
// Kalau sudah siap → langsung init
// ============================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConsultationForm);
} else {
    initConsultationForm();
}