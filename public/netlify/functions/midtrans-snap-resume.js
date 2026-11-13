// ============================================================
// NETLIFY FUNCTION - Lanjutkan Pembayaran (Resume Snap)
// POST /.netlify/functions/midtrans-snap-resume
// Body: { token, wa4 }
//
// Dipakai oleh halaman /tracking saat pendaftaran masih berstatus
// "Menunggu" (user menutup pop-up Snap / refresh sebelum bayar).
//
// Verifikasi: token + 4 digit terakhir WhatsApp (wa4) — sama seperti
// login di halaman tracking. Nominal TIDAK diambil dari client;
// harga & diskon referral dihitung ulang di SERVER dari Firestore
// (programId & kodeReferral dibaca dari doc tracking/{token}).
//
// Env:  MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY / MIDTRANS_ENV
// ============================================================

const json = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
});

const crypto = require('crypto');

const PROJECT_ID = 'imdkomyk-9695a';
const FIRESTORE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const TOKEN_RE = /^IMDKOM-[A-Z]{10}$/;
const WA4_RE = /^[0-9]{4}$/;
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
    const CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || '';
    const env = (process.env.MIDTRANS_ENV || 'sandbox').toLowerCase();
    const HOST = env === 'production' ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
    const SNAP_JS = env === 'production'
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';

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
    const wa4 = String(body.wa4 || '').trim();

    if (!TOKEN_RE.test(token)) return json(400, { error: 'Token tidak valid.' });
    if (!WA4_RE.test(wa4)) return json(400, { error: 'Masukkan tepat 4 digit terakhir WhatsApp.' });
    if (!SERVER_KEY || !CLIENT_KEY) {
        return json(500, { error: 'MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY belum diset di Netlify.' });
    }

    // ---------- 1. Ambil doc tracking (publik by token) & verifikasi wa4 ----------
    let trDoc;
    try {
        trDoc = await firestoreGet(`tracking/${encodeURIComponent(token)}`);
    } catch (e) {
        return json(502, { error: 'Gagal membaca data pendaftaran.' });
    }
    if (!trDoc || !trDoc.fields) {
        return json(404, { error: 'Token tidak ditemukan. Periksa kembali token pendaftaran Anda.' });
    }
    const tr = trDoc.fields;
    const wa4HashServer = crypto.createHash('sha256').update('imdkom-wa:' + wa4).digest('hex');
    if (!fieldString(tr, 'wa4hash') || wa4HashServer !== fieldString(tr, 'wa4hash')) {
        // Respons sama seperti token/WA salah agar tidak membocorkan info
        return json(403, { error: '4 digit terakhir WhatsApp tidak cocok.' });
    }
    if (fieldString(tr, 'statusPembayaran') === 'Terverifikasi') {
        return json(409, { error: 'Pembayaran untuk token ini sudah terverifikasi. Tidak perlu membayar lagi.' });
    }

    const programId = fieldString(tr, 'programId').trim();
    if (!programId || !PROGRAM_ID_RE.test(programId)) {
        return json(409, { error: 'Pendaftaran ini dibuat sebelum fitur lanjutkan pembayaran tersedia. Silakan hubungi admin via WhatsApp untuk menyelesaikan pembayaran.' });
    }
    const kodeReferral = fieldString(tr, 'kodeReferral').trim().toUpperCase();
    const namaPeserta = (fieldString(tr, 'nama').trim() || 'Peserta').slice(0, 50);

    // ---------- 2. Hitung ulang harga program dari Firestore (seperti midtrans-snap) ----------
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

    let base = (hargaPromoNum > 0 && hargaNum > 0 && hargaPromoNum !== hargaNum)
        ? hargaPromoNum
        : (hargaPromoNum > 0 && hargaNum === 0 ? hargaPromoNum : hargaNum);
    if (base <= 0) return json(422, { error: 'Harga program belum diatur admin.' });

    // ---------- 3. Hitung ulang diskon referral (jika ada) ----------
    let potongan = 0;
    if (kodeReferral && REFERRAL_RE.test(kodeReferral)) {
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
        if (refDoc.fields.expiresAt && refDoc.fields.expiresAt.stringValue) {
            const raw = String(refDoc.fields.expiresAt.stringValue).trim();
            const d = new Date(raw);
            if (!isNaN(d.getTime()) && d.getTime() <= Date.now()) {
                return json(409, { error: 'Kode referral sudah kedaluwarsa.' });
            }
        }
        const maxUse = fieldNumber(refDoc.fields, 'maxUsage');
        const used = fieldNumber(refDoc.fields, 'usageCount');
        if (maxUse > 0 && used >= maxUse) {
            return json(409, { error: 'Kuota kode referral sudah habis.' });
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

    // ---------- 4. Buat sesi Snap baru (order_id: token~suffix; base token TIDAK berubah) ----------
    const suffix = Date.now().toString(36);
    const orderId = token + '~' + suffix;
    const auth = 'Basic ' + Buffer.from(SERVER_KEY + ':').toString('base64');

    const nameParts = namaPeserta.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts.shift() || 'Peserta';
    const lastName = nameParts.join(' ');

    const payload = {
        transaction_details: { order_id: orderId, gross_amount: grossAmount },
        item_details: [{ id: 'KURSUS', price: grossAmount, quantity: 1, name: namaProgram.slice(0, 50) }],
        customer_details: { first_name: firstName, last_name: lastName }
    };

    let resp;
    try {
        resp = await fetch(`${HOST}/snap/v1/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': auth },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        return json(502, { error: 'Gagal menghubungi Midtrans: ' + err.message });
    }

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
        return json(resp.status, { error: data?.error_messages ? (Array.isArray(data.error_messages) ? data.error_messages.join(' | ') : String(data.error_messages)) : (data?.status_message || 'Midtrans menolak transaksi') });
    }

    if (!data.token) {
        console.error('Midtrans resume: respons tanpa token:', resp.status, JSON.stringify(data));
        return json(502, { error: 'Respons Midtrans tidak lengkap (token tidak dibuat).' });
    }

    return json(200, {
        orderId,
        snapToken: data.token,
        redirectUrl: data.redirect_url || '',
        grossAmount: String(grossAmount),
        potonganReferral: potongan,
        env,
        snapJsUrl: SNAP_JS,
        clientKey: CLIENT_KEY
    });
};
