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
  Timestamp 
} from 'firebase/firestore';

export interface FirebaseTask {
  id: string;
  title: string;
  description: string;
  assignedUserId: string | null;
  requiredSkills: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  createdAt: Date;
  completedAt: Date | null;
  rating: number | null;
  archived: boolean;
  archivedAt: Date | null;
  points?: number;
}

export const tasksCollection = collection(db, 'tasks');

export async function getAllTasks(): Promise<FirebaseTask[]> {
  const snapshot = await getDocs(tasksCollection);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dueDate: data.dueDate?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      completedAt: data.completedAt?.toDate() || null,
      archivedAt: data.archivedAt?.toDate() || null
    };
  }) as FirebaseTask[];
}

export async function getTaskById(id: string): Promise<FirebaseTask | null> {
  const docRef = doc(db, 'tasks', id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    dueDate: data.dueDate?.toDate() || new Date(),
    createdAt: data.createdAt?.toDate() || new Date(),
    completedAt: data.completedAt?.toDate() || null,
    archivedAt: data.archivedAt?.toDate() || null
  } as FirebaseTask;
}

export async function createTask(taskData: Omit<FirebaseTask, 'id'>): Promise<string> {
  console.log('🔥 SALVANDO TASK NO PROJETO:', taskData);
  console.log("🔥 Enviando para Firestore");
  const docRef = await addDoc(collection(db, "tasks"), {
    ...taskData,
    dueDate: Timestamp.fromDate(taskData.dueDate),
    createdAt: Timestamp.fromDate(taskData.createdAt),
    completedAt: taskData.completedAt ? Timestamp.fromDate(taskData.completedAt) : null,
    archivedAt: taskData.archivedAt ? Timestamp.fromDate(taskData.archivedAt) : null
  });
  console.log("🔥 Documento criado com ID:", docRef.id);
  return docRef.id;
}

export async function updateTask(id: string, taskData: Partial<FirebaseTask>): Promise<void> {
  const docRef = doc(db, 'tasks', id);
  const updateData: any = { ...taskData };
  if (taskData.dueDate) updateData.dueDate = Timestamp.fromDate(taskData.dueDate);
  if (taskData.createdAt) updateData.createdAt = Timestamp.fromDate(taskData.createdAt);
  if (taskData.completedAt) updateData.completedAt = Timestamp.fromDate(taskData.completedAt);
  if (taskData.archivedAt) updateData.archivedAt = Timestamp.fromDate(taskData.archivedAt);
  await updateDoc(docRef, updateData);
}

export async function deleteTask(id: string): Promise<void> {
  const docRef = doc(db, 'tasks', id);
  await deleteDoc(docRef);
}

export function subscribeToTasks(callback: (tasks: FirebaseTask[]) => void) {
  return onSnapshot(tasksCollection, (snapshot) => {
    const tasks = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate() || null,
        archivedAt: data.archivedAt?.toDate() || null
      };
    }) as FirebaseTask[];
    callback(tasks);
  });
}

export interface SimpleTaskData {
  title: string;
  description?: string;
  assignedUserId?: string | null;
}

export async function createTaskSafe(taskData: SimpleTaskData): Promise<string> {
  try {
    const fullTaskData = {
      title: taskData.title,
      description: taskData.description || '',
      status: 'pending' as const,
      assignedUserId: taskData.assignedUserId || null,
      requiredSkills: [],
      priority: 'medium' as const,
      dueDate: new Date(),
      createdAt: new Date(),
      completedAt: null,
      rating: null,
      archived: false,
      archivedAt: null
    };
    
    const id = await createTask(fullTaskData);
    return id;
  } catch (error) {
    console.error('Erro ao criar task', error);
    throw error;
  }
}