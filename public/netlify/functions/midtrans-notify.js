// ============================================================
// NETLIFY FUNCTION - Midtrans Payment Notification (Webhook)
// POST /.netlify/functions/midtrans-notify
//
// Dipanggil OTOMATIS oleh Midtrans saat status transaksi berubah.
// Di-set di Merchant Dashboard Anda:
//   Settings > Configuration > Payment Notification URL
//   = https://<domain>/.netlify/functions/midtrans-notify
//
// Keamanan: signature_key diverifikasi dengan server key.
// Auth Firestore pakai Service Account (env FIREBASE_SERVICE_ACCOUNT,
// isi = JSON string service account dari Firebase Console > Project
// settings > Service accounts). Jika env belum diset, fungsi hanya
// membalas 200 (ack) dan TIDAK menandai apapun.
//
// Env:  MIDTRANS_SERVER_KEY (server key)
//       MIDTRANS_ENV = sandbox | production
//       FIREBASE_SERVICE_ACCOUNT (JSON string, opsional tapi disarankan)
// ============================================================

const crypto = require('crypto');

const json = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
});

const PROJECT_ID = 'imdkomyk-9695a';

const b64u = (str) => Buffer.from(str).toString('base64url');
const b64uJson = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

const getAccessToken = async (sa) => {
    const now = Math.floor(Date.now() / 1000);
    const header = b64uJson({ alg: 'RS256', typ: 'JWT' });
    const claims = b64uJson({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/datastore',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600
    });
    const signInput = `${header}.${claims}`;
    const sig = crypto.createSign('RSA-SHA256').update(signInput).sign(sa.private_key, 'base64url');
    const jwt = `${signInput}.${sig}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + encodeURIComponent(jwt)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
        throw new Error('Gagal tukar access token: ' + (data.error_description || data.error || res.status));
    }
    return data.access_token;
};

const firestorePatch = async (accessToken, fullPath, fields) => {
    const fieldPaths = Object.keys(fields).map(k => 'updateMask.fieldPaths=' + encodeURIComponent(k)).join('&');
    const url = `https://firestore.googleapis.com/v1/${fullPath}?${fieldPaths}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
    });
    return res.ok;
};

const findDocumentByField = async (accessToken, collectionId, fieldPath, value) => {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
    const body = {
        structuredQuery: {
            from: [{ collectionId }],
            where: { fieldFilter: { field: { fieldPath }, op: 'EQUAL', value: { stringValue: value } } },
            limit: 1
        }
    };
    const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) return [];
    const arr = await res.json().catch(() => []);
    if (!Array.isArray(arr)) return [];
    return arr.map(r => r.document && r.document.name).filter(Boolean);
};

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

    const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
    if (!SERVER_KEY) return json(500, { error: 'MIDTRANS_SERVER_KEY belum diset.' });

    let rawBody = event.body || '{}';
    if (event.isBase64Encoded && rawBody) {
        try { rawBody = Buffer.from(rawBody, 'base64').toString('utf8'); } catch (e) { /* lanjut gagal di bawah */ }
    }
    if (rawBody && rawBody.charCodeAt(0) === 0xFEFF) rawBody = rawBody.slice(1);

    let body = {};
    try { body = JSON.parse(rawBody || '{}'); } catch (e) {
        return json(400, { error: 'Body JSON tidak valid' });
    }

    const orderId = String(body.order_id || '').trim();
    const statusCode = String(body.status_code || '');
    const grossAmount = String(body.gross_amount || '');
    const signature = String(body.signature_key || '');
    // order_id Snap = token Dasar + "~" + suffix; token dasar (untuk
    // tracking/registrations) adalah bagian sebelum "~".
    const baseMatch = orderId.match(/^IMDKOM-[A-Z]{10}/);
    const baseToken = baseMatch ? baseMatch[0] : '';

    // ---------- 1. Verifikasi signature — WAJIB ----------
    const expected = crypto.createHash('sha512').update(orderId + statusCode + grossAmount + SERVER_KEY).digest('hex');
    if (!signature || signature !== expected) {
        console.warn('Notify: signature tidak cocok. order_id=', orderId);
        return json(403, { error: 'Signature tidak valid.' });
    }

    const status = String(body.transaction_status || '').toLowerCase();
    const fraud = String(body.fraud_status || '').toLowerCase();
    const isPaid = status === 'settlement' || (status === 'capture' && (fraud === '' || fraud === 'accept'));

    console.log('Notify: order_id=%s baseToken=%s status=%s paid=%s', orderId, baseToken || '(invalid)', status, isPaid);
    if (!baseToken) {
        console.error('Notify: order_id bukan format IMDKOM valid:', orderId);
        return json(400, { error: 'order_id tidak dikenali.' });
    }

    // ---------- 2. Tandai dokumen jika lunas ----------
    const SA_RAW = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!SA_RAW) {
        return json(200, { received: true, warning: 'FIREBASE_SERVICE_ACCOUNT belum diset — status tidak diverifikasi otomatis.' });
    }

    let sa;
    try { sa = JSON.parse(SA_RAW); } catch (e) {
        return json(200, { received: true, warning: 'FIREBASE_SERVICE_ACCOUNT tidak valid.' });
    }

    if (!isPaid) {
        return json(200, { received: true, status });
    }

    let accessToken;
    try {
        accessToken = await getAccessToken(sa);
    } catch (e) {
        console.error('Notify: gagal ambil access token:', e.message);
        return json(200, { received: true, warning: 'Gagal autentikasi ke Firestore.' });
    }

    const patchFields = {
        statusPembayaran: { stringValue: 'Terverifikasi' },
        updatedAt: { stringValue: new Date().toISOString() }
    };

    const fullPath = (docName) => `projects/${PROJECT_ID}/databases/(default)/documents/${docName}`;

    // 2a. Update tracking mirror (doc id = token dasar)
    await firestorePatch(accessToken, `projects/${PROJECT_ID}/databases/(default)/documents/tracking/${baseToken}`, patchFields)
        .catch(e => console.error('Notify: gagal update tracking:', e.message));

    // 2b. Registrations: doc id acak, cari berdasar field token
    try {
        const docs = await findDocumentByField(accessToken, 'registrations', 'token', baseToken);
        for (const docName of docs) {
            const rel = docName.split('/documents/')[1];
            await firestorePatch(accessToken, `projects/${PROJECT_ID}/databases/(default)/documents/${rel}`, patchFields)
                .catch(e => console.error('Notify: gagal update registrasi:', e.message));
        }
    } catch (e) {
        console.error('Notify: gagal cari registrasi:', e.message);
    }

    return json(200, { received: true, status: 'paid' });
};
