'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { X, Sparkles } from 'lucide-react';
import { TaskPriority, TaskStatus } from '@/lib/types';
import { createTask } from '@/lib/firebase-tasks';

export function TaskModal({ isOpen, onClose, taskId }: { isOpen: boolean; onClose: () => void; taskId: string | null }) {
  const { tasks, users, skills, userSkills, updateTask } = useAppStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [assignedUserId, setAssignedUserId] = useState<string>('');

  useEffect(() => {
    if (taskId) {
      const t = tasks.find(x => x.id === taskId);
      if (t) {
        setTitle(t.title);
        setDescription(t.description);
        setPriority(t.priority);
        setDueDate(t.dueDate.split('T')[0]);
        setRequiredSkills(t.requiredSkills);
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

  // Smart Assignment Logic
  const suggestedUsers = users.map(u => {
    let score = 0;
    requiredSkills.forEach(skId => {
      const us = userSkills.find(x => x.userId === u.id && x.skillId === skId);
      if (us) {
        if (us.level === 'expert') score += 3;
        else if (us.level === 'competent') score += 2;
        else if (us.level === 'in_training') score += 1;
      }
    });
    return { user: u, score };
  }).filter(u => u.score > 0).sort((a, b) => b.score - a.score);

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
                    {suggestedUsers.map(({ user, score }) => (
                      <div 
                        key={user.id} 
                        onClick={() => setAssignedUserId(user.id)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${assignedUserId === user.id ? 'bg-white border-2 border-primary shadow-sm' : 'bg-white/50 border border-transparent hover:bg-white'}`}
                      >
                        <div className="flex items-center gap-3">
                          <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
                          <div>
                            <p className="text-sm font-bold text-on-surface">{user.name}</p>
                            <p className="text-[10px] text-slate-500">{user.role}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">Score: {score}</span>
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
