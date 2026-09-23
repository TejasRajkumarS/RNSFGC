#!/usr/bin/env node
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  const envPath = resolve(__dirname, "../.env.local");
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const [key, ...rest] = line.split("=");
      if (key && !key.startsWith("#")) {
        process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
      }
    }
  } catch {
    console.warn("No .env.local found, using process.env");
  }
}

loadEnv();

const requiredVars = ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"];

for (const v of requiredVars) {
  if (!process.env[v]) {
    console.error(`Missing required env var: ${v}`);
    process.exit(1);
  }
}

const adminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
};

if (getApps().length === 0) {
  initializeApp({ credential: cert(adminConfig) });
}

const adminAuth = getAuth();
const adminDb = getFirestore();

const DEPARTMENTS = [
  { id: "bca", name: "Bachelor of Computer Applications(BCA)" },
  { id: "bcom", name: "Bachelor of Commerce(BCOM)" },
  { id: "bba", name: "Bachelor of Business Administration(BBA)" },
  { id: "mba", name: "Master of Business Administration(MBA)" },
];

async function seedDepartments() {
  console.log("Seeding departments...");
  const batch = adminDb.batch();
  for (const dept of DEPARTMENTS) {
    const ref = adminDb.collection("departments").doc(dept.id);
    batch.set(ref, { name: dept.name, created_at: Timestamp.now(), updated_at: Timestamp.now() });
  }
  await batch.commit();
  console.log("Departments seeded.");
}

async function createAdminUser() {
  const email = process.env.ADMIN_EMAIL || "admin@rnsfc.example.com";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const name = process.env.ADMIN_NAME || "System Administrator";

  console.log(`Creating admin user: ${email}`);
  try {
    const userRecord = await adminAuth.createUser({ email, password, displayName: name });
    const now = Timestamp.now();
    await adminDb.collection("users").doc(userRecord.uid).set({
      email,
      full_name: name,
      role: "ADMIN",
      department_id: null,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    console.log(`Admin user created with UID: ${userRecord.uid}`);
    console.log("IMPORTANT: Change the default password immediately after first login!");
  } catch (e) {
    if (e.code === "auth/email-already-exists") {
      console.log("Admin user already exists.");
    } else {
      throw e;
    }
  }
}

async function main() {
  console.log("=== RNS Event Tracker - Initial Setup ===");
  await seedDepartments();
  await createAdminUser();
  console.log("=== Setup Complete ===");
  console.log("");
  console.log("Next steps:");
  console.log("1. Deploy firestore.rules: firebase deploy --only firestore:rules");
  console.log("2. Start the dev server: npm run dev");
  console.log("3. Login at /login with the admin credentials");
  console.log("4. Change the admin password immediately!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Setup failed:", e);
  process.exit(1);
});
