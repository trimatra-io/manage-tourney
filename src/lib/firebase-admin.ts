import { getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function getPrivateKey() {
  const raw = process.env.FIREBASE_PRIVATE_KEY;
  if (!raw) return undefined;
  return raw.replace(/\\n/g, "\n");
}

function getProjectId() {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT
  );
}

function validateCredentials() {
  const projectId = getProjectId();
  const hasServiceAccount = Boolean(projectId && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
  const hasApplicationDefault = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCLOUD_SERVICE_ACCOUNT;

  if (!hasServiceAccount && !hasApplicationDefault) {
    console.warn(
      `⚠️  Firebase Admin SDK membutuhkan service account credentials.\n` +
      `Diperlukan salah satu dari:\n` +
      `1. Env variables di .env:\n` +
      `   - FIREBASE_PROJECT_ID\n` +
      `   - FIREBASE_CLIENT_EMAIL\n` +
      `   - FIREBASE_PRIVATE_KEY\n\n` +
      `2. Atau GOOGLE_APPLICATION_CREDENTIALS pointing ke service account JSON.\n\n` +
      `Dapatkan dari Firebase Console > Project Settings > Service Accounts > Generate New Private Key.`,
    );
  }
}

const projectId = getProjectId();
validateCredentials();
const hasServiceAccount = Boolean(projectId && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

const app =
  getApps()[0] ??
  initializeApp({
    projectId,
    credential: hasServiceAccount
      ? cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: getPrivateKey(),
        })
      : applicationDefault(),
  });

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
