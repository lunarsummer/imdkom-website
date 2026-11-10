// ============================================================
// NETLIFY FUNCTION - Cek Status Transaksi Midtrans
// GET /.netlify/functions/midtrans-qris-status?orderId=IMDKOM-XXXX
// Env:  MIDTRANS_SERVER_KEY (server key)
//       MIDTRANS_ENV = sandbox | production (default: sandbox)
// ============================================================

const json = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
});

exports.handler = async function (event) {
    const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
    const env = (process.env.MIDTRANS_ENV || 'sandbox').toLowerCase();
    const API = env === 'production' ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';

    if (!SERVER_KEY) return json(500, { error: 'MIDTRANS_SERVER_KEY belum diset di Netlify.' });

    const params = event.queryStringParameters || {};
    const orderId = String(params.orderId || params.order_id || '').trim().slice(0, 50);

    if (!orderId) return json(400, { error: 'orderId wajib diisi' });
    if (!SERVER_KEY) return json(500, { error: 'MIDTRANS_SERVER_KEY belum diset di Netlify.' });

    const auth = 'Basic ' + Buffer.from(SERVER_KEY + ':').toString('base64');

    let resp;
    try {
        resp = await fetch(`${API}/v2/${encodeURIComponent(orderId)}/status`, {
            headers: { 'Authorization': auth, 'Accept': 'application/json' }
        });
    } catch (err) {
        return json(502, { error: 'Gagal menghubungi Midtrans: ' + err.message });
    }

    const data = await resp.json().catch(() => ({}));
    if (resp.status === 404) {
        return json(404, { error: "Transaksi tidak ditemukan", status: 'not_found' });
    }
    if (!resp.ok) {
        return json(502, { error: data?.status_message || 'Midtrans menolak verifikasi status', details: data });
    }

    return json(200, {
        orderId,
        transactionId: data.transaction_id || '',
        transactionStatus: data.transaction_status || 'unknown',
        fraudStatus: data.fraud_status || '',
        grossAmount: data.gross_amount || '',
        paymentType: data.payment_type || '',
        expireTime: data.expire_time || ''
    });
};
