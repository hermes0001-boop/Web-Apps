
import React from 'react';
import { Task } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  pinnedLinks?: Task[];
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout, pinnedLinks = [] }) => {
  const navItems = [
    { id: 'daily', icon: 'fa-calendar-day', label: 'Daily (PARA)' },
    { id: 'projects', icon: 'fa-diagram-project', label: 'Projects' },
    { id: 'google', icon: 'fa-google', label: 'Sync' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar for Desktop */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col fixed md:relative bottom-0 md:bottom-auto z-50 h-auto md:h-screen">
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent italic">
            PARA Nexus
          </h1>
        </div>
        
        <nav className="flex md:flex-col flex-row justify-around md:justify-start flex-1 px-4 md:px-2 pb-4 overflow-y-auto">
          <div className="flex md:flex-col flex-row w-full space-x-2 md:space-x-0">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 flex-1 md:flex-none ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <i className={`fas ${item.icon} text-lg`}></i>
                <span className="font-bold text-sm md:text-base">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Access Section - Desktop Only */}
          <div className="hidden md:block mt-10 px-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Access</h3>
            <div className="space-y-2">
              {pinnedLinks.length > 0 ? pinnedLinks.map(link => (
                <a 
                  key={link.id}
                  href={link.title}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 group transition-all"
                  title={link.title}
                >
                  <div className="w-6 h-6 rounded bg-white shadow-sm border border-slate-100 flex items-center justify-center p-1">
                    <img src={link.linkMetadata?.favicon} alt="f" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-700 truncate">{link.linkMetadata?.displayTitle}</span>
                    <span className="text-[9px] text-blue-500 font-black">para.nx/{link.linkMetadata?.slug}</span>
                  </div>
                </a>
              )) : (
                <p className="text-[10px] text-slate-300 italic px-2">핀으로 고정한 링크가 없습니다.</p>
              )}
            </div>
          </div>

          {/* Logout button at the bottom for desktop */}
          <div className="mt-auto hidden md:block p-2 border-t border-slate-50">
             <button 
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-all font-bold text-sm"
             >
               <i className="fas fa-power-off"></i>
               <span>Lock Session</span>
             </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 mb-20 md:mb-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
