'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoleModal({ isOpen, onClose }: RoleModalProps) {
  const { roles, addRole, updateRole, deleteRole } = useAppStore();
  const [newRoleName, setNewRoleName] = useState('');
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (newRoleName.trim()) {
      addRole(newRoleName);
      setNewRoleName('');
    }
  };

  const handleEdit = (id: string) => {
    const role = roles.find(r => r.id === id);
    if (role) {
      setEditingRoleId(id);
      setEditName(role.name);
    }
  };

  const handleSaveEdit = () => {
    if (editingRoleId && editName.trim()) {
      updateRole(editingRoleId, editName);
      setEditingRoleId(null);
      setEditName('');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta função?')) {
      deleteRole(id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-surface-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-on-surface">Gerenciar Funções</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <input
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              placeholder="Nova função (ex: Vendedor)"
              className="flex-1 p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {roles.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhuma função criada ainda.</p>
            ) : (
              roles.map(role => (
                <div key={role.id} className="flex items-center justify-between p-3 bg-surface-low rounded-lg group">
                  {editingRoleId === role.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm"
                        autoFocus
                      />
                      <button onClick={handleSaveEdit} className="text-green-600 hover:bg-green-50 px-2 py-1 rounded">Salvar</button>
                      <button onClick={() => setEditingRoleId(null)} className="text-slate-400 hover:bg-slate-100 px-2 py-1 rounded">Cancelar</button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-on-surface">{role.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(role.id)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(role.id)} className="p-1.5 text-slate-400 hover:text-error hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
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