'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Topbar } from '@/components/Topbar';
import { useAppStore } from '@/lib/store';
import { getPdfReportData } from '@/lib/report-utils';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Users, 
  Award,
  ChevronRight,
  Filter,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import dynamic from 'next/dynamic';

const PDFDownloadButton = dynamic(
  () => import('@/components/reports/NexusReport').then((mod) => mod.PDFDownloadButton),
  { ssr: false }
);

interface TeamGroup {
  name: string;
  memberIds: string[];
}

const TEAMS: TeamGroup[] = [
  { name: 'Todos', memberIds: [] },
  { name: 'Tech', memberIds: ['u2', 'u4'] },
  { name: 'Design', memberIds: ['u3'] },
  { name: 'Gestão', memberIds: ['u1'] },
];

export default function ReportsPage() {
  const { users, tasks, skills, userSkills, goals } = useAppStore();
  
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('Todos');
  const [selectedCollaborator, setSelectedCollaborator] = useState<string>('');
  const [includeArchived, setIncludeArchived] = useState(false);

  // Função segura para converter qualquer valor de data para Date
  const safeToDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') return new Date(dateValue);
    if (dateValue.toDate) return dateValue.toDate(); // Firebase Timestamp
    return new Date();
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const [dateRange, setDateRange] = useState({
    start: thirtyDaysAgo.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0],
  });

  const availableCollaborators = useMemo(() => {
    if (selectedTeam === 'Todos') return users;
    const team = TEAMS.find(t => t.name === selectedTeam);
    if (!team) return users;
    return users.filter(u => team.memberIds.includes(u.id));
  }, [users, selectedTeam]);

  const filteredMemberIds = useMemo(() => {
    if (selectedCollaborator) return [selectedCollaborator];
    if (selectedTeam === 'Todos') return users.map(u => u.id);
    const team = TEAMS.find(t => t.name === selectedTeam);
    return team?.memberIds || users.map(u => u.id);
  }, [selectedTeam, selectedCollaborator, users]);

  const filteredTasksByDate = useMemo(() => {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);
    
    return tasks.filter(t => {
      const createdAt = new Date(t.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });
  }, [tasks, dateRange]);

  const allTasks = useMemo(() => {
    const filtered = includeArchived ? filteredTasksByDate : filteredTasksByDate.filter(t => !t.archived);
    return filtered.filter(t => 
      t.assignedUserId && filteredMemberIds.includes(t.assignedUserId)
    );
  }, [filteredTasksByDate, includeArchived, filteredMemberIds]);

  const completionRate = useMemo(() => {
    const total = allTasks.length;
    if (total === 0) return 0;
    const completed = allTasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / total) * 100);
  }, [allTasks]);

  const delayRate = useMemo(() => {
    const total = allTasks.length;
    if (total === 0) return 0;
    const now = new Date();
    const overdue = allTasks.filter(t => {
      const dueDate = safeToDate(t.dueDate);
      return dueDate < now && t.status !== 'completed';
    }).length;
    return Math.round((overdue / total) * 100);
  }, [allTasks, filteredMemberIds]);

  const avgScore = useMemo(() => {
    const activeUsers = users.filter(u => filteredMemberIds.includes(u.id));
    if (activeUsers.length === 0) return 'N/A';
    const total = activeUsers.reduce((acc, u) => acc + u.performanceScore, 0);
    return (total / activeUsers.length).toFixed(1);
  }, [users, filteredMemberIds]);

  const userProductivity = useMemo(() => {
    return users
      .filter(u => filteredMemberIds.includes(u.id))
      .map(user => {
        const completedTasks = filteredTasksByDate.filter(
          t => t.assignedUserId === user.id && t.status === 'completed' && (t as any).rating !== undefined
        );
        
        if (completedTasks.length === 0) {
          return { user, rating: 'N/A' };
        }
        
        const totalRating = completedTasks.reduce((acc, t) => acc + ((t as any).rating || 0), 0);
        const avgRating = totalRating / completedTasks.length;
        
        return { user, rating: avgRating.toFixed(1), taskCount: completedTasks.length };
      })
      .sort((a, b) => {
        if (a.rating === 'N/A') return 1;
        if (b.rating === 'N/A') return -1;
        return parseFloat(b.rating) - parseFloat(a.rating);
      });
  }, [users, filteredTasksByDate, filteredMemberIds]);

  const reportData = useMemo(() => getPdfReportData(
    users,
    tasks,
    goals,
    dateRange,
    userSkills,
    skills
  ), [users, tasks, goals, dateRange, userSkills, skills]);

  const skillStats = useMemo(() => {
    const activeUserSkills = userSkills.filter(us => 
      filteredMemberIds.includes(us.userId) && us.level !== 'not_trained'
    );
    
    return skills.map(skill => {
      const skillUsers = activeUserSkills.filter(us => us.skillId === skill.id);
      const experts = skillUsers.filter(us => us.level === 'expert').length;
      const total = skillUsers.length;
      
      if (total === 0) return null;
      
      return {
        skill,
        experts,
        total,
        percentage: Math.round((total / filteredMemberIds.length) * 100)
      };
    }).filter(Boolean);
  }, [skills, userSkills, filteredMemberIds]);

  const scoreEvolutionData = useMemo(() => {
    const months = [];
    const now = new Date();
    const activeUsers = users.filter(u => filteredMemberIds.includes(u.id));
    const baseScore = activeUsers.length > 0 
      ? activeUsers.reduce((acc, u) => acc + u.performanceScore, 0) / activeUsers.length 
      : 0;
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const score = activeUsers.length > 0 
        ? Math.min(10, Math.max(0, baseScore - (i * 0.15) + 0.3))
        : 0;
      
      months.push({
        month: monthName,
        score: parseFloat(score.toFixed(1))
      });
    }
    
    return months;
  }, [users, filteredMemberIds]);

  const isEmpty = filteredMemberIds.length === 0;

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Topbar title="Relatórios" />
      <main className="pt-24 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        
        <section className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Relatórios e Analytics</h2>
              <p className="text-slate-500 text-sm">Analise o desempenho individual e coletivo da sua equipe.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 p-4 bg-surface-lowest rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtros:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 focus:border-primary focus:outline-none"
              />
              <span className="text-slate-400">até</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 focus:border-primary focus:outline-none"
              />
            </div>
            
            <select
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value);
                setSelectedCollaborator('');
              }}
              className="px-4 py-2 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 focus:border-primary focus:outline-none transition-colors cursor-pointer"
            >
              {TEAMS.map(team => (
                <option key={team.name} value={team.name}>
                  {team.name === 'Todos' ? 'Todas as Equipes' : `Equipe ${team.name}`}
                </option>
              ))}
            </select>

            <select
              value={selectedCollaborator}
              onChange={(e) => setSelectedCollaborator(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 focus:border-primary focus:outline-none transition-colors cursor-pointer min-w-[200px]"
            >
              <option value="">Todos os Colaboradores</option>
              {availableCollaborators && availableCollaborators.length > 0 && availableCollaborators.map((user: any) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-slate-700">Incluir Arquivadas</span>
            </label>

            {reportData && reportData.members?.length > 0 && (
              <div style={{ cursor: 'pointer' }} className="cursor-pointer">
                <PDFDownloadButton data={reportData} />
              </div>
            )}
          </div>
        </section>

        {isEmpty ? (
          <div className="bg-surface-lowest py-24 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Users className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-600">Nenhum membro encontrado</h3>
            <p className="text-slate-400 max-w-xs mt-3">Selecione uma equipe ou colaborador para visualizar os indicadores.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard 
                icon={Target} 
                label="Taxa de Conclusão" 
                value={`${completionRate}%`} 
                subValue={`${tasks.filter(t => filteredMemberIds.includes(t.assignedUserId || '')).filter(t => t.status === 'completed').length} de ${tasks.filter(t => filteredMemberIds.includes(t.assignedUserId || '')).length} tarefas`}
                color="indigo"
              />
              <MetricCard 
                icon={Clock} 
                label="Taxa de Atraso" 
                value={`${delayRate}%`} 
                subValue="Tarefas vencidas não concluídas"
                color="red"
              />
              <MetricCard 
                icon={TrendingUp} 
                label="Score Médio" 
                value={avgScore} 
                subValue="Baseado em performance"
                color="emerald"
              />
            </div>

            <div className="bg-surface-lowest p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Evolução do Score Médio
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
                  Últimos 6 meses
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreEvolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748b" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 10]}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value) => [Number(value ?? 0).toFixed(1), 'Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      dot={{ fill: '#6366f1', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, fill: '#6366f1' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-surface-lowest p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    Produtividade por Usuário
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
                    Média de Ratings
                  </span>
                </div>
                <div className="space-y-4">
                  {userProductivity.map(({ user, rating, taskCount }) => (
                    <div 
                      key={user.id} 
                      className="group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 bg-indigo-50 border-2 border-primary/20 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md transition-transform group-hover:scale-110" 
                        />
                        <div>
                          <p className="text-sm font-bold text-on-surface">{user.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-medium">
                              {taskCount !== undefined ? `${taskCount} tarefas concluídas` : 'Nenhuma tarefa com rating'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-primary">
                          {rating}
                        </span>
                        {rating !== 'N/A' && (
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[8px] font-black text-primary uppercase tracking-tighter">Média</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-lowest p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-on-surface">Utilização de Habilidades</h3>
                  <div className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
                    Matriz de Competências
                  </div>
                </div>
                <div className="space-y-6">
                  {skillStats.map((stat: any) => (
                    <div key={stat.skill.id} className="group flex flex-col gap-2">
                      <div className="flex justify-between items-end px-1">
                        <div>
                          <span className="text-sm font-bold text-on-surface block group-hover:text-primary transition-colors">
                            {stat.skill.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            {stat.experts} especialista{stat.experts !== 1 ? 's' : ''} • {stat.total} Total
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-primary">{stat.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-700 ease-out relative" 
                          style={{ width: `${stat.percentage}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {skillStats.length === 0 && (
                    <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                      <p className="text-sm text-slate-400 italic">Nenhuma habilidade registrada para o grupo selecionado.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function MetricCard({ icon: Icon, label, value, subValue, color }: { 
  icon: any, 
  label: string, 
  value: string | number, 
  subValue: string,
  color: 'indigo' | 'red' | 'emerald' | 'purple'
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    red: "bg-red-50 text-red-600 border-red-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100"
  };

  return (
    <div className="bg-surface-lowest p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border", colors[color])}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
          <p className="text-3xl font-black text-on-surface leading-none">{value}</p>
          <p className="text-[10px] text-slate-500 font-semibold mt-2 flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            {subValue}
          </p>
        </div>
      </div>
    </div>
  );
}