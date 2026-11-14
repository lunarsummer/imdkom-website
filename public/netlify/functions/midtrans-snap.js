// ============================================================
// NETLIFY FUNCTION - Midtrans Snap (Pop Up)
// POST /.netlify/functions/midtrans-snap
// Body: { token, programId, kodeReferral?, nama?, wa? }
//
// Harga diverifikasi & dihitung di SERVER dari Firestore (public read),
// client TIDAK menentukan nominal pembayaran.
// Mengembalikan Snap token untuk window.snap.pay() di frontend.
//
// Env:  MIDTRANS_SERVER_KEY (server key)
//       MIDTRANS_CLIENT_KEY (client key - publik by design, dipakai snap.js)
//       MIDTRANS_ENV = sandbox | production (default: sandbox)
//
// CATATAN DOMAIN: Snap API memakai app.sandbox.midtrans.com (sandbox)
// / app.midtrans.com (production) - BUKAN api.sandbox.midtrans.com
// (itu hanya untuk Core API). snap.js di-load frontend dari URL yang
// sama environment-nya.
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
    const programId = String(body.programId || '').trim();
    const kodeReferral = String(body.kodeReferral || '').trim().toUpperCase();
    const nama = String(body.nama || 'Peserta').slice(0, 50);
    const wa = String(body.wa || '').slice(0, 20);
    const email = String(body.email || '').slice(0, 100).trim().toLowerCase();
    const alamat = String(body.alamat || '').slice(0, 200).trim();

    if (!TOKEN_RE.test(token)) return json(400, { error: 'Token tidak valid. Refresh halaman.' });
    if (!PROGRAM_ID_RE.test(programId)) return json(400, { error: 'Program ID tidak valid.' });
    if (kodeReferral && !REFERRAL_RE.test(kodeReferral)) return json(400, { error: 'Kode referral tidak valid.' });
    if (!SERVER_KEY || !CLIENT_KEY) {
        const present = Object.keys(process.env).filter(k => k.indexOf('MIDTRANS') === 0).sort();
        console.error('midtrans-snap env cek. Variabel MIDTRANS terbaca:', present.join(', ') || '(tidak ada)', '| SERVER_KEY set:', !!SERVER_KEY, '| CLIENT_KEY set:', !!CLIENT_KEY);
        return json(500, { error: 'MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY belum diset di Netlify.', envTerbaca: present, serverKeySet: !!SERVER_KEY, clientKeySet: !!CLIENT_KEY });
    }

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
        if (!refDoc || !refDoc.fields) return json(404, { error: 'Kode referral tidak ditemukan.', code: 'REFERRAL_NOT_FOUND' });
        if (refDoc.fields.active && refDoc.fields.active.booleanValue === false) {
            return json(409, { error: 'Kode referral sudah tidak aktif.', code: 'REFERRAL_INACTIVE' });
        }
        if (refDoc.fields.expiresAt && refDoc.fields.expiresAt.stringValue) {
            const raw = String(refDoc.fields.expiresAt.stringValue).trim();
            const d = new Date(raw);
            if (!isNaN(d.getTime()) && d.getTime() <= Date.now()) {
                return json(409, { error: 'Kode referral sudah kedaluwarsa.', code: 'REFERRAL_EXPIRED' });
            }
        }
        const maxUse = fieldNumber(refDoc.fields, 'maxUsage');
        const used = fieldNumber(refDoc.fields, 'usageCount');
        if (maxUse > 0 && used >= maxUse) {
            return json(409, { error: 'Kuota kode referral sudah habis.', code: 'REFERRAL_QUOTA_FULL' });
        }
        const refProgramId = fieldString(refDoc.fields, 'programId');
        if (refProgramId && refProgramId !== programId) {
            return json(409, { error: 'Kode referral tidak berlaku untuk program ini.', code: 'REFERRAL_PROGRAM_MISMATCH' });
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

    // order_id unik per transaksi Snap: token dasar + suffix "~" + timestamp
    // (token dasar tetap untuk tracking/registrations; suffix agar user bisa
    // membuat transaksi Snap baru tanpa menabrak order_id lama).
    const suffix = Date.now().toString(36);
    const orderId = token + '~' + suffix;
    const auth = 'Basic ' + Buffer.from(SERVER_KEY + ':').toString('base64');

    // Pecah nama jadi first_name/last_name
    const nameParts = nama.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts.shift() || 'Peserta';
    const lastName = nameParts.join(' ');

    const customer_details = {
        first_name: firstName,
        last_name: lastName
    };
    if (email) customer_details.email = email;
    if (wa) customer_details.phone = wa;

    // billing_address (docs Snap): alamat lengkap peserta
    if (alamat || email || wa) {
        const addr = {
            first_name: firstName,
            last_name: lastName,
            country_code: 'IDN'
        };
        if (email) addr.email = email;
        if (wa) addr.phone = wa;
        if (alamat) addr.address = alamat;
        customer_details.billing_address = addr;
    }

    const payload = {
        transaction_details: { order_id: orderId, gross_amount: grossAmount },
        item_details: [{ id: 'KURSUS', price: grossAmount, quantity: 1, name: namaProgram.slice(0, 50) }],
        customer_details
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
        console.error('Midtrans aneh:', resp.status, JSON.stringify(data));
        return json(502, { error: 'Respons Midtrans tidak lengkap (token tidak dibuat).', midtrans: { statusCode: resp.status, body: data } });
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
