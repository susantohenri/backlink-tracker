import React from 'react';
import type { TabType } from '../types';
import { CheckSquare, ListOrdered, Smartphone, Globe } from 'lucide-react';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  todoCount: number;
  totalSubmissions: number;
  totalApps: number;
  totalWebsites: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  todoCount,
  totalSubmissions,
  totalApps,
  totalWebsites,
}) => {
  const tabs: Array<{
    id: TabType;
    label: string;
    icon: React.ReactNode;
    count?: number;
    highlightCount?: boolean;
    testId: string;
  }> = [
    {
      id: 'todo',
      label: 'What To Do Now',
      icon: <CheckSquare className="w-4 h-4 mr-2" />,
      count: todoCount,
      highlightCount: todoCount > 0,
      testId: 'nav-todo',
    },
    {
      id: 'submissions',
      label: 'Submissions',
      icon: <ListOrdered className="w-4 h-4 mr-2" />,
      count: totalSubmissions,
      testId: 'nav-submissions',
    },
    {
      id: 'apps',
      label: 'Android Apps',
      icon: <Smartphone className="w-4 h-4 mr-2" />,
      count: totalApps,
      testId: 'nav-apps',
    },
    {
      id: 'websites',
      label: 'Websites',
      icon: <Globe className="w-4 h-4 mr-2" />,
      count: totalWebsites,
      testId: 'nav-websites',
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Backlink Tracker</h1>
              <p className="text-xs text-slate-500">Android App Backlink Queue</p>
            </div>
          </div>

          <nav className="flex space-x-1" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-testid={tab.testId}
                  onClick={() => {
                    setActiveTab(tab.id);
                    window.location.hash = tab.id;
                  }}
                  className={`inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      data-testid={`${tab.testId}-count`}
                      className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        isActive
                          ? tab.highlightCount
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-700'
                          : tab.highlightCount
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
