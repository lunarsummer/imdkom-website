// ============================================================
// Init Database — Auto-create Firestore Collections
// ============================================================

import { 
    db, 
    collection, doc, getDoc, getDocs, setDoc, addDoc,
    query, where, orderBy, limit 
} from './firebase.js';

/**
 * Inisialisasi database — cek & buat collection default
 */
export async function initDatabase() {
    console.log('🔍 Checking database structure...');
    
    try {
        // ============================================================
        // EXISTING COLLECTIONS
        // ============================================================
        
        // Programs
        if (!await checkCollection('programs')) {
            console.log('📦 Creating default programs...');
            await createDefaultPrograms();
        }
        
        // Services
        if (!await checkCollection('services')) {
            console.log('📦 Creating default services...');
            await createDefaultServices();
        }
        
        // FAQs
        if (!await checkCollection('faqs')) {
            console.log('📦 Creating default FAQs...');
            await createDefaultFaqs();
        }
        
        // Settings
        if (!await checkDocument('settings', 'general')) {
            console.log('📦 Creating default settings...');
            await createDefaultSettings();
        }
        
        // Landing Page
        if (!await checkDocument('landingPage', 'content')) {
            console.log('📦 Creating default landing page content...');
            await createDefaultLandingPage();
        }
        
        // ============================================================
        // NEW COLLECTIONS (untuk halaman detail layanan)
        // ============================================================
        
        // Pricelists
        if (!await checkCollection('pricelists')) {
            console.log('📦 Creating default pricelists...');
            await createDefaultPricelists();
        }
        
        // Documentations
        if (!await checkCollection('documentations')) {
    console.log('📦 Creating default documentations...');
    try {
        await createDefaultDocumentations();
    } catch (e) {
        console.warn('⚠️ Skip documentations:', e.message);
    }
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
// DEFAULT DATA — PROGRAMS
// ============================================================

async function createDefaultPrograms() {
    const now = new Date().toISOString();
    
    const programs = [
        {
            nama: "Microsoft Office",
            kategori: "Microsoft Office",
            deskripsi: "Pelatihan Microsoft Office lengkap untuk pemula hingga mahir. Mencakup Word, Excel, PowerPoint, dan Outlook.",
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
            deskripsi: "Program belajar komputer secara privat dengan materi yang disesuaikan dengan kebutuhan peserta.",
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
            deskripsi: "Pelatihan intensif dalam waktu singkat untuk keterampilan spesifik.",
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
            deskripsi: "Program persiapan sertifikasi komputer untuk meningkatkan kredibilitas dan karir Anda.",
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

// ============================================================
// DEFAULT DATA — SERVICES
// ============================================================

async function createDefaultServices() {
    const now = new Date().toISOString();
    
    const services = [
        {
            nama: "Service Laptop",
            slug: "laptop",
            kategori: "Service Laptop",
            deskripsi: "Layanan perbaikan laptop berbagai merek dengan teknisi berpengalaman. Melayani ASUS, Lenovo, HP, Acer, Dell, dan lainnya.",
            deskripsiSingkat: "Perbaikan semua merek laptop.",
            hargaMulai: "Rp 100.000",
            gambar: "assets/images/services/laptop.jpg",
            icon: "laptop",
            warna: "brand",
            aktif: true,
            order: 1,
            createdAt: now,
            updatedAt: now
        },
        {
            nama: "Service PC",
            slug: "pc",
            kategori: "Service PC",
            deskripsi: "Layanan perbaikan komputer desktop/PC untuk kebutuhan pribadi dan kantor.",
            deskripsiSingkat: "Perbaikan komputer desktop/PC.",
            hargaMulai: "Rp 100.000",
            gambar: "assets/images/services/pc.jpg",
            icon: "monitor",
            warna: "brand",
            aktif: true,
            order: 2,
            createdAt: now,
            updatedAt: now
        },
        {
            nama: "Service Printer",
            slug: "printer",
            kategori: "Service Printer",
            deskripsi: "Layanan perbaikan printer, termasuk penggantian tinta, cartridge, dan sparepart.",
            deskripsiSingkat: "Perbaikan printer berbagai merek.",
            hargaMulai: "Rp 75.000",
            gambar: "assets/images/services/printer.jpg",
            icon: "printer",
            warna: "brand",
            aktif: true,
            order: 3,
            createdAt: now,
            updatedAt: now
        },
        {
            nama: "Service Panggil",
            slug: "panggil",
            kategori: "Service Panggil",
            deskripsi: "Layanan service panggil ke lokasi Anda. Teknisi kami akan datang untuk memperbaiki perangkat Anda.",
            deskripsiSingkat: "Teknisi datang ke lokasi Anda.",
            hargaMulai: "Rp 150.000",
            gambar: "assets/images/services/panggil.jpg",
            icon: "home",
            warna: "orange",
            badge: "POPULER",
            aktif: true,
            order: 4,
            createdAt: now,
            updatedAt: now
        },
        {
            nama: "Sparepart",
            slug: "sparepart",
            kategori: "Sparepart",
            deskripsi: "Menyediakan berbagai sparepart komputer seperti RAM, harddisk, power supply, dan aksesoris lainnya.",
            deskripsiSingkat: "Suku cadang berkualitas.",
            hargaMulai: "Rp 150.000",
            gambar: "assets/images/services/sparepart.jpg",
            icon: "cpu",
            warna: "brand",
            aktif: true,
            order: 5,
            createdAt: now,
            updatedAt: now
        },
        {
            nama: "Upgrade",
            slug: "upgrade",
            kategori: "Upgrade",
            deskripsi: "Layanan upgrade komputer untuk meningkatkan performa. Meliputi upgrade RAM, SSD, processor, dan komponen lainnya.",
            deskripsiSingkat: "Tingkatkan performa komputer.",
            hargaMulai: "Rp 200.000",
            gambar: "assets/images/services/upgrade.jpg",
            icon: "trending-up",
            warna: "brand",
            aktif: true,
            order: 6,
            createdAt: now,
            updatedAt: now
        },
        {
            nama: "Instalasi",
            slug: "instalasi",
            kategori: "Instalasi",
            deskripsi: "Layanan instalasi OS dan software untuk laptop maupun PC.",
            deskripsiSingkat: "Instalasi OS & software.",
            hargaMulai: "Rp 75.000",
            gambar: "assets/images/services/instalasi.jpg",
            icon: "download",
            warna: "brand",
            aktif: true,
            order: 7,
            createdAt: now,
            updatedAt: now
        }
    ];
    
    for (const service of services) {
        const docRef = doc(collection(db, 'services'));
        await setDoc(docRef, service);
    }
}

// ============================================================
// DEFAULT DATA — PRICELISTS
// ============================================================

async function createDefaultPricelists() {
    const now = new Date().toISOString();
    
    const pricelists = [
        // ===== SERVICE LAPTOP =====
        // Kategori: Perbaikan Hardware
        { serviceSlug: "laptop", kategori: "Perbaikan Hardware", nama: "Ganti LCD Laptop", deskripsi: "Ganti LCD original sesuai merek", harga: 500000, estimasi: "1 hari", garansi: "2 bulan", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "laptop", kategori: "Perbaikan Hardware", nama: "Ganti Keyboard", deskripsi: "Ganti keyboard laptop", harga: 250000, estimasi: "2 jam", garansi: "2 bulan", order: 2, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "laptop", kategori: "Perbaikan Hardware", nama: "Ganti Baterai", deskripsi: "Ganti baterai original", harga: 350000, estimasi: "1 jam", garansi: "2 bulan", order: 3, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "laptop", kategori: "Perbaikan Hardware", nama: "Ganti Motherboard", deskripsi: "Ganti motherboard laptop", harga: 850000, estimasi: "2-3 hari", garansi: "2 bulan", order: 4, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "laptop", kategori: "Perbaikan Hardware", nama: "Perbaikan Engsel", deskripsi: "Perbaikan engsel layar", harga: 200000, estimasi: "1 hari", garansi: "2 bulan", order: 5, aktif: true, createdAt: now, updatedAt: now },
        
        // Kategori: Software
        { serviceSlug: "laptop", kategori: "Software", nama: "Install Ulang OS", deskripsi: "Install ulang Windows/Mac/Linux", harga: 100000, estimasi: "2 jam", garansi: "2 bulan", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "laptop", kategori: "Software", nama: "Install Software", deskripsi: "Install software sesuai kebutuhan", harga: 50000, estimasi: "1 jam", garansi: "1 bulan", order: 2, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "laptop", kategori: "Software", nama: "Hapus Virus/Malware", deskripsi: "Pembersihan virus & malware", harga: 75000, estimasi: "1 jam", garansi: "1 bulan", order: 3, aktif: true, createdAt: now, updatedAt: now },
        
        // Kategori: Upgrade
        { serviceSlug: "laptop", kategori: "Upgrade", nama: "Upgrade RAM", deskripsi: "Upgrade RAM 4GB/8GB/16GB", harga: 250000, estimasi: "30 menit", garansi: "2 bulan", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "laptop", kategori: "Upgrade", nama: "Upgrade SSD", deskripsi: "Upgrade ke SSD 256GB/512GB", harga: 450000, estimasi: "1 jam", garansi: "2 bulan", order: 2, aktif: true, createdAt: now, updatedAt: now },
        
        // ===== SERVICE PC =====
        { serviceSlug: "pc", kategori: "Perbaikan Hardware", nama: "Ganti Power Supply", deskripsi: "Ganti PSU komputer", harga: 300000, estimasi: "1 jam", garansi: "2 bulan", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "pc", kategori: "Perbaikan Hardware", nama: "Ganti Motherboard", deskripsi: "Ganti motherboard PC", harga: 750000, estimasi: "2-3 hari", garansi: "2 bulan", order: 2, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "pc", kategori: "Software", nama: "Install Ulang OS", deskripsi: "Install ulang Windows/Linux", harga: 100000, estimasi: "2 jam", garansi: "2 bulan", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "pc", kategori: "Upgrade", nama: "Upgrade RAM", deskripsi: "Upgrade RAM PC", harga: 250000, estimasi: "30 menit", garansi: "2 bulan", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "pc", kategori: "Upgrade", nama: "Upgrade VGA", deskripsi: "Upgrade kartu grafis", harga: 800000, estimasi: "1 jam", garansi: "2 bulan", order: 2, aktif: true, createdAt: now, updatedAt: now },
        
        // ===== SERVICE PRINTER =====
        { serviceSlug: "printer", kategori: "Perbaikan Hardware", nama: "Bersihkan Head Printer", deskripsi: "Cleaning head printer", harga: 75000, estimasi: "30 menit", garansi: "1 bulan", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "printer", kategori: "Perbaikan Hardware", nama: "Ganti Cartridge", deskripsi: "Ganti cartridge printer", harga: 150000, estimasi: "30 menit", garansi: "1 bulan", order: 2, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "printer", kategori: "Perbaikan Hardware", nama: "Ganti Roller", deskripsi: "Ganti roller printer", harga: 200000, estimasi: "1 jam", garansi: "2 bulan", order: 3, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "printer", kategori: "Refill", nama: "Refill Tinta", deskripsi: "Isi ulang tinta printer", harga: 50000, estimasi: "15 menit", garansi: "-", order: 1, aktif: true, createdAt: now, updatedAt: now },
        
        // ===== SERVICE PANGGIL =====
        { serviceSlug: "panggil", kategori: "Biaya Kunjungan", nama: "Kunjungan dalam Kota", deskripsi: "Biaya kunjungan area Yogyakarta", harga: 50000, estimasi: "Sesuai jadwal", garansi: "-", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "panggil", kategori: "Biaya Kunjungan", nama: "Kunjungan Luar Kota", deskripsi: "Biaya kunjungan luar Yogyakarta", harga: 100000, estimasi: "Sesuai jadwal", garansi: "-", order: 2, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "panggil", kategori: "Service", nama: "Perbaikan di Lokasi", deskripsi: "Perbaikan langsung di lokasi", harga: 150000, estimasi: "1-2 jam", garansi: "2 bulan", order: 1, aktif: true, createdAt: now, updatedAt: now },
        
        // ===== SPAREPART =====
        { serviceSlug: "sparepart", kategori: "RAM", nama: "RAM DDR4 4GB", deskripsi: "RAM DDR4 kapasitas 4GB", harga: 350000, estimasi: "Ready", garansi: "1 tahun", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "sparepart", kategori: "RAM", nama: "RAM DDR4 8GB", deskripsi: "RAM DDR4 kapasitas 8GB", harga: 600000, estimasi: "Ready", garansi: "1 tahun", order: 2, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "sparepart", kategori: "Storage", nama: "SSD 256GB", deskripsi: "SSD SATA 256GB", harga: 450000, estimasi: "Ready", garansi: "1 tahun", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "sparepart", kategori: "Storage", nama: "SSD 512GB", deskripsi: "SSD SATA 512GB", harga: 750000, estimasi: "Ready", garansi: "1 tahun", order: 2, aktif: true, createdAt: now, updatedAt: now },
        
        // ===== UPGRADE =====
        { serviceSlug: "upgrade", kategori: "RAM", nama: "Upgrade RAM 4GB → 8GB", deskripsi: "Upgrade RAM dari 4GB ke 8GB", harga: 400000, estimasi: "30 menit", garansi: "2 bulan", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "upgrade", kategori: "RAM", nama: "Upgrade RAM 8GB → 16GB", deskripsi: "Upgrade RAM dari 8GB ke 16GB", harga: 700000, estimasi: "30 menit", garansi: "2 bulan", order: 2, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "upgrade", kategori: "Storage", nama: "Upgrade HDD → SSD", deskripsi: "Upgrade dari HDD ke SSD", harga: 500000, estimasi: "1 jam", garansi: "2 bulan", order: 1, aktif: true, createdAt: now, updatedAt: now },
        
        // ===== INSTALASI =====
        { serviceSlug: "instalasi", kategori: "OS", nama: "Install Windows 10/11", deskripsi: "Install Windows original", harga: 100000, estimasi: "2 jam", garansi: "1 bulan", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "instalasi", kategori: "OS", nama: "Install Linux", deskripsi: "Install Linux (Ubuntu, dll)", harga: 75000, estimasi: "1.5 jam", garansi: "1 bulan", order: 2, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "instalasi", kategori: "Software", nama: "Install Office", deskripsi: "Install Microsoft Office", harga: 50000, estimasi: "30 menit", garansi: "-", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "instalasi", kategori: "Software", nama: "Install Design Software", deskripsi: "Install Photoshop, Corel, dll", harga: 75000, estimasi: "1 jam", garansi: "-", order: 2, aktif: true, createdAt: now, updatedAt: now }
    ];
    
    for (const pricelist of pricelists) {
        const docRef = doc(collection(db, 'pricelists'));
        await setDoc(docRef, pricelist);
    }
}

// ============================================================
// DEFAULT DATA — DOCUMENTATIONS
// ============================================================

async function createDefaultDocumentations() {
    const now = new Date().toISOString();
    
    const documentations = [
        // Service Laptop
        { serviceSlug: "laptop", nama: "Ganti LCD Laptop Asus", gambar: "assets/images/services/laptop/svl1.png", keterangan: "Proses penggantian LCD laptop Asus", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "laptop", nama: "Ganti Keyboard Lenovo", gambar: "assets/images/services/laptop/svl2.png", keterangan: "Penggantian keyboard Lenovo ThinkPad", order: 2, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "laptop", nama: "Install Ulang Windows", gambar: "assets/images/services/laptop/svl3.png", keterangan: "Install ulang Windows 11", order: 3, aktif: true, createdAt: now, updatedAt: now },
        
        // Service PC
        { serviceSlug: "pc", nama: "Perbaikan PC Gaming", gambar: "assets/images/services/pc/svc1.png", keterangan: "Perbaikan PC gaming", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "pc", nama: "Upgrade RAM PC", gambar: "assets/images/services/pc/svc2.png", keterangan: "Upgrade RAM PC kantor", order: 2, aktif: true, createdAt: now, updatedAt: now },
        
        // Service Printer
        { serviceSlug: "printer", nama: "Bersihkan Head Printer", gambar: "assets/images/services/printer/svp1.png", keterangan: "Cleaning head printer Epson", order: 1, aktif: true, createdAt: now, updatedAt: now },
        { serviceSlug: "printer", nama: "Ganti Cartridge Canon", gambar: "assets/images/services/printer/svp2.png", keterangan: "Ganti cartridge printer Canon", order: 2, aktif: true, createdAt: now, updatedAt: now }
    ];
    
    // ✅ FIX: Ganti 'doc' jadi 'item'
    for (const item of documentations) {
        const docRef = doc(collection(db, 'documentations'));
        await setDoc(docRef, item);
    }
}

// ============================================================
// DEFAULT DATA — FAQS
// ============================================================

async function createDefaultFaqs() {
    const now = new Date().toISOString();
    
    const faqs = [
        {
            pertanyaan: "Berapa biaya kursus di IMDKOM?",
            jawaban: "Biaya kursus bervariasi tergantung program yang dipilih. Mulai dari Rp 800.000 untuk kursus singkat hingga Rp 2.500.000 untuk program sertifikasi.",
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
            pertanyaan: "Apakah ada garansi service?",
            jawaban: "Ya, setiap service yang kami kerjakan bergaransi 2 bulan untuk kerusakan yang sama.",
            aktif: true,
            order: 3,
            createdAt: now,
            updatedAt: now
        },
        {
            pertanyaan: "Bagaimana cara booking service?",
            jawaban: "Anda dapat menghubungi kami melalui WhatsApp atau klik tombol Konsultasi di setiap halaman layanan.",
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

// ============================================================
// DEFAULT DATA — SETTINGS
// ============================================================

async function createDefaultSettings() {
    const now = new Date().toISOString();
    
    const settings = {
        whatsapp: "0856-0191-3435",
        instagram: "@imdkom_yk",
        alamat: "Jl. Pendidikan No. 123, Yogyakarta",
        jamOperasional: "Senin-Jumat, 08:00 - 17:00",
        googleMaps: "https://maps.google.com/",
        updatedAt: now
    };
    
    await setDoc(doc(db, 'settings', 'general'), settings);
}

// ============================================================
// DEFAULT DATA — LANDING PAGE
// ============================================================

async function createDefaultLandingPage() {
    const now = new Date().toISOString();
    
    const content = {
        hero: {
            heading: "IMDKOM YOGYAKARTA",
            subheading: "Kursus & Pelatihan • Computer Service",
            deskripsi: "Belajar keterampilan komputer. Dapatkan solusi untuk perangkat Anda.",
            subtext: "IMDKOM adalah lembaga kursus dan pelatihan komputer yang juga menyediakan layanan perbaikan laptop, PC, dan printer.",
            ctaText: "Lihat Program",
            gambar: "assets/images/hero/hero-default.jpg"
        },
        about: {
            judul: "Tentang IMDKOM",
            deskripsi: "IMDKOM adalah lembaga kursus dan pelatihan komputer yang telah berpengalaman dalam membantu masyarakat mengembangkan keterampilan digital.",
            gambar: "assets/images/about/about-imdkom.jpg"
        },
        contact: {
            whatsapp: "0856-0191-3435",
            instagram: "@imdkom_yk"
        },
        footer: {
            copyright: "© 2026 IMDKOM. All rights reserved."
        },
        updatedAt: now
    };
    
    await setDoc(doc(db, 'landingPage', 'content'), content);
}