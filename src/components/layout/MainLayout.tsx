import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-[#F5F1EB] p-4 lg:p-6 overflow-hidden">
      {/* Sidebar - Fixed width */}
      <div className="w-64 flex-shrink-0 sticky top-0 h-[calc(100vh-3rem)]">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 bg-white rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col relative">
        {/* Decorative Background covers full width */}
        <div className="absolute inset-y-0 left-0 w-full bg-[#FDFBF7] z-0"></div>

        <div className="relative z-10 flex flex-col h-full overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
