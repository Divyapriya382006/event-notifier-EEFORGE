import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, Calendar, CheckSquare, User, 
  Calculator, MessageSquare, LogOut, Award, Zap
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
}

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', events: 'Events', tasks: 'My Tasks',
  timetable: 'Timetable', od: 'OD Calculator', portfolio: 'Portfolio',
  'verified-clg': 'College Events', 'verified-club': 'Club Events', forum: 'Forums'
};

export default function Layout({ children, activeTab, setActiveTab, user, onLogout }: LayoutProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'od', label: 'OD Calculator', icon: Calculator },
    { id: 'portfolio', label: 'Portfolio', icon: User },
    { id: 'verified-clg', label: 'College Events', icon: Award },
    { id: 'verified-club', label: 'Club Events', icon: Zap },
    { id: 'forum', label: 'Forums', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-[#E4E3E0] text-[#141414] font-sans">
      <aside className="w-64 border-r border-[#141414] flex flex-col">
        <div className="p-6 border-b border-[#141414]">
          <h1 className="text-2xl font-serif italic font-bold tracking-tight">EventPulse</h1>
          
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors duration-200 ${
                activeTab === item.id ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'
              }`}>
              <item.icon size={18} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#141414]">
          <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] flex items-center justify-center text-xs font-bold">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user?.name}</p>
              <p className="text-[10px] opacity-50 truncate uppercase tracking-tighter">{user?.role}</p>
            </div>
          </div>
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-2 py-2 text-xs hover:bg-red-500/10 text-red-600 transition-colors">
            <LogOut size={14} /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-[#141414] flex items-center px-8 bg-white/50 backdrop-blur-sm">
          <h2 className="text-lg font-serif italic">{TAB_LABELS[activeTab] || activeTab}</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}