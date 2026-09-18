// ============================================================
// Firebase Initialization — IMDKOM
// ============================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
    getFirestore, 
    collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, 
    query, where, orderBy, setDoc, limit 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// ============================================================
// KONFIGURASI FIREBASE BARU
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyAhtv22cqn4wrfqOSFSeG77grPl-dgvKSw",
    authDomain: "imdkomyk-9695a.firebaseapp.com",
    projectId: "imdkomyk-9695a",
    storageBucket: "imdkomyk-9695a.firebasestorage.app",
    messagingSenderId: "251470015590",
    appId: "1:251470015590:web:6837e86b03aca1d517d1a7"
};

// Inisialisasi
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { 
    app, db, auth,
    collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, setDoc,
    query, where, orderBy, limit,
    signInWithEmailAndPassword, onAuthStateChanged, signOut
};