'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Topbar } from '@/components/Topbar';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  isToday, parseISO, startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Users, BookOpen, X, Clock, ListFilter, Coffee } from 'lucide-react';

interface DayEvent {
  id: string;
  type: 'training' | 'task';
  title: string;
  description?: string;
  time?: string;
  userName?: string;
}

type FilterType = 'all' | 'tasks' | 'trainings';

export default function CalendarPage() {
  const { tasks, trainings, users } = useAppStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const getDateKey = (date: Date) => format(startOfDay(date), 'yyyy-MM-dd');

  const eventsByDate = useMemo(() => {
    const events: Record<string, DayEvent[]> = {};
    
    tasks.forEach(task => {
      const dateStr = task.dueDate.split('T')[0];
      const dateKey = format(parseISO(dateStr + 'T00:00:00'), 'yyyy-MM-dd');
      const user = users.find(u => u.id === task.assignedUserId);
      if (!events[dateKey]) events[dateKey] = [];
      events[dateKey].push({
        id: task.id,
        type: 'task',
        title: task.title,
        description: task.description,
        userName: user?.name,
      });
    });
    
    trainings.forEach(training => {
      const dateStr = training.date.split('T')[0];
      const dateKey = format(parseISO(dateStr + 'T00:00:00'), 'yyyy-MM-dd');
      if (!events[dateKey]) events[dateKey] = [];
      events[dateKey].push({
        id: training.id,
        type: 'training',
        title: training.title,
        description: training.description,
        time: `${training.duration}min`,
        userName: training.instructor,
      });
    });
    
    return events;
  }, [tasks, trainings, users]);

  const filteredEventsByDate = useMemo(() => {
    if (filter === 'all') return eventsByDate;
    
    const filtered: Record<string, DayEvent[]> = {};
    Object.entries(eventsByDate).forEach(([dateKey, events]) => {
      const filteredEvents = events.filter(e => 
        filter === 'tasks' ? e.type === 'task' : e.type === 'training'
      );
      if (filteredEvents.length > 0) {
        filtered[dateKey] = filteredEvents;
      }
    });
    return filtered;
  }, [eventsByDate, filter]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = getDateKey(selectedDate);
    const events = filteredEventsByDate[dateKey] || [];
    return events;
  }, [selectedDate, filteredEventsByDate]);

  const getDayEvents = (day: Date) => {
    const dateKey = getDateKey(day);
    return filteredEventsByDate[dateKey] || [];
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getCountBadge = (events: DayEvent[], type: 'task' | 'training') => {
    const count = events.filter(e => e.type === type).length;
    if (count === 0) return null;
    if (count === 1) {
      return (
        <span 
          className={`w-2 h-2 rounded-full ${type === 'training' ? 'bg-blue-500' : 'bg-emerald-500'}`}
          title={type === 'training' ? '1 Treinamento' : '1 Tarefa'}
        />
      );
    }
    return (
      <span 
        className={`
          min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold
          ${type === 'training' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}
        `}
        title={`${count} ${type === 'training' ? 'Treinamentos' : 'Tarefas'}`}
      >
        {count}
      </span>
    );
  };

  return (
    <>
      <Topbar title="Calendário" />
      <main className="pt-24 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto">
        <section className="mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Calendário Interativo</h2>
          <p className="text-slate-500 text-sm">Visualize treinamentos e tarefas da sua equipe.</p>
        </section>

        <div className="bg-surface-lowest rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={handlePrevMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h3 className="text-xl font-bold text-on-surface min-w-[180px] text-center">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h3>
              <button 
                onClick={handleNextMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <ListFilter className="w-4 h-4 text-slate-400" />
              <div className="flex bg-slate-100 rounded-lg p-1">
                {[
                  { value: 'all', label: 'Ver Tudo' },
                  { value: 'tasks', label: 'Tarefas' },
                  { value: 'trainings', label: 'Treinamentos' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value as FilterType)}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-md transition-all
                      ${filter === option.value 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'}
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                const dayEvents = getDayEvents(day);
                const hasEvents = dayEvents.length > 0;
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                
                const trainingCount = dayEvents.filter(e => e.type === 'training').length;
                const taskCount = dayEvents.filter(e => e.type === 'task').length;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative min-h-[80px] p-2 rounded-xl transition-all duration-200 text-left
                      ${isCurrentMonth ? 'bg-white' : 'bg-slate-50'}
                      ${isSelected 
                        ? 'ring-2 ring-primary ring-offset-2 bg-indigo-50' 
                        : 'hover:bg-slate-100 hover:shadow-md hover:scale-[1.02]'}
                      ${isTodayDate && !isSelected ? 'bg-indigo-50' : ''}
                    `}
                  >
                    <span className={`
                      inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold
                      ${isTodayDate ? 'bg-primary text-white' : isCurrentMonth ? 'text-on-surface' : 'text-slate-300'}
                    `}>
                      {format(day, 'd')}
                    </span>
                    
                    {hasEvents && (
                      <div className="mt-2 flex flex-wrap gap-1 justify-center">
                        {getCountBadge(dayEvents, 'training')}
                        {getCountBadge(dayEvents, 'task')}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-slate-600">Treinamentos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600">Tarefas</span>
            </div>
          </div>
        </div>

        {selectedDate && (
          <div className="mt-8 bg-surface-lowest rounded-3xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
              <button 
                onClick={() => setSelectedDate(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-b from-slate-50 to-white rounded-2xl border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <Coffee className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-xl font-bold text-slate-600 mb-2">Dia livre! ✨</p>
                <p className="text-slate-400">Nenhuma atividade agendada para este dia.</p>
                <p className="text-slate-300 text-sm mt-2">Aproveite para relaxar ou planejar novas tarefas!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDayEvents.map(event => (
                  <div 
                    key={event.id}
                    className={`
                      p-4 rounded-xl border transition-all hover:shadow-md hover:scale-[1.01]
                      ${event.type === 'training' 
                        ? 'bg-blue-50 border-blue-100' 
                        : 'bg-emerald-50 border-emerald-100'}
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`
                        p-2 rounded-lg
                        ${event.type === 'training' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}
                      `}>
                        {event.type === 'training' ? (
                          <BookOpen className="w-5 h-5" />
                        ) : (
                          <Users className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`
                            text-[10px] font-bold uppercase px-2 py-0.5 rounded-full
                            ${event.type === 'training' ? 'bg-blue-200 text-blue-700' : 'bg-emerald-200 text-emerald-700'}
                          `}>
                            {event.type === 'training' ? 'Treinamento' : 'Tarefa'}
                          </span>
                          {event.time && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.time}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-on-surface">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-slate-500 mt-1">{event.description}</p>
                        )}
                        {event.userName && (
                          <p className="text-xs text-slate-400 mt-2">
                            Responsável: <span className="font-medium text-slate-600">{event.userName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}