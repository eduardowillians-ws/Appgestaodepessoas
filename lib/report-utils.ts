'use client';

export interface ReportData {
  generatedAt: string;
  dateRange: { start: string; end: string };
  members: Array<{
    id: string;
    name: string;
    role: string;
    points: number;
    level: number;
    tasksCompleted: number;
    skillsAsExpert: number;
  }>;
  tasks: {
    total: number;
    completed: number;
    archived: number;
    overdue: number;
    byPeriod: Array<{
      id: string;
      title: string;
      status: string;
      completedAt?: string;
      archivedAt?: string;
      assignedUser?: string;
    }>;
  };
  goals: {
    team: Array<{
      id: string;
      name: string;
      progress: number;
      archived: boolean;
      members: string[];
    }>;
    individual: Array<{
      id: string;
      name: string;
      progress: number;
      archived: boolean;
      memberId: string;
      memberName: string;
    }>;
  };
  skills: Array<{
    id: string;
    name: string;
    category: string;
    expertsCount: number;
    totalTrained: number;
  }>;
  metrics: {
    completionRate: number;
    delayRate: number;
    avgScore: number;
    totalPoints: number;
  };
}

export function getReportData(
  users: any[],
  tasks: any[],
  goals: any[],
  skills: any[],
  userSkills: any[],
  dateRange: { start: string; end: string },
  includeArchived: boolean
): ReportData {
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  endDate.setHours(23, 59, 59, 999);

  const filteredTasks = tasks.filter(t => {
    const createdAt = new Date(t.createdAt);
    return createdAt >= startDate && createdAt <= endDate;
  });

  const filteredArchivedTasks = includeArchived 
    ? filteredTasks.filter(t => t.archived)
    : [];

  const completedTasksInPeriod = filteredTasks.filter(t => {
    if (t.status !== 'completed' || !t.completedAt) return false;
    const completedAt = new Date(t.completedAt);
    return completedAt >= startDate && completedAt <= endDate;
  });

  const overdueTasks = filteredTasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    return dueDate < new Date() && t.status !== 'completed';
  });

  const membersData = users.map(user => {
    const userTasks = completedTasksInPeriod.filter(t => t.assignedUserId === user.id);
    const expertSkills = userSkills.filter(us => us.userId === user.id && us.level === 'expert');
    
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      points: user.points || 0,
      level: user.level || 1,
      tasksCompleted: userTasks.length,
      skillsAsExpert: expertSkills.length,
    };
  });

  const teamGoals = goals.filter(g => g.scope === 'team' && (!includeArchived || g.archived !== false));
  const individualGoals = goals.filter(g => g.scope === 'individual' && (!includeArchived || g.archived !== false));

  const skillsData = skills.map(skill => {
    const skillUsers = userSkills.filter(us => us.skillId === skill.id);
    const experts = skillUsers.filter(us => us.level === 'expert').length;
    const trained = skillUsers.filter(us => us.level !== 'not_trained').length;
    
    return {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      expertsCount: experts,
      totalTrained: trained,
    };
  }).sort((a, b) => b.expertsCount - a.expertsCount);

  const totalTasks = filteredTasks.length;
  const completedCount = completedTasksInPeriod.length;
  const totalPoints = membersData.reduce((acc, m) => acc + m.points, 0);
  const avgScore = membersData.length > 0 
    ? membersData.reduce((acc, m) => acc + (m.points / (m.level * 10)) * 10, 0) / membersData.length 
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    dateRange,
    members: membersData,
    tasks: {
      total: totalTasks,
      completed: completedCount,
      archived: filteredArchivedTasks.length,
      overdue: overdueTasks.length,
      byPeriod: completedTasksInPeriod.map(t => {
        const assignedUser = users.find(u => u.id === t.assignedUserId);
        return {
          id: t.id,
          title: t.title,
          status: t.status,
          completedAt: t.completedAt,
          archivedAt: t.archivedAt,
          assignedUser: assignedUser?.name,
        };
      }),
    },
    goals: {
      team: teamGoals.map(g => ({
        id: g.id,
        name: g.name,
        progress: g.archivedProgress || 0,
        archived: g.archived || false,
        members: g.targetMembers || [],
      })),
      individual: individualGoals.map(g => {
        const member = users.find(u => u.id === g.targetMemberId);
        return {
          id: g.id,
          name: g.name,
          progress: g.archivedProgress || 0,
          archived: g.archived || false,
          memberId: g.targetMemberId || '',
          memberName: member?.name || '',
        };
      }),
    },
    skills: skillsData,
    metrics: {
      completionRate: totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0,
      delayRate: totalTasks > 0 ? Math.round((overdueTasks.length / totalTasks) * 100) : 0,
      avgScore: Math.round(avgScore * 10) / 10,
      totalPoints,
    },
  };
}

export function getPdfReportData(
  users: any[],
  tasks: any[],
  goals: any[],
  dateRange: { start: string; end: string },
  userSkills?: any[],
  skills?: any[]
) {
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  endDate.setHours(23, 59, 59, 999);

  const periodTasks = tasks.filter(t => {
    const createdAt = new Date(t.createdAt);
    return createdAt >= startDate && createdAt <= endDate;
  });

  const completedInPeriod = periodTasks.filter(t => t.status === 'completed');
  const inProgressInPeriod = periodTasks.filter(t => t.status === 'in_progress');
  const overdueInPeriod = periodTasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    return dueDate < new Date() && t.status !== 'completed';
  });

  const members = users.map(user => {
    const userCompleted = completedInPeriod.filter(t => t.assignedUserId === user.id).length;
    const userOverdue = overdueInPeriod.filter(t => t.assignedUserId === user.id).length;
    const userLevel = user.level || 1;
    const userSkillsData = userSkills?.filter((us: any) => us.userId === user.id) || [];
    const skillProficiencies = skills?.map((skill: any) => {
      const userSkill = userSkillsData.find((us: any) => us.skillId === skill.id);
      return {
        name: skill.name,
        level: userSkill?.level || 'not_trained'
      };
    }) || [];
    
    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      points: user.points || 0,
      level: userLevel,
      completed: userCompleted,
      delayed: userOverdue,
      skillsCount: userSkillsData.length,
      skillProficiencies,
    };
  }).sort((a, b) => b.points - a.points);

  const topPerformer = members.length > 0 ? members[0] : null;
  const topPerformerTasks = topPerformer ? completedInPeriod.filter(t => t.assignedUserId === topPerformer.id).length : 0;

  const individualGoals = goals
    .filter(g => g.scope === 'individual')
    .map(g => {
      const member = users.find(u => u.id === g.targetMemberId);
      return {
        memberName: member?.name || 'Membro',
        title: g.name,
        progress: g.archivedProgress || 0,
      };
    });

  const periodLabel = `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  
  const totalTasks = periodTasks.length;
  const completedCount = completedInPeriod.length;
  const inProgressCount = inProgressInPeriod.length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const inProgressRate = totalTasks > 0 ? Math.round((inProgressCount / totalTasks) * 100) : 0;
  const totalXP = members.reduce((acc, m) => acc + m.points, 0);
  const averageScore = members.length > 0 
    ? Math.round((members.reduce((acc, m) => acc + (m.points / 10), 0) / members.length) * 10) / 10 
    : 0;

  const skillsMatrix = skills?.map((skill: any) => {
    const skillUsers = userSkills?.filter((us: any) => us.skillId === skill.id) || [];
    const experts = skillUsers.filter((us: any) => us.level === 'expert').length;
    const training = skillUsers.filter((us: any) => us.level === 'trained').length;
    const total = skillUsers.length;
    return {
      name: skill.name,
      category: skill.category,
      experts,
      training,
      total,
      proficiency: total > 0 ? Math.round((experts / total) * 100) : 0
    };
  }).sort((a: any, b: any) => b.total - a.total) || [];

  const aiInsights = {
    topPerformer: topPerformer ? `${topPerformer.name} é o destaque produtivo do período com ${topPerformerTasks} tarefas concluídas!` : 'Nenhum dado disponível',
    efficiency: completionRate >= 90 ? `Eficiência da equipe em ${completionRate}% - Excelente performance!` : completionRate >= 70 ? `Eficiência da equipe em ${completionRate}% - Boa performance, mas há espaço para melhoria.` : `Eficiência da equipe em ${completionRate}% - Atenção needed.`,
    skillInsight: skillsMatrix.length > 0 ? `A skill ${skillsMatrix[0].name} possui ${skillsMatrix[0].experts} especialista${skillsMatrix[0].experts !== 1 ? 's' : ''} e ${skillsMatrix[0].training} em treinamento.` : 'Nenhuma skill registrada.'
  };

  const analysisNotes = [
    completionRate >= 90 ? `Alto índice de conclusão (${completionRate}%) indica maturidade da equipe.` : `Índice de conclusão de ${completionRate}% - Recomenda-se revisar processos.`,
    inProgressCount > 0 ? `${inProgressCount} tarefa${inProgressCount !== 1 ? 's' : ''} em andamento requer${inProgressCount === 1 ? '' : 'm'} acompanhamento.` : 'Todas as tarefas foram finalizadas ou estão pendentes.',
    topPerformer ? `${topPerformer.name} lidera o ranking com ${topPerformer.points} XP -值得 reconhecimento.` : 'Sem dados de performance disponíveis.'
  ];

  return {
    period: periodLabel,
    dateRange: {
      start: startDate.toLocaleDateString('pt-BR'),
      end: endDate.toLocaleDateString('pt-BR')
    },
    completionRate,
    inProgressRate,
    totalXP,
    averageScore,
    members,
    individualGoals,
    skillsMatrix,
    taskStatus: {
      completed: completedCount,
      inProgress: inProgressCount,
      overdue: overdueInPeriod.length,
      total: totalTasks
    },
    aiInsights,
    analysisNotes
  };
}