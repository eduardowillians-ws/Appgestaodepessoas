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

export interface FirebaseSkill {
  id: string;
  name: string;
  category: string;
  description: string;
  points: number;
}

export const skillsCollection = collection(db, 'skills');

export async function getAllSkills(): Promise<FirebaseSkill[]> {
  const snapshot = await getDocs(skillsCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FirebaseSkill[];
}

export async function getSkillById(id: string): Promise<FirebaseSkill | null> {
  const docRef = doc(db, 'skills', id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as FirebaseSkill;
}

export async function createSkill(skillData: Omit<FirebaseSkill, 'id'>): Promise<string> {
  const docRef = await addDoc(skillsCollection, skillData);
  return docRef.id;
}

export async function updateSkill(id: string, skillData: Partial<FirebaseSkill>): Promise<void> {
  const docRef = doc(db, 'skills', id);
  await updateDoc(docRef, skillData);
}

export async function deleteSkill(id: string): Promise<void> {
  const docRef = doc(db, 'skills', id);
  await deleteDoc(docRef);
}

export function subscribeSkills(callback: (skills: FirebaseSkill[]) => void) {
  return onSnapshot(skillsCollection, (snapshot) => {
    const skills = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirebaseSkill[];
    callback(skills);
  });
}