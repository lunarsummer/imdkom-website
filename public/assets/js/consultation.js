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

    // WA hanya angka, maks 15 digit
    const waInput = document.getElementById('consultationWa');
    if (waInput) {
        waInput.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '').slice(0, 15);
        });
    }

    // Counter karakter untuk Deskripsi Masalah (maks 300)
    const masalahInput = document.getElementById('consultationMasalah');
    const masalahCount = document.getElementById('consultationMasalahCount');
    if (masalahInput && masalahCount) {
        masalahCount.textContent = String(masalahInput.value.length);
        masalahInput.addEventListener('input', function () {
            masalahCount.textContent = String(this.value.length);
        });
    }

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

        // Ambil data (safe access) + strip karakter code (< dan >) di semua field teks
        const stripCode = (s) => String(s || '').replace(/[<>]/g, '').trim();
        const slug = document.getElementById('consultationService')?.value || '';
        const nama = stripCode(document.getElementById('consultationNama')?.value);
        const wa = String(document.getElementById('consultationWa')?.value || '').replace(/\D/g, '').trim();
        const device = stripCode(document.getElementById('consultationDevice')?.value);
        const masalah = stripCode(document.getElementById('consultationMasalah')?.value);

        // Honeypot: bot mengisi field tersembunyi "website" → tolak diam-diam
        const honeypot = this.querySelector('input[name="website"]');
        if (honeypot && honeypot.value) {
            form.reset();
            closeConsultationModal();
            messageEl.innerHTML = '';
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
            return;
        }
        const serviceLabel = document.getElementById('consultationServiceLabel')?.textContent || 'Service';

        // Validasi
        if (!nama || !wa || !device || !masalah) {
            messageEl.innerHTML = `<p class="text-red-600 text-sm">Mohon lengkapi semua field.</p>`;
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
            return;
        }
        if (wa.length < 9 || wa.length > 15) {
            messageEl.innerHTML = `<p class="text-red-600 text-sm">Nomor WhatsApp harus 9–15 digit angka.</p>`;
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