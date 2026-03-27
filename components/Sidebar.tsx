'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, LayoutDashboard, Users, BrainCircuit, CheckSquare, BarChart3, Flag, X, Settings, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Equipe', href: '/team', icon: Users },
  { name: 'Calendário', href: '/calendar', icon: Calendar },
  { name: 'Matriz de Competências', href: '/matrix', icon: BrainCircuit },
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  { name: 'Metas', href: '/goals', icon: Flag },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileMenuOpen, setMobileMenuOpen } = useAppStore();

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300",
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-slate-50 dark:bg-slate-950 z-50 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full py-8">
          <div className="px-6 mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <BrainCircuit className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tighter text-indigo-700 dark:text-indigo-400">
                NEXUS.
              </span>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 -mr-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg md:hidden transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
                  isActive 
                    ? "text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/20 font-semibold shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-slate-400")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-6 mt-auto">
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcBL1lspFHQzM77O11-hM7xD06S5g10MR8VdDBNTucT7XRZdIyJ0vaXxx0EH1nwxMFyIANUJ0RIvPQkgG_PhIPVSfRpy9gef7W9iIDeA6l6LbVct8oSH0225HHHq1gkyHrVeO8w76eDQ_01OAP8IuL3xg1EljQXFc9U7lCh5THsisPCwRlx8djqAnukfERFnybe1Ppsbhd8cGguHv1Pdmox-4HIafBeQZSWArlrtixoV3s8i3un6fWLeMfJLqlMpykBZPYWuuzQ8yP" 
              alt="Ana Silva" 
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-on-surface truncate">Ana Silva</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Gestora de Projetos</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </>
);
}
