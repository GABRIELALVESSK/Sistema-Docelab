import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { CompletarCadastroModal } from "../auth/CompletarCadastroModal";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-[#F5F1EB] dark:bg-gray-900 p-4 lg:p-6 overflow-hidden transition-colors">
      <CompletarCadastroModal />

      {/* Sidebar - Fixed width */}
      <div className="w-64 flex-shrink-0 sticky top-0 h-[calc(100vh-3rem)]">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col relative transition-colors">
        {/* Decorative Background covers full width */}
        <div className="absolute inset-y-0 left-0 w-full bg-[#FDFBF7] dark:bg-gray-800 z-0 transition-colors"></div>

        <div className="relative z-10 flex flex-col h-full overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}

