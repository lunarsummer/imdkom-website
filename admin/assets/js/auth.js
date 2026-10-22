// ============================================================
// Auth Helper — IMDKOM (ADMIN)
// Cek role, proteksi halaman, redirect berdasarkan role
// ============================================================

import { auth, db, onAuthStateChanged, signOut, doc, getDoc } from './firebase.js';

// ============================================================
// KONFIGURASI DOMAIN
// ============================================================
const DOMAIN_CONFIG = {
    public: 'https://imdkomputer.id',
    admin: 'https://admin.imdkomputer.id',
    tentor: 'https://tentor.imdkomputer.id'
};

// ============================================================
// AMBIL PROFIL USER DARI FIRESTORE
// ============================================================
export async function getUserProfile(uid) {
    try {
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (!docSnap.exists()) return null;
        return { uid, ...docSnap.data() };
    } catch (error) {
        console.error('Error getting user profile:', error);
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
// PROTEKSI HALAMAN (ADMIN ONLY)
// ============================================================
export function protectPage(options = {}) {
    const {
        allowedRoles = ['admin'],   // default: hanya admin
        requireActive = true,
        onAuthorized = () => {}
    } = options;

    onAuthStateChanged(auth, async (user) => {
        // Belum login → redirect ke login admin
        if (!user) {
            window.location.href = './index.html';
            return;
        }

        // Ambil profil
        const profile = await getUserProfile(user.uid);

        // Profil tidak ada → logout & redirect
        if (!profile) {
            console.error('Profil user tidak ditemukan');
            await signOut(auth);
            window.location.href = './index.html';
            return;
        }

        // Cek status aktif
        if (requireActive && profile.status !== 'active') {
            await signOut(auth);
            window.location.href = './index.html?error=account_inactive';
            return;
        }

        // Cek role
        if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
            // Role tidak diizinkan → redirect ke portal yang sesuai
            if (profile.role === 'tentor') {
                window.location.href = `${DOMAIN_CONFIG.tentor}/`;
            } else {
                window.location.href = './index.html';
            }
            return;
        }

        // Lolos → panggil callback
        onAuthorized(profile);
    });
}

// ============================================================
// LOGOUT
// ============================================================
export async function logout() {
    await signOut(auth);
    window.location.href = './index.html';
}