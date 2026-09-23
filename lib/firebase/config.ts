export function getFirebaseClientConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error(
      "Firebase client is not configured. Copy .env.local.example to .env.local, fill in the NEXT_PUBLIC_FIREBASE_* values from Firebase Console > Project settings, then restart the dev server."
    );
  }

  return { apiKey, authDomain, projectId, appId };
}

export function getFirebaseAdminConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin SDK is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local"
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

export const SESSION_COOKIE_NAME = "rns_session";
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 5; // 5 days in seconds

export function getFirebaseStorageBucket(): string {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Firebase Admin SDK is not configured. Set FIREBASE_PROJECT_ID in .env.local");
  }
  return process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
}
