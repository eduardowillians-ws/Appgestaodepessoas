import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';

export interface FirebaseUser {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive' | 'busy';
  performanceScore: number;
  tags: string[];
  notes: string;
  avatar: string;
  points: number;
  level: number;
  xpToNextLevel: number;
  createdAt: Date;
}

export const usersCollection = collection(db, 'users');

export async function getAllUsers(): Promise<FirebaseUser[]> {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  })) as FirebaseUser[];
}

export async function getUserById(id: string): Promise<FirebaseUser | null> {
  const docRef = doc(db, 'users', id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as FirebaseUser;
}

export async function createUser(userData: Omit<FirebaseUser, 'id'>): Promise<string> {
  console.log("🔥 CHEGOU NO FIREBASE", userData);
  console.log("🔥 DB:", db);
  console.log("🔥 collection:", collection(db, "users"));
  try {
    const docRef = await addDoc(collection(db, "users"), {
      ...userData,
      createdAt: Timestamp.fromDate(userData.createdAt)
    });
    console.log("✅ SALVO COM ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ ERRO FIREBASE:", error);
    throw error;
  }
}

export async function updateUser(id: string, userData: Partial<FirebaseUser>): Promise<void> {
  const docRef = doc(db, 'users', id);
  await updateDoc(docRef, userData);
}

export async function deleteUser(id: string): Promise<void> {
  const docRef = doc(db, 'users', id);
  await deleteDoc(docRef);
}

export function subscribeToUsers(callback: (users: FirebaseUser[]) => void) {
  return onSnapshot(usersCollection, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as FirebaseUser[];
    callback(users);
  });
}