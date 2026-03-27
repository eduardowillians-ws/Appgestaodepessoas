'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Skill, UserSkill, Task, TaskStatus, SkillLevel, Role, Training, Goal } from './types';
import { initialUsers, initialSkills, initialUserSkills, initialTasks, initialRoles, initialTrainings } from './mock-data';
import { sanitizeData } from './utils';

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

  // Auto-overdue logic
  useEffect(() => {
    const checkOverdue = () => {
      const now = new Date().toISOString();
      let updated = false;

      const newTasks = tasks.map(t => {
        if (t.status !== 'completed' && t.status !== 'overdue' && t.dueDate < now) {
          updated = true;
          // Gamification: -0.5 pontos por atraso
          if (t.assignedUserId) {
            setUsers(prev => prev.map(u =>
              u.id === t.assignedUserId
                ? { ...u, performanceScore: Math.max(0, u.performanceScore - 0.5) }
                : u
            ));
          }
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
  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'performanceScore' | 'points' | 'level' | 'xpToNextLevel'>) => {
    const newUser: User = sanitizeData({
      ...userData,
      id: `u${Date.now()}`,
      createdAt: new Date().toISOString(),
      performanceScore: 8.0,
      points: 0,
      level: 1,
      xpToNextLevel: 100,
    });
    setUsers(prev => [...prev, newUser]);
  };

  const addUserPoints = (userId: string, pointsToAdd: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const newPoints = u.points + pointsToAdd;
      const xpNeeded = 100 * u.level;
      const newXp = u.xpToNextLevel - pointsToAdd;
      if (newXp <= 0) {
        return sanitizeData({
          ...u,
          points: newPoints,
          level: u.level + 1,
          xpToNextLevel: 100 * (u.level + 1) - Math.abs(newXp),
        });
      }
      return sanitizeData({ ...u, points: newPoints, xpToNextLevel: newXp });
    }));
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? sanitizeData({ ...u, ...data }) : u));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setUserSkills(prev => prev.filter(us => us.userId !== id));
    setTasks(prev => prev.map(t => t.assignedUserId === id ? sanitizeData({ ...t, assignedUserId: undefined }) : t));
  };

  // --- Skills ---
  const addSkill = (skillData: Omit<Skill, 'id'>) => {
    const newSkill: Skill = sanitizeData({ ...skillData, id: `s${Date.now()}` });
    setSkills(prev => [...prev, newSkill]);
  };

  const updateSkill = (id: string, data: Partial<Skill>) => {
    setSkills(prev => prev.map(s => s.id === id ? sanitizeData({ ...s, ...data }) : s));
  };

  const deleteSkill = (id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
    setUserSkills(prev => prev.filter(us => us.skillId !== id));
  };

  // --- UserSkills ---
  const updateUserSkill = (userId: string, skillId: string, level: SkillLevel) => {
    setUserSkills(prev => {
      const existing = prev.find(us => us.userId === userId && us.skillId === skillId);
      const wasNotExpert = existing && existing.level !== 'expert';
      const isNowExpert = level === 'expert';
      
      if (isNowExpert && wasNotExpert) {
        addUserPoints(userId, 5.0);
      }
      
      if (existing) {
        if (level === 'not_trained') {
          return prev.filter(us => us.id !== existing.id);
        }
        return prev.map(us => us.id === existing.id
          ? sanitizeData({ ...us, level, lastUpdated: new Date().toISOString() })
          : us
        );
      }
      if (level !== 'not_trained') {
        return [...prev, sanitizeData({ id: `us${Date.now()}`, userId, skillId, level, lastUpdated: new Date().toISOString() })];
      }
      return prev;
    });
  };

  // --- Tasks ---
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const newTask: Task = sanitizeData({
      ...taskData,
      id: `t${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, data: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? sanitizeData({ ...t, ...data }) : t));
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    try {
      setTasks(prev => {
        const task = prev.find(t => t.id === id);
        if (!task) return prev;
        
        const wasCompleted = task.status === 'completed';
        const isNowCompleted = status === 'completed';
        const isNowOverdue = status === 'overdue';
        
        if (isNowCompleted && !wasCompleted && task.assignedUserId) {
          addUserPoints(task.assignedUserId, 1.0);
        }
        
        if (isNowOverdue && !wasCompleted && task.assignedUserId && task.status !== 'overdue') {
          addUserPoints(task.assignedUserId, -0.5);
        }

        return prev.map(t => {
          if (t.id === id) {
            return sanitizeData({
              ...t,
              status,
              completedAt: isNowCompleted ? new Date().toISOString() : t.completedAt
            });
          }
          return t;
        });
      });
    } catch (error) {
      console.error('Erro em updateTaskStatus:', error);
    }
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const archiveTask = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id 
        ? sanitizeData({ ...t, archived: true, archivedAt: new Date().toISOString() }) 
        : t
    ));
  };

  const unarchiveTask = (id: string) => {
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
