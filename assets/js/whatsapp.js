// ============================================================
// WhatsApp Handler
// ============================================================

import { db, getDoc, doc } from './firebase.js';

let whatsappNumber = '6285601913435';

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

// Expose ke window
window.openWhatsAppProgram = openWhatsAppProgram;
window.openWhatsAppService = openWhatsAppService;
window.openWhatsAppGeneric = openWhatsAppGeneric;

// Inisialisasi
document.addEventListener('DOMContentLoaded', async () => {
    await getWhatsAppNumber();

    const heroWA = document.getElementById('heroWhatsApp');
    if (heroWA) {
        heroWA.addEventListener('click', (e) => {
            e.preventDefault();
            openWhatsAppGeneric();
        });
    }

    const floatingWA = document.getElementById('floatingWhatsApp');
    if (floatingWA) {
        floatingWA.addEventListener('click', (e) => {
            e.preventDefault();
            openWhatsAppGeneric();
        });
    }
});