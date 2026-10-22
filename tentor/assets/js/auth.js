// ============================================================
// Auth Helper — IMDKOM (TENTOR)
// Versi dengan debug log lengkap & support multiple status
// ============================================================

import { auth, db, onAuthStateChanged, signOut, doc, getDoc } from './firebase.js';

// ============================================================
// KONFIGURASI DOMAIN
// Auto-detect localhost vs production
// ============================================================
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';

const DOMAIN_CONFIG = isLocal ? {
    public: window.location.origin + '/public',
    admin: window.location.origin + '/admin',
    tentor: window.location.origin + '/tentor'
} : {
    public: 'https://imdkomputer.id',
    admin: 'https://admin.imdkomputer.id',
    tentor: 'https://tentor.imdkomputer.id'
};

// Status yang dianggap "aktif" (lolos proteksi)
const ACTIVE_STATUSES = ['active', 'aktif', 'approved'];
// Status yang dianggap "pending" (redirect ke pending-approval)
const PENDING_STATUSES = ['pending', 'menunggu', 'waiting'];
// Status yang dianggap "rejected" (logout)
const REJECTED_STATUSES = ['rejected', 'ditolak'];

// ============================================================
// AMBIL PROFIL USER DARI FIRESTORE
// ============================================================
export async function getUserProfile(uid) {
    try {
        console.log('🔍 [getUserProfile] Mencari user dengan UID:', uid);
        
        const docSnap = await getDoc(doc(db, 'users', uid));
        
        if (!docSnap.exists()) {
            console.error('❌ [getUserProfile] Dokumen users TIDAK ADA untuk UID:', uid);
            return null;
        }
        
        const data = docSnap.data();
        console.log('✅ [getUserProfile] Profil ditemukan:');
        console.log('   - email:', data.email);
        console.log('   - nama:', data.nama);
        console.log('   - role:', data.role);
        console.log('   - status:', data.status);
        
        return { uid, ...data };
    } catch (error) {
        console.error('❌ [getUserProfile] Error:', error);
        return null;
    }
}

// ============================================================
// REDIRECT BERDASARKAN ROLE
// ============================================================
export function getDashboardUrl(role) {
    switch (role) {
        case 'admin': return `${DOMAIN_CONFIG.admin}/dashboard.html`;
        case 'tentor': return `${DOMAIN_CONFIG.tentor}/dashboard.html`;
        default: return `${DOMAIN_CONFIG.public}/`;
    }
}

// ============================================================
// PROTEKSI HALAMAN (TENTOR ONLY)
// ============================================================
export function protectPage(options = {}) {
    const {
        allowedRoles = ['tentor'],
        requireActive = true,
        onAuthorized = () => {}
    } = options;

    console.log('🔍 [protectPage] Mulai — mendengarkan auth state...');

    onAuthStateChanged(auth, async (user) => {
        console.log('🔍 [protectPage] onAuthStateChanged triggered');

        // ============================================================
        // CEK 1: User login atau belum
        // ============================================================
        if (!user) {
            console.warn('⚠️ [protectPage] TIDAK ADA USER → redirect ke index.html');
            window.location.href = './index.html';
            return;
        }

        console.log('✅ [protectPage] User login:', user.email, '| UID:', user.uid);

        // ============================================================
        // CEK 2: Ambil profil dari Firestore
        // ============================================================
        const profile = await getUserProfile(user.uid);

        if (!profile) {
            console.error('❌ [protectPage] Profil NULL → logout & redirect');
            await signOut(auth);
            window.location.href = './index.html?error=profile_not_found';
            return;
        }

        // ============================================================
        // CEK 3: Role sesuai?
        // ============================================================
        if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
            console.error('❌ [protectPage] Role tidak diizinkan:', profile.role);
            console.error('   Role yang diizinkan:', allowedRoles.join(', '));

            if (profile.role === 'admin') {
                console.log('→ Role admin, redirect ke admin domain');
                window.location.href = `${DOMAIN_CONFIG.admin}/`;
            } else {
                console.log('→ Role tidak dikenal, logout & redirect');
                await signOut(auth);
                window.location.href = './index.html?error=wrong_role';
            }
            return;
        }

        // ============================================================
        // CEK 4: Status aktif?
        // ============================================================
        if (requireActive) {
            console.log('🔍 [protectPage] Cek status:', profile.status);

            // Pending → redirect ke pending-approval
            if (PENDING_STATUSES.includes(profile.status)) {
                console.log('⏳ [protectPage] Status PENDING → redirect ke pending-approval');
                window.location.href = `${DOMAIN_CONFIG.public}/pending-approval.html`;
                return;
            }

            // Rejected → logout
            if (REJECTED_STATUSES.includes(profile.status)) {
                console.log('❌ [protectPage] Status REJECTED → logout');
                await signOut(auth);
                window.location.href = './index.html?error=account_rejected';
                return;
            }

            // Status tidak valid (bukan active/aktif/approved) → logout
            if (!ACTIVE_STATUSES.includes(profile.status)) {
                console.error('❌ [protectPage] Status TIDAK VALID:', profile.status);
                console.error('   Status yang diterima:', ACTIVE_STATUSES.join(', '));
                await signOut(auth);
                window.location.href = './index.html?error=account_inactive';
                return;
            }
        }

        // ============================================================
        // SEMUA CEK LOLOS
        // ============================================================
        console.log('✅ [protectPage] SEMUA CEK LOLOS → onAuthorized dipanggil');
        onAuthorized(profile);
    });
}

// ============================================================
// LOGOUT
// ============================================================
export async function logout() {
    console.log('🔍 [logout] Logout dipanggil');
    await signOut(auth);
    window.location.href = './index.html';
}