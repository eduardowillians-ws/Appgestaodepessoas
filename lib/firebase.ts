import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("🔥 Firebase config:", firebaseConfig);

const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let db: Firestore;

try {
  db = getFirestore(app);
  enableIndexedDbPersistence(db)
    .then(() => console.log("✅ [Firebase] Persistência offline habilitada"))
    .catch((err: any) => {
      if (err.code === 'failed-precondition') {
        console.warn("⚠️ [Firebase] Múltiplas abas abertas");
      } else if (err.code === 'unimplemented') {
        console.warn("⚠️ [Firebase] Browser não suporta persistência offline");
      }
    });
} catch (e) {
  console.error("❌ [Firebase] Erro ao inicializar:", e);
  db = getFirestore(app);
}

export { db };

export async function testFirebaseConnection() {
  console.log("📡 [Firebase] Testando conexão...");
  try {
    const { doc, getDocFromServer } = await import('firebase/firestore');
    const testDoc = doc(db, 'users', 'test-connection');
    await getDocFromServer(testDoc);
    console.log("✅ [Firebase] Conexão OK!");
    return true;
  } catch (error: any) {
    console.error("❌ [Firebase] Erro de conexão:", error?.message || error);
    return false;
  }
}