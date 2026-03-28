import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  increment
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

export async function addPointsToUser(userId: string, pointsToAdd: number): Promise<void> {
  console.info("📡 Verificando estado da conexão antes de gravar...");
  console.log("🎯 addPointsToUser chamado:", { userId, pointsToAdd });
  
  // Verificar se está online
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.warn("⚠️ [Firebase] Offline - ponto será enviado quando conexão voltar");
  }
  
  try {
    const docRef = doc(db, 'users', userId);
    const userSnap = await getDoc(docRef);
    
    if (!userSnap.exists()) {
      console.error("❌ Usuário não encontrado no Firebase:", userId);
      return;
    }
    
    const userData = userSnap.data();
    const currentPoints = Number(userData?.points) || 0;
    const currentLevel = Number(userData?.level) || 1;
    const currentXpNeeded = Number(userData?.xpToNextLevel) || 100;
    
    console.log("📊 Dados atuais do usuário:", { currentPoints, currentLevel, currentXpNeeded });
    
    // Calcular novos pontos e verificar level up
    let newPoints = currentPoints + pointsToAdd;
    let newLevel = currentLevel;
    let newXpToNextLevel = currentXpNeeded;
    
    // Level up se pontos ultrapassarem o needed
    if (newPoints >= newXpToNextLevel) {
      newPoints = newPoints - newXpToNextLevel;
      newLevel = currentLevel + 1;
      newXpToNextLevel = newLevel * 100;
      console.log("🎉 LEVEL UP! Novo nível:", newLevel);
    }
    
    await updateDoc(docRef, {
      points: newPoints,
      level: newLevel,
      xpToNextLevel: newXpToNextLevel,
      performanceScore: increment(pointsToAdd) // Mantém também para score de desempenho
    });
    
    console.log("✅ Ponto gravado no Firebase! novos valores:", { points: newPoints, level: newLevel, xpToNextLevel: newXpToNextLevel });
  } catch (error: any) {
    console.error("❌ Erro ao salvar ponto no Firebase:", error?.message || error);
    
    if (error?.code === 'not-found') {
      console.error("❌ Usuário não encontrado:", userId);
    }
    if (error?.code === 'permission-denied') {
      console.error("❌ Permissão negada - verifique as regras do Firestore!");
    }
  }
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