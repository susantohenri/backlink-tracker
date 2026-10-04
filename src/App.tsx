import { useState, useEffect } from 'react';
import type { AndroidApp, Website, Submission, TabType } from './types';
import { subscribeApps, subscribeWebsites, subscribeSubmissions } from './services/storage';
import { Navbar } from './components/Navbar';
import { WhatToDoNow } from './components/WhatToDoNow';
import { SubmissionsView } from './components/SubmissionsView';
import { AppsView } from './components/AppsView';
import { WebsitesView } from './components/WebsitesView';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('todo');
  const [apps, setApps] = useState<AndroidApp[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Synchronize activeTab with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as TabType;
      if (['todo', 'submissions', 'apps', 'websites'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Real-time data subscriptions
  useEffect(() => {
    let appsLoaded = false;
    let websitesLoaded = false;
    let submissionsLoaded = false;

    const checkAllLoaded = () => {
      if (appsLoaded && websitesLoaded && submissionsLoaded) {
        setLoading(false);
      }
    };

    const unsubApps = subscribeApps((data) => {
      setApps(data);
      appsLoaded = true;
      checkAllLoaded();
    });

    const unsubWebsites = subscribeWebsites((data) => {
      setWebsites(data);
      websitesLoaded = true;
      checkAllLoaded();
    });

    const unsubSubmissions = subscribeSubmissions((data) => {
      setSubmissions(data);
      submissionsLoaded = true;
      checkAllLoaded();
    });

    return () => {
      unsubApps();
      unsubWebsites();
      unsubSubmissions();
    };
  }, []);

  const todoCount = submissions.filter((s) => s.status === 'TODO').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        todoCount={todoCount}
        totalSubmissions={submissions.length}
        totalApps={apps.length}
        totalWebsites={websites.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20" data-testid="loading-state">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-600">Connecting to Backlink Tracker database...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'todo' && (
              <WhatToDoNow
                apps={apps}
                websites={websites}
                submissions={submissions}
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  window.location.hash = tab;
                }}
              />
            )}

            {activeTab === 'submissions' && (
              <SubmissionsView apps={apps} websites={websites} submissions={submissions} />
            )}

            {activeTab === 'apps' && <AppsView apps={apps} submissions={submissions} />}

            {activeTab === 'websites' && <WebsitesView websites={websites} submissions={submissions} />}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>Personal Android App Backlink Tracker • Designed for productivity</p>
      </footer>
    </div>
  );
}

export default App;
