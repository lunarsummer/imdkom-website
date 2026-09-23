// ============================================================
// Placeholder Helper — SVG Data URI (Offline Safe)
// ============================================================

/**
 * Placeholder gambar (SVG data URI) — selalu bekerja offline
 * Menggantikan via.placeholder.com yang sering down
 */
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="#f3f4f6"/>
    <g transform="translate(200, 160)">
        <rect x="-40" y="-30" width="80" height="60" rx="8" fill="none" stroke="#d1d5db" stroke-width="3"/>
        <circle cx="-15" cy="-10" r="6" fill="#d1d5db"/>
        <path d="M -30 20 L -10 -5 L 5 10 L 15 0 L 30 20 Z" fill="#d1d5db"/>
    </g>
    <text x="50%" y="65%" font-family="Poppins, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle" font-weight="600">Image Not Found</text>
    <text x="50%" y="72%" font-family="Poppins, sans-serif" font-size="11" fill="#d1d5db" text-anchor="middle">Periksa kembali path gambar</text>
</svg>
`);

/**
 * Generate avatar SVG dari inisial nama
 * @param {string} name - Nama user
 * @param {string} bgColor - Background color (hex)
 * @param {string} textColor - Text color (hex)
 */
export function generateAvatar(name, bgColor = '#1a3c5e', textColor = '#ffffff') {
    const initial = (name || 'A').charAt(0).toUpperCase();
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="${bgColor}"/>
    <text x="50%" y="50%" font-family="Poppins, sans-serif" font-size="42" font-weight="700" fill="${textColor}" text-anchor="middle" dominant-baseline="central">${initial}</text>
</svg>
`;
    return 'data:image/svg+xml;base64,' + btoa(svg);
}

/**
 * Generate placeholder dengan icon & text custom
 * @param {string} emoji - Emoji icon (contoh: '🖼️')
 * @param {string} text - Text di bawah icon
 */
export function generatePlaceholder(emoji = '🖼️', text = 'No Image') {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="#f3f4f6"/>
    <text x="50%" y="45%" font-family="sans-serif" font-size="60" fill="#d1d5db" text-anchor="middle">${emoji}</text>
    <text x="50%" y="58%" font-family="Poppins, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle" font-weight="600">${text}</text>
</svg>
`;
    return 'data:image/svg+xml;base64,' + btoa(svg);
}

/**
 * Helper untuk set gambar dengan fallback otomatis
 * @param {HTMLImageElement} imgElement - Element img
 * @param {string} path - Path gambar
 * @param {string} fallback - Fallback SVG (opsional)
 */
export function setImageWithFallback(imgElement, path, fallback = PLACEHOLDER_IMAGE) {
    imgElement.onerror = function() {
        this.onerror = null; // Hindari infinite loop
        this.src = fallback;
    };
    
    if (path) {
        // Path relatif (dari root) → tambahkan '../' kalau di admin
        const isAdmin = window.location.pathname.includes('/admin/');
        const finalPath = path.startsWith('http') ? path : (isAdmin ? '../' + path : path);
        imgElement.src = finalPath;
    } else {
        imgElement.src = fallback;
    }
}