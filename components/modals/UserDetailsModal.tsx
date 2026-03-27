'use client';

import { useMemo } from 'react';
import { X, Star, BookOpen, CheckSquare, User } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserDetailsModalProps {
  userId: string;
  onClose: () => void;
}

export function UserDetailsModal({ userId, onClose }: UserDetailsModalProps) {
  const { users, skills, userSkills, tasks } = useAppStore();

  const user = useMemo(() => users.find(u => u.id === userId), [users, userId]);
  const userTaskHistory = useMemo(() => {
    return tasks
      .filter(t => t.assignedUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [tasks, userId]);

  const userSkillsList = useMemo(() => {
    return userSkills
      .filter(us => us.userId === userId)
      .map(us => ({
        ...us,
        skill: skills.find(s => s.id === us.skillId)
      }))
      .filter(us => us.skill);
  }, [userSkills, skills, userId]);

  const calculatedScore = useMemo(() => {
    if (userTaskHistory.length === 0) return user?.performanceScore || 0;
    
    const completedTasks = userTaskHistory.filter(t => t.status === 'completed');
    if (completedTasks.length === 0) return user?.performanceScore || 0;
    
    return user?.performanceScore || 0;
  }, [userTaskHistory, user]);

  if (!user) return null;

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      not_trained: 'Não Treinado',
      in_training: 'Em Treinamento',
      competent: 'Competente',
      expert: 'Especialista'
    };
    return labels[level] || level;
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      not_trained: 'bg-slate-100 text-slate-500',
      in_training: 'bg-amber-100 text-amber-600',
      competent: 'bg-blue-100 text-blue-600',
      expert: 'bg-emerald-100 text-emerald-600'
    };
    return colors[level] || 'bg-slate-100 text-slate-500';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      overdue: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      completed: 'Concluída',
      overdue: 'Atrasada'
    };
    return labels[status] || status;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-surface-lowest rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        <div className="bg-gradient-to-br from-primary to-purple-600 p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white/30"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`;
                }}
              />
              <span className={`absolute bottom-1 right-1 w-4 h-4 border-2 border-white rounded-full ${
                user.status === 'active' ? 'bg-emerald-400' : user.status === 'busy' ? 'bg-amber-400' : 'bg-slate-400'
              }`} />
            </div>
            <div>
              <h2 className="text-2xl font-black mb-1">{user.name}</h2>
              <p className="text-indigo-100 text-sm font-medium">{user.role}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  user.status === 'active' ? 'bg-emerald-500/20 text-emerald-100' :
                  user.status === 'busy' ? 'bg-amber-500/20 text-amber-100' :
                  'bg-slate-500/20 text-slate-200'
                }`}>
                  {user.status === 'active' ? 'Ativo' : user.status === 'busy' ? 'Ocupado' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Star className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold text-indigo-100 uppercase">Score</span>
              </div>
              <p className="text-3xl font-black">{calculatedScore.toFixed(1)}</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckSquare className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-bold text-indigo-100 uppercase">Tarefas</span>
              </div>
              <p className="text-3xl font-black">{userTaskHistory.length}</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-blue-300" />
                <span className="text-xs font-bold text-indigo-100 uppercase">Skills</span>
              </div>
              <p className="text-3xl font-black">{userSkillsList.length}</p>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[calc(90vh-280px)] overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Habilidades
            </h3>
            {userSkillsList.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma habilidade registrada</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userSkillsList.map(us => (
                  <span 
                    key={us.id}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getLevelColor(us.level)}`}
                  >
                    {us.skill?.name} - {getLevelLabel(us.level)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Histórico de Tarefas Recentes
            </h3>
            {userTaskHistory.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma tarefa encontrada</p>
            ) : (
              <div className="space-y-3">
                {userTaskHistory.map(task => (
                  <div 
                    key={task.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-bold text-on-surface">{task.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Prazo: {format(parseISO(task.dueDate), "d 'de' MMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}