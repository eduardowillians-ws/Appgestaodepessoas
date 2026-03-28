import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';

export interface FirebaseUserSkill {
  id: string;
  userId: string;
  skillId: string;
  level: 'not_trained' | 'in_training' | 'competent' | 'expert';
  lastUpdated: Date;
}

export const userSkillsCollection = collection(db, 'userSkills');

export async function updateFirebaseUserSkill(
  userId: string, 
  skillId: string, 
  level: 'not_trained' | 'in_training' | 'competent' | 'expert'
): Promise<void> {
  const docId = `${userId}_${skillId}`;
  const docRef = doc(db, 'userSkills', docId);
  
  // 1. Read existing document to check previous level
  const existingSnap = await getDoc(docRef);
  const previousLevel = existingSnap.exists() ? existingSnap.data().level : null;
  
  console.log("🔍 updateFirebaseUserSkill:", { userId, skillId, previousLevel, newLevel: level });
  
  // 1.5. Protect expert as terminal state - block any downgrade attempt
  if (previousLevel === 'expert' && level !== 'expert') {
    console.warn("🚫 BLOCKED: Attempt to downgrade expert level is not allowed");
    return;
  }
  
  // 2. Build update object
  const updateData: any = {
    userId,
    skillId,
    level,
    lastUpdated: serverTimestamp()
  };
  
  // 3. If new level is "expert" AND previous was NOT "expert", award 5 points
  if (level === 'expert' && previousLevel !== 'expert') {
    console.log("🎉 NOVO EXPERT! Adicionando 5 pontos para userId:", userId);
    
    // Get user document reference
    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);
    
    if (userSnap.exists()) {
      // Use atomic increment to avoid race conditions
      await updateDoc(userDocRef, {
        points: increment(5),
        performanceScore: increment(5)
      });
      console.log("✅ 5 pontos adicionados via atomic increment");
    } else {
      console.warn("⚠️ Usuário não encontrado no Firebase:", userId);
    }
  } else if (level === 'expert' && previousLevel === 'expert') {
    console.log("⚠️ Usuário JÁ ERA expert - não dar pontos duplicados");
  }
  
  // 4. Save the userSkill update
  await setDoc(docRef, updateData, { merge: true });
}

export async function getAllUserSkills(): Promise<FirebaseUserSkill[]> {
  const snapshot = await getDocs(userSkillsCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
  })) as FirebaseUserSkill[];
}

export async function getUserSkillById(id: string): Promise<FirebaseUserSkill | null> {
  const docRef = doc(db, 'userSkills', id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as FirebaseUserSkill;
}

export async function createUserSkill(userSkillData: Omit<FirebaseUserSkill, 'id'>): Promise<string> {
  const docRef = await addDoc(userSkillsCollection, {
    ...userSkillData,
    lastUpdated: userSkillData.lastUpdated || new Date()
  });
  return docRef.id;
}

export async function updateUserSkill(id: string, userSkillData: Partial<FirebaseUserSkill>): Promise<void> {
  const docRef = doc(db, 'userSkills', id);
  await updateDoc(docRef, userSkillData);
}

export async function findAndUpdateUserSkill(
  userId: string, 
  skillId: string, 
  level: 'not_trained' | 'in_training' | 'competent' | 'expert'
): Promise<string | null> {
  // Delegate to updateFirebaseUserSkill which handles gamification logic
  await updateFirebaseUserSkill(userId, skillId, level);
  return `${userId}_${skillId}`;
}

export async function deleteUserSkillByUserAndSkill(userId: string, skillId: string): Promise<void> {
  const snapshot = await getDocs(userSkillsCollection);
  const existingDoc = snapshot.docs.find(d => d.data().userId === userId && d.data().skillId === skillId);
  if (existingDoc) {
    await deleteDoc(doc(db, 'userSkills', existingDoc.id));
  }
}

export async function deleteUserSkill(id: string): Promise<void> {
  const docRef = doc(db, 'userSkills', id);
  await deleteDoc(docRef);
}

export function subscribeUserSkills(callback: (userSkills: FirebaseUserSkill[]) => void) {
  return onSnapshot(userSkillsCollection, (snapshot) => {
    const userSkills = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
    })) as FirebaseUserSkill[];
    callback(userSkills);
  });
}
