import { User, Skill, UserSkill, Task, Role, Training } from './types';

export const initialRoles: Role[] = [
  { id: 'r1', name: 'Desenvolvedor', createdAt: new Date(Date.now() - 10000000000).toISOString() },
  { id: 'r2', name: 'Designer', createdAt: new Date(Date.now() - 9000000000).toISOString() },
  { id: 'r3', name: 'Gestor de Projetos', createdAt: new Date(Date.now() - 8000000000).toISOString() },
  { id: 'r4', name: 'Tech Lead', createdAt: new Date(Date.now() - 7000000000).toISOString() },
  { id: 'r5', name: 'Analista', createdAt: new Date(Date.now() - 6000000000).toISOString() },
  { id: 'r6', name: 'Vendedor', createdAt: new Date(Date.now() - 5000000000).toISOString() },
  { id: 'r7', name: 'Caixa', createdAt: new Date(Date.now() - 4000000000).toISOString() },
];

export function generateProductivityData(days: number): { date: string; completed: number }[] {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const completed = Math.floor(Math.random() * 13) + 3;
    
    data.push({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      completed,
    });
  }
  
  return data;
}

export const initialUsers: User[] = [
  {
    id: 'u1',
    name: 'Ana Silva',
    role: 'Gestora de Projetos',
    status: 'active',
    performanceScore: 9.8,
    tags: ['Liderança', 'Ágil'],
    notes: 'Excelente em comunicação.',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcBL1lspFHQzM77O11-hM7xD06S5g10MR8VdDBNTucT7XRZdIyJ0vaXxx0EH1nwxMFyIANUJ0RIvPQkgG_PhIPVSfRpy9gef7W9iIDeA6l6LbVct8oSH0225HHHq1gkyHrVeO8w76eDQ_01OAP8IuL3xg1EljQXFc9U7lCh5THsisPCwRlx8djqAnukfERFnybe1Ppsbhd8cGguHv1Pdmox-4HIafBeQZSWArlrtixoV3s8i3un6fWLeMfJLqlMpykBZPYWuuzQ8yP',
    points: 30,
    level: 2,
    xpToNextLevel: 70,
  },
  {
    id: 'u2',
    name: 'Ricardo Lima',
    role: 'Tech Lead',
    status: 'active',
    performanceScore: 9.5,
    tags: ['Backend', 'Arquitetura'],
    notes: 'Especialista em microsserviços.',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrECI-GE1L7wVERtJJ3UaEp479Bcx4bXhV-KH1_5dH_kNJbPHcqIK9OGjyKt6afpTfofALAGOpVHXw2yCmfVwwlrGGlHZYIZPEF88-Vkf14D58FHn4zOOw65SM8VoozR8NfHLkLBKshznU1nrZq_8rGP5Uw0e5af3D1__o_CpBxToxEpnWsqk2EjqbPG6HU5ijA2vUaGLYBWqplLuQH9D2HvUOdjXsM1rTfzc1CEXDSTocNSiwr3BdZVJ4UfwAapfvkJiKKOWXg6VY',
    points: 6,
    level: 1,
    xpToNextLevel: 94,
  },
  {
    id: 'u3',
    name: 'Mariana Costa',
    role: 'Senior Designer',
    status: 'busy',
    performanceScore: 9.2,
    tags: ['UI/UX', 'Figma'],
    notes: 'Criativa e detalhista.',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCY26ddxvIsdQnpOA91AW52nNRhDs_zRoZIWbaBlLeTxpA5hb0ckg9ew1M8rKwtiLtc4Xj1F7vWHaDoFohoz5hV4ExxG90QXAiKwXeQ7nUcB246SqWYP6XZUUkKlEzNrz1jjdXgabtYA4qM6ANQWa3SgUG__9DMgyiwHCPDIURLBwjZhk70OPwYx8OReP5xIGZ33QeZMs46QQ1Do6T64GfzH-gDxiqKv-KBjdfV3NtXUvlbcm3vzxrEwHnv5NcvYPcWCU1lsnkwVCx4',
    points: 15,
    level: 1,
    xpToNextLevel: 85,
  },
  {
    id: 'u4',
    name: 'Lucas Peixoto',
    role: 'Fullstack Developer',
    status: 'active',
    performanceScore: 8.7,
    tags: ['React', 'Node.js'],
    notes: 'Em rápido desenvolvimento.',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_ggU1DIxMIa7Ow_LVQiEceVWK61qvNcw6HgBOvgqajZsVyryFco7PpJB-hMvNNgoRZ0sY4YJQSVAHv1yD4_HxGjkm-UH-dALSkh5ZUYMV7fCSLgMApJbD4SQbSUOlc61Jsr6AHmWsoZCOseeKQlfwtuwPKYuo1FUY6_ZKVl497Yd-dI3xRkGH9X5IWyW7vtfBcO2Gny8xIrXjm1KJSuoZeua_3ZeL5ikSaxDrUd8vubnXlgFAMsDH7W5ADRhHdt8gUtZZA9OgJcMd',
    points: 45,
    level: 2,
    xpToNextLevel: 55,
  },
];

export const initialSkills: Skill[] = [
  { id: 's1', name: 'React', description: 'Desenvolvimento frontend com React', category: 'Frontend', points: 5 },
  { id: 's2', name: 'Node.js', description: 'Desenvolvimento backend com Node.js', category: 'Backend', points: 5 },
  { id: 's3', name: 'UI Design', description: 'Design de interfaces de usuário', category: 'Design', points: 5 },
  { id: 's4', name: 'Project Mgmt', description: 'Gestão de projetos e metodologias ágeis', category: 'Gestão', points: 5 },
  { id: 's5', name: 'Python', description: 'Desenvolvimento em Python', category: 'Backend', points: 5 },
  { id: 's6', name: 'DevOps', description: 'Infraestrutura e CI/CD', category: 'DevOps', points: 5 },
];

export const initialUserSkills: UserSkill[] = [
  { id: 'us1', userId: 'u2', skillId: 's1', level: 'expert', lastUpdated: new Date().toISOString() },
  { id: 'us2', userId: 'u2', skillId: 's2', level: 'competent', lastUpdated: new Date().toISOString() },
  { id: 'us3', userId: 'u2', skillId: 's3', level: 'in_training', lastUpdated: new Date().toISOString() },
  { id: 'us4', userId: 'u2', skillId: 's4', level: 'competent', lastUpdated: new Date().toISOString() },
  { id: 'us5', userId: 'u2', skillId: 's6', level: 'competent', lastUpdated: new Date().toISOString() },
  
  { id: 'us6', userId: 'u3', skillId: 's1', level: 'in_training', lastUpdated: new Date().toISOString() },
  { id: 'us7', userId: 'u3', skillId: 's3', level: 'expert', lastUpdated: new Date().toISOString() },
  { id: 'us8', userId: 'u3', skillId: 's4', level: 'competent', lastUpdated: new Date().toISOString() },
  
  { id: 'us9', userId: 'u4', skillId: 's1', level: 'competent', lastUpdated: new Date().toISOString() },
  { id: 'us10', userId: 'u4', skillId: 's2', level: 'expert', lastUpdated: new Date().toISOString() },
  { id: 'us11', userId: 'u4', skillId: 's4', level: 'in_training', lastUpdated: new Date().toISOString() },
  { id: 'us12', userId: 'u4', skillId: 's5', level: 'competent', lastUpdated: new Date().toISOString() },
  { id: 'us13', userId: 'u4', skillId: 's6', level: 'in_training', lastUpdated: new Date().toISOString() },
];

export const initialTasks: Task[] = [
  {
    id: 't1',
    title: 'Revisão de Protótipo Mobile',
    description: 'Revisar as telas do novo app mobile.',
    assignedUserId: 'u3',
    requiredSkills: ['s3'],
    status: 'overdue',
    priority: 'high',
    dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    createdAt: new Date(Date.now() - 500000000).toISOString(),
  },
  {
    id: 't2',
    title: 'Deploy Versão 2.4.0 (Staging)',
    description: 'Realizar o deploy da nova versão no ambiente de staging.',
    assignedUserId: 'u2',
    requiredSkills: ['s6', 's2'],
    status: 'in_progress',
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    createdAt: new Date(Date.now() - 200000000).toISOString(),
  },
  {
    id: 't3',
    title: 'Pesquisa de Benchmark Competitivo',
    description: 'Analisar concorrentes diretos.',
    assignedUserId: 'u1',
    requiredSkills: ['s4'],
    status: 'pending',
    priority: 'low',
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 100000000).toISOString(),
  },
  {
    id: 't4',
    title: 'Definição de Personas do Projeto',
    description: 'Criar as personas baseadas nas entrevistas.',
    assignedUserId: 'u1',
    requiredSkills: ['s3', 's4'],
    status: 'completed',
    priority: 'medium',
    dueDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    rating: 9.8,
  },
  {
    id: 't5',
    title: 'Revisão de Código Backend',
    description: 'Revisar código do módulo de autenticação.',
    assignedUserId: 'u2',
    requiredSkills: ['s2'],
    status: 'completed',
    priority: 'high',
    dueDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    rating: 9.5,
  },
  {
    id: 't6',
    title: 'Criar Wireframes Mobile',
    description: 'Desenvolver wireframes para o app mobile.',
    assignedUserId: 'u3',
    requiredSkills: ['s3'],
    status: 'completed',
    priority: 'medium',
    dueDate: new Date(Date.now() - 86400000 * 7).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    rating: 10.0,
  },
  {
    id: 't7',
    title: 'API de Integração',
    description: 'Desenvolver API RESTful para integração.',
    assignedUserId: 'u4',
    requiredSkills: ['s2', 's5'],
    status: 'completed',
    priority: 'high',
    dueDate: new Date(Date.now() - 86400000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    rating: 8.7,
  },
];

export const initialTrainings: Training[] = [
  {
    id: 'tr1',
    title: 'Node.js Avançado',
    description: 'Curso completo de Node.js com padrões avançados',
    instructor: 'Ricardo Lima',
    date: new Date(Date.now() + 86400000).toISOString(),
    duration: 120,
    type: 'technical',
  },
  {
    id: 'tr2',
    title: 'Design Systems 101',
    description: 'Introdução a Design Systems e componentização',
    instructor: 'Mariana Costa',
    date: new Date(Date.now() + 86400000 * 5).toISOString(),
    duration: 90,
    type: 'workshop',
  },
  {
    id: 'tr3',
    title: 'Comunicação Assertiva',
    description: 'Técnicas de comunicação para líderes',
    instructor: 'Ana Silva',
    date: new Date(Date.now() + 86400000 * 10).toISOString(),
    duration: 60,
    type: 'soft',
  },
  {
    id: 'tr4',
    title: 'React Performance',
    description: 'Otimização de aplicações React',
    instructor: 'Lucas Peixoto',
    date: new Date(Date.now() + 86400000 * 15).toISOString(),
    duration: 90,
    type: 'technical',
  },
];
