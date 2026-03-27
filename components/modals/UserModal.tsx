'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { X, Camera } from 'lucide-react';
import { UserStatus } from '@/lib/types';
import { createUser, updateUser as updateUserFirebase } from '@/lib/firebase-users';

const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAcBL1lspFHQzM77O11-hM7xD06S5g10MR8VdDBNTucT7XRZdIyJ0vaXxx0EH1nwxMFyIANUJ0RIvPQkgG_PhIPVSfRpy9gef7W9iIDeA6l6LbVct8oSH0225HHHq1gkyHrVeO8w76eDQ_01OAP8IuL3xg1EljQXFc9U7lCh5THsisPCwRlx8djqAnukfERFnybe1Ppsbhd8cGguHv1Pdmox-4HIafBeQZSWArlrtixoV3s8i3un6fWLeMfJLqlMpykBZPYWuuzQ8yP';

export function UserModal({
  isOpen,
  onClose,
  userId,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onSaved?: () => void;
}) {
  console.log("UserModal renderizado", { isOpen, userId });
  const { users, roles } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<UserStatus>('active');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
      setAvatar(objectUrl);
    }
  };

  useEffect(() => {
    if (userId) {
      const u = users.find(x => x.id === userId);
      if (u) {
        setName(u.name);
        setRole(u.role);
        setStatus(u.status);
        setTags(u.tags.join(', '));
        setNotes(u.notes ?? '');
        setAvatar(u.avatar ?? DEFAULT_AVATAR);
        setAvatarPreview(null);
      }
    } else {
      setName('');
      setRole('');
      setStatus('active');
      setTags('');
      setNotes('');
      setAvatar(DEFAULT_AVATAR);
      setAvatarPreview(null);
    }
  }, [userId, users]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("SUBMIT DISPARADO");
    try {
      const userData = {
        name: name.trim(),
        role: role.trim(),
        status,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        notes: notes.trim(),
        avatar,
        performanceScore: 0,
        points: 0,
        level: 1,
        xpToNextLevel: 100,
        createdAt: new Date(),
      };

      console.log("DADOS:", userData);
      console.log("CHAMANDO createUser...");
      console.log("🔍 ANTES DO AWAIT createUser");
      const newUserId = await createUser(userData);
      console.log("🔍 DEPOIS DO AWAIT createUser, result:", newUserId);
      console.log("SUCESSO");
      onClose();
      if (onSaved) onSaved();
    } catch (error) {
      console.error("ERRO FIREBASE:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-surface-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-on-surface">
            {userId ? 'Editar Membro' : 'Novo Membro'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => {
          console.log("FORM DISPARADO");
          handleSubmit(e);
        }} className="p-6 space-y-6">
          <div className="space-y-4">
            
            <div className="flex flex-col items-center">
              <label className="cursor-pointer group">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg group-hover:opacity-80 transition-opacity">
                    {avatarPreview || avatar ? (
                      <img 
                        src={avatarPreview || avatar} 
                        alt="Avatar preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">Clique para upload</p>
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome</label>
              {/* ✅ onChange extrai apenas e.target.value (string) — sem armazenar o evento */}
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Cargo</label>
              <select
                required
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">Selecione um cargo</option>
                {roles.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
              {/* ✅ Cast seguro para UserStatus — sem armazenar o evento */}
              <select
                value={status}
                onChange={e => setStatus(e.target.value as UserStatus)}
                className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="active">Ativo</option>
                <option value="busy">Ocupado</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Tags (separadas por vírgula)
              </label>
              {/* ✅ e.target.value — apenas string */}
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Ex: Frontend, React, Sênior"
                className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Notas</label>
              {/* ✅ e.target.value — apenas string */}
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observações sobre o membro..."
                className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none h-24 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={() => console.log("BOTÃO CLICADO")}
              className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-lg shadow-primary/20"
            >
              {userId ? 'Salvar Alterações' : 'Adicionar Membro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
