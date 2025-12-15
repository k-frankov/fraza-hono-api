import type { App } from 'firebase-admin/app';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

let firebaseApp: App | undefined;

export function initializeFirebase() {
  if (firebaseApp) return;

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    // For deployment environments, keep the private key as a single line string and encode newlines as \n.
    const privateKey = privateKeyRaw?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('⚠️ Firebase environment variables missing. Auth may fail.');
      return;
    }

    firebaseApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    console.info('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
  }
}

export function getAuth() {
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (!firebaseApp) {
    throw new Error('Firebase Admin not initialized (missing/invalid FIREBASE_* env vars)');
  }

  return getAdminAuth(firebaseApp);
}
