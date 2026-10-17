// ============================================================
// NETLIFY EDGE FUNCTION - FINAL
// Path: /program-detail.html & /program-detail
// ============================================================

export default async (request, context) => {
    const url = new URL(request.url);
    const programId = url.searchParams.get('id');
    const userAgent = request.headers.get('user-agent') || '';

    // 1. Deteksi Crawler
    const isCrawler = /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|Googlebot|bingbot/i.test(userAgent);

    // 2. Jika bukan crawler atau tidak ada ID, lanjutkan request seperti biasa (jangan return apapun)
    //    Ini akan membuat Netlify menyajikan file statis HTML asli.
    if (!isCrawler || !programId) {
        return; 
    }

    try {
        // 3. Ambil Data dari Firestore
        const projectId = 'imdkomyk-9695a';
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/programs/${programId}`;
        
        const firestoreRes = await fetch(firestoreUrl);
        if (!firestoreRes.ok) {
            // Jika gagal ambil data, biarkan Netlify menyajikan HTML asli
            return; 
        }

        const firestoreData = await firestoreRes.json();
        const fields = firestoreData.fields || {};

        const nama = fields.nama?.stringValue || 'Program Kursus';
        const deskripsi = fields.deskripsiSingkat?.stringValue || fields.deskripsi?.stringValue || 'Program pelatihan di IMDKOM.';
        const gambar = fields.gambar?.stringValue || '';

        let ogImage = 'https://imdkomyogyakarta.netlify.app/assets/images/logo/imdkom.svg';
        if (gambar && gambar.includes('cloudinary.com')) {
            ogImage = gambar.replace('/upload/', '/upload/f_auto,q_auto,w_1200,h_630,c_fill/');
        } else if (gambar) {
            ogImage = gambar.startsWith('http') ? gambar : `https://imdkomyogyakarta.netlify.app/${gambar}`;
        }

        const pageTitle = `${nama} | IMDKOM Yogyakarta`;
        const pageDesc = deskripsi.substring(0, 160);

        // 4. AMBIL HTML ASLI MENGGUNAKAN context.next() (CARA YANG BENAR)
        //    Ini mengambil file program-detail.html tanpa memicu Edge Function lagi.
        const response = await context.next();
        let html = await response.text();

        // 5. Suntikkan Meta Tag
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

        // Ganti title lama & suntikkan meta baru
        html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeAttr(pageTitle)}</title>`);
        html = html.replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '');
        html = html.replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '');
        html = html.replace(/(<title>.*?<\/title>)/i, `$1\n${metaTags}`);

        // 6. Kembalikan HTML yang sudah dimodifikasi
        return new Response(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=300, s-maxage=600'
            }
        });

    } catch (error) {
        // 7. Jika terjadi error, JANGAN crash. Biarkan Netlify menyajikan HTML asli.
        console.error('Edge Function error:', error.message);
        return; // Kembalikan undefined agar request berlanjut ke file statis
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