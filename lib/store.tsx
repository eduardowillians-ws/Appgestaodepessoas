'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Skill, UserSkill, Task, TaskStatus, SkillLevel, Role, Training, Goal } from './types';
import { initialUsers, initialSkills, initialUserSkills, initialTasks, initialRoles, initialTrainings } from './mock-data';
import { sanitizeData } from './utils';
import { subscribeToUsers, FirebaseUser, updateUser as updateUserFirebase, getUserById, addPointsToUser, deleteUser as deleteUserFirebase, createUser } from './firebase-users';
import { subscribeSkills, FirebaseSkill, createSkill as createSkillFirebase, updateSkill as updateSkillFirebase, deleteSkill as deleteSkillFirebase } from './firebase-skills';
import { subscribeToTasks, FirebaseTask, updateTask as updateTaskFirebase, deleteTask as deleteTaskFirebase, createTask as createTaskFirebase } from './firebase-tasks';
import { subscribeUserSkills, FirebaseUserSkill, updateFirebaseUserSkill, deleteUserSkillByUserAndSkill } from './firebase-user-skills';

// ---------------------------------------------------------------------------
// 🔒 Helpers de localStorage SEGUROS
// Protegem contra: dados corrompidos, JSON circular, HTMLElement serializado
// ---------------------------------------------------------------------------

function loadFromStorage<T>(key: string, fallback: T, validator?: (v: unknown) => boolean): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    // Validação opcional: se falhar, descarta os dados corrompidos
    if (validator && !validator(parsed)) {
      console.warn(`[Storage] Dados inválidos em "${key}", limpando...`);
      localStorage.removeItem(key);
      return fallback;
    }
    return parsed as T;
  } catch (err) {
    console.warn(`[Storage] Erro ao carregar "${key}", limpando dados corrompidos:`, err);
    localStorage.removeItem(key);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    // sanitizeData garante que nenhum HTMLElement/circular ref entre no JSON
    const clean = sanitizeData(data);
    localStorage.setItem(key, JSON.stringify(clean));
  } catch (err) {
    console.warn(`[Storage] Erro ao salvar "${key}":`, err);
  }
}

// Validadores — garantem que os dados do localStorage têm o formato esperado
const isArrayOfObjects = (v: unknown): boolean =>
  Array.isArray(v) && v.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));

// ---------------------------------------------------------------------------
// 🔄 Helpers de conversão Firebase → App (Timestamps → ISOString)
// ---------------------------------------------------------------------------

function convertFirebaseUser(fbUser: FirebaseUser): User {
  return {
    ...fbUser,
    createdAt: fbUser.createdAt instanceof Date ? fbUser.createdAt.toISOString() : String(fbUser.createdAt),
  };
}

function convertFirebaseTask(fbTask: FirebaseTask): Task {
  return {
    id: fbTask.id,
    title: fbTask.title,
    description: fbTask.description || '',
    assignedUserId: fbTask.assignedUserId || undefined,
    requiredSkills: fbTask.requiredSkills || [],
    status: fbTask.status || 'pending',
    priority: fbTask.priority || 'medium',
    dueDate: fbTask.dueDate instanceof Date ? fbTask.dueDate.toISOString() : String(fbTask.dueDate),
    createdAt: fbTask.createdAt instanceof Date ? fbTask.createdAt.toISOString() : String(fbTask.createdAt),
    completedAt: fbTask.completedAt instanceof Date ? fbTask.completedAt.toISOString() : fbTask.completedAt ? String(fbTask.completedAt) : undefined,
    rating: fbTask.rating ?? undefined,
    archived: fbTask.archived || false,
    archivedAt: fbTask.archivedAt instanceof Date ? fbTask.archivedAt.toISOString() : fbTask.archivedAt ? String(fbTask.archivedAt) : undefined,
    points: fbTask.points ?? 1,
  };
}

function convertFirebaseSkill(fbSkill: FirebaseSkill): Skill {
  return fbSkill as unknown as Skill;
}

function convertFirebaseUserSkill(fbUserSkill: FirebaseUserSkill): UserSkill {
  return {
    ...fbUserSkill,
    lastUpdated: fbUserSkill.lastUpdated instanceof Date ? fbUserSkill.lastUpdated.toISOString() : String(fbUserSkill.lastUpdated),
  };
}

// ---------------------------------------------------------------------------

interface AppContextType {
  users: User[];
  skills: Skill[];
  userSkills: UserSkill[];
  tasks: Task[];
  roles: Role[];
  trainings: Training[];
  goals: Goal[];

  // UI State
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (isOpen: boolean) => void;

  // Roles
  addRole: (name: string) => void;
  updateRole: (id: string, name: string) => void;
  deleteRole: (id: string) => void;

  // Users
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'performanceScore' | 'points' | 'level' | 'xpToNextLevel'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addUserPoints: (userId: string, points: number) => void;

  // Skills
  addSkill: (skill: Omit<Skill, 'id'>) => void;
  updateSkill: (id: string, data: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;

  // UserSkills
  updateUserSkill: (userId: string, skillId: string, level: SkillLevel) => void;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  archiveTask: (id: string) => void;
  unarchiveTask: (id: string) => void;

  // Trainings
  addTraining: (training: Omit<Training, 'id'>) => void;
  updateTraining: (id: string, data: Partial<Training>) => void;
  deleteTraining: (id: string) => void;

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  archiveGoal: (id: string, progress: number) => void;
  unarchiveGoal: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // ✅ Estado inicializado do localStorage com fallback para os dados mock
  const [users, setUsers] = useState<User[]>(() => {
    const stored = loadFromStorage<User[]>('nexus_users', [], isArrayOfObjects);
    return stored.length > 0 ? stored : initialUsers;
  });

  const [skills, setSkills] = useState<Skill[]>(() => {
    const stored = loadFromStorage<Skill[]>('nexus_skills', [], isArrayOfObjects);
    return stored.length > 0 ? stored : initialSkills;
  });

  const [userSkills, setUserSkills] = useState<UserSkill[]>(() => {
    const stored = loadFromStorage<UserSkill[]>('nexus_userSkills', [], isArrayOfObjects);
    return stored.length > 0 ? stored : initialUserSkills;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = loadFromStorage<Task[]>('nexus_tasks', [], isArrayOfObjects);
    return stored.length > 0 ? stored : initialTasks;
  });

  const [roles, setRoles] = useState<Role[]>(() => {
    const stored = loadFromStorage<Role[]>('nexus_roles', [], isArrayOfObjects);
    return stored.length > 0 ? stored : initialRoles;
  });

  const [trainings, setTrainings] = useState<Training[]>(() => {
    const stored = loadFromStorage<Training[]>('nexus_trainings', [], isArrayOfObjects);
    return stored.length > 0 ? stored : initialTrainings;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const stored = loadFromStorage<Goal[]>('nexus_goals', [], isArrayOfObjects);
    return stored.length > 0 ? stored : [];
  });

  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ Persistência automática: salva no localStorage sempre que o estado muda
  // Só salva dados serializáveis (sanitizeData é aplicado dentro de saveToStorage)
  useEffect(() => { saveToStorage('nexus_users', users); }, [users]);
  useEffect(() => { saveToStorage('nexus_skills', skills); }, [skills]);
  useEffect(() => { saveToStorage('nexus_userSkills', userSkills); }, [userSkills]);
  useEffect(() => { saveToStorage('nexus_tasks', tasks); }, [tasks]);
  useEffect(() => { saveToStorage('nexus_roles', roles); }, [roles]);
  useEffect(() => { saveToStorage('nexus_trainings', trainings); }, [trainings]);
  useEffect(() => { saveToStorage('nexus_goals', goals); }, [goals]);

  // ---------------------------------------------------------------------------
  // 🔄 Sincronização Firebase → AppProvider (Fonte da verdade)
  // Se Firestore vazio, usa initialUsers/initialTasks como fallback
  // ---------------------------------------------------------------------------
  
  // Users
  useEffect(() => {
    const unsubscribe = subscribeToUsers((firebaseUsers) => {
      if (firebaseUsers.length > 0) {
        const converted = firebaseUsers.map(convertFirebaseUser);
        setUsers(converted);
        saveToStorage('nexus_users', converted);
      }
    });
    return () => unsubscribe();
  }, []);

  // Tasks
  useEffect(() => {
    const unsubscribe = subscribeToTasks((firebaseTasks) => {
      if (firebaseTasks.length > 0) {
        const converted = firebaseTasks.map(convertFirebaseTask);
        setTasks(converted);
        saveToStorage('nexus_tasks', converted);
      }
    });
    return () => unsubscribe();
  }, []);

  // Skills
  useEffect(() => {
    const unsubscribe = subscribeSkills((firebaseSkills) => {
      if (firebaseSkills.length > 0) {
        const converted = firebaseSkills.map(convertFirebaseSkill);
        setSkills(converted);
        saveToStorage('nexus_skills', converted);
      }
    });
    return () => unsubscribe();
  }, []);

  // UserSkills
  useEffect(() => {
    const unsubscribe = subscribeUserSkills((firebaseUserSkills) => {
      if (firebaseUserSkills.length > 0) {
        const converted = firebaseUserSkills.map(convertFirebaseUserSkill);
        setUserSkills(converted);
        saveToStorage('nexus_userSkills', converted);
      }
    });
    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------------------------

  // Auto-overdue logic
  useEffect(() => {
    const checkOverdue = () => {
      const now = new Date().toISOString();
      let updated = false;

      const newTasks = tasks.map(t => {
        if (t.status !== 'completed' && t.status !== 'overdue' && t.dueDate < now) {
          updated = true;
          const isRealUser = t.assignedUserId && !t.assignedUserId.match(/^u\d+$/);
          const isRealTask = t.id && !t.id.match(/^t\d+$/);

          // Update Firebase if it's a real task
          if (isRealTask) {
            updateTaskFirebase(t.id, { status: 'overdue' }).catch(console.error);
            if (isRealUser) {
              addPointsToUser(t.assignedUserId!, -0.5).catch(console.error);
            }
          }

          // Fallback optimistic return
          return { ...t, status: 'overdue' as TaskStatus };
        }
        return t;
      });

      if (updated) setTasks(newTasks);
    };

    checkOverdue();
    const interval = setInterval(checkOverdue, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

  // --- Roles ---
  const addRole = (name: string) => {
    const newRole: Role = sanitizeData({
      id: `r${Date.now()}`,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    });
    setRoles(prev => [...prev, newRole]);
  };

  const updateRole = (id: string, name: string) => {
    setRoles(prev => prev.map(r => r.id === id ? sanitizeData({ ...r, name: name.trim() }) : r));
  };

  const deleteRole = (id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id));
  };

  // --- Users ---
  const addUser = async (userData: Omit<User, 'id' | 'createdAt' | 'performanceScore' | 'points' | 'level' | 'xpToNextLevel'>) => {
    const now = new Date();
    try {
      await createUser({
        ...userData,
        createdAt: now,
        performanceScore: 8.0,
        points: 0,
        level: 1,
        xpToNextLevel: 100,
      });
    } catch (error) {
      console.error("Erro ao adicionar usuário no Firebase:", error);
      // Fallback local caso dê erro (opcional)
      const newUser: User = sanitizeData({
        ...userData,
        id: `u${Date.now()}`,
        createdAt: now.toISOString(),
        performanceScore: 8.0,
        points: 0,
        level: 1,
        xpToNextLevel: 100,
      });
      setUsers(prev => [...prev, newUser]);
    }
  };

  const addUserPoints = async (userId: string, pointsToAdd: number) => {
    console.log('🔍 addUserPoints chamado:', { userId, pointsToAdd });
    
    // Apenas Firebase - useEffect com subscribeToUsers vai atualizar UI automaticamente
    try {
      await addPointsToUser(userId, pointsToAdd);
    } catch (err) {
      console.error('❌ Erro ao incrementar pontos:', err);
    }
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? sanitizeData({ ...u, ...data }) : u));
    
    // Convert to Firebase types
    const firebaseData: any = { ...data };
    if (data.createdAt) firebaseData.createdAt = new Date(data.createdAt);
    
    await updateUserFirebase(id, firebaseData).catch(console.error);
  };

  const deleteUser = async (id: string) => {
    // Delete from Firebase first
    try {
      await deleteUserFirebase(id);
      console.log("✅ Usuário removido do Firebase:", id);
    } catch (error) {
      console.error("❌ Erro ao excluir usuário do Firebase:", error);
    }
    
    // Then update local state
    setUsers(prev => prev.filter(u => u.id !== id));
    setUserSkills(prev => prev.filter(us => us.userId !== id));
    setTasks(prev => prev.map(t => t.assignedUserId === id ? sanitizeData({ ...t, assignedUserId: undefined }) : t));
  };

  // --- Skills ---
  const addSkill = async (skillData: Omit<Skill, 'id'>) => {
    try {
      await createSkillFirebase({
        ...skillData,
        points: skillData.points ?? 10
      });
    } catch (error) {
      console.error("Erro ao adicionar skill:", error);
      const newSkill: Skill = sanitizeData({ ...skillData, id: `s${Date.now()}` });
      setSkills(prev => [...prev, newSkill]);
    }
  };

  const updateSkill = async (id: string, data: Partial<Skill>) => {
    setSkills(prev => prev.map(s => s.id === id ? sanitizeData({ ...s, ...data }) : s));
    await updateSkillFirebase(id, data).catch(console.error);
  };

  const deleteSkill = async (id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
    setUserSkills(prev => prev.filter(us => us.skillId !== id));
    await deleteSkillFirebase(id).catch(console.error);
  };

  // --- UserSkills ---
  const updateUserSkill = async (userId: string, skillId: string, level: SkillLevel) => {
    console.log("🔗 updateUserSkill chamado:", { userId, skillId, level });

    // 0. Verificar se é usuário mock (apenas IDs simples como "u1", "u2")
    const isMockUser = /^u\d+$/.test(userId);
    if (isMockUser) {
      console.warn("⚠️ Tentativa de atualizar usuário mock ignorada. Use um usuário real do Firebase.");
    }

    // 1. Persistir no Firebase (se não for mock)
    console.log("🔥 1. Iniciando Firebase para userId:", userId);
    try {
      if (!isMockUser) {
        if (level === 'not_trained') {
          await deleteUserSkillByUserAndSkill(userId, skillId);
        } else {
          await updateFirebaseUserSkill(userId, skillId, level);
        }
        console.log("✅ Firebase atualizado com sucesso.");
      }
    } catch (error) {
      console.error("❌ Erro ao salvar userSkill no Firebase:", error);
    }

    // 2. Lógica de Gamificação (FORA do setState)
    console.log("🏆 2. Verificando lógica de gamificação...");
    const existing = userSkills.find(us => us.userId === userId && us.skillId === skillId);
    const wasNotExpert = !existing || existing.level !== 'expert';

    if (level === 'expert' && wasNotExpert) {
      console.log("🎉 NOVO EXPERT! Adicionando 5 pontos ao usuário:", userId);
      if (!isMockUser) {
        await addUserPoints(userId, 5.0);
      }
    } else if (level === 'expert' && !wasNotExpert) {
      console.log("⚠️ Usuário JÁ ERA expert - não dar pontos duplicados");
    }

    // 3. Atualização da UI Local
    console.log("🎨 3. Atualizando estado local...");
    setUserSkills(prev => {
      const existingInUpdate = prev.find(us => us.userId === userId && us.skillId === skillId);
      
      if (existingInUpdate) {
        if (level === 'not_trained') {
          return prev.filter(us => us.id !== existingInUpdate.id);
        }
        return prev.map(us => us.id === existingInUpdate.id
          ? sanitizeData({ ...us, level, lastUpdated: new Date().toISOString() })
          : us
        );
      }
      if (level !== 'not_trained') {
        return [...prev, sanitizeData({ id: `us${Date.now()}`, userId, skillId, level, lastUpdated: new Date().toISOString() })];
      }
      return prev;
    });
    
    console.log("✅ updateUserSkill concluído.");
  };

  // --- Tasks ---
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const now = new Date();
    try {
      await createTaskFirebase({
        title: taskData.title,
        description: taskData.description,
        assignedUserId: taskData.assignedUserId || null,
        requiredSkills: taskData.requiredSkills || [],
        status: 'pending',
        priority: taskData.priority,
        dueDate: new Date(taskData.dueDate),
        createdAt: now,
        completedAt: null,
        rating: null,
        archived: false,
        archivedAt: null,
        points: taskData.points ?? 1,
      });
    } catch (error) {
      console.error("Erro ao criar newTask:", error);
      const newTask: Task = sanitizeData({
        ...taskData,
        id: `t${Date.now()}`,
        status: 'pending',
        createdAt: now.toISOString(),
      });
      setTasks(prev => [...prev, newTask]);
    }
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? sanitizeData({ ...t, ...data }) : t));

    const firebaseData: any = { ...data };
    if (data.dueDate) firebaseData.dueDate = new Date(data.dueDate);
    if (data.createdAt) firebaseData.createdAt = new Date(data.createdAt);
    if (data.completedAt) firebaseData.completedAt = new Date(data.completedAt);
    if (data.archivedAt) firebaseData.archivedAt = new Date(data.archivedAt);
    
    await updateTaskFirebase(id, firebaseData).catch(console.error);
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    console.log("🚀 updateTaskStatus chamado:", { id, status });
    try {
      // 1. Pega a task diretamente do state closure no momento exato do clique
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      
      const previousStatus = task.status;
      const isNowCompleting = status === 'completed';
      const wasNotCompleted = previousStatus !== 'completed';

      console.log("🔍 VERIFICAÇÃO DE XP:", { 
        taskId: id, 
        assignedUserId: task.assignedUserId,
        previousStatus,
        statusParam: status,
        isNowCompleting,
        wasNotCompleted,
        taskPoints: task.points
      });

      // 2. Verificar se é usuário real (não mock)
      const isRealUserId = task.assignedUserId && 
        !task.assignedUserId.match(/^u\d+$/) && 
        !task.assignedUserId.startsWith('mock') &&
        task.assignedUserId.length > 5;
      
      // 3. Executar Lógica de Pontos DE FORA DO SET_STATE (evita React render dobrado ou race conditions)
      if (isNowCompleting && task.assignedUserId && isRealUserId && wasNotCompleted) {
        const pointsToAdd = task.points ?? 1;
        console.log('🎯 Concluindo tarefa com pontos:', {
          taskId: task.id,
          previousStatus,
          configuredPoints: task.points,
          pointsToAdd,
        });
        addUserPoints(task.assignedUserId, pointsToAdd);
      } else if (!wasNotCompleted) {
        console.log('⏭️ Task já estava concluída, ignorando XP duplicado');
      } else if (!isNowCompleting) {
        console.log('⏭️ Task não está sendo completada, sem XP');
      }

      // 4. Primeiro atualiza no Firebase
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
      await updateTaskFirebase(id, updateData).catch(console.error);

      // 5. Atualiza o estado local de forma puramente funcional para não bloquear a UI temporariamente
      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          return sanitizeData({
            ...t,
            status,
            completedAt: isNowCompleting ? new Date().toISOString() : t.completedAt
          });
        }
        return t;
      }));
    } catch (error) {
      console.error('Erro em updateTaskStatus:', error);
    }
  };

  const deleteTask = async (id: string) => {
    await deleteTaskFirebase(id).catch(console.error);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const archiveTask = async (id: string) => {
    await updateTaskFirebase(id, { archived: true, archivedAt: new Date() }).catch(console.error);
    setTasks(prev => prev.map(t => 
      t.id === id 
        ? sanitizeData({ ...t, archived: true, archivedAt: new Date().toISOString() }) 
        : t
    ));
  };

  const unarchiveTask = async (id: string) => {
    await updateTaskFirebase(id, { archived: false, archivedAt: null }).catch(console.error);
    setTasks(prev => prev.map(t => 
      t.id === id 
        ? sanitizeData({ ...t, archived: false, archivedAt: undefined }) 
        : t
    ));
  };

  // --- Trainings ---
  const addTraining = (trainingData: Omit<Training, 'id'>) => {
    const newTraining: Training = sanitizeData({
      ...trainingData,
      id: `tr${Date.now()}`,
    });
    setTrainings(prev => [...prev, newTraining]);
  };

  const updateTraining = (id: string, data: Partial<Training>) => {
    setTrainings(prev => prev.map(t => t.id === id ? sanitizeData({ ...t, ...data }) : t));
  };

  const deleteTraining = (id: string) => {
    setTrainings(prev => prev.filter(t => t.id !== id));
  };

  // --- Goals ---
  const addGoal = (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = sanitizeData({
      ...goalData,
      id: `g${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    setGoals(prev => [...prev, newGoal]);
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const updateGoal = (id: string, data: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === id ? sanitizeData({ ...g, ...data }) : g));
  };

  const archiveGoal = (id: string, progress: number) => {
    setGoals(prev => prev.map(g => 
      g.id === id 
        ? sanitizeData({ ...g, archived: true, archivedAt: new Date().toISOString(), archivedProgress: progress }) 
        : g
    ));
  };

  const unarchiveGoal = (id: string) => {
    setGoals(prev => prev.map(g => 
      g.id === id 
        ? sanitizeData({ ...g, archived: false, archivedAt: undefined, archivedProgress: undefined }) 
        : g
    ));
  };

  return (
    <AppContext.Provider value={{
      isMobileMenuOpen, setMobileMenuOpen,
      users, skills, userSkills, tasks, roles, trainings, goals,
      addRole, updateRole, deleteRole,
      addUser, updateUser, deleteUser, addUserPoints,
      addSkill, updateSkill, deleteSkill,
      updateUserSkill,
      addTask, updateTask, updateTaskStatus, deleteTask, archiveTask, unarchiveTask,
      addTraining, updateTraining, deleteTraining,
      addGoal, updateGoal, deleteGoal, archiveGoal, unarchiveGoal
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
}
