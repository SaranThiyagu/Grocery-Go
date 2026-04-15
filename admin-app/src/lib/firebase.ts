/* eslint-disable @typescript-eslint/no-require-imports */
// Firebase configuration with fallback for demo mode
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoKeyForDevelopmentOnly",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "orderflow-admin.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "orderflow-admin",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "orderflow-admin.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456789"
};

// Check if we have real Firebase credentials (not demo ones)
const isDemoMode = firebaseConfig.apiKey.includes("DemoKey");

// Demo mode flag
export const IS_DEMO_MODE = isDemoMode;

// Initialize Firebase only if we have real credentials
let app: any = null;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;

if (!isDemoMode) {
  try {
    // Real Firebase initialization
    const { initializeApp } = require('firebase/app');
    const { getAuth, GoogleAuthProvider } = require('firebase/auth');
    const { getFirestore } = require('firebase/firestore');
    
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.log('Firebase initialization failed:', error);
  }
} else {
  console.log('Running in demo mode - Firebase not initialized');
}

// Export Firebase services (will be null in demo mode)
export { app, auth, db, googleProvider };

// Admin UID - replace with actual admin UID from Firebase
export const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID || "admin-user-uid-here";

export default app;