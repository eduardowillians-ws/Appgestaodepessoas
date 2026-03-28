'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Topbar } from '@/components/Topbar';
import { UserPlus, Terminal, Palette, Calendar, Search, X, Filter, Users, ChevronDown } from 'lucide-react';
import { UserModal } from '@/components/modals/UserModal';
import { UserDetailsModal } from '@/components/modals/UserDetailsModal';
import { UserStatus } from '@/lib/types';
import { getAllUsers, FirebaseUser } from '@/lib/firebase-users';

export default function TeamPage() {
  const router = useRouter();
  const { users, roles, deleteUser, tasks } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<UserStatus[]>([]);
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = searchQuery === '' || 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(u.role);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(u.status);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, selectedRoles, selectedStatuses]);

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const toggleStatus = (status: UserStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRoles([]);
    setSelectedStatuses([]);
  };

  const hasActiveFilters = searchQuery || selectedRoles.length > 0 || selectedStatuses.length > 0;

  const avgScore = users.length > 0 
    ? (users.reduce((acc, u) => acc + u.performanceScore, 0) / users.length).toFixed(1)
    : '0.0';

  const performanceStats = useMemo(() => {
    if (users.length === 0 || tasks.length === 0) {
      return { quality: 0, productivity: 0, percentage: 0 };
    }
    
    const quality = users.reduce((acc, u) => acc + u.performanceScore, 0) / users.length;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const currentMonthTasks = tasks.filter(t => {
      const taskDate = new Date(t.createdAt);
      return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear && t.status === 'completed';
    });
    
    const lastMonthTasks = tasks.filter(t => {
      const taskDate = new Date(t.createdAt);
      return taskDate.getMonth() === lastMonth && taskDate.getFullYear() === lastMonthYear && t.status === 'completed';
    });
    
    let productivity = 0;
    if (lastMonthTasks.length > 0) {
      productivity = ((currentMonthTasks.length - lastMonthTasks.length) / lastMonthTasks.length) * 100;
    } else if (currentMonthTasks.length > 0) {
      productivity = 100;
    }
    
    const percentage = Math.min(100, Math.round(quality * 10));
    
    return { quality, productivity, percentage };
  }, [users, tasks]);

  const handleEdit = (id: string) => {
    setEditingUserId(id);
    setIsModalOpen(true);
  };

  const handleDeleteMember = async (userId: string, userName: string) => {
    const confirmed = confirm(`Tem certeza que deseja excluir "${userName}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;
    
    console.log("🗑️ Iniciando exclusão do usuário:", userId, userName);
    
    try {
      await deleteUser(userId);
      console.log("✅ Usuário excluído com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao excluir membro:", error);
      alert("Erro ao excluir membro. Tente novamente.");
    }
  };

  const handleAdd = () => {
    setEditingUserId(null);
    setIsModalOpen(true);
  };

  const handleViewCalendar = () => {
    router.push('/calendar');
  };

  return (
    <>
      <Topbar title="Equipe" />
      <main className="pt-24 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto">
        
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Painel de Gestão</h2>
            <p className="text-slate-500 text-sm">Gerencie o desempenho e a disponibilidade do seu time em tempo real.</p>
          </div>
          <button 
            onClick={handleAdd}
            className="bg-primary hover:bg-secondary text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200/50 transition-all active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            Adicionar Membro
          </button>
        </section>

        <div className="bg-surface-lowest p-4 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, cargo ou tags..."
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
                  onClick={() => { setShowRoleFilter(!showRoleFilter); setShowStatusFilter(false); }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                    selectedRoles.length > 0 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-surface-low border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Cargo
                  {selectedRoles.length > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {selectedRoles.length}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showRoleFilter ? 'rotate-180' : ''}`} />
                </button>
                {showRoleFilter && (
                  <div className="absolute top-full mt-2 left-0 bg-surface-lowest border border-slate-200 rounded-xl shadow-xl z-30 min-w-[200px] max-h-64 overflow-y-auto">
                    {roles.length === 0 ? (
                      <div className="p-4 text-sm text-slate-400 text-center">Nenhum cargo encontrado</div>
                    ) : (
                      roles.map(role => (
                        <button
                          key={role.id}
                          onClick={() => toggleRole(role.name)}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-low transition-colors flex items-center justify-between ${
                            selectedRoles.includes(role.name) ? 'bg-primary/10 text-primary' : 'text-on-surface'
                          }`}
                        >
                          {role.name}
                          {selectedRoles.includes(role.name) && <span className="text-primary">✓</span>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => { setShowStatusFilter(!showStatusFilter); setShowRoleFilter(false); }}
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
                  <div className="absolute top-full mt-2 left-0 bg-surface-lowest border border-slate-200 rounded-xl shadow-xl z-30 min-w-[160px]">
                    {[
                      { value: 'active', label: 'Ativo', color: 'bg-emerald-500' },
                      { value: 'busy', label: 'Ocupado', color: 'bg-amber-500' },
                      { value: 'inactive', label: 'Inativo', color: 'bg-slate-400' }
                    ].map(status => (
                      <button
                        key={status.value}
                        onClick={() => toggleStatus(status.value as UserStatus)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-low transition-colors flex items-center gap-2 ${
                          selectedStatuses.includes(status.value as UserStatus) ? 'bg-primary/10 text-primary' : 'text-on-surface'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${status.color}`}></span>
                        {status.label}
                        {selectedStatuses.includes(status.value as UserStatus) && <span className="ml-auto text-primary">✓</span>}
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
              {selectedRoles.map(role => (
                <span key={role} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {role}
                  <button onClick={() => toggleRole(role)}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {selectedStatuses.map(status => (
                <span key={status} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {status === 'active' ? 'Ativo' : status === 'busy' ? 'Ocupado' : 'Inativo'}
                  <button onClick={() => toggleStatus(status)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing <span className="font-bold text-on-surface">{filteredUsers.length}</span> de <span className="font-bold">{users.length}</span> membros
          </p>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="bg-surface-lowest p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-on-surface mb-2">Nenhum membro encontrado</h3>
            <p className="text-slate-400 mb-6">
              {hasActiveFilters 
                ? 'Tente ajustar seus filtros de busca' 
                : 'Adicione o primeiro membro da sua equipe'}
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
                onClick={handleAdd}
                className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
              >
                Adicionar Membro
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-surface-lowest p-6 rounded-xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                
                <div className="absolute top-2 right-2 opacity-100 z-10 flex gap-2">
                  <button onClick={() => setDetailsUserId(user.id)} className="text-slate-400 hover:text-primary text-xs font-bold bg-white/80 px-2 py-1 rounded shadow-sm">Detalhes</button>
                  <button onClick={() => handleEdit(user.id)} className="text-slate-400 hover:text-primary text-xs font-bold bg-white/80 px-2 py-1 rounded shadow-sm">Editar</button>
                  <button onClick={() => handleDeleteMember(user.id, user.name)} className="text-slate-400 hover:text-error text-xs font-bold bg-white/80 px-2 py-1 rounded shadow-sm">Excluir</button>
                </div>

                <div className="relative flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
                    <span className={`absolute bottom-1 right-1 w-4 h-4 border-2 border-white rounded-full ${user.status === 'active' ? 'bg-emerald-500' : user.status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'}`} title={user.status}></span>
                  </div>
                  
                  <h3 className="font-bold text-lg text-on-surface">{user.name}</h3>
                  <p className="text-indigo-600 text-xs font-semibold mb-4">{user.role}</p>
                  
                  <div className="w-full flex justify-between items-center bg-slate-50 p-3 rounded-lg mb-4">
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Score</p>
                      <p className="text-lg font-black text-on-surface">{user.performanceScore.toFixed(1)}</p>
                    </div>
                    <div className="h-8 w-[2px] bg-slate-200"></div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                      <p className={`text-xs font-bold ${user.status === 'active' ? 'text-emerald-600' : user.status === 'busy' ? 'text-amber-600' : 'text-slate-600'}`}>
                        {user.status === 'active' ? 'Ativo' : user.status === 'busy' ? 'Ocupado' : 'Inativo'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-2">
                    {user.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-surface-low text-slate-500 rounded-full text-[10px] font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredUsers.length > 0 && (
          <section className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-indigo-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="z-10">
                <h2 className="text-2xl font-bold mb-2">Desempenho Geral do Time</h2>
                <p className="text-indigo-100 mb-6 max-w-sm">Seu time alcançou uma média de {performanceStats.quality.toFixed(1)} este mês. {performanceStats.productivity >= 0 ? `Isso representa um aumento de ${Math.round(performanceStats.productivity)}% em relação ao período anterior.` : 'Houve uma redução de atividade neste período.'}</p>
                <div className="flex gap-4">
                  <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 min-w-[120px]">
                    <p className="text-[10px] uppercase font-bold opacity-70">Produtividade</p>
                    <p className="text-2xl font-black">{performanceStats.productivity >= 0 ? '+' : ''}{Math.round(performanceStats.productivity)}%</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 min-w-[120px]">
                    <p className="text-[10px] uppercase font-bold opacity-70">Qualidade</p>
                    <p className="text-2xl font-black">{performanceStats.quality.toFixed(1)}</p>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/3 flex justify-center z-10">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-white/20" cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8"></circle>
                    <circle 
                      className="text-white" 
                      cx="64" 
                      cy="64" 
                      r="58" 
                      fill="transparent" 
                      stroke="currentColor" 
                      strokeDasharray={`${(performanceStats.percentage / 100) * 364.4} 364.4`} 
                      strokeWidth="8"
                    ></circle>
                  </svg>
                  <span className="absolute text-2xl font-black">{performanceStats.percentage}%</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between border border-slate-50">
              <div>
                <h4 className="font-bold text-on-surface mb-4">Próximos Treinamentos</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Node.js Avançado</p>
                      <p className="text-[10px] text-slate-400">Amanhã às 14:00</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Design Systems 101</p>
                      <p className="text-[10px] text-slate-400">24 Out, 10:30</p>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={handleViewCalendar} className="w-full py-2 text-indigo-600 text-xs font-bold hover:bg-indigo-50 rounded-lg transition-colors mt-6">Ver Calendário Completo</button>
            </div>
          </section>
        )}
      </main>

      {isModalOpen && (
        <UserModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          userId={editingUserId}
        />
      )}

      {detailsUserId && (
        <UserDetailsModal 
          userId={detailsUserId} 
          onClose={() => setDetailsUserId(null)} 
        />
      )}
    </>
  );
}
