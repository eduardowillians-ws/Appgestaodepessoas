'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Topbar } from '@/components/Topbar';
import { Settings, Users, BrainCircuit, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { subscribeSkills, createSkill, updateSkill, deleteSkill } from '@/lib/firebase-skills';
import { Skill } from '@/lib/types';

export default function SettingsPage() {
  const { roles, addRole, updateRole, deleteRole } = useAppStore();
  const [skills, setSkills] = useState<Skill[]>([]);
  
  const [activeTab, setActiveTab] = useState<'roles' | 'skills'>('roles');
  const [newRoleName, setNewRoleName] = useState('');
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState('');
  
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [newSkillDescription, setNewSkillDescription] = useState('');
  const [newSkillPoints, setNewSkillPoints] = useState<number | ''>('');
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState({ name: '', category: '', description: '', points: 5 });

  useEffect(() => {
    const unsubscribe = subscribeSkills((firebaseSkills) => {
      setSkills(firebaseSkills as Skill[]);
    });
    return () => unsubscribe();
  }, []);

  const handleAddRole = () => {
    if (newRoleName.trim()) {
      addRole(newRoleName.trim());
      setNewRoleName('');
    }
  };

  const handleEditRole = (id: string, name: string) => {
    setEditingRoleId(id);
    setEditingRoleName(name);
  };

  const handleSaveRole = () => {
    if (editingRoleId && editingRoleName.trim()) {
      updateRole(editingRoleId, editingRoleName.trim());
      setEditingRoleId(null);
      setEditingRoleName('');
    }
  };

  const handleDeleteRole = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cargo?')) {
      deleteRole(id);
    }
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
    }
  };

  const handleEditSkill = (id: string, skill: { name: string; category: string; description: string; points?: number }) => {
    setEditingSkillId(id);
    setEditingSkill({ name: skill.name, category: skill.category, description: skill.description || '', points: skill.points ?? 5 });
  };

  const handleSaveSkill = async () => {
    if (editingSkillId && editingSkill.name.trim() && editingSkill.category.trim()) {
      await updateSkill(editingSkillId, {
        name: editingSkill.name.trim(),
        category: editingSkill.category.trim(),
        description: editingSkill.description.trim(),
        points: Number(editingSkill.points),
      });
      setEditingSkillId(null);
      setEditingSkill({ name: '', category: '', description: '', points: 5 });
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta habilidade?')) {
      await deleteSkill(id);
    }
  };

  return (
    <>
      <Topbar title="Configurações" />
      <main className="pt-24 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        
        <section>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Configurações</h2>
          <p className="text-slate-500 text-sm">Gerencie cargos e habilidades do sistema.</p>
        </section>

        <div className="flex gap-4 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'roles' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-4 h-4" />
            Gerenciar Cargos
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'skills' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            Gerenciar Habilidades
          </button>
        </div>

        {activeTab === 'roles' && (
          <section className="space-y-6">
            <div className="bg-surface-lowest p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-on-surface mb-4">Adicionar Novo Cargo</h3>
              <div className="flex flex-col md:flex-row md:items-start md:justify-end gap-3">
                <input
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  placeholder="Nome do cargo (ex: Vendedor, Analista)"
                  className="flex-1 w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleAddRole()}
                />
                <button
                  onClick={handleAddRole}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar
                </button>
              </div>
            </div>

            <div className="bg-surface-lowest rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface-low/50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-slate-400">Nome</th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-slate-400">Criado em</th>
                    <th className="text-right p-4 text-xs font-bold uppercase tracking-widest text-slate-400">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roles.map(role => (
                    <tr key={role.id} className="hover:bg-surface-low/30 transition-colors">
                      <td className="p-4">
                        {editingRoleId === role.id ? (
                          <input
                            value={editingRoleName}
                            onChange={e => setEditingRoleName(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            onKeyDown={e => e.key === 'Enter' && handleSaveRole()}
                          />
                        ) : (
                          <span className="font-semibold text-on-surface">{role.name}</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                        {new Date(role.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {editingRoleId === role.id ? (
                            <>
                              <button
                                onClick={handleSaveRole}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingRoleId(null)}
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditRole(role.id, role.name)}
                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRole(role.id)}
                                className="p-2 text-slate-400 hover:text-error hover:bg-error/5 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {roles.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  Nenhum cargo encontrado. Adicione o primeiro cargo acima.
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'skills' && (
          <section className="space-y-6">
            <div className="bg-surface-lowest p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-on-surface mb-4">Adicionar Nova Habilidade</h3>
              <div className="flex flex-col md:flex-row md:items-start md:justify-end gap-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
                  <input
                    value={newSkillName}
                    onChange={e => setNewSkillName(e.target.value)}
                    placeholder="Nome da habilidade"
                    className="p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <input
                    value={newSkillCategory}
                    onChange={e => setNewSkillCategory(e.target.value)}
                    placeholder="Categoria (ex: Vendas, TI)"
                    className="p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <input
                    value={newSkillDescription}
                    onChange={e => setNewSkillDescription(e.target.value)}
                    placeholder="Descrição (opcional)"
                    className="p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <input
                    type="number"
                    value={newSkillPoints}
                    onChange={e => setNewSkillPoints(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="PTS (Padrão: 5)"
                    className="p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none w-full"
                  />
                </div>
                <button
                  onClick={handleAddSkill}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar
                </button>
              </div>
            </div>

            <div className="bg-surface-lowest rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface-low/50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-slate-400">Nome</th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-slate-400">Categoria</th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-slate-400">Descrição</th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-slate-400">PTS</th>
                    <th className="text-right p-4 text-xs font-bold uppercase tracking-widest text-slate-400">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {skills.map(skill => (
                    <tr key={skill.id} className="hover:bg-surface-low/30 transition-colors">
                      <td className="p-4">
                        {editingSkillId === skill.id ? (
                          <input
                            value={editingSkill.name}
                            onChange={e => setEditingSkill({ ...editingSkill, name: e.target.value })}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        ) : (
                          <span className="font-semibold text-on-surface">{skill.name}</span>
                        )}
                      </td>
                      <td className="p-4">
                        {editingSkillId === skill.id ? (
                          <input
                            value={editingSkill.category}
                            onChange={e => setEditingSkill({ ...editingSkill, category: e.target.value })}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        ) : (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                            {skill.category}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-500 max-w-xs truncate">
                        {editingSkillId === skill.id ? (
                          <input
                            value={editingSkill.description}
                            onChange={e => setEditingSkill({ ...editingSkill, description: e.target.value })}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        ) : (
                          skill.description || '-'
                        )}
                      </td>
                      <td className="p-4 text-sm font-bold text-primary">
                        {editingSkillId === skill.id ? (
                          <input
                            type="number"
                            value={editingSkill.points}
                            onChange={e => setEditingSkill({ ...editingSkill, points: Number(e.target.value) })}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        ) : (
                          skill.points ?? 5
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {editingSkillId === skill.id ? (
                            <>
                              <button
                                onClick={handleSaveSkill}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingSkillId(null)}
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditSkill(skill.id, skill)}
                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSkill(skill.id)}
                                className="p-2 text-slate-400 hover:text-error hover:bg-error/5 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {skills.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  Nenhuma habilidade encontrada. Adicione a primeira habilidade acima.
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
