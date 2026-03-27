import { Search, Bell, Menu } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function Topbar({ title = "Painel de Controle" }: { title?: string }) {
  const { setMobileMenuOpen } = useAppStore();

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm shadow-slate-200/50 dark:shadow-none">
      <div className="flex justify-between items-center px-4 md:px-6 py-4 max-w-full">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg md:hidden transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-['Inter'] text-lg font-semibold tracking-tight text-on-surface md:block hidden">
            {title}
          </h1>
          <div className="relative w-full max-w-md ml-4 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar tarefas, membros ou relatórios..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
          </button>
          <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcBL1lspFHQzM77O11-hM7xD06S5g10MR8VdDBNTucT7XRZdIyJ0vaXxx0EH1nwxMFyIANUJ0RIvPQkgG_PhIPVSfRpy9gef7W9iIDeA6l6LbVct8oSH0225HHHq1gkyHrVeO8w76eDQ_01OAP8IuL3xg1EljQXFc9U7lCh5THsisPCwRlx8djqAnukfERFnybe1Ppsbhd8cGguHv1Pdmox-4HIafBeQZSWArlrtixoV3s8i3un6fWLeMfJLqlMpykBZPYWuuzQ8yP" 
            alt="Avatar" 
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
