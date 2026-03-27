'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Topbar } from '@/components/Topbar';
import { Sparkles, Users, CheckCircle2, AlertTriangle, TrendingUp, Star, Calendar, Loader2 } from 'lucide-react';
import { generateProductivityData } from '@/lib/mock-data';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface DateRange {
  start: Date;
  end: Date;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { users, tasks } = useAppStore();
  
  const [mounted, setMounted] = useState(false);

  const getInitialDateRange = (): DateRange => {
    const fromUrl = searchParams.get('from');
    const toUrl = searchParams.get('to');
    
    if (fromUrl && toUrl) {
      return {
        start: new Date(fromUrl),
        end: new Date(toUrl),
      };
    }
    
    return {
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date(),
    };
  };

  const [dateRange, setDateRange] = useState<DateRange>(getInitialDateRange);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateUrlParams = (range: DateRange) => {
    const params = new URLSearchParams();
    params.set('from', range.start.toISOString().split('T')[0]);
    params.set('to', range.end.toISOString().split('T')[0]);
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const newRange = { ...dateRange, [type]: new Date(value) };
    if (newRange.start <= newRange.end) {
      setDateRange(newRange);
      updateUrlParams(newRange);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const taskDate = new Date(t.createdAt);
      return taskDate >= dateRange.start && taskDate <= dateRange.end;
    });
  }, [tasks, dateRange]);

  const completedTasksFiltered = useMemo(() => {
    return filteredTasks.filter(t => t.status === 'completed');
  }, [filteredTasks]);

  const overdueTasksFiltered = useMemo(() => {
    return filteredTasks.filter(t => t.status === 'overdue');
  }, [filteredTasks]);

  const completedTasks = completedTasksFiltered.length;
  const overdueTasks = overdueTasksFiltered.length;

  const avgScore = useMemo(() => {
    if (completedTasksFiltered.length === 0) return 0;
    const totalScore = completedTasksFiltered.reduce((acc, t) => {
      const user = users.find(u => u.id === t.assignedUserId);
      return acc + (user?.performanceScore || 0);
    }, 0);
    return totalScore / completedTasksFiltered.length;
  }, [completedTasksFiltered, users]);

  const topPerformer = useMemo(() => {
    if (users.length === 0) return null;
    return [...users].sort((a, b) => b.performanceScore - a.performanceScore)[0];
  }, [users]);

  const topPerformerTasks = useMemo(() => {
    if (!topPerformer) return 0;
    return tasks.filter(t => 
      t.assignedUserId === topPerformer.id && t.status === 'completed'
    ).length;
  }, [tasks, topPerformer]);

  const totalTasks = filteredTasks.length;
  
  const inProgressTasks = useMemo(() => {
    return filteredTasks.filter(t => t.status === 'in_progress').length;
  }, [filteredTasks]);

  const inProgressPercent = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
  const completedPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const scoreLabel = useMemo(() => {
    if (avgScore >= 9.0) return { text: 'Excelência', color: 'text-secondary', bg: 'bg-secondary/5' };
    if (avgScore >= 7.0) return { text: 'Bom Desempenho', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    return { text: 'Atenção', color: 'text-red-500', bg: 'bg-red-50' };
  }, [avgScore]);

  const daysInRange = useMemo(() => {
    const diff = dateRange.end.getTime() - dateRange.start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [dateRange]);

  console.log('Calculando produtividade para:', dateRange.start.toLocaleDateString('pt-BR'), 'até', dateRange.end.toLocaleDateString('pt-BR'), '- Dias:', daysInRange);

  const memberGrowth = useMemo(() => {
    const membersAtStart = users.filter(u => {
      const createdAt = new Date(u.createdAt);
      return createdAt < dateRange.start;
    }).length;
    
    const totalNow = users.length;
    const growth = membersAtStart > 0 ? ((totalNow - membersAtStart) / membersAtStart) * 100 : (totalNow > 0 ? 100 : 0);
    
    return {
      current: totalNow,
      atStart: membersAtStart,
      percentage: Math.round(growth),
      isPositive: growth >= 0
    };
  }, [users, dateRange]);

  const productivityData = useMemo(() => {
    return generateProductivityData(daysInRange);
  }, [daysInRange]);

  const aiInsights = useMemo(() => {
    const userTaskCounts: Record<string, number> = {};
    completedTasksFiltered.forEach(task => {
      if (task.assignedUserId) {
        userTaskCounts[task.assignedUserId] = (userTaskCounts[task.assignedUserId] || 0) + 1;
      }
    });
    
    let topPerformerName = 'Nenhum';
    let maxTasks = 0;
    Object.entries(userTaskCounts).forEach(([userId, count]) => {
      const user = users.find(u => u.id === userId);
      if (user && count > maxTasks) {
        maxTasks = count;
        topPerformerName = user.name;
      }
    });
    
    const productivityInsight = maxTasks > 0 
      ? `${topPerformerName} é o destaque produtivo do período!`
      : 'Nenhum dado de produtividade no período';
    
    const efficiencyInsight = overdueTasks > 0
      ? `Atenção: Existem ${overdueTasks} tarefa${overdueTasks !== 1 ? 's' : ''} pendente${overdueTasks !== 1 ? 's' : ''} que precisam de foco.`
      : 'Sua equipe está com 100% de eficiência nas entregas!';
    
    return { productivityInsight, efficiencyInsight };
  }, [completedTasksFiltered, overdueTasks, users]);

  const sortedUsersByScore = useMemo(() => {
    return [...users].sort((a, b) => b.performanceScore - a.performanceScore);
  }, [users]);

  const handleViewAllTeam = () => {
    router.push('/team');
  };

  const formatXAxis = (dateStr: string, index: number) => {
    const data = productivityData;
    if (index === 0 || index === data.length - 1) return dateStr;
    if (data.length <= 7) return dateStr;
    if (index % Math.ceil(data.length / 6) === 0) return dateStr;
    return '';
  };

  if (!users || !tasks) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Topbar title="Painel de Controle" />
      <main className="pt-24 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Bom dia, Equipe.</h2>
            <p className="text-slate-500 text-lg">Aqui está o que está acontecendo com sua equipe hoje.</p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-200 rounded-2xl p-5 flex items-start gap-4 shadow-lg shadow-indigo-100/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-primary text-sm mb-1 uppercase tracking-widest">Insights de IA</h4>
              <ul className="space-y-2">
                <li className="text-sm text-on-surface flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {mounted ? aiInsights.productivityInsight : '-'}
                </li>
                <li className="text-sm text-on-surface flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${overdueTasks > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                  {mounted ? aiInsights.efficiencyInsight : '-'}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <span className="text-sm text-slate-500 font-medium">
            Período selecionado:
          </span>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-surface-lowest border border-slate-200 rounded-xl px-3 py-2 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <label className="text-xs text-slate-500 font-medium whitespace-nowrap">De:</label>
              <input 
                type="date" 
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={e => handleDateChange('start', e.target.value)}
                className="bg-transparent text-sm font-medium text-on-surface outline-none w-full sm:w-auto min-w-[120px]"
              />
            </div>
            
            <span className="text-slate-400 hidden sm:inline">→</span>
            
            <div className="flex items-center gap-2 bg-surface-lowest border border-slate-200 rounded-xl px-3 py-2 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Até:</label>
              <input 
                type="date" 
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={e => handleDateChange('end', e.target.value)}
                className="bg-transparent text-sm font-medium text-on-surface outline-none w-full sm:w-auto min-w-[120px]"
              />
            </div>
            
            <span className="text-xs text-slate-400 ml-2 whitespace-nowrap">
              ({daysInRange} dia{daysInRange !== 1 ? 's' : ''})
            </span>
          </div>
        </div>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-surface-lowest p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <Users className="text-slate-400 w-5 h-5 md:w-6 md:h-6" />
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${memberGrowth.isPositive ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                {memberGrowth.isPositive ? '+' : ''}{memberGrowth.percentage}%
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Membros</p>
            <p className="text-2xl font-black text-on-surface">{memberGrowth.current}</p>
          </div>
          
          <div className="bg-surface-lowest p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <CheckCircle2 className="text-slate-400 w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">{completedPercent}%</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Tarefas Concluídas</p>
            <p className="text-2xl font-black text-on-surface">{completedTasks}</p>
          </div>

          <div className="bg-surface-lowest p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <AlertTriangle className="text-red-500 w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">Atenção</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Atrasadas</p>
            <p className="text-2xl font-black text-red-600">{overdueTasks.toString().padStart(2, '0')}</p>
          </div>

          <div className="bg-surface-lowest p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <TrendingUp className={`w-5 h-5 md:w-6 md:h-6 ${scoreLabel.color}`} />
              <span className={`text-xs font-bold ${scoreLabel.color} ${scoreLabel.bg} px-2 py-1 rounded-lg`}>{scoreLabel.text}</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Score Geral</p>
            <p className="text-2xl font-black text-on-surface">{avgScore.toFixed(1)}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-surface-lowest p-4 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Produtividade ao Longo do Tempo</h3>
                <p className="text-sm text-slate-500">
                  {daysInRange <= 7 ? 'Média de entrega por dia' : `Tarefas concluídas (${daysInRange} dias)`}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg self-start">
                {dateRange.start.toLocaleDateString('pt-BR')} - {dateRange.end.toLocaleDateString('pt-BR')}
              </span>
            </div>
            
            {productivityData.length > 0 ? (
              <div className="h-48 md:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={productivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value, index) => formatXAxis(value, index)}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      interval={Math.floor(productivityData.length / 6)}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                      formatter={(value: unknown) => [`${value} tarefas`, 'Concluídas']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCompleted)" 
                      dot={{ fill: '#6366f1', strokeWidth: 2, stroke: '#fff', r: 3 }}
                      activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 md:h-64 flex items-center justify-center text-slate-400">
                <p className="text-sm">Nenhuma tarefa encontrada no período</p>
              </div>
            )}
          </div>

          {topPerformer ? (
            <div className="lg:col-span-4 bg-primary text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 rotate-12 group-hover:rotate-45 transition-transform duration-700">
                <Star className="w-32 md:w-48 h-32 md:h-48" />
              </div>
              <div className="relative mb-4 md:mb-6">
                <div className="w-20 md:w-24 rounded-full border-4 border-white/30 p-1">
                  <img 
                    src={topPerformer.avatar} 
                    alt={topPerformer.name} 
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${topPerformer.name}`;
                    }}
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-secondary p-1.5 rounded-lg">
                  <Star className="w-4 h-4 fill-white" />
                </div>
              </div>
              <h4 className="text-sm font-bold opacity-80 uppercase tracking-[0.2em] mb-2">Destaque</h4>
              <p className="text-xl md:text-2xl font-black mb-1">{topPerformer.name}</p>
              <p className="text-sm opacity-90 mb-4 md:mb-6">{topPerformer.role}</p>
              
              <div className="bg-white/20 backdrop-blur-md px-4 md:px-6 py-2 md:py-3 rounded-2xl flex gap-4 md:gap-6">
                <div className="text-center border-r border-white/20 pr-4 md:pr-6">
                  <p className="text-xs opacity-70">Tarefas</p>
                  <p className="font-bold">{topPerformerTasks}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs opacity-70">Nota</p>
                  <p className="font-bold">{topPerformer.performanceScore.toFixed(1)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-4 bg-surface-lowest p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center">
              <p className="text-slate-400">Nenhum colaborador encontrado</p>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-surface-lowest p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-on-surface mb-6">Distribuição por Status</h3>
            <div className="relative w-40 h-40 md:w-48 md:h-48 mx-auto mb-8">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" strokeWidth="4"></circle>
                {inProgressPercent > 0 && (
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="16" 
                    fill="transparent" 
                    stroke="#fbbf24" 
                    strokeWidth="4" 
                    strokeDasharray={`${inProgressPercent} 100`}
                  ></circle>
                )}
                {completedPercent > 0 && (
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="16" 
                    fill="transparent" 
                    stroke="#22c55e" 
                    strokeWidth="4" 
                    strokeDasharray={`${completedPercent} 100`}
                    strokeDashoffset={`-${inProgressPercent}`}
                  ></circle>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black">{totalTasks}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                  <span className="text-slate-600">Em Andamento</span>
                </div>
                <span className="font-bold">{inProgressPercent}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-slate-600">Concluídas</span>
                </div>
                <span className="font-bold">{completedPercent}%</span>
              </div>
              {totalTasks - inProgressTasks - completedTasks > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                    <span className="text-slate-600">Pendentes</span>
                  </div>
                  <span className="font-bold">{Math.round(((totalTasks - inProgressTasks - completedTasks) / totalTasks) * 100)}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-surface-lowest p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h3 className="text-lg font-bold text-on-surface">Performance da Equipe</h3>
              <button 
                onClick={handleViewAllTeam}
                className="text-indigo-600 text-sm font-bold hover:underline cursor-pointer"
              >
                Ver Todos
              </button>
            </div>
            {sortedUsersByScore.length > 0 ? (
              <div className="space-y-4 md:space-y-6">
                {sortedUsersByScore.slice(0, 3).map((user, idx) => (
                  <div key={user.id} className="flex items-center gap-3 md:gap-4">
                    <span className="text-lg font-black text-slate-300 w-5 md:w-6">0{idx + 1}</span>
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-10 h-10 rounded-xl object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{user.name}</p>
                      <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-500" 
                          style={{ width: `${(user.performanceScore / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-black text-primary">{user.performanceScore.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <p className="text-sm">Nenhum colaborador encontrado</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Carregando dashboard...</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
