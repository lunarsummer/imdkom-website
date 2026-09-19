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
    
    // Set service info
    const serviceInput = document.getElementById('consultationService');
    const serviceLabel = document.getElementById('consultationServiceLabel');
    
    if (serviceInput) serviceInput.value = slug;
    if (serviceLabel) serviceLabel.textContent = serviceName || 'Konsultasi Service';
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ============================================================
// CLOSE MODAL
// ============================================================
window.closeConsultationModal = function() {
    const modal = document.getElementById('consultationModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
};

// ============================================================
// SUBMIT CONSULTATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('consultationForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const messageEl = document.getElementById('consultationMessage');
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengirim...';
        messageEl.innerHTML = '';
        
        // Ambil data
        const slug = document.getElementById('consultationService')?.value || '';
        const nama = document.getElementById('consultationNama')?.value.trim() || '';
        const wa = document.getElementById('consultationWa')?.value.trim() || '';
        const device = document.getElementById('consultationDevice')?.value.trim() || '';
        const masalah = document.getElementById('consultationMasalah')?.value.trim() || '';
        
        // Validasi
        if (!nama || !wa || !device || !masalah) {
            messageEl.innerHTML = `<p class="text-red-600 text-sm">Mohon lengkapi semua field.</p>`;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim Konsultasi';
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
            
            // Format pesan WhatsApp (tanpa emoji)
            let message = `*KONSULTASI SERVICE - IMDKOM*\n\n`;
            message += `> Layanan: ${document.getElementById('consultationServiceLabel')?.textContent || 'Service'}\n`;
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
                submitBtn.textContent = 'Kirim Konsultasi';
            }, 2000);
            
        } catch (error) {
            console.error('Error submitting consultation:', error);
            messageEl.innerHTML = `<p class="text-red-600 text-sm">Gagal mengirim: ${error.message}</p>`;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim Konsultasi';
        }
    });
});