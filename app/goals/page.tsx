'use client';

import { useState, useMemo, useEffect } from 'react';
import { Topbar } from '@/components/Topbar';
import { Trophy, Target, Plus, Medal, Zap } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { GoalModal, calculateGoalProgress } from '@/components/modals/GoalModal';

function XPBar({ currentXP, maxXP }: { currentXP: number; maxXP: number }) {
  const percentage = Math.min((currentXP / maxXP) * 100, 100);
  
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
        {currentXP}/{maxXP} XP
      </span>
    </div>
  );
}

export default function GoalsPage() {
  const { goals, tasks, skills, userSkills, users, addUserPoints, archiveGoal, unarchiveGoal, deleteGoal, updateGoal } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  useEffect(() => {
    const calculatePointsFromTasks = () => {
      const userPoints: Record<string, { completed: number; overdue: number; expertSkills: Set<string> }> = {};
      
      users.forEach(u => {
        userPoints[u.id] = { completed: 0, overdue: 0, expertSkills: new Set() };
      });
      
      tasks.forEach(t => {
        if (t.assignedUserId && userPoints[t.assignedUserId]) {
          if (t.status === 'completed') {
            userPoints[t.assignedUserId].completed++;
          } else if (t.status === 'overdue') {
            userPoints[t.assignedUserId].overdue++;
          }
        }
      });
      
      userSkills.forEach(us => {
        if (us.userId && us.level === 'expert' && userPoints[us.userId]) {
          userPoints[us.userId].expertSkills.add(us.skillId);
        }
      });
      
      users.forEach(u => {
        const expectedPoints = 
          (userPoints[u.id].completed * 1.0) +
          (userPoints[u.id].overdue * -0.5) +
          (userPoints[u.id].expertSkills.size * 5.0);
        
        if (Math.abs((u.points || 0) - expectedPoints) > 0.5) {
          console.log(`[Sync] ${u.name}: ${u.points} pts (expected: ${expectedPoints})`);
        }
      });
    };
    
    calculatePointsFromTasks();
  }, [tasks, userSkills, users]);

  const goalsWithProgress = useMemo(() => {
    return goals
      .filter(g => showArchived ? g.archived : !g.archived)
      .map(goal => ({
        ...goal,
        progress: goal.archived && goal.archivedProgress !== undefined 
          ? goal.archivedProgress 
          : calculateGoalProgress(
            { 
              criteria: goal.criteria, 
              targetMemberId: goal.targetMemberId, 
              targetMembers: goal.targetMembers,
              targetValue: goal.targetValue, 
              scope: goal.scope 
            },
        users, 
        tasks, 
        userSkills, 
        skills
      )
    }));
  }, [goals, users, tasks, userSkills, skills, showArchived]);

  const leaderboard = useMemo(() => {
    return [...users]
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));
  }, [users]);

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'text-amber-400';
    if (rank === 2) return 'text-slate-400';
    if (rank === 3) return 'text-orange-400';
    return 'text-slate-300';
  };

  const getMedalBg = (rank: number) => {
    if (rank === 1) return 'bg-amber-50 border-amber-200';
    if (rank === 2) return 'bg-slate-50 border-slate-200';
    if (rank === 3) return 'bg-orange-50 border-orange-200';
    return 'bg-white border-slate-100';
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getGoalMembers = (goal: any) => {
    if (goal.scope === 'individual' && goal.targetMemberId) {
      return users.filter(u => u.id === goal.targetMemberId);
    }
    if (goal.targetMembers) {
      return users.filter(u => goal.targetMembers.includes(u.id));
    }
    return [];
  };

  return (
    <>
      <GoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <Topbar title="Metas e Gamificação" />
      <main className="pt-24 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Metas da Equipe</h2>
            <p className="text-slate-500 text-sm">Acompanhe os objetivos e a evolução da equipe Nexus.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            <Plus className="w-5 h-5" />
            Nova Meta
          </button>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-lowest p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Target className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface">Objetivos da Equipe Nexus</h3>
                </div>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    showArchived ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>📁</span>
                  {showArchived ? 'Ocultar' : `Arquivadas (${goals.filter(g => g.archived).length})`}
                </button>
              </div>
              
              {goalsWithProgress.length > 0 ? (
                <div className="space-y-6">
                  {goalsWithProgress.map((goal) => {
                    const goalMembers = getGoalMembers(goal);
                    return (
                      <div key={goal.id} className={`p-4 rounded-xl border ${goal.archived ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-100'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2 flex-wrap flex-1">
                            <span className={`text-sm font-bold text-on-surface ${goal.archived ? 'line-through text-slate-400' : ''}`}>{goal.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${goal.scope === 'team' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              {goal.scope === 'team' ? 'Equipe' : 'Individual'}
                            </span>
                            {goal.archived && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                Arquivada
                              </span>
                            )}
                            {goalMembers.length > 0 && (
                              <div className="flex -space-x-2">
                                {goalMembers.slice(0, 4).map(member => (
                                  <img 
                                    key={member.id}
                                    src={member.avatar}
                                    alt={member.name}
                                    title={member.name}
                                    className="w-6 h-6 rounded-full border-2 border-white"
                                  />
                                ))}
                                {goalMembers.length > 4 && (
                                  <span className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-600">
                                    +{goalMembers.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {goal.archived ? (
                              <button
                                onClick={() => unarchiveGoal(goal.id)}
                                className="text-[10px] px-2 py-1 rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                              >
                                📂 Desarquivar
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => archiveGoal(goal.id, goal.progress)}
                                  className="text-[10px] px-2 py-1 rounded bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                                >
                                  📁 Arquivar
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(goal.id)}
                                  className="text-[10px] px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                            <span className="text-sm font-black text-indigo-600">{goal.progress}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-500" 
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400">Nenhuma meta cadastrada</p>
                  <p className="text-slate-300 text-sm">Clique em &quot;Nova Meta&quot; para começar</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Sistema de Pontos</h3>
                </div>
                <p className="text-amber-50 text-xs mb-4">Ganhe pontos completando tarefas e evoluindo habilidades.</p>
                
                <ul className="space-y-2">
                  <li className="flex items-center justify-between bg-white/20 backdrop-blur-md p-2 rounded-lg">
                    <span className="text-xs font-medium">Tarefa Concluída</span>
                    <span className="text-xs font-black bg-white text-amber-600 px-2 py-0.5 rounded">+1.0</span>
                  </li>
                  <li className="flex items-center justify-between bg-white/20 backdrop-blur-md p-2 rounded-lg">
                    <span className="text-xs font-medium">Tarefa Atrasada</span>
                    <span className="text-xs font-black bg-error text-white px-2 py-0.5 rounded">-0.5</span>
                  </li>
                  <li className="flex items-center justify-between bg-white/20 backdrop-blur-md p-2 rounded-lg">
                    <span className="text-xs font-medium">Virar Especialista</span>
                    <span className="text-xs font-black bg-white text-amber-600 px-2 py-0.5 rounded">+5.0</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-surface-lowest p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <Medal className="w-6 h-6 text-amber-500" />
                <h3 className="text-lg font-bold text-on-surface">Leaderboard</h3>
              </div>
              
              <div className="space-y-3">
                {leaderboard.map((user) => (
                  <div 
                    key={user.id} 
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${getMedalBg(user.rank)}`}
                  >
                    <span className={`text-lg font-black w-8 text-center ${getMedalColor(user.rank)}`}>
                      {getMedalIcon(user.rank)}
                    </span>
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-on-surface truncate">{user.name}</p>
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                          <Zap className="w-3 h-3" />
                          Nv. {user.level || 1}
                        </span>
                      </div>
                      <XPBar 
                        currentXP={user.xpToNextLevel || 0} 
                        maxXP={100 * (user.level || 1)}
                      />
                    </div>
                    <span className={`text-lg font-black ${user.rank === 1 ? 'text-amber-500' : user.rank === 2 ? 'text-slate-400' : user.rank === 3 ? 'text-orange-400' : 'text-slate-600'}`}>
                      {user.points || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-on-surface mb-2">Confirmar Exclusão</h3>
            <p className="text-slate-500 text-sm mb-6">Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { deleteGoal(deleteConfirmId); setDeleteConfirmId(null); }}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
