'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Topbar } from '@/components/Topbar';
import { Sparkles, Plus, Filter, Calendar, Tag, MoreVertical, AlertTriangle, CheckCircle2, Circle, RefreshCw, Search, X, ChevronDown, CheckSquare, BookOpen } from 'lucide-react';
import { TaskModal } from '@/components/modals/TaskModal';
import { TrainingModal } from '@/components/modals/TrainingModal';
import { TaskStatus, TaskPriority } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TasksPage() {
  const { tasks, users, skills, updateTaskStatus, archiveTask, unarchiveTask, deleteTask } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showPriorityFilter, setShowPriorityFilter] = useState(false);
  const [showUserFilter, setShowUserFilter] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesArchived = showArchived ? t.archived : !t.archived;
      const matchesSearch = searchQuery === '' || 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(t.status);
      const matchesPriority = selectedPriorities.length === 0 || selectedPriorities.includes(t.priority);
      const matchesUser = selectedUsers.length === 0 || (t.assignedUserId ? selectedUsers.includes(t.assignedUserId) : selectedUsers.includes('unassigned'));
      
      return matchesArchived && matchesSearch && matchesStatus && matchesPriority && matchesUser;
    });
  }, [tasks, searchQuery, selectedStatuses, selectedPriorities, selectedUsers, showArchived]);

  const activeTasksCount = tasks.filter(t => !t.archived).length;
  const archivedTasksCount = tasks.filter(t => t.archived).length;

  const toggleStatus = (status: TaskStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const togglePriority = (priority: TaskPriority) => {
    setSelectedPriorities(prev => 
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    );
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(u => u !== userId) : [...prev, userId]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setSelectedUsers([]);
  };

  const hasActiveFilters = searchQuery || selectedStatuses.length > 0 || selectedPriorities.length > 0 || selectedUsers.length > 0;

  const overdueCount = tasks.filter(t => t.status === 'overdue' && !t.archived).length;
  const todayCount = tasks.filter(t => (t.status === 'in_progress' || t.status === 'pending') && !t.archived).length;

  const handleCreate = () => {
    setEditingTaskId(null);
    setIsModalOpen(true);
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'overdue': return <AlertTriangle className="w-5 h-5" />;
      case 'in_progress': return <RefreshCw className="w-5 h-5" />;
      case 'completed': return <CheckCircle2 className="w-5 h-5" />;
      case 'pending': return <Circle className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'overdue': return 'bg-red-50 text-red-600';
      case 'in_progress': return 'bg-amber-50 text-amber-600';
      case 'completed': return 'bg-emerald-50 text-emerald-600';
      case 'pending': return 'bg-slate-100 text-slate-500';
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'overdue': return <span className="px-2 py-0.5 bg-red-500 text-[10px] font-black text-white rounded uppercase tracking-tighter">Atrasada</span>;
      case 'in_progress': return <span className="px-2 py-0.5 bg-amber-400 text-[10px] font-bold text-amber-900 rounded uppercase">Em Andamento</span>;
      case 'completed': return <span className="px-2 py-0.5 bg-emerald-500 text-[10px] font-bold text-white rounded uppercase">Concluída</span>;
      case 'pending': return <span className="px-2 py-0.5 bg-slate-400 text-[10px] font-bold text-white rounded uppercase">Pendente</span>;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-slate-100 text-slate-600';
    }
  };

  const formatDate = (isoString: string) => {
    const dateStr = isoString.split('T')[0];
    return format(parseISO(dateStr + 'T00:00:00'), "dd/MM", { locale: ptBR });
  };

  return (
    <>
      <Topbar title="Gestão de Tarefas" />
      <main className="pt-24 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Bem-vinda de volta, Ana</p>
            <h3 className="text-3xl font-extrabold tracking-tight text-on-surface">Painel de Controle</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-lowest px-4 py-2 rounded-xl shadow-sm border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atrasadas</span>
              <span className="text-lg font-black text-red-500">{overdueCount.toString().padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-lowest px-4 py-2 rounded-xl shadow-sm border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hoje</span>
              <span className="text-lg font-black text-primary">{todayCount.toString().padStart(2, '0')}</span>
            </div>
            <button 
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
              Nova Tarefa
            </button>
            <button 
              onClick={() => setIsTrainingModalOpen(true)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 border border-blue-200 active:scale-95 transition-all"
            >
              <BookOpen className="w-5 h-5" />
              Treinamento
            </button>
          </div>
        </section>

        <div className="bg-surface-lowest p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar tarefas..."
                className="w-full pl-10 pr-4 py-3 bg-surface-low border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <button
                  onClick={() => { setShowStatusFilter(!showStatusFilter); setShowPriorityFilter(false); setShowUserFilter(false); }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                    selectedStatuses.length > 0 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-surface-low border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Status
                  {selectedStatuses.length > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {selectedStatuses.length}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showStatusFilter ? 'rotate-180' : ''}`} />
                </button>
                {showStatusFilter && (
                  <div className="absolute top-full mt-2 left-0 bg-surface-lowest border border-slate-200 rounded-xl shadow-xl z-30 min-w-[180px]">
                    {[
                      { value: 'pending', label: 'Pendente', color: 'bg-slate-400' },
                      { value: 'in_progress', label: 'Em Andamento', color: 'bg-amber-400' },
                      { value: 'completed', label: 'Concluída', color: 'bg-emerald-500' },
                      { value: 'overdue', label: 'Atrasada', color: 'bg-red-500' }
                    ].map(status => (
                      <button
                        key={status.value}
                        onClick={() => toggleStatus(status.value as TaskStatus)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-low transition-colors flex items-center gap-2 ${
                          selectedStatuses.includes(status.value as TaskStatus) ? 'bg-primary/10 text-primary' : 'text-on-surface'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${status.color}`}></span>
                        {status.label}
                        {selectedStatuses.includes(status.value as TaskStatus) && <span className="ml-auto text-primary">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => { setShowPriorityFilter(!showPriorityFilter); setShowStatusFilter(false); setShowUserFilter(false); }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                    selectedPriorities.length > 0 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-surface-low border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Prioridade
                  {selectedPriorities.length > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {selectedPriorities.length}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showPriorityFilter ? 'rotate-180' : ''}`} />
                </button>
                {showPriorityFilter && (
                  <div className="absolute top-full mt-2 left-0 bg-surface-lowest border border-slate-200 rounded-xl shadow-xl z-30 min-w-[160px]">
                    {[
                      { value: 'high', label: 'Alta' },
                      { value: 'medium', label: 'Média' },
                      { value: 'low', label: 'Baixa' }
                    ].map(priority => (
                      <button
                        key={priority.value}
                        onClick={() => togglePriority(priority.value as TaskPriority)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-low transition-colors flex items-center justify-between ${
                          selectedPriorities.includes(priority.value as TaskPriority) ? 'bg-primary/10 text-primary' : 'text-on-surface'
                        }`}
                      >
                        {priority.label}
                        {selectedPriorities.includes(priority.value as TaskPriority) && <span className="text-primary">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => { setShowUserFilter(!showUserFilter); setShowStatusFilter(false); setShowPriorityFilter(false); }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                    selectedUsers.length > 0 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-surface-low border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Responsável
                  {selectedUsers.length > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {selectedUsers.length}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showUserFilter ? 'rotate-180' : ''}`} />
                </button>
                {showUserFilter && (
                  <div className="absolute top-full mt-2 left-0 bg-surface-lowest border border-slate-200 rounded-xl shadow-xl z-30 min-w-[200px] max-h-64 overflow-y-auto">
                    <button
                      onClick={() => toggleUser('unassigned')}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-low transition-colors flex items-center gap-2 ${
                        selectedUsers.includes('unassigned') ? 'bg-primary/10 text-primary' : 'text-on-surface'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                      Não atribuída
                      {selectedUsers.includes('unassigned') && <span className="ml-auto text-primary">✓</span>}
                    </button>
                    {users.map(user => (
                      <button
                        key={user.id}
                        onClick={() => toggleUser(user.id)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-low transition-colors flex items-center gap-2 ${
                          selectedUsers.includes(user.id) ? 'bg-primary/10 text-primary' : 'text-on-surface'
                        }`}
                      >
                        <img src={user.avatar} alt="" className="w-5 h-5 rounded-full" />
                        {user.name}
                        {selectedUsers.includes(user.id) && <span className="ml-auto text-primary">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">Filtros ativos:</span>
              {selectedStatuses.map(status => (
                <span key={status} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {status === 'pending' ? 'Pendente' : status === 'in_progress' ? 'Em Andamento' : status === 'completed' ? 'Concluída' : 'Atrasada'}
                  <button onClick={() => toggleStatus(status)}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {selectedPriorities.map(priority => (
                <span key={priority} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Média' : 'Baixa'}
                  <button onClick={() => togglePriority(priority)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Mostrando <span className="font-bold text-on-surface">{filteredTasks.length}</span> de <span className="font-bold">{showArchived ? tasks.length : activeTasksCount}</span> tarefas
          </div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showArchived ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="text-xs">📁</span>
            {showArchived ? 'Ocultar Arquivadas' : `Arquivadas (${archivedTasksCount})`}
          </button>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="bg-surface-lowest p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <CheckSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-on-surface mb-2">Nenhuma tarefa encontrada</h3>
            <p className="text-slate-400 mb-6">
              {hasActiveFilters 
                ? 'Tente ajustar seus filtros de busca' 
                : 'Crie sua primeira tarefa para começar'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
              >
                Limpar Filtros
              </button>
            ) : (
              <button
                onClick={handleCreate}
                className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
              >
                Criar Tarefa
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => {
              const assignedUser = users.find(u => u.id === task.assignedUserId);
              const taskSkills = skills.filter(s => task.requiredSkills.includes(s.id));
              
              return (
                <div key={task.id} className={`group bg-surface-lowest p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-100 ${task.status === 'overdue' ? 'border-l-4 border-l-red-500' : ''} ${task.status === 'completed' ? 'opacity-80' : ''}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h5 className={`text-base font-bold text-on-surface ${task.status === 'completed' ? 'line-through decoration-slate-400' : ''}`}>
                            {task.title}
                          </h5>
                          {getStatusBadge(task.status)}
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-tighter ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(task.dueDate)}</span>
                          {taskSkills.length > 0 && (
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {taskSkills.map(s => s.name).join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                      {assignedUser ? (
                        <div className="flex items-center gap-2">
                          <img src={assignedUser.avatar} alt={assignedUser.name} className="w-8 h-8 rounded-full object-cover" />
                          <span className="text-xs font-semibold text-on-surface">{assignedUser.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 italic">Não atribuída</span>
                      )}
                      
                      <div className="relative group/menu">
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                          className="p-2 text-slate-400 hover:text-primary transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openMenuId === task.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-100 w-40 z-30">
                            {task.archived ? (
                              <button 
                                onClick={() => { unarchiveTask(task.id); setOpenMenuId(null); }} 
                                className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <span>📂</span> Desarquivar
                              </button>
                            ) : (
                              <>
                                {task.status === 'completed' && (
                                  <button 
                                    onClick={() => { archiveTask(task.id); setOpenMenuId(null); }} 
                                    className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <span>📁</span> Arquivar
                                  </button>
                                )}
                                {task.status !== 'completed' && (
                                  <button 
                                    onClick={() => { updateTaskStatus(task.id, 'completed'); setOpenMenuId(null); }} 
                                    className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <span>✓</span> Concluir
                                  </button>
                                )}
                                {task.status !== 'in_progress' && task.status !== 'completed' && (
                                  <button 
                                    onClick={() => { updateTaskStatus(task.id, 'in_progress'); setOpenMenuId(null); }} 
                                    className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <span>▶</span> Iniciar
                                  </button>
                                )}
                                <button 
                                  onClick={() => { setEditingTaskId(task.id); setIsModalOpen(true); setOpenMenuId(null); }} 
                                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <span>✏️</span> Editar
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => { setDeleteConfirmId(task.id); setOpenMenuId(null); }} 
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t"
                            >
                              <span>🗑️</span> Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {isModalOpen && (
        <TaskModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          taskId={editingTaskId} 
        />
      )}

      {isTrainingModalOpen && (
        <TrainingModal
          isOpen={isTrainingModalOpen}
          onClose={() => setIsTrainingModalOpen(false)}
        />
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-on-surface mb-2">Confirmar Exclusão</h3>
            <p className="text-slate-500 text-sm mb-6">Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { deleteTask(deleteConfirmId); setDeleteConfirmId(null); }}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
