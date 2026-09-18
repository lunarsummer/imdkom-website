// ============================================================
// Init Database — Membuat Struktur Firestore Secara Otomatis
// ============================================================

import { 
    db, 
    collection, doc, getDoc, getDocs, setDoc, 
    query, where, orderBy, limit 
} from './firebase.js';

/**
 * Cek apakah database sudah memiliki data
 * Jika belum, buat data default
 */
export async function initDatabase() {
    console.log('🔍 Checking database structure...');
    
    try {
        // Cek collection programs
        const programsExist = await checkCollection('programs');
        if (!programsExist) {
            console.log('📦 Creating default programs...');
            await createDefaultPrograms();
        }
        
        // Cek collection services
        const servicesExist = await checkCollection('services');
        if (!servicesExist) {
            console.log('📦 Creating default services...');
            await createDefaultServices();
        }
        
        // Cek collection faqs
        const faqsExist = await checkCollection('faqs');
        if (!faqsExist) {
            console.log('📦 Creating default FAQs...');
            await createDefaultFaqs();
        }
        
        // Cek settings
        const settingsExist = await checkDocument('settings', 'general');
        if (!settingsExist) {
            console.log('📦 Creating default settings...');
            await createDefaultSettings();
        }
        
        // Cek landing page
        const landingExist = await checkDocument('landingPage', 'content');
        if (!landingExist) {
            console.log('📦 Creating default landing page content...');
            await createDefaultLandingPage();
        }
        
        console.log('✅ Database initialization complete!');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Cek apakah collection memiliki data
 */
async function checkCollection(collectionName) {
    try {
        const q = query(collection(db, collectionName), limit(1));
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        // Jika collection tidak ada, Firestore akan error
        return false;
    }
}

/**
 * Cek apakah document ada
 */
async function checkDocument(collectionName, documentId) {
    try {
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists();
    } catch (error) {
        return false;
    }
}

// ============================================================
// DEFAULT DATA
// ============================================================

/**
 * Membuat program default
 */
async function createDefaultPrograms() {
    const now = new Date().toISOString();
    
    const programs = [
        {
            nama: "Microsoft Office",
            kategori: "Microsoft Office",
            deskripsi: "Pelatihan Microsoft Office lengkap untuk pemula hingga mahir. Mencakup Word, Excel, PowerPoint, dan Outlook. Peserta akan mendapatkan pemahaman mendalam tentang fitur-fitur penting dan tips produktivitas.",
            deskripsiSingkat: "Pelatihan Microsoft Office untuk pemula hingga mahir.",
            harga: "Rp 1.500.000",
            durasi: "3 bulan",
            materi: ["Word", "Excel", "PowerPoint", "Outlook"],
            benefit: ["Sertifikat", "Modul belajar", "Akses online"],
            gambar: "assets/images/programs/ms-office.jpg",
            aktif: true,
            order: 1,
            createdAt: now,
            updatedAt: now
        },
        {
            nama: "Kursus Privat Komputer",
            kategori: "Kursus Privat",
            deskripsi: "Program belajar komputer secara privat dengan materi yang disesuaikan dengan kebutuhan peserta. Fleksibel dalam hal waktu dan materi pembelajaran.",
            deskripsiSingkat: "Belajar komputer secara privat dengan materi sesuai kebutuhan.",
            harga: "Rp 2.000.000",
            durasi: "Flexible",
            materi: ["Disesuaikan dengan kebutuhan", "Konsultasi awal", "Evaluasi berkala"],
            benefit: ["Sertifikat", "Jadwal fleksibel", "Materi custom"],
            gambar: "assets/images/programs/privat.jpg",
            aktif: true,
            order: 2,
            createdAt: now,
            updatedAt: now
        },
        {
            nama: "Kursus Singkat Komputer",
            kategori: "Kursus Singkat",
            deskripsi: "Pelatihan intensif dalam waktu singkat untuk keterampilan spesifik. Cocok untuk Anda yang ingin cepat menguasai topik tertentu.",
            deskripsiSingkat: "Pelatihan intensif untuk keterampilan spesifik.",
            harga: "Rp 800.000",
            durasi: "1-2 minggu",
            materi: ["Topik spesifik", "Praktek langsung", "Studi kasus"],
            benefit: ["Sertifikat", "Materi ringkas", "Praktek intensif"],
            gambar: "assets/images/programs/kursus-singkat.jpg",
            aktif: true,
            order: 3,
            createdAt: now,
            updatedAt: now
        },
        {
            nama: "Sertifikasi Komputer",
            kategori: "Sertifikasi",
            deskripsi: "Program persiapan sertifikasi komputer untuk meningkatkan kredibilitas dan karir Anda. Mencakup berbagai jenis sertifikasi.",
            deskripsiSingkat: "Persiapan sertifikasi komputer untuk karir Anda.",
            harga: "Rp 2.500.000",
            durasi: "4 bulan",
            materi: ["Materi sertifikasi", "Simulasi ujian", "Strategi ujian"],
            benefit: ["Sertifikat resmi", "Pengalaman ujian", "Pembimbing ahli"],
            gambar: "assets/images/programs/sertifikasi.jpg",
            aktif: true,
            order: 4,
            createdAt: now,
            updatedAt: now
        }
    ];
    
    for (const program of programs) {
        const docRef = doc(collection(db, 'programs'));
        await setDoc(docRef, program);
    }
}

/**
 * Membuat service default
 */
async function createDefaultServices() {
    const now = new Date().toISOString();
    
    const services = [
        {
            nama: "Service Laptop",
            kategori: "Service Laptop",
            deskripsi: "Layanan perbaikan laptop berbagai merek dengan teknisi berpengalaman. Mulai dari perbaikan hardware hingga software.",
            deskripsiSingkat: "Perbaikan laptop berbagai merek.",
            hargaMulai: "Rp 100.000",
            gambar: "assets/images/services/laptop-service.jpg",
            aktif: true,
            order: 1,
            createdAt: now,
            updatedAt: now
        },
        {
            nama: "Service PC",
            kategori: "Service PC",
            deskripsi: "Layanan perbaikan komputer desktop/PC untuk kebutuhan pribadi dan kantor. Meliputi perbaikan hardware dan optimasi software.",
            deskripsiSingkat: "Perbaikan komputer desktop/PC.",
            hargaMulai: "Rp 100.000",
            gambar: "assets/images/services/pc-service.jpg",
            aktif: true,
            order: 2,
            createdAt: now,
            updatedAt: now
        },
        {
            nama: "Service Printer",
            kategori: "Service Printer",
            deskripsi: "Layanan perbaikan printer, termasuk penggantian tinta, cartridge, dan sparepart lainnya. Melayani berbagai merek printer.",
            deskripsiSingkat: "Perbaikan printer berbagai merek.",
            hargaMulai: "Rp 75.000",
            gambar: "assets/images/services/printer-service.jpg",
            aktif: true,
            order: 3,
            createdAt: now,
            updatedAt: now
        },
        {
            nama: "Sparepart Komputer",
            kategori: "Sparepart",
            deskripsi: "Menyediakan berbagai sparepart komputer seperti RAM, harddisk, power supply, dan aksesoris lainnya.",
            deskripsiSingkat: "Sparepart komputer berkualitas.",
            hargaMulai: "Rp 150.000",
            gambar: "assets/images/services/sparepart.jpg",
            aktif: true,
            order: 4,
            createdAt: now,
            updatedAt: now
        },
        {
            nama: "Upgrade Komputer",
            kategori: "Upgrade",
            deskripsi: "Layanan upgrade komputer untuk meningkatkan performa. Meliputi upgrade RAM, SSD, processor, dan komponen lainnya.",
            deskripsiSingkat: "Upgrade performa komputer.",
            hargaMulai: "Rp 200.000",
            gambar: "assets/images/services/upgrade.jpg",
            aktif: true,
            order: 5,
            createdAt: now,
            updatedAt: now
        }
    ];
    
    for (const service of services) {
        const docRef = doc(collection(db, 'services'));
        await setDoc(docRef, service);
    }
}

/**
 * Membuat FAQ default
 */
async function createDefaultFaqs() {
    const now = new Date().toISOString();
    
    const faqs = [
        {
            pertanyaan: "Berapa biaya kursus di IMDKOM?",
            jawaban: "Biaya kursus bervariasi tergantung program yang dipilih. Mulai dari Rp 800.000 untuk kursus singkat hingga Rp 2.500.000 untuk program sertifikasi. Silakan hubungi kami untuk informasi lebih detail.",
            aktif: true,
            order: 1,
            createdAt: now,
            updatedAt: now
        },
        {
            pertanyaan: "Apakah IMDKOM memiliki izin resmi?",
            jawaban: "Ya, IMDKOM memiliki izin dari Dinas Pendidikan dengan nomor: 098/Kpts/2021 dan NPSN: K0560748.",
            aktif: true,
            order: 2,
            createdAt: now,
            updatedAt: now
        },
        {
            pertanyaan: "Apakah ada program sertifikasi di IMDKOM?",
            jawaban: "Ya, IMDKOM menyediakan program sertifikasi komputer untuk meningkatkan kredibilitas dan karir Anda.",
            aktif: true,
            order: 3,
            createdAt: now,
            updatedAt: now
        },
        {
            pertanyaan: "Bagaimana cara mendaftar kursus?",
            jawaban: "Anda dapat menghubungi kami melalui WhatsApp di 0856-0191-3435 atau datang langsung ke alamat IMDKOM. Kami akan membantu proses pendaftaran.",
            aktif: true,
            order: 4,
            createdAt: now,
            updatedAt: now
        }
    ];
    
    for (const faq of faqs) {
        const docRef = doc(collection(db, 'faqs'));
        await setDoc(docRef, faq);
    }
}

/**
 * Membuat settings default
 */
async function createDefaultSettings() {
    const now = new Date().toISOString();
    
    const settings = {
        whatsapp: "0856-0191-3435",
        instagram: "@imdkom",
        alamat: "Jl. Pendidikan No. 123, Kota (isi alamat lengkap)",
        jamOperasional: "Senin-Jumat, 08:00 - 17:00",
        googleMaps: "https://maps.google.com/",
        updatedAt: now
    };
    
    await setDoc(doc(db, 'settings', 'general'), settings);
}

/**
 * Membuat landing page content default
 */
async function createDefaultLandingPage() {
    const now = new Date().toISOString();
    
    const content = {
        hero: {
            heading: "IMDKOM",
            subheading: "Kursus & Pelatihan • Computer Service",
            deskripsi: "Belajar keterampilan komputer. Dapatkan solusi untuk perangkat Anda.",
            subtext: "IMDKOM adalah lembaga kursus dan pelatihan komputer yang juga menyediakan layanan perbaikan laptop, PC, dan printer.",
            ctaText: "Lihat Program",
            gambar: "assets/images/hero/hero-default.jpg"
        },
        about: {
            judul: "Tentang IMDKOM",
            deskripsi: "IMDKOM adalah lembaga kursus dan pelatihan komputer yang telah berpengalaman dalam membantu masyarakat mengembangkan keterampilan digital. Kami juga menyediakan layanan computer service untuk perbaikan laptop, PC, dan printer.",
            gambar: "assets/images/about/about-imdkom.jpg"
        },
        contact: {
            whatsapp: "0856-0191-3435",
            instagram: "@imdkom"
        },
        footer: {
            copyright: "© 2026 IMDKOM. All rights reserved."
        },
        updatedAt: now
    };
    
    await setDoc(doc(db, 'landingPage', 'content'), content);
}

// ============================================================
// TAMBAHAN: Buat Data Testimoni Contoh (Opsional)
// ============================================================

/**
 * Membuat testimoni default (opsional)
 */
export async function createDefaultTestimonials() {
    const now = new Date().toISOString();
    
    const testimonials = [
        {
            nama: "Budi Santoso",
            program: "Microsoft Office",
            teks: "Pelatihan di IMDKOM sangat bermanfaat. Sekarang saya bisa menggunakan Microsoft Office dengan lebih profesional.",
            foto: "assets/images/testimonials/user-1.jpg",
            aktif: true,
            order: 1,
            createdAt: now,
            updatedAt: now
        },
        {
            nama: "Siti Rahayu",
            program: "Kursus Privat",
            teks: "Saya sangat terbantu dengan program privat di IMDKOM. Materi disesuaikan dengan kebutuhan saya.",
            foto: "assets/images/testimonials/user-2.jpg",
            aktif: true,
            order: 2,
            createdAt: now,
            updatedAt: now
        }
    ];
    
    for (const testimonial of testimonials) {
        const docRef = doc(collection(db, 'testimonials'));
        await setDoc(docRef, testimonial);
    }
}