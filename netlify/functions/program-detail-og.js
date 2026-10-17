// ============================================================
// NETLIFY EDGE FUNCTION
// Inject meta tag OG dinamis untuk program-detail.html
// Hanya aktif saat request dari crawler (WhatsApp, FB, dll)
// ============================================================

export default async (request, context) => {
    const url = new URL(request.url);
    const programId = url.searchParams.get('id');
    const userAgent = request.headers.get('user-agent') || '';

    // Deteksi crawler
    const isCrawler = /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|Googlebot|bingbot/i.test(userAgent);

    // Ambil HTML asli dari file statis
    const response = await context.next();
    
    // Kalau bukan crawler atau tidak ada ID program → kirim HTML apa adanya
    if (!isCrawler || !programId) {
        return response;
    }

    // Ambil HTML asli
    let html = await response.text();

    // Kalau bukan halaman program-detail → kirim apa adanya
    if (!url.pathname.includes('program-detail')) {
        return new Response(html, {
            status: response.status,
            headers: response.headers
        });
    }

    try {
        // ============================================================
        // FETCH DATA PROGRAM DARI FIRESTORE REST API
        // ============================================================
        const projectId = 'imdkomyk-9695a';
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/programs/${programId}`;
        
        const firestoreRes = await fetch(firestoreUrl);
        
        if (!firestoreRes.ok) {
            console.log('Firestore fetch failed:', firestoreRes.status);
            return new Response(html, {
                status: response.status,
                headers: response.headers
            });
        }

        const firestoreData = await firestoreRes.json();
        const fields = firestoreData.fields || {};

        // Parse field Firestore
        const nama = fields.nama?.stringValue || 'Program Kursus';
        const deskripsi = fields.deskripsiSingkat?.stringValue 
            || fields.deskripsi?.stringValue 
            || 'Program pelatihan komputer di IMDKOM Yogyakarta.';
        const gambar = fields.gambar?.stringValue || '';

        // ============================================================
        // BUILD OG IMAGE URL (dengan transformasi Cloudinary)
        // ============================================================
        let ogImage = 'https://imdkomyogyakarta.netlify.app/assets/images/logo/imdkom.svg';
        
        if (gambar && gambar.includes('cloudinary.com')) {
            // Sisipkan transformasi 1200x630 (standar OG)
            ogImage = gambar.replace('/upload/', '/upload/f_auto,q_auto,w_1200,h_630,c_fill/');
        } else if (gambar) {
            ogImage = gambar.startsWith('http') 
                ? gambar 
                : `https://imdkomyogyakarta.netlify.app/${gambar}`;
        }

        const pageTitle = `${nama} | IMDKOM Yogyakarta`;
        const pageDesc = deskripsi.substring(0, 160);

        // ============================================================
        // INJECT META TAG OG KE HTML
        // ============================================================
        const metaTags = `
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="IMDKOM Yogyakarta" />
    <meta property="og:title" content="${escapeAttr(pageTitle)}" />
    <meta property="og:description" content="${escapeAttr(pageDesc)}" />
    <meta property="og:image" content="${escapeAttr(ogImage)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${escapeAttr(url.href)}" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(pageTitle)}" />
    <meta name="twitter:description" content="${escapeAttr(pageDesc)}" />
    <meta name="twitter:image" content="${escapeAttr(ogImage)}" />
    `;

        // Ganti title
        html = html.replace(
            /<title>.*?<\/title>/i,
            `<title>${escapeAttr(pageTitle)}</title>`
        );

        // Hapus meta tag OG lama, lalu inject yang baru
        html = html.replace(
            /<meta\s+property="og:[^"]*"[^>]*>/gi,
            ''
        );
        html = html.replace(
            /<meta\s+name="twitter:[^"]*"[^>]*>/gi,
            ''
        );

        // Inject setelah <title>
        html = html.replace(
            /(<title>.*?<\/title>)/i,
            `$1\n${metaTags}`
        );

        return new Response(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=300, s-maxage=600'
            }
        });

    } catch (error) {
        console.error('Edge Function error:', error);
        // Fallback: kirim HTML asli
        return new Response(html, {
            status: response.status,
            headers: response.headers
        });
    }
};

// Helper: escape untuk atribut HTML
function escapeAttr(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
export const config = {
    path: ["/program-detail.html", "/program-detail"]
};