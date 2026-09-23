import "server-only";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getFirebaseAdminConfig } from "./config";

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

function initAdmin(): void {
  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert(getFirebaseAdminConfig()),
    });
  } else {
    adminApp = getApps()[0];
  }
  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
}

export function getAdminApp(): App {
  if (!adminApp) initAdmin();
  return adminApp!;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) initAdmin();
  return adminAuth!;
}

export function getAdminDb(): Firestore {
  if (!adminDb) initAdmin();
  return adminDb!;
}
