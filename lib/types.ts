export type SkillLevel = 'not_trained' | 'in_training' | 'competent' | 'expert';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high';
export type UserStatus = 'active' | 'inactive' | 'busy';

export interface Role {
  id: string;
  name: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  role: string;
  status: UserStatus;
  performanceScore: number;
  tags: string[];
  notes: string;
  createdAt: string;
  avatar: string;
  points: number;
  level: number;
  xpToNextLevel: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  level: SkillLevel;
  lastUpdated: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedUserId?: string;
  requiredSkills: string[];
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  rating?: number;
  archived?: boolean;
  archivedAt?: string;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  instructor: string;
  date: string;
  duration: number;
  type: 'technical' | 'soft' | 'workshop';
  category?: string;
}

export interface CalendarEvent {
  id: string;
  date: Date;
  type: 'training' | 'task';
  title: string;
  description?: string;
  userId?: string;
}

export type GoalType = 'task' | 'skill' | 'general';
export type GoalScope = 'team' | 'individual';
export type GoalCriteria = 'complete_tasks' | 'gain_skill' | 'points';

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  scope: GoalScope;
  targetMemberId?: string;
  targetMembers?: string[];
  criteria: GoalCriteria;
  targetValue: number;
  createdAt: string;
  archived?: boolean;
  archivedAt?: string;
  archivedProgress?: number;
}
