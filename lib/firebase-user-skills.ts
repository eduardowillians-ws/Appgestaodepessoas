import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot 
} from 'firebase/firestore';

export interface FirebaseUserSkill {
  id: string;
  userId: string;
  skillId: string;
  level: 'not_trained' | 'in_training' | 'competent' | 'expert';
  lastUpdated: Date;
}

export const userSkillsCollection = collection(db, 'userSkills');

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
