'use client';

import { useState } from 'react';
import { X, Users, User, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { GoalScope, GoalCriteria } from '@/lib/types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoalModal({ isOpen, onClose }: GoalModalProps) {
  const { addGoal, users } = useAppStore();
  const [name, setName] = useState('');
  const [scope, setScope] = useState<GoalScope>('team');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [criteria, setCriteria] = useState<GoalCriteria>('points');
  const [targetValue, setTargetValue] = useState(50);

  if (!isOpen) return null;

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (selectedMembers.length === 0) return;
    
    const targetMemberId = scope === 'individual' ? selectedMembers[0] : undefined;
    
    addGoal({
      name: name.trim(),
      type: criteria === 'points' ? 'general' : criteria === 'complete_tasks' ? 'task' : 'skill',
      scope,
      targetMemberId,
      targetMembers: selectedMembers,
      criteria,
      targetValue,
    } as any);
    
    setName('');
    setScope('team');
    setSelectedMembers([]);
    setCriteria('points');
    setTargetValue(50);
    onClose();
  };

  const criteriaOptions: { value: GoalCriteria; label: string }[] = [
    { value: 'complete_tasks', label: 'Finalizar Tarefas' },
    { value: 'gain_skill', label: 'Conquistar Nova Habilidade (Especialista)' },
    { value: 'points', label: 'Pontuação Total' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
        
        <h2 className="text-2xl font-bold text-on-surface mb-6">Nova Meta</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Nome da Meta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Aumentar pontuação, Conquistar skill..."
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary focus:outline-none transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Tipo de Meta
            </label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${scope === 'team' ? 'border-primary bg-indigo-50 text-primary' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                <Users className="w-5 h-5" />
                <span className="font-medium">Equipe</span>
                <input
                  type="radio"
                  name="scope"
                  value="team"
                  checked={scope === 'team'}
                  onChange={() => { setScope('team'); setSelectedMembers([]); }}
                  className="sr-only"
                />
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${scope === 'individual' ? 'border-primary bg-indigo-50 text-primary' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                <User className="w-5 h-5" />
                <span className="font-medium">Individual</span>
                <input
                  type="radio"
                  name="scope"
                  value="individual"
                  checked={scope === 'individual'}
                  onChange={() => { setScope('individual'); setSelectedMembers([]); }}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              {scope === 'team' ? 'Selecionar Membros da Equipe' : 'Selecionar Membro'}
            </label>
            <div className="max-h-40 overflow-y-auto border-2 border-slate-200 rounded-xl p-2 space-y-1">
              {users.map(user => {
                const isSelected = selectedMembers.includes(user.id);
                const isDisabled = scope === 'individual' && selectedMembers.length > 0 && !isSelected;
                
                return (
                  <label
                    key={user.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'} ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => !isDisabled && toggleMember(user.id)}
                      disabled={isDisabled}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-slate-700">{user.name}</span>
                    <span className="text-xs text-slate-400">({user.role})</span>
                  </label>
                );
              })}
            </div>
            {selectedMembers.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Selecione pelo menos um membro</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Critérios
            </label>
            <div className="space-y-2">
              {criteriaOptions.map(option => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${criteria === option.value ? 'border-primary bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <input
                    type="radio"
                    name="criteria"
                    value={option.value}
                    checked={criteria === option.value}
                    onChange={() => setCriteria(option.value)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${criteria === option.value ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                    {criteria === option.value && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${criteria === option.value ? 'text-primary' : 'text-slate-600'}`}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Valor Alvo {criteria === 'points' ? '(pontos)' : '(% de progresso)'}
            </label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(Number(e.target.value))}
              min={1}
              max={criteria === 'points' ? 1000 : 100}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary focus:outline-none transition-colors"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Criar Meta
          </button>
        </form>
      </div>
    </div>
  );
}

export function calculateGoalProgress(
  goal: { criteria: GoalCriteria; targetMemberId?: string; targetMembers?: string[]; targetValue: number; scope: GoalScope },
  users: any[],
  tasks: any[],
  userSkills: any[],
  skills: any[]
): number {
  const { criteria, targetMemberId, targetMembers, targetValue, scope } = goal;
  
  const memberIds = scope === 'individual' && targetMemberId 
    ? [targetMemberId] 
    : (targetMembers || users.map(u => u.id));
  
  if (scope === 'individual' && targetMemberId) {
    const targetUser = users.find(u => u.id === targetMemberId);
    if (!targetUser) return 0;
    
    if (criteria === 'points') {
      return Math.min(Math.round((targetUser.points / targetValue) * 100), 100);
    }
    
    if (criteria === 'complete_tasks') {
      const userTasks = tasks.filter(t => t.assignedUserId === targetUser.id);
      const completedTasks = userTasks.filter(t => t.status === 'completed').length;
      return targetValue > 0 ? Math.min(Math.round((completedTasks / targetValue) * 100), 100) : 0;
    }
    
    if (criteria === 'gain_skill') {
      const userSkillSet = userSkills.filter(us => us.userId === targetUser.id && us.level === 'expert');
      return targetValue > 0 ? Math.min(Math.round((userSkillSet.length / targetValue) * 100), 100) : 0;
    }
  }
  
  if (scope === 'team' && targetMembers && targetMembers.length > 0) {
    if (criteria === 'points') {
      const teamPoints = users
        .filter(u => targetMembers.includes(u.id))
        .reduce((acc, u) => acc + (u.points || 0), 0);
      return targetValue > 0 ? Math.min(Math.round((teamPoints / targetValue) * 100), 100) : 0;
    }
    
    if (criteria === 'complete_tasks') {
      const completedTasks = tasks
        .filter(t => t.assignedUserId && targetMembers.includes(t.assignedUserId) && t.status === 'completed')
        .length;
      return targetValue > 0 ? Math.min(Math.round((completedTasks / targetValue) * 100), 100) : 0;
    }
    
    if (criteria === 'gain_skill') {
      const expertSkills = userSkills.filter(us => targetMembers.includes(us.userId) && us.level === 'expert');
      return targetValue > 0 ? Math.min(Math.round((expertSkills.length / targetValue) * 100), 100) : 0;
    }
  }
  
  return 0;
}
