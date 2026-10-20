// ============================================================
// Auth Helper — IMDKOM
// Cek role, proteksi halaman, redirect berdasarkan role
// ============================================================

import { auth, db, onAuthStateChanged, signOut, doc, getDoc } from './firebase.js';

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
        case 'admin': return '/admin/dashboard.html';
        case 'tentor': return '/tentor/dashboard.html';
        case 'siswa': return '/siswa/dashboard.html';
        default: return '/login.html';
    }
}

// ============================================================
// PROTEKSI HALAMAN
// Panggil di awal setiap halaman yang butuh login.
// @param {Object} options
//   - allowedRoles: array role yang boleh akses (mis. ['admin'])
//   - requireActive: boolean (default true) — cek status 'active'
//   - onAuthorized: function(profile) — dipanggil kalau lolos
// ============================================================
export function protectPage(options = {}) {
    const {
        allowedRoles = [],
        requireActive = true,
        onAuthorized = () => {}
    } = options;

    onAuthStateChanged(auth, async (user) => {
        // Belum login → redirect ke login
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        // Ambil profil
        const profile = await getUserProfile(user.uid);

        // Profil tidak ada → logout & redirect
        if (!profile) {
            console.error('Profil user tidak ditemukan');
            await signOut(auth);
            window.location.href = '/login.html';
            return;
        }

        // Cek status aktif
        if (requireActive && profile.status !== 'active') {
            // Tentor pending → halaman pending approval
            if (profile.role === 'tentor' && profile.status === 'pending') {
                window.location.href = '/pending-approval.html';
                return;
            }
            // Status lain (rejected) → logout
            await signOut(auth);
            window.location.href = '/login.html?error=account_inactive';
            return;
        }

        // Cek role
        if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
            // Role tidak diizinkan → redirect ke dashboard-nya sendiri
            window.location.href = getDashboardUrl(profile.role);
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
    window.location.href = '/login.html';
}