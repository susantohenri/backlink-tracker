import React from 'react';
import type { TabType } from '../types';
import { CheckSquare, ListOrdered, Smartphone, Globe, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  todoCount: number;
  totalSubmissions: number;
  totalApps: number;
  totalWebsites: number;
  isDark: boolean;
  toggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  todoCount,
  totalSubmissions,
  totalApps,
  totalWebsites,
  isDark,
  toggleDarkMode,
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
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-bold shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Backlink Tracker</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Android App Backlink Queue</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Navigation Tabs */}
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
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
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
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                            : tab.highlightCount
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Dark Mode Switch in Top Right */}
            <div className="flex items-center pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={toggleDarkMode}
                data-testid="btn-toggle-dark-mode"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-200 dark:bg-slate-700 transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                <span className="sr-only">Toggle Dark Mode</span>
                <span
                  className={`pointer-events-none flex h-7 w-7 transform items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-md ring-0 transition duration-200 ease-in-out ${
                    isDark ? 'translate-x-6' : 'translate-x-0'
                  }`}
                >
                  {isDark ? (
                    <Moon className="h-3.5 w-3.5 text-indigo-400" />
                  ) : (
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
