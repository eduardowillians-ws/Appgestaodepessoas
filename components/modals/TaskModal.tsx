'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { X, Sparkles } from 'lucide-react';
import { TaskPriority, TaskStatus, Skill, User, UserSkill } from '@/lib/types';
import { createTask } from '@/lib/firebase-tasks';
import { subscribeSkills, FirebaseSkill } from '@/lib/firebase-skills';
import { subscribeToUsers, FirebaseUser } from '@/lib/firebase-users';
import { subscribeUserSkills, FirebaseUserSkill } from '@/lib/firebase-user-skills';
import { subscribeToTasks } from '@/lib/firebase-tasks';

export function TaskModal({ isOpen, onClose, taskId }: { isOpen: boolean; onClose: () => void; taskId: string | null }) {
  const { updateTask } = useAppStore();
  
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [skills, setSkills] = useState<FirebaseSkill[]>([]);
  const [userSkills, setUserSkills] = useState<FirebaseUserSkill[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const router = useRouter();

  // Função segura para converter dueDate (Date ou string) para YYYY-MM-DD
  const formatDateForInput = (dateValue: any): string => {
    if (!dateValue) return '';
    let date: Date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (dateValue.toDate) {
      // Firebase Timestamp
      date = dateValue.toDate();
    } else {
      return '';
    }
    return date.toISOString().split('T')[0];
  };
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [assignedUserId, setAssignedUserId] = useState<string>('');

  useEffect(() => {
    const unsubUsers = subscribeToUsers(setUsers);
    const unsubSkills = subscribeSkills(setSkills);
    const unsubUserSkills = subscribeUserSkills(setUserSkills);
    const unsubTasks = subscribeToTasks(setTasks);
    return () => {
      unsubUsers();
      unsubSkills();
      unsubUserSkills();
      unsubTasks();
    };
  }, []);

  const calculateScore = (userId: string, requiredSkillIds: string[]) => {
    const LEVEL_SCORES: Record<string, number> = {
      not_trained: 0,
      in_training: 1,
      competent: 2,
      expert: 3
    };
    
    const LEVEL_LABELS: Record<string, string> = {
      not_trained: 'Não treinado',
      in_training: 'Em treinamento',
      competent: 'Competente',
      expert: 'Especialista'
    };

    const skillBreakdown: { skillId: string; skillName: string; level: string; points: number }[] = [];
    let skillScore = 0;
    
    requiredSkillIds.forEach(skillId => {
      const userSkill = userSkills.find(us => us.userId === userId && us.skillId === skillId);
      const skill = skills.find(s => s.id === skillId);
      if (userSkill) {
        const points = LEVEL_SCORES[userSkill.level] || 0;
        skillScore += points;
        skillBreakdown.push({
          skillId,
          skillName: skill?.name || skillId,
          level: LEVEL_LABELS[userSkill.level] || 'Não treinado',
          points
        });
      } else {
        skillBreakdown.push({
          skillId,
          skillName: skill?.name || skillId,
          level: 'Não treinado',
          points: 0
        });
      }
    });

    const openTasksCount = tasks.filter(t => 
      t.assignedUserId === userId && t.status !== 'completed'
    ).length;
    
    const workloadPenalty = openTasksCount * 0.5;
    const total = Math.max(0, skillScore - workloadPenalty);

    return {
      total,
      skillScore,
      workloadPenalty,
      openTasksCount,
      skillBreakdown
    };
  };

  const suggestedUsers = useMemo(() => {
    if (requiredSkills.length === 0) return [];
    
    return users
      .map(user => ({
        user,
        score: calculateScore(user.id, requiredSkills)
      }))
      .filter(item => item.score.total > 0)
      .sort((a, b) => b.score.total - a.score.total);
  }, [users, userSkills, requiredSkills, tasks, skills]);

  useEffect(() => {
    if (taskId) {
      const t = tasks.find(x => x.id === taskId);
      if (t) {
        setTitle(t.title);
        setDescription(t.description);
        setPriority(t.priority);
        setDueDate(formatDateForInput(t.dueDate));
        setRequiredSkills(t.requiredSkills || []);
        setAssignedUserId(t.assignedUserId || '');
      }
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(new Date().toISOString().split('T')[0]);
      setRequiredSkills([]);
      setAssignedUserId('');
    }
  }, [taskId, tasks]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log("SUBMIT TASK DISPARADO");
    e.preventDefault();
    try {
      const taskData = {
        title,
        description,
        priority,
        dueDate: new Date(dueDate + 'T12:00:00').toISOString(),
        requiredSkills,
        assignedUserId: assignedUserId || undefined,
      };

      console.log("DADOS TASK:", taskData);
      console.log("CHAMANDO CREATE TASK");

      if (taskId) {
        // edição - por agora mantém local
        updateTask(taskId, taskData);
      } else {
        // criação - Firebase
        const firebaseTaskData = {
          title: taskData.title,
          description: taskData.description,
          status: 'pending' as const,
          assignedUserId: taskData.assignedUserId || null,
          requiredSkills: taskData.requiredSkills,
          priority: taskData.priority as 'low' | 'medium' | 'high',
          dueDate: new Date(taskData.dueDate),
          createdAt: new Date(),
          completedAt: null,
          rating: null,
          archived: false,
          archivedAt: null
        };
        await createTask(firebaseTaskData);
      }
      console.log("TASK CRIADA COM SUCESSO");
      onClose();
    } catch (error) {
      console.error("ERRO AO CRIAR TASK", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-surface-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-on-surface">{taskId ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={(e) => { console.log("FORM TASK DISPARADO"); handleSubmit(e); }} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Título</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none h-24" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Prioridade</label>
                <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Data de Entrega</label>
                <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Habilidades Necessárias</label>
              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setRequiredSkills(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${requiredSkills.includes(s.id) ? 'bg-primary text-white' : 'bg-surface-low text-slate-600 border border-slate-200'}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {requiredSkills.length > 0 && (
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Sugestões de Atribuição (IA)</span>
                </div>
                {suggestedUsers.length > 0 ? (
                  <div className="space-y-2">
                    {(() => {
                      const bestUserScore = suggestedUsers[0]?.score;
                      const missingSkills = bestUserScore?.skillBreakdown.filter(s => s.points === 0) || [];
                      const hasAnyUserWithAllSkills = suggestedUsers.some(s => s.score.skillBreakdown.every(sb => sb.points > 0));
                      
                      const trainingSuggestions = missingSkills.map(ms => {
                        const inTrainingUsers = userSkills
                          .filter(us => us.skillId === ms.skillId && us.level === 'in_training')
                          .map(us => users.find(u => u.id === us.userId))
                          .filter(Boolean);
                        return {
                          skillName: ms.skillName,
                          candidates: inTrainingUsers as FirebaseUser[]
                        };
                      }).filter(ts => ts.candidates.length > 0);
                      
                      return (
                        <>
                          {missingSkills.length > 0 && !hasAnyUserWithAllSkills && (
                            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-2 rounded text-xs">
                              ⚠ Nenhum usuário possui todas as skills necessárias. Skills faltantes: {missingSkills.map(s => s.skillName).join(', ')}
                            </div>
                          )}
                          {trainingSuggestions.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-2 rounded text-xs space-y-1">
                              <p className="font-bold">💡 Sugestão de treinamento:</p>
                              {trainingSuggestions.map(ts => (
                                <p key={ts.skillName}>
                                  {ts.candidates.map(u => u?.name).join(', ')} {ts.candidates.length === 1 ? 'está' : 'estão'} em treinamento em {ts.skillName}
                                </p>
                              ))}
                            </div>
                          )}
                          {missingSkills.length > 0 && trainingSuggestions.length === 0 && (
                            <div className="space-y-2">
                              <div className="bg-red-50 border border-red-200 text-red-800 p-2 rounded text-xs">
                                Nenhum usuário está em treinamento nas skills faltantes. Considere criar um treinamento.
                              </div>
                              {missingSkills.map(ms => (
                                <button
                                  key={ms.skillName}
                                  onClick={() => router.push(`/trainings/new?skill=${encodeURIComponent(ms.skillName)}`)}
                                  className="w-full py-1.5 px-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors"
                                >
                                  + Criar treinamento para {ms.skillName}
                                </button>
                              ))}
                            </div>
                          )}
                          {!assignedUserId && suggestedUsers[0] && (
                            <button
                              onClick={() => setAssignedUserId(suggestedUsers[0].user.id)}
                              className="w-full py-2 px-3 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                              <Sparkles className="w-3 h-3" />
                              Atribuir automaticamente: {suggestedUsers[0].user.name} (score {suggestedUsers[0].score.total})
                            </button>
                          )}
                        </>
                      );
                    })()}
                    {suggestedUsers.map(({ user, score }) => (
                      <div 
                        key={user.id} 
                        onClick={() => setAssignedUserId(user.id)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${assignedUserId === user.id ? 'bg-white border-2 border-primary shadow-sm' : 'bg-white/50 border border-transparent hover:bg-white'}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
                            <div>
                              <p className="text-sm font-bold text-on-surface">{user.name}</p>
                              <p className="text-[10px] text-slate-500">{user.role}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-[10px] text-slate-500 space-y-0.5">
                            {score.skillBreakdown.map((sb) => (
                              <p key={sb.skillId} className="flex items-center gap-1">
                                <span className="font-medium">{sb.skillName}:</span>
                                <span className={sb.points > 0 ? 'text-green-600' : 'text-red-500'}>{sb.level}</span>
                                <span className={sb.points > 0 ? 'text-green-600' : 'text-red-500'}>({sb.points > 0 ? '+' : ''}{sb.points})</span>
                              </p>
                            ))}
                            {score.openTasksCount > 0 && (
                              <p className="text-orange-600">
                                Tarefas abertas: {score.openTasksCount} (-{score.workloadPenalty})
                              </p>
                            )}
                            <p className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block mt-1">
                              Score final: {score.total}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Nenhum membro possui as habilidades selecionadas.</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" onClick={() => console.log("BOTÃO TASK CLICADO")} className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-lg shadow-primary/20">
              {taskId ? 'Salvar Alterações' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
