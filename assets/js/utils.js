// ============================================================
// Utility Functions
// ============================================================

/**
 * Mendapatkan URL gambar
 */
export function getImageUrl(path, defaultPath = '') {
    if (!path) {
        return defaultPath || 'assets/images/default-placeholder.jpg';
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    if (path.startsWith('assets/') || path.startsWith('./assets/')) {
        return path;
    }
    if (path.startsWith('/')) {
        return '.' + path;
    }
    return defaultPath || 'assets/images/default-placeholder.jpg';
}

/**
 * Format harga ke Rupiah
 */
export function formatRupiah(amount) {
    if (!amount) return 'Hubungi kami';
    if (typeof amount === 'string' && isNaN(parseFloat(amount.replace(/[^0-9]/g, '')))) {
        return amount;
    }
    const num = parseFloat(amount.toString().replace(/[^0-9]/g, ''));
    if (isNaN(num) || num === 0) return 'Hubungi kami';
    return 'Rp ' + num.toLocaleString('id-ID');
}

/**
 * Truncate text
 */
export function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Format tanggal
 */
export function formatDate(timestamp) {
    if (!timestamp) return '';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (e) {
        return '';
    }
}

/**
 * Escape HTML
 */
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}