// ============================================================
// NETLIFY EDGE FUNCTION
// Path: /program-detail.html & /program-detail
// ============================================================

export default async (request) => {
    const url = new URL(request.url);
    const programId = url.searchParams.get('id');
    const userAgent = request.headers.get('user-agent') || '';

    // Deteksi crawler (WhatsApp, FB, dll)
    const isCrawler = /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|Googlebot|bingbot/i.test(userAgent);

    // Jika bukan crawler atau tidak ada ID, kembalikan respons kosong (biarkan Netlify menyajikan file statis)
    // Kita gunakan trick: fetch URL asli dengan menambahkan parameter ?_edge=1 agar tidak loop
    if (!isCrawler || !programId) {
        const staticUrl = new URL(request.url);
        staticUrl.searchParams.set('_edge', '1');
        return fetch(staticUrl.toString());
    }

    try {
        // ============================================================
        // FETCH DATA DARI FIRESTORE
        // ============================================================
        const projectId = 'imdkomyk-9695a';
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/programs/${programId}`;
        
        const firestoreRes = await fetch(firestoreUrl);
        
        if (!firestoreRes.ok) {
            throw new Error(`Firestore error: ${firestoreRes.status}`);
        }

        const firestoreData = await firestoreRes.json();
        const fields = firestoreData.fields || {};

        const nama = fields.nama?.stringValue || 'Program Kursus';
        const deskripsi = fields.deskripsiSingkat?.stringValue 
            || fields.deskripsi?.stringValue 
            || 'Program pelatihan komputer di IMDKOM Yogyakarta.';
        const gambar = fields.gambar?.stringValue || '';

        let ogImage = 'https://imdkomyogyakarta.netlify.app/assets/images/logo/imdkom.svg';
        if (gambar && gambar.includes('cloudinary.com')) {
            ogImage = gambar.replace('/upload/', '/upload/f_auto,q_auto,w_1200,h_630,c_fill/');
        } else if (gambar) {
            ogImage = gambar.startsWith('http') ? gambar : `https://imdkomyogyakarta.netlify.app/${gambar}`;
        }

        const pageTitle = `${nama} | IMDKOM Yogyakarta`;
        const pageDesc = deskripsi.substring(0, 160);

        // ============================================================
        // AMBIL HTML ASLI (TANPA EDGE FUNCTION)
        // ============================================================
        // Kita fetch file statis aslinya dengan menambahkan ?_edge=1
        const staticUrl = new URL(request.url);
        staticUrl.searchParams.set('_edge', '1');
        const htmlRes = await fetch(staticUrl.toString());
        let html = await htmlRes.text();

        // ============================================================
        // INJECT META TAG
        // ============================================================
        const metaTags = `
    <meta property="og:type" content="article" />
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

        html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeAttr(pageTitle)}</title>`);
        html = html.replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '');
        html = html.replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '');
        html = html.replace(/(<title>.*?<\/title>)/i, `$1\n${metaTags}`);

        return new Response(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });

    } catch (error) {
        console.error('Edge Function error:', error.message);
        // Fallback: jika error, kembalikan HTML asli
        const staticUrl = new URL(request.url);
        staticUrl.searchParams.set('_edge', '1');
        return fetch(staticUrl.toString());
    }
};

function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============================================================
// KONFIGURASI PATH
// ============================================================
export const config = {
    path: ["/program-detail.html", "/program-detail"]
};