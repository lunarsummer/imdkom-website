// ============================================================
// CLOUDINARY UPLOAD HELPER
// IMDKOM — Reusable untuk admin, tentor, & halaman publik
// ============================================================

// ============================================================
// ⚙️ KONFIGURASI
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
// VALIDASI CONFIG
// ============================================================
function validateConfig(onError) {
    if (CLOUDINARY_CONFIG.cloudName.includes('GANTI_') ||
        CLOUDINARY_CONFIG.uploadPreset.includes('GANTI_')) {
        const err = new Error(
            'Cloudinary belum dikonfigurasi. Edit assets/js/cloudinary.js dan isi cloudName & uploadPreset.'
        );
        console.error('❌', err.message);
        onError(err);
        return false;
    }
    return true;
}

// ============================================================
// BANGUN FOLDER PATH
// ============================================================
function buildFolderPath(folder) {
    return folder
        ? `${CLOUDINARY_CONFIG.defaultFolder}/${folder}`
        : CLOUDINARY_CONFIG.defaultFolder;
}

// ============================================================
// STYLES & TEXT — dipakai bersama oleh semua widget
// ============================================================
const WIDGET_TEXT = {
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
};

const WIDGET_STYLES = {
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
};

// ============================================================
// OPEN UPLOAD WIDGET (GAMBAR)
// @param {Object} options
//   - folder: string — subfolder Cloudinary
//   - onSuccess: function(url, publicId)
//   - onError: function(error)
//   - multiple: boolean (default false)
//   - cropping: boolean (default false) — aktifkan crop di widget
//   - croppingAspectRatio: number (mis. 1 untuk 1:1, 0.8 untuk 4:5)
//   - maxFileSize: number (default 5MB)
//   - clientAllowedFormats: array (default jpg/jpeg/png/webp/gif/svg)
// ============================================================
export async function openCloudinaryUpload(options = {}) {
    const {
        folder = '',
        onSuccess = () => {},
        onError = () => {},
        multiple = false,
        cropping = false,
        croppingAspectRatio = null,
        maxFileSize = 5000000,
        clientAllowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']
    } = options;

    if (!validateConfig(onError)) return;

    try {
        await loadCloudinaryWidget();
    } catch (error) {
        console.error('❌ Cloudinary widget load error:', error);
        onError(error);
        return;
    }

    const fullFolder = buildFolderPath(folder);

    const widget = window.cloudinary.createUploadWidget(
        {
            cloudName: CLOUDINARY_CONFIG.cloudName,
            uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
            folder: fullFolder,
            sources: ['local', 'url', 'camera'],
            multiple: multiple,
            maxFileSize: maxFileSize,
            clientAllowedFormats: clientAllowedFormats,
            cropping: cropping,
            croppingAspectRatio: croppingAspectRatio,
            showAdvancedOptions: false,
            showSkipCropButton: true,
            language: 'id',
            text: WIDGET_TEXT,
            styles: WIDGET_STYLES
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
                console.log('ℹ️ Widget ditutup');
            }
        }
    );

    widget.open();
}

// ============================================================
// OPEN UPLOAD WIDGET (FILE NON-GAMBAR — PDF, DOCX, dll)
// @param {Object} options
//   - folder: string
//   - onSuccess: function(url, publicId, originalFilename, bytes)
//   - onError: function(error)
//   - maxFileSize: number (default 20MB)
//   - clientAllowedFormats: array (default ['pdf', 'doc', 'docx'])
// ============================================================
export async function openCloudinaryFileUpload(options = {}) {
    const {
        folder = '',
        onSuccess = () => {},
        onError = () => {},
        maxFileSize = 20000000,  // 20MB untuk PDF modul
        clientAllowedFormats = ['pdf', 'doc', 'docx']
    } = options;

    if (!validateConfig(onError)) return;

    try {
        await loadCloudinaryWidget();
    } catch (error) {
        console.error('❌ Cloudinary widget load error:', error);
        onError(error);
        return;
    }

    const fullFolder = buildFolderPath(folder);

    const widget = window.cloudinary.createUploadWidget(
        {
            cloudName: CLOUDINARY_CONFIG.cloudName,
            uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
            folder: fullFolder,
            resourceType: 'raw',         // ← kunci: file non-gambar disimpan sebagai 'raw'
            sources: ['local', 'url'],
            multiple: false,
            maxFileSize: maxFileSize,
            clientAllowedFormats: clientAllowedFormats,
            showAdvancedOptions: false,
            language: 'id',
            text: WIDGET_TEXT,
            styles: WIDGET_STYLES
        },
        (error, result) => {
            if (error) {
                console.error('❌ Cloudinary error:', error);
                onError(error);
                return;
            }

            if (result.event === 'success') {
                const info = result.info;
                console.log('✅ File upload sukses:', info.secure_url);
                onSuccess(
                    info.secure_url,
                    info.public_id,
                    info.original_filename,
                    info.bytes
                );
            }

            if (result.event === 'close') {
                console.log('ℹ️ Widget ditutup');
            }
        }
    );

    widget.open();
}

// ============================================================
// OPTIMASI URL GAMBAR CLOUDINARY
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

    const uploadIndex = url.indexOf('/upload/');
    const afterUpload = url.substring(uploadIndex + 8);

    if (/^v\d+/.test(afterUpload)) {
        return url.replace('/upload/', `/upload/${transformStr}/`);
    }

    return url;
}

// ============================================================
// HELPER: SETUP UPLOAD GAMBAR LENGKAP UNTUK 1 FIELD
// @param {Object} config
//   - uploadBtnId, uploadTextId, removeBtnId, inputId,
//     previewWrapperId, previewImgId, folder, previewWidth
//   - cropping (opsional, default false)
//   - croppingAspectRatio (opsional)
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
        previewWidth = 400,
        cropping = false,
        croppingAspectRatio = null
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

    uploadBtn.addEventListener('click', () => {
        openCloudinaryUpload({
            folder,
            cropping,
            croppingAspectRatio,
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
// HELPER: SETUP UPLOAD FILE (PDF/DOCX) UNTUK 1 FIELD
// @param {Object} config
//   - uploadBtnId, uploadTextId, removeBtnId, inputId,
//     fileNameId (elemen untuk tampilkan nama file),
//     fileSizeId (elemen untuk tampilkan ukuran file),
//     previewWrapperId (wrapper preview),
//     folder
// ============================================================
export function setupFileUploadField(config) {
    const {
        uploadBtnId,
        uploadTextId,
        removeBtnId,
        inputId,
        previewWrapperId,
        fileNameId,
        fileSizeId,
        folder = ''
    } = config;

    const uploadBtn = document.getElementById(uploadBtnId);
    const uploadText = document.getElementById(uploadTextId);
    const removeBtn = document.getElementById(removeBtnId);
    const input = document.getElementById(inputId);
    const previewWrapper = document.getElementById(previewWrapperId);
    const fileNameEl = document.getElementById(fileNameId);
    const fileSizeEl = document.getElementById(fileSizeId);

    if (!uploadBtn || !input) {
        console.warn(`⚠️ setupFileUploadField: elemen tidak ditemukan (${uploadBtnId}, ${inputId})`);
        return;
    }

    uploadBtn.addEventListener('click', () => {
        openCloudinaryFileUpload({
            folder,
            onSuccess: (url, publicId, filename, bytes) => {
                input.value = url;

                // Simpan metadata di dataset input (untuk edit)
                input.dataset.filename = filename || '';
                input.dataset.bytes = bytes || 0;

                if (fileNameEl) fileNameEl.textContent = filename || 'File terunggah';
                if (fileSizeEl && bytes) {
                    fileSizeEl.textContent = formatBytes(bytes);
                }

                if (previewWrapper) previewWrapper.classList.remove('hidden');
                if (removeBtn) removeBtn.classList.remove('hidden');
                if (uploadText) uploadText.textContent = 'Ganti File';

                if (typeof lucide !== 'undefined') lucide.createIcons();
            },
            onError: (err) => alert('Upload gagal: ' + err.message)
        });
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            input.value = '';
            input.dataset.filename = '';
            input.dataset.bytes = 0;
            if (previewWrapper) previewWrapper.classList.add('hidden');
            removeBtn.classList.add('hidden');
            if (uploadText) uploadText.textContent = 'Upload File';
        });
    }
}

// ============================================================
// HELPER: SET PREVIEW DARI URL EXISTING (mode edit)
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
// HELPER: SET PREVIEW FILE DARI URL EXISTING (mode edit)
// @param {Object} config — sama dengan setupFileUploadField
// @param {string} url
// @param {string} filename (opsional)
// @param {number} bytes (opsional)
// ============================================================
export function setExistingFilePreview(config, url, filename = '', bytes = 0) {
    if (!url) return;

    const {
        uploadTextId,
        removeBtnId,
        inputId,
        previewWrapperId,
        fileNameId,
        fileSizeId
    } = config;

    const input = document.getElementById(inputId);
    const previewWrapper = document.getElementById(previewWrapperId);
    const fileNameEl = document.getElementById(fileNameId);
    const fileSizeEl = document.getElementById(fileSizeId);
    const removeBtn = document.getElementById(removeBtnId);
    const uploadText = document.getElementById(uploadTextId);

    if (input) {
        input.value = url;
        input.dataset.filename = filename || '';
        input.dataset.bytes = bytes || 0;
    }
    if (fileNameEl) fileNameEl.textContent = filename || 'File terunggah';
    if (fileSizeEl && bytes) fileSizeEl.textContent = formatBytes(bytes);
    if (previewWrapper) previewWrapper.classList.remove('hidden');
    if (removeBtn) removeBtn.classList.remove('hidden');
    if (uploadText) uploadText.textContent = 'Ganti File';
}

// ============================================================
// FORMAT BYTES → KB/MB
// ============================================================
export function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================================
// EXPORT CONFIG (debug)
// ============================================================
export function getCloudinaryConfig() {
    return { ...CLOUDINARY_CONFIG };
}