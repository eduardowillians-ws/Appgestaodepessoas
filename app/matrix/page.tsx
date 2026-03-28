'use client';

import { useState, useMemo, useEffect } from 'react';
import { Topbar } from '@/components/Topbar';
import { Sparkles, Filter, Plus, CheckCircle2, Award, TrendingUp, XCircle, X, BrainCircuit, Users, Star } from 'lucide-react';
import { SkillLevel, UserSkill, User, Skill } from '@/lib/types';
import { subscribeToUsers, FirebaseUser } from '@/lib/firebase-users';
import { subscribeSkills, FirebaseSkill, createSkill } from '@/lib/firebase-skills';
import { subscribeUserSkills, FirebaseUserSkill, updateFirebaseUserSkill } from '@/lib/firebase-user-skills';

const LEVEL_WEIGHTS: Record<SkillLevel, number> = { not_trained: 0, in_training: 1, competent: 2, expert: 3 };

const LEVEL_CONFIG: Record<SkillLevel, { label: string; color: string; icon: any }> = {
  expert: { label: 'Especialista', color: 'bg-green-500 text-white', icon: Star },
  competent: { label: 'Competente', color: 'bg-blue-500 text-white', icon: CheckCircle2 },
  in_training: { label: 'Treinando', color: 'bg-yellow-400 text-yellow-900', icon: TrendingUp },
  not_trained: { label: 'N/A', color: 'bg-slate-100 text-slate-400 border border-dashed border-slate-300', icon: XCircle },
};

const calculateTeamHealth = (userSkills: FirebaseUserSkill[], users: FirebaseUser[], skills: FirebaseSkill[]) => {
  if (users.length === 0 || skills.length === 0) return 0;
  const totalCells = users.length * skills.length;
  const maxPoints = totalCells * 3;
  const currentPoints = userSkills.reduce((acc, us) => acc + (LEVEL_WEIGHTS[us.level] || 0), 0);
  return Math.round((currentPoints / maxPoints) * 100);
};

const getAtRiskSkills = (userSkills: FirebaseUserSkill[], skills: FirebaseSkill[]) => {
  return skills.filter(skill => {
    const skillUsers = userSkills.filter(us => us.skillId === skill.id);
    const expertCount = skillUsers.filter(us => us.level === 'expert').length;
    const competentCount = skillUsers.filter(us => us.level === 'competent').length;
    return expertCount < 1 && competentCount < 2;
  });
};

export default function MatrixPage() {
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [skills, setSkills] = useState<FirebaseSkill[]>([]);
  const [userSkills, setUserSkills] = useState<FirebaseUserSkill[]>([]);
  
  const [filterCategory, setFilterCategory] = useState('Todas as Skills');
  const [searchSkill, setSearchSkill] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [showInsights, setShowInsights] = useState(true);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [newSkillDescription, setNewSkillDescription] = useState('');
  const [newSkillPoints, setNewSkillPoints] = useState<number | ''>('');

  useEffect(() => {
    const unsubUsers = subscribeToUsers(setUsers);
    const unsubSkills = subscribeSkills(setSkills);
    const unsubUserSkills = subscribeUserSkills(setUserSkills);
    return () => {
      unsubUsers();
      unsubSkills();
      unsubUserSkills();
    };
  }, []);

  const levelMap = useMemo(() => {
    const map: Record<string, Record<string, SkillLevel>> = {};
    userSkills.forEach(us => {
      if (!map[us.userId]) map[us.userId] = {};
      map[us.userId][us.skillId] = us.level;
    });
    return map;
  }, [userSkills]);

  const categories = ['Todas as Skills', ...Array.from(new Set(skills.map(s => s.category)))];

  const filteredSkills = useMemo(() => {
    return skills.filter(s => {
      const matchesCategory = filterCategory === 'Todas as Skills' || s.category === filterCategory;
      const matchesSearch = searchSkill === '' || s.name.toLowerCase().includes(searchSkill.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [skills, filterCategory, searchSkill]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      return searchUser === '' || u.name.toLowerCase().includes(searchUser.toLowerCase());
    });
  }, [users, searchUser]);

  const teamHealth = useMemo(() => 
    calculateTeamHealth(userSkills, filteredUsers, filteredSkills), 
  [userSkills, filteredUsers, filteredSkills]);

  const atRiskSkills = useMemo(() => 
    getAtRiskSkills(userSkills, filteredSkills), 
  [userSkills, filteredSkills]);

  const getLevelInfo = (level: SkillLevel) => {
    const config = LEVEL_CONFIG[level];
    const Icon = config.icon;
    return { icon: Icon, color: config.color, label: config.label };
  };

  const levels: SkillLevel[] = ['not_trained', 'in_training', 'competent', 'expert'];
  
  const cycleLevel = (level: SkillLevel): SkillLevel => {
    if (level === 'expert') {
      return 'expert';
    }
    const index = levels.indexOf(level);
    return levels[index + 1];
  };

  const handleCellClick = async (userId: string, skillId: string) => {
    const currentLevel = levelMap[userId]?.[skillId] || 'not_trained';
    const newLevel = cycleLevel(currentLevel);
    
    await updateFirebaseUserSkill(userId, skillId, newLevel);
  };

  const handleAddSkill = async () => {
    if (newSkillName.trim() && newSkillCategory.trim()) {
      await createSkill({
        name: newSkillName.trim(),
        category: newSkillCategory.trim(),
        description: newSkillDescription.trim(),
        points: newSkillPoints === '' ? 5 : Number(newSkillPoints),
      });
      setNewSkillName('');
      setNewSkillCategory('');
      setNewSkillDescription('');
      setNewSkillPoints('');
      setShowSkillModal(false);
    }
  };

  const expertCounts = skills.map(s => ({
    skill: s,
    count: userSkills.filter(us => us.skillId === s.id && us.level === 'expert').length
  })).sort((a, b) => a.count - b.count);
  
  const criticalSkill = expertCounts[0]?.skill.name || 'UI Design';
  const criticalCount = expertCounts[0]?.count || 0;

  const hasNoSkills = skills.length === 0;
  const hasNoUsers = users.length === 0;

  return (
    <>
      <Topbar title="Matriz de Competências" />
      <main className="pt-24 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        
        {showInsights && !hasNoSkills && (
          <section className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-2xl border-none relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/80 rounded-xl flex items-center justify-center shadow-sm">
                  <Sparkles className="text-primary w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-primary flex items-center gap-2">
                    Insights de IA <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Beta</span>
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 max-w-xl">
                    Identificamos um <strong>gap crítico em {criticalSkill}</strong>. Apenas {criticalCount} membro(s) possui nível Especialista. Sugerimos treinamento para equilibrar a carga de trabalho.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-white text-primary text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98]">Ver Sugestões</button>
                <button onClick={() => setShowInsights(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filterCategory === cat 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-surface-lowest text-slate-500 border border-slate-200 hover:bg-surface-low'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchSkill}
                onChange={e => setSearchSkill(e.target.value)}
                placeholder="Buscar habilidade..."
                className="pl-9 pr-4 py-2 bg-surface-lowest border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none w-48"
              />
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            <button onClick={() => setShowSkillModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm">
              <Plus className="w-4 h-4" /> Adicionar Habilidade
            </button>
          </div>
        </section>

        {hasNoSkills ? (
          <div className="bg-surface-lowest p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <BrainCircuit className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-on-surface mb-2">Nenhuma habilidade encontrada</h3>
            <p className="text-slate-400 mb-6">Adicione habilidades para criar a matriz de competências</p>
            <button
              onClick={() => setShowSkillModal(true)}
              className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Adicionar Habilidade
            </button>
          </div>
        ) : hasNoUsers ? (
          <div className="bg-surface-lowest p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-on-surface mb-2">Nenhum membro na equipe</h3>
            <p className="text-slate-400 mb-6">Adicione membros na equipe para gerenciar competências</p>
          </div>
        ) : (
          <section className="bg-surface-lowest rounded-3xl shadow-sm overflow-hidden border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-low/50">
                    <th className="sticky left-0 z-20 bg-surface-low/50 p-4 text-left min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Membro da Equipe</span>
                        <input
                          type="text"
                          value={searchUser}
                          onChange={e => setSearchUser(e.target.value)}
                          placeholder="Buscar..."
                          className="text-xs px-2 py-1 bg-white border border-slate-200 rounded w-24 focus:ring-1 focus:ring-primary/20 outline-none"
                        />
                      </div>
                    </th>
                    {filteredSkills.map(skill => (
                      <th key={skill.id} className="p-4 text-center min-w-[100px]">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{skill.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="group hover:bg-surface-low/30 transition-colors">
                      <td className="sticky left-0 z-20 bg-surface-lowest group-hover:bg-slate-50 p-4 flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-sm text-on-surface">{user.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">{user.role}</p>
                        </div>
                      </td>
                      {filteredSkills.map(skill => {
                        const us = userSkills.find(us => us.userId === user.id && us.skillId === skill.id);
                        const level = us ? us.level : 'not_trained';
                        const info = getLevelInfo(level);
                        const Icon = info.icon;
                        
                        return (
                          <td key={skill.id} className="p-2">
                            <div 
                              onClick={() => {
                                if (level !== 'expert') {
                                  handleCellClick(user.id, skill.id);
                                }
                              }}
                              className={`h-12 w-full rounded-lg flex items-center justify-center flex-col gap-0.5 cursor-pointer hover:brightness-110 transition-all ${info.color} ${level === 'expert' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span className="text-[8px] font-bold">{info.label}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!hasNoSkills && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-surface-lowest p-6 rounded-3xl shadow-sm border border-slate-100">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Legenda de Proficiência</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300"></div>
                  <span className="text-sm text-slate-600">Não treinado / N/A</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                  <span className="text-sm text-slate-600">Em treinamento (Autonomia Parcial)</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-slate-600">Competente (Autonomia Plena)</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm text-slate-600">Especialista (Capaz de Ensinar)</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-lowest p-6 rounded-3xl shadow-sm border border-slate-100 col-span-1 lg:col-span-2">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Equilíbrio de Carga vs Skill</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-surface-low">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Saúde da Equipe</p>
                  <p className="text-2xl font-black text-on-surface mt-1">{teamHealth}%</p>
                  <div className="w-full h-1.5 bg-white rounded-full mt-3 overflow-hidden">
                    <div className={`h-full bg-primary transition-all duration-500`} style={{ width: `${teamHealth}%` }}></div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-surface-low">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Habilidades em Risco</p>
                  <p className="text-2xl font-black text-red-500 mt-1">{atRiskSkills.length}</p>
                  {atRiskSkills.length > 0 && (
                    <p className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full inline-block mt-2 font-semibold">
                      {atRiskSkills.map(s => s.name).join(', ')}
                    </p>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-surface-low">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Treinamentos Ativos</p>
                  <p className="text-2xl font-black text-on-surface mt-1">
                    {userSkills.filter(us => us.level === 'in_training').length}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2 italic">+3 esta semana</p>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>

      {showSkillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-surface-lowest rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-on-surface">Nova Habilidade</h2>
              <button onClick={() => setShowSkillModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome</label>
                <input
                  value={newSkillName}
                  onChange={e => setNewSkillName(e.target.value)}
                  placeholder="Ex: Atendimento ao Cliente"
                  className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
                <input
                  value={newSkillCategory}
                  onChange={e => setNewSkillCategory(e.target.value)}
                  placeholder="Ex: Vendas, Operações, TI"
                  className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={newSkillDescription}
                  onChange={e => setNewSkillDescription(e.target.value)}
                  placeholder="Descrição da habilidade..."
                  className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none h-20 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Pontos por Nível (Padrão: 5)</label>
                <input
                  type="number"
                  value={newSkillPoints}
                  onChange={e => setNewSkillPoints(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Pontos"
                  className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
              <button
                onClick={() => setShowSkillModal(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSkill}
                className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
