// ============================================================
// NETLIFY FUNCTION - QRIS Dinamis (Midtrans)
// POST /.netlify/functions/midtrans-qris
// Body: { token, amount, description, nama, wa }
// Env:  MIDTRANS_SERVER_KEY (server key)
//       MIDTRANS_ENV = sandbox | production (default: sandbox)
// ============================================================

const json = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
});

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

    const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
    const env = (process.env.MIDTRANS_ENV || 'sandbox').toLowerCase();
    const API = env === 'production' ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';

    let rawBody = event.body || '{}';
    if (event.isBase64Encoded && rawBody) {
        try { rawBody = Buffer.from(rawBody, 'base64').toString('utf8'); } catch (e) { /* biarkan gagal di bawah */ }
    }
    if (rawBody && rawBody.charCodeAt(0) === 0xFEFF) rawBody = rawBody.slice(1);
    const bodyText = rawBody.trim();

    let body = {};
    try { body = JSON.parse(bodyText || '{}'); } catch (e) {
        return json(400, { error: 'Body JSON tidak valid' });
    }

    const token = String(body.token || '').trim();
    const amount = Math.round(Number(String(body.amount ?? '').replace(/[^0-9]/g, '')));
    const description = String(body.description || 'Pendaftaran Kursus IMDKOM').slice(0, 50);
    const nama = String(body.nama || 'Peserta').slice(0, 50);
    const wa = String(body.wa || '').slice(0, 20);

    if (!token) return json(400, { error: 'token wajib diisi' });
    if (!amount || amount < 1) return json(400, { error: 'nominal pembayaran tidak valid' });
    if (!SERVER_KEY) return json(500, { error: 'MIDTRANS_SERVER_KEY belum diset di Netlify.' });

    const orderId = token.slice(0, 50);
    const auth = 'Basic ' + Buffer.from(SERVER_KEY + ':').toString('base64');

    const payload = {
        payment_type: 'qris',
        transaction_details: { order_id: orderId, gross_amount: amount },
        item_details: [{ id: 'KURSUS', price: amount, quantity: 1, name: description }],
        customer_details: { first_name: nama, phone: wa },
        qris: {}
    };

    let resp;
    try {
        resp = await fetch(`${API}/v2/charge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': auth },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        return json(502, { error: 'Gagal menghubungi Midtrans: ' + err.message });
    }

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
        return json(resp.status, { error: data?.status_message || 'Midtrans menolak transaksi', details: data });
    }

    // Ambil gambar QR dari action generate-qr-code (butuh auth) lalu unduh & kembalikan sebagai data URL
    let qrDataUrl = '';
    const qrAction = (Array.isArray(data.actions) ? data.actions : []).find(a => a && a.name === 'generate-qr-code')
        || (Array.isArray(data.actions) ? data.actions[0] : null);
    if (qrAction && qrAction.url) {
        try {
            const imgRes = await fetch(qrAction.url, { headers: { 'Authorization': auth } });
            if (imgRes.ok) {
                const buf = Buffer.from(await imgRes.arrayBuffer());
                const ctype = imgRes.headers.get('content-type') || 'image/png';
                qrDataUrl = 'data:' + ctype + ';base64,' + buf.toString('base64');
            }
        } catch (err) {
            console.error('Gagal unduh QR image:', err.message);
        }
    }

    return json(200, {
        orderId,
        transactionId: data.transaction_id || '',
        transactionStatus: data.transaction_status || 'pending',
        grossAmount: data.gross_amount || String(amount),
        qrString: data.qr_string || '',
        qrDataUrl,
        expireTime: data.expire_time || '',
        acquirer: data.acquirer || ''
    });
};
