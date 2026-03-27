'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SkillModal({ isOpen, onClose }: SkillModalProps) {
  const { skills, addSkill, updateSkill, deleteSkill } = useAppStore();
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Geral');
  const [newSkillDescription, setNewSkillDescription] = useState('');
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const categories = Array.from(new Set(skills.map(s => s.category).filter(Boolean)));

  const handleAdd = () => {
    if (newSkillName.trim()) {
      addSkill({
        name: newSkillName.trim(),
        description: newSkillDescription.trim(),
        category: newSkillCategory.trim() || 'Geral',
      });
      setNewSkillName('');
      setNewSkillDescription('');
    }
  };

  const handleEdit = (id: string) => {
    const skill = skills.find(s => s.id === id);
    if (skill) {
      setEditingSkillId(id);
      setEditName(skill.name);
      setEditCategory(skill.category);
      setEditDescription(skill.description || '');
    }
  };

  const handleSaveEdit = () => {
    if (editingSkillId && editName.trim()) {
      updateSkill(editingSkillId, {
        name: editName.trim(),
        category: editCategory.trim() || 'Geral',
        description: editDescription.trim(),
      });
      setEditingSkillId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta habilidade?')) {
      deleteSkill(id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-surface-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-on-surface">Gerenciar Habilidades</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3 p-4 bg-surface-low rounded-xl">
            <input
              value={newSkillName}
              onChange={e => setNewSkillName(e.target.value)}
              placeholder="Nome da habilidade (ex: Atendimento ao Cliente)"
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <select
                value={newSkillCategory}
                onChange={e => setNewSkillCategory(e.target.value)}
                className="flex-1 p-3 bg-white border border-slate-200 rounded-lg text-sm"
              >
                <option value="Geral">Geral</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__new__">+ Nova Categoria</option>
              </select>
              {newSkillCategory === '__new__' && (
                <input
                  placeholder="Nova categoria"
                  onChange={e => setNewSkillCategory(e.target.value)}
                  className="flex-1 p-3 bg-white border border-slate-200 rounded-lg text-sm"
                />
              )}
            </div>
            <input
              value={newSkillDescription}
              onChange={e => setNewSkillDescription(e.target.value)}
              placeholder="Descrição (opcional)"
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm"
            />
            <button
              onClick={handleAdd}
              disabled={!newSkillName.trim()}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Adicionar Habilidade
            </button>
          </div>

          <div className="space-y-2">
            {skills.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhuma habilidade criada ainda.</p>
            ) : (
              skills.map(skill => (
                <div key={skill.id} className="p-3 bg-surface-low rounded-lg group">
                  {editingSkillId === skill.id ? (
                    <div className="space-y-2">
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                        autoFocus
                      />
                      <input
                        value={editCategory}
                        onChange={e => setEditCategory(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                        placeholder="Categoria"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleSaveEdit} className="flex-1 text-green-600 hover:bg-green-50 px-3 py-1.5 rounded text-sm font-medium">Salvar</button>
                        <button onClick={() => setEditingSkillId(null)} className="flex-1 text-slate-400 hover:bg-slate-100 px-3 py-1.5 rounded text-sm font-medium">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-on-surface">{skill.name}</p>
                        <p className="text-xs text-slate-400">{skill.category}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(skill.id)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(skill.id)} className="p-1.5 text-slate-400 hover:text-error hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}