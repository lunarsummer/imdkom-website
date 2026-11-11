// ============================================================
// NETLIFY FUNCTION - QRIS Dinamis (Midtrans)
// POST /.netlify/functions/midtrans-qris
// Body: { token, programId, kodeReferral?, nama?, wa? }
//
// Harga diverifikasi & dihitung di SERVER dari Firestore (public read),
// client TIDAK lagi menentukan nominal pembayaran.
//
// Env:  MIDTRANS_SERVER_KEY (server key)
//       MIDTRANS_ENV = sandbox | production (default: sandbox)
//
// CATATAN: URL notifikasi Midtrans di-set di Merchant Dashboard
// (Settings > Configuration > Payment Notification URL) ke:
//   https://<domain-anda>/.netlify/functions/midtrans-notify
// Midtrans tidak menerima notify_url per-transaksi charge QRIS.
// ============================================================

const json = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
});

const PROJECT_ID = 'imdkomyk-9695a';
const FIRESTORE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const TOKEN_RE = /^IMDKOM-[A-Z]{10}$/;
const PROGRAM_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const REFERRAL_RE = /^[A-Z0-9_-]{3,32}$/;

const parsePrice = (v) => {
    const digits = String(v == null ? '' : v).replace(/[^0-9]/g, '');
    const n = parseInt(digits, 10);
    return Number.isFinite(n) ? n : 0;
};

const firestoreGet = async (path) => {
    const res = await fetch(`${FIRESTORE}/${path}`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data;
};

const fieldString = (fields, key) => {
    const f = fields && fields[key];
    return f && f.stringValue !== undefined ? f.stringValue : '';
};

const fieldBool = (fields, key) => {
    const f = fields && fields[key];
    return !!(f && f.booleanValue === true);
};

const fieldNumber = (fields, key) => {
    const f = fields && fields[key];
    if (!f) return 0;
    if (f.integerValue !== undefined) return parseInt(f.integerValue, 10) || 0;
    if (f.doubleValue !== undefined) return parseFloat(f.doubleValue) || 0;
    if (f.stringValue !== undefined) return parsePrice(f.stringValue);
    return 0;
};

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

    const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
    const env = (process.env.MIDTRANS_ENV || 'sandbox').toLowerCase();
    const API = env === 'production' ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';

    let rawBody = event.body || '{}';
    if (event.isBase64Encoded && rawBody) {
        try { rawBody = Buffer.from(rawBody, 'base64').toString('utf8'); } catch (e) { /* lanjut gagal di bawah */ }
    }
    if (rawBody && rawBody.charCodeAt(0) === 0xFEFF) rawBody = rawBody.slice(1);
    const bodyText = rawBody.trim();

    let body = {};
    try { body = JSON.parse(bodyText || '{}'); } catch (e) {
        return json(400, { error: 'Body JSON tidak valid' });
    }

    const token = String(body.token || '').trim().toUpperCase();
    const programId = String(body.programId || '').trim();
    const kodeReferral = String(body.kodeReferral || '').trim().toUpperCase();
    const nama = String(body.nama || 'Peserta').slice(0, 50);
    const wa = String(body.wa || '').slice(0, 20);

    if (!TOKEN_RE.test(token)) return json(400, { error: 'Token tidak valid. Refresh halaman.' });
    if (!PROGRAM_ID_RE.test(programId)) return json(400, { error: 'Program ID tidak valid.' });
    if (kodeReferral && !REFERRAL_RE.test(kodeReferral)) return json(400, { error: 'Kode referral tidak valid.' });
    if (!SERVER_KEY) return json(500, { error: 'MIDTRANS_SERVER_KEY belum diset di Netlify.' });

    // ---------- 1. Ambil harga program dari Firestore (public read) ----------
    let programDoc;
    try {
        programDoc = await firestoreGet(`programs/${encodeURIComponent(programId)}`);
    } catch (e) {
        return json(502, { error: 'Gagal membaca data program.' });
    }
    if (!programDoc || !programDoc.fields) {
        return json(404, { error: 'Program tidak ditemukan.' });
    }
    if (fieldBool(programDoc.fields, 'aktif') === false) {
        return json(409, { error: 'Program sedang tidak tersedia.' });
    }

    const hargaNum = parsePrice(fieldString(programDoc.fields, 'harga'));
    const hargaPromoNum = parsePrice(fieldString(programDoc.fields, 'hargaPromo'));
    const namaProgram = fieldString(programDoc.fields, 'nama') || 'Program Kursus';

    // Pakai harga promo jika lebih murah & valid
    let base = (hargaPromoNum > 0 && hargaNum > 0 && hargaPromoNum !== hargaNum)
        ? hargaPromoNum
        : (hargaPromoNum > 0 && hargaNum === 0 ? hargaPromoNum : hargaNum);
    if (base <= 0) return json(422, { error: 'Harga program belum diatur admin.' });

    // ---------- 2. Hitung diskon referral (jika ada) ----------
    let potongan = 0;
    if (kodeReferral) {
        let refDoc = null;
        try {
            refDoc = await firestoreGet(`referrals/${encodeURIComponent(kodeReferral)}`);
        } catch (e) {
            return json(502, { error: 'Gagal membaca kode referral.' });
        }
        if (!refDoc || !refDoc.fields) return json(404, { error: 'Kode referral tidak ditemukan.' });
        if (refDoc.fields.active && refDoc.fields.active.booleanValue === false) {
            return json(409, { error: 'Kode referral sudah tidak aktif.' });
        }
        const refProgramId = fieldString(refDoc.fields, 'programId');
        if (refProgramId && refProgramId !== programId) {
            return json(409, { error: 'Kode referral tidak berlaku untuk program ini.' });
        }
        const type = fieldString(refDoc.fields, 'type') === 'flat' ? 'flat' : 'percent';
        let value = fieldNumber(refDoc.fields, 'value');
        if (type === 'percent') value = Math.min(100, Math.max(0, value));
        if (value > 0) {
            potongan = type === 'percent'
                ? Math.min(base, Math.round(base * value / 100))
                : Math.min(base, value);
        }
    }

    const grossAmount = Math.max(1, base - potongan);

    const orderId = token;
    const auth = 'Basic ' + Buffer.from(SERVER_KEY + ':').toString('base64');

    const payload = {
        payment_type: 'qris',
        transaction_details: { order_id: orderId, gross_amount: grossAmount },
        item_details: [{ id: 'KURSUS', price: grossAmount, quantity: 1, name: namaProgram.slice(0, 50) }],
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

    // PERTAHANAN TERAKHIR: jika Midtrans membalas 200 tapi tanpa detail transaksi
    // (mis. channel belum diaktifkan untuk Core API di production — dokumentasi
    //  Midtrans: aktifkan Core API QRIS lewat support@midtrans.com), tampilkan
    //  alasan aslinya alih-alih gagal diam-diam.
    if (!data.transaction_id && !data.qr_string && !(Array.isArray(data.actions) && data.actions.length)) {
        console.error('Midtrans aneh:', resp.status, JSON.stringify(data));
        return json(502, {
            error: data?.status_message || 'Respons Midtrans tidak lengkap (transaksi tidak dibuat). Hubungi support Midtrans untuk aktivasi Core API QRIS di production.',
            midtrans: { statusCode: resp.status, body: data }
        });
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
        grossAmount: data.gross_amount || String(grossAmount),
        potonganReferral: potongan,
        qrString: data.qr_string || '',
        qrDataUrl,
        qrImageUrl: qrAction && qrAction.url ? qrAction.url : '',
        env,
        expireTime: data.expire_time || '',
        acquirer: data.acquirer || ''
    });
};
