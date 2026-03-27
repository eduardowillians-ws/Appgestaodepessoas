'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { X, BookOpen, Sparkles } from 'lucide-react';
import { Training } from '@/lib/types';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainingId?: string | null;
}

const CATEGORIES = [
  { value: 'technical', label: 'Técnico' },
  { value: 'soft', label: 'Liderança' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'other', label: 'Outros' },
];

export function TrainingModal({ isOpen, onClose, trainingId }: TrainingModalProps) {
  const { trainings, addTraining, updateTraining } = useAppStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('technical');
  const [dateTime, setDateTime] = useState('');
  const [instructor, setInstructor] = useState('');
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    if (trainingId) {
      const t = trainings.find(x => x.id === trainingId);
      if (t) {
        setTitle(t.title);
        setDescription(t.description);
        setCategory(t.category || t.type);
        setDateTime(t.date.slice(0, 16));
        setInstructor(t.instructor);
        setDuration(t.duration);
      }
    } else {
      setTitle('');
      setDescription('');
      setCategory('technical');
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      setDateTime(now.toISOString().slice(0, 16));
      setInstructor('');
      setDuration(60);
    }
  }, [trainingId, trainings]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const trainingData = {
        title,
        description,
        category,
        date: new Date(dateTime + ':00').toISOString(),
        instructor,
        duration,
        type: category as 'technical' | 'soft' | 'workshop',
      };

      if (trainingId) {
        updateTraining(trainingId, trainingData);
      } else {
        addTraining(trainingData);
      }
      onClose();
    } catch (error) {
      console.error('Error in TrainingModal handleSubmit:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-surface-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">
                {trainingId ? 'Editar Treinamento' : 'Novo Treinamento'}
              </h2>
              <p className="text-xs text-slate-500">Agende uma sessão de capacitação</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Título do Treinamento</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: React Avançado"
              className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Data e Horário</label>
            <input
              type="datetime-local"
              required
              value={dateTime}
              onChange={e => setDateTime(e.target.value)}
              className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Instrutor/Responsável</label>
            <input
              type="text"
              required
              value={instructor}
              onChange={e => setInstructor(e.target.value)}
              placeholder="Nome do instrutor"
              className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Duração (minutos)</label>
            <select
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1h 30min</option>
              <option value={120}>2 horas</option>
              <option value={180}>3 horas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Descrição Breve</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Descreva o conteúdo do treinamento..."
              className="w-full p-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary hover:bg-secondary text-white font-semibold rounded-xl shadow-lg shadow-indigo-200/50 transition-all active:scale-95"
            >
              {trainingId ? 'Salvar' : 'Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}