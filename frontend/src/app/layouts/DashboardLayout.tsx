import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppContext } from '@/app/providers/AppStateProvider';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import CreateTaskModal from '@/features/tasks/components/CreateTaskModal.tsx';
import { cn } from '@/lib/utils';

export default function DashboardLayout() {
  const { sidebarCollapsed } = useAppContext();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <Sidebar />
      <TopHeader onCreateNew={() => setShowCreate(true)} />
      <main className={cn(
        "pt-[61px] min-h-screen transition-all duration-300",
        sidebarCollapsed ? "pl-[72px]" : "pl-[256px]"
      )}>
        <div className="p-5">
          <Outlet />
        </div>
      </main>
      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
