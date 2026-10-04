import { useState, useEffect } from 'react';
import type { AndroidApp, Website, Submission, TabType } from './types';
import { subscribeApps, subscribeWebsites, subscribeSubmissions } from './services/storage';
import { Navbar } from './components/Navbar';
import { WhatToDoNow } from './components/WhatToDoNow';
import { SubmissionsView } from './components/SubmissionsView';
import { AppsView } from './components/AppsView';
import { WebsitesView } from './components/WebsitesView';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('todo');
  const [apps, setApps] = useState<AndroidApp[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    let settled = false;

    const done = () => {
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    };

    const checkAllLoaded = () => {
      if (appsLoaded && websitesLoaded && submissionsLoaded) {
        done();
      }
    };

    // Safety timeout: if Firestore doesn't respond in 10s (e.g. bad rules / offline),
    // stop loading and show an actionable error message instead of hanging forever.
    const timeoutId = setTimeout(() => {
      if (!settled) {
        setLoadError(
          'Could not connect to Firebase. Please check: (1) your internet connection, (2) Firebase Console → Firestore → Rules (allow read, write). Then refresh this page.'
        );
        done();
      }
    }, 10000);

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
      clearTimeout(timeoutId);
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
          <div className="flex flex-col items-center justify-center py-32" data-testid="loading-state">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-600">Connecting to Firestore database...</p>
            <p className="text-xs text-slate-400 mt-1">If this takes too long, check your Firebase Firestore Rules.</p>
          </div>
        ) : (
          <div>
            {/* Show error banner if Firestore timed out, but still render the app */}
            {loadError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-rose-800">Firebase Connection Error</p>
                  <p className="text-xs text-rose-700 mt-0.5">{loadError}</p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Retry
                </button>
              </div>
            )}

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
