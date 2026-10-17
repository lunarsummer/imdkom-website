// ============================================================
// CLOUDINARY UPLOAD HELPER
// IMDKOM Admin — Reusable for all admin pages
// ============================================================

// ============================================================
// ⚙️ KONFIGURASI — GANTI DENGAN MILIK ANDA
// ============================================================
// Cara mendapatkan:
// 1. cloudName: Lihat di Cloudinary Dashboard (pojok kiri atas)
// 2. uploadPreset: Settings → Upload → Upload presets → (nama preset unsigned Anda)
// ============================================================

const CLOUDINARY_CONFIG = {
    cloudName: 'hrrdzqmn',
    uploadPreset: 'imdkom_unsigned',
    defaultFolder: 'imdkom'
};

// ============================================================
// LOAD CLOUDINARY WIDGET SCRIPT (lazy load, sekali saja)
// ============================================================
let widgetScriptLoaded = false;
let widgetScriptPromise = null;

function loadCloudinaryWidget() {
    if (widgetScriptLoaded && window.cloudinary) {
        return Promise.resolve();
    }

    if (widgetScriptPromise) {
        return widgetScriptPromise;
    }

    widgetScriptPromise = new Promise((resolve, reject) => {
        // Cek kalau script sudah ada di DOM
        const existingScript = document.querySelector('script[src*="upload-widget.cloudinary.com"]');
        if (existingScript && window.cloudinary) {
            widgetScriptLoaded = true;
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://upload-widget.cloudinary.com/global/all.js';
        script.async = true;
        script.onload = () => {
            widgetScriptLoaded = true;
            resolve();
        };
        script.onerror = () => {
            widgetScriptPromise = null;
            reject(new Error('Gagal load Cloudinary Upload Widget. Periksa koneksi internet.'));
        };
        document.head.appendChild(script);
    });

    return widgetScriptPromise;
}

// ============================================================
// OPEN UPLOAD WIDGET
// @param {Object} options
//   - folder: string (opsional) — subfolder di Cloudinary
//   - onSuccess: function(url, publicId) — callback sukses
//   - onError: function(error) — callback error
// ============================================================
export async function openCloudinaryUpload(options = {}) {
    const {
        folder = '',
        onSuccess = () => {},
        onError = () => {}
    } = options;

    // Validasi config
    if (CLOUDINARY_CONFIG.cloudName.includes('GANTI_') ||
        CLOUDINARY_CONFIG.uploadPreset.includes('GANTI_')) {
        const err = new Error(
            'Cloudinary belum dikonfigurasi. Edit assets/js/cloudinary.js dan isi cloudName & uploadPreset.'
        );
        console.error('❌', err.message);
        onError(err);
        return;
    }

    // Load widget script
    try {
        await loadCloudinaryWidget();
    } catch (error) {
        console.error('❌ Cloudinary widget load error:', error);
        onError(error);
        return;
    }

    // Bangun folder path
    const fullFolder = folder
        ? `${CLOUDINARY_CONFIG.defaultFolder}/${folder}`
        : CLOUDINARY_CONFIG.defaultFolder;

    // Buat widget
    const widget = window.cloudinary.createUploadWidget(
        {
            cloudName: CLOUDINARY_CONFIG.cloudName,
            uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
            folder: fullFolder,
            sources: ['local', 'url', 'camera'],
            multiple: false,
            maxFileSize: 5000000,                     // 5MB
            clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
            cropping: false,
            showAdvancedOptions: false,
            showSkipCropButton: true,
            language: 'id',
            text: {
                id: {
                    or: 'Atau',
                    back: 'Kembali',
                    advanced: 'Opsi Lanjutan',
                    close: 'Tutup',
                    no_results: 'Tidak ada hasil',
                    search_placeholder: 'Cari...',
                    about_uw: 'Tentang Upload Widget',
                    menu: {
                        files: 'File Saya',
                        web: 'Alamat Web',
                        camera: 'Kamera'
                    },
                    local: {
                        browse: 'Pilih File',
                        dd_title_single: 'Drag & Drop file di sini',
                        drop_title_single: 'Drop file untuk upload'
                    },
                    url: {
                        inner_title: 'URL Publik File',
                        outer_title: 'URL Publik File'
                    },
                    camera: {
                        capture: 'Ambil Foto',
                        cancel: 'Batal',
                        take_pic: 'Ambil',
                        explanation: 'Pastikan wajah Anda terlihat jelas'
                    },
                    queue: {
                        title: 'Antrian Upload',
                        title_uploading_with_counter: 'Mengunggah {{num}} file',
                        title_uploading: 'Mengunggah file',
                        mini_title: 'File',
                        mini_title_uploading: 'Mengunggah',
                        mini_title_uploaded: 'Terunggah',
                        show_advanced_options: 'Tampilkan opsi lanjutan',
                        retry_failed: 'Coba lagi',
                        abort_all: 'Batalkan Semua',
                        upload_more: 'Upload Lagi',
                        done: 'Selesai',
                        mini_upload_count: '{{num}} terunggah',
                        mini_failed: '{{num}} gagal',
                        statuses: {
                            uploading: 'Mengunggah...',
                            error: 'Error',
                            uploaded: 'Terunggah',
                            aborted: 'Dibatalkan'
                        }
                    }
                }
            },
            styles: {
                palette: {
                    window: '#FFFFFF',
                    windowBorder: '#1a3c5e',
                    tabIcon: '#1a3c5e',
                    menuIcons: '#1a3c5e',
                    textDark: '#1a3c5e',
                    textLight: '#FFFFFF',
                    link: '#c2410c',
                    action: '#1a3c5e',
                    inactiveTabIcon: '#9ca3af',
                    error: '#dc2626',
                    inProgress: '#059669',
                    complete: '#059669',
                    sourceBg: '#f8fafc'
                },
                fonts: {
                    default: null,
                    "'Poppins', sans-serif": {
                        url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
                        active: true
                    }
                }
            }
        },
        (error, result) => {
            if (error) {
                console.error('❌ Cloudinary error:', error);
                onError(error);
                return;
            }

            if (result.event === 'success') {
                const info = result.info;
                console.log('✅ Upload sukses:', info.secure_url);
                onSuccess(info.secure_url, info.public_id);
            }

            if (result.event === 'close') {
                // Widget ditutup tanpa upload — biarkan saja
                console.log('ℹ️ Widget ditutup');
            }
        }
    );

    widget.open();
}

// ============================================================
// OPTIMASI URL GAMBAR CLOUDINARY
// Tambahkan transformasi otomatis (resize, format, quality)
// @param {string} url — URL Cloudinary asli
// @param {Object} options — { width, height, crop, quality }
// @returns {string} URL yang sudah dioptimasi
// ============================================================
export function optimizeCloudinaryUrl(url, options = {}) {
    if (!url || typeof url !== 'string') return url;
    if (!url.includes('cloudinary.com')) return url;
    if (!url.includes('/upload/')) return url;

    const {
        width = null,
        height = null,
        crop = 'fill',
        quality = 'auto'
    } = options;

    const transforms = ['f_auto'];

    if (quality === 'auto') transforms.push('q_auto');
    else if (typeof quality === 'number') transforms.push(`q_${quality}`);

    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (width || height) transforms.push(`c_${crop}`);

    const transformStr = transforms.join(',');

    // Sisipkan transform setelah /upload/
    // Contoh: .../upload/v123/... → .../upload/f_auto,q_auto,w_400/v123/...
    // Kalau sudah ada transform sebelumnya, biarkan saja (jangan double)
    const uploadIndex = url.indexOf('/upload/');
    const afterUpload = url.substring(uploadIndex + 8); // 8 = length of '/upload/'

    // Kalau setelah /upload/ langsung 'v' + digit → belum ada transform
    if (/^v\d+/.test(afterUpload)) {
        return url.replace('/upload/', `/upload/${transformStr}/`);
    }

    // Sudah ada transform sebelumnya — jangan tambah lagi, biarkan
    return url;
}

// ============================================================
// HELPER: SETUP UPLOAD GAMBAR LENGKAP UNTUK 1 FIELD
// Fungsi ini untuk mengurangi boilerplate di setiap halaman admin
// @param {Object} config
//   - uploadBtnId: string
//   - uploadTextId: string
//   - removeBtnId: string
//   - inputId: string
//   - previewWrapperId: string
//   - previewImgId: string
//   - folder: string
//   - previewWidth: number (opsional, default 400)
// ============================================================
export function setupImageUploadField(config) {
    const {
        uploadBtnId,
        uploadTextId,
        removeBtnId,
        inputId,
        previewWrapperId,
        previewImgId,
        folder = '',
        previewWidth = 400
    } = config;

    const uploadBtn = document.getElementById(uploadBtnId);
    const uploadText = document.getElementById(uploadTextId);
    const removeBtn = document.getElementById(removeBtnId);
    const input = document.getElementById(inputId);
    const previewWrapper = document.getElementById(previewWrapperId);
    const previewImg = document.getElementById(previewImgId);

    if (!uploadBtn || !input) {
        console.warn(`⚠️ setupImageUploadField: elemen tidak ditemukan (${uploadBtnId}, ${inputId})`);
        return;
    }

    // Handler tombol Upload
    uploadBtn.addEventListener('click', () => {
        openCloudinaryUpload({
            folder,
            onSuccess: (url) => {
                input.value = url;
                if (previewImg) {
                    previewImg.src = optimizeCloudinaryUrl(url, { width: previewWidth });
                }
                if (previewWrapper) previewWrapper.classList.remove('hidden');
                if (removeBtn) removeBtn.classList.remove('hidden');
                if (uploadText) uploadText.textContent = 'Ganti Gambar';

                if (typeof lucide !== 'undefined') lucide.createIcons();
            },
            onError: (err) => alert('Upload gagal: ' + err.message)
        });
    });

    // Handler tombol Hapus
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            input.value = '';
            if (previewWrapper) previewWrapper.classList.add('hidden');
            removeBtn.classList.add('hidden');
            if (uploadText) uploadText.textContent = 'Upload Gambar';
        });
    }
}

// ============================================================
// HELPER: SET PREVIEW DARI URL EXISTING (untuk mode edit)
// @param {Object} config — sama dengan setupImageUploadField
// @param {string} url — URL Cloudinary existing
// ============================================================
export function setExistingImagePreview(config, url) {
    if (!url) return;

    const {
        uploadTextId,
        removeBtnId,
        inputId,
        previewWrapperId,
        previewImgId,
        previewWidth = 400
    } = config;

    const input = document.getElementById(inputId);
    const previewWrapper = document.getElementById(previewWrapperId);
    const previewImg = document.getElementById(previewImgId);
    const removeBtn = document.getElementById(removeBtnId);
    const uploadText = document.getElementById(uploadTextId);

    if (input) input.value = url;
    if (previewImg) previewImg.src = optimizeCloudinaryUrl(url, { width: previewWidth });
    if (previewWrapper) previewWrapper.classList.remove('hidden');
    if (removeBtn) removeBtn.classList.remove('hidden');
    if (uploadText) uploadText.textContent = 'Ganti Gambar';
}

// ============================================================
// EXPORT CONFIG (untuk debug — lihat di console)
// ============================================================
export function getCloudinaryConfig() {
    return { ...CLOUDINARY_CONFIG };
}