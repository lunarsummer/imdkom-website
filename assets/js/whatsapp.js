// ============================================================
// WhatsApp Handler
// ============================================================

import { db, getDoc, doc } from './firebase.js';

// Nomor default — fallback kalau Firestore belum siap / gagal fetch
let whatsappNumber = '6285601913435';

// ============================================================
// AMBIL NOMOR WA DARI FIRESTORE
// ============================================================
export async function getWhatsAppNumber() {
    try {
        const settingsRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.whatsapp) {
                let number = data.whatsapp.replace(/\s/g, '').replace(/-/g, '');
                number = number.replace(/^\+/, '');
                if (number.startsWith('0')) {
                    number = '62' + number.substring(1);
                }
                if (!number.startsWith('62')) {
                    number = '62' + number;
                }
                whatsappNumber = number;
            }
        }
    } catch (error) {
        console.error('Error loading WhatsApp number:', error);
    }
    return whatsappNumber;
}

// ============================================================
// FUNGSI BUKA WHATSAPP
// ============================================================
export function openWhatsApp(message = '') {
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encoded}`, '_blank');
}

export function openWhatsAppProgram(programName) {
    const message = `Halo IMDKOM, saya tertarik dengan program "${programName}". Saya ingin mendapatkan informasi lebih lanjut.`;
    openWhatsApp(message);
}

export function openWhatsAppService(serviceName) {
    const message = `Halo IMDKOM, saya ingin konsultasi mengenai layanan "${serviceName}".`;
    openWhatsApp(message);
}

export function openWhatsAppGeneric() {
    const message = `Halo IMDKOM, saya ingin berkonsultasi mengenai program dan layanan yang tersedia.`;
    openWhatsApp(message);
}

// Expose ke window (untuk onclick di HTML)
window.openWhatsAppProgram = openWhatsAppProgram;
window.openWhatsAppService = openWhatsAppService;
window.openWhatsAppGeneric = openWhatsAppGeneric;
window.openWhatsApp = openWhatsApp;

// ============================================================
// PASANG LISTENER TOMBOL WA
// ============================================================
let whatsappInitialized = false;

async function initWhatsAppButtons() {
    if (whatsappInitialized) return;
    whatsappInitialized = true;

    // Pastikan nomor WA sudah di-fetch dari Firestore
    await getWhatsAppNumber();

    // Helper: pasang listener kalau elemen ada & belum pernah dipasang
    function bindClick(id, handler) {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.dataset.waBound === 'true') return;
        el.dataset.waBound = 'true';
        el.addEventListener('click', handler);
    }

    // Hero WhatsApp — Desktop (index.html)
    bindClick('heroWhatsApp', (e) => {
        e.preventDefault();
        openWhatsAppGeneric();
    });

    // Hero WhatsApp — Mobile (index.html)
    bindClick('heroWhatsAppMobile', (e) => {
        e.preventDefault();
        openWhatsAppGeneric();
    });

    // Floating WhatsApp (semua halaman)
    bindClick('floatingWhatsApp', (e) => {
        e.preventDefault();
        openWhatsAppGeneric();
    });
}

// ============================================================
// READY STATE HANDLING
// Kalau DOM belum siap → tunggu DOMContentLoaded
// Kalau sudah siap → langsung init
// ============================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhatsAppButtons);
} else {
    initWhatsAppButtons();
}