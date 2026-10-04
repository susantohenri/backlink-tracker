import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDRdGf65oWBZvA5LQ1HDxo_d4jYz8xhNEc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "backlink-tracker-bf7c7.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "backlink-tracker-bf7c7",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "backlink-tracker-bf7c7.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1021726638369",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1021726638369:web:f46a64fe9f8a0ec61fbe60"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db: Firestore = getFirestore(app);
export default app;
