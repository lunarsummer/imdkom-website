// ============================================================
// NETLIFY EDGE FUNCTION — SERVICE DETAIL OG INJECTION
// Path: /service-detail.html & /service-detail
// ============================================================

const PROJECT_ID = 'imdkomyk-9695a';
const FALLBACK_OG_IMAGE = 'https://imdkomyogyakarta.netlify.app/assets/images/logo/imdkom.svg';

export default async (request, context) => {
    const url = new URL(request.url);
    const serviceId = url.searchParams.get('id');
    const userAgent = request.headers.get('user-agent') || '';

    // 1. Deteksi crawler
    const isCrawler = /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|Googlebot|bingbot/i.test(userAgent);

    // 2. Jika bukan crawler atau tidak ada ID, biarkan Netlify sajikan HTML asli
    if (!isCrawler || !serviceId) {
        return;
    }

    try {
        // 3. Ambil data dari Firestore
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/services/${serviceId}`;

        const firestoreRes = await fetch(firestoreUrl);
        if (!firestoreRes.ok) {
            return;
        }

        const firestoreData = await firestoreRes.json();
        const fields = firestoreData.fields || {};

        const nama = fields.nama?.stringValue || 'Layanan Service';
        const deskripsi = fields.deskripsiSingkat?.stringValue
            || fields.deskripsi?.stringValue
            || 'Layanan service profesional di IMDKOM Yogyakarta.';
        const gambar = fields.gambar?.stringValue || '';
        const kategori = fields.kategori?.stringValue || '';

        // 4. Build OG image URL (optimasi Cloudinary)
        let ogImage = FALLBACK_OG_IMAGE;
        if (gambar && gambar.includes('cloudinary.com')) {
            ogImage = gambar.replace('/upload/', '/upload/f_auto,q_auto,w_1200,h_630,c_fill/');
        } else if (gambar) {
            ogImage = gambar.startsWith('http') ? gambar : `https://imdkomyogyakarta.netlify.app/${gambar}`;
        }

        const pageTitle = `${nama} | IMDKOM Yogyakarta`;
        const pageDesc = deskripsi.substring(0, 160);

        // 5. Ambil HTML asli
        const response = await context.next();
        let html = await response.text();

        // 6. Suntikkan meta tags
        const metaTags = `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeAttr(pageTitle)}" />
    <meta property="og:description" content="${escapeAttr(pageDesc)}" />
    <meta property="og:image" content="${escapeAttr(ogImage)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${escapeAttr(url.href)}" />
    <meta property="og:site_name" content="IMDKOM Yogyakarta" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(pageTitle)}" />
    <meta name="twitter:description" content="${escapeAttr(pageDesc)}" />
    <meta name="twitter:image" content="${escapeAttr(ogImage)}" />
    <meta name="description" content="${escapeAttr(pageDesc)}" />
    `;

        // Ganti title & hapus OG/twitter/description lama
        html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeAttr(pageTitle)}</title>`);
        html = html.replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '');
        html = html.replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '');
        html = html.replace(/<meta\s+name="description"[^>]*>/gi, '');
        html = html.replace(/(<title>.*?<\/title>)/i, `$1\n${metaTags}`);

        // 7. Kembalikan HTML yang sudah dimodifikasi
        return new Response(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=300, s-maxage=600'
            }
        });

    } catch (error) {
        console.error('Service edge function error:', error.message);
        return;
    }
};

function escapeAttr(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================================
// KONFIGURASI PATH
// ============================================================
export const config = {
    path: ["/service-detail.html", "/service-detail"]
};