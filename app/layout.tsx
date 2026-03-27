import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AppProvider } from '@/lib/store';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'NEXUS - Gestão de Equipe SaaS',
  description: 'Gestão de equipe e produtividade',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className="bg-surface text-on-surface antialiased overflow-x-hidden">
        <AppProvider>
          <Sidebar />
          <div className="md:ml-64 min-h-screen">
            {children}
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
