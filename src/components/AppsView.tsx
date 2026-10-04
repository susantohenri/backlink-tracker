import React, { useState } from 'react';
import type { AndroidApp, Submission, AppFormData } from '../types';
import { createApp, updateApp, deleteApp } from '../services/storage';
import { Plus, Search, Trash2, Edit2, ExternalLink, AlertTriangle, X, Check, Smartphone } from 'lucide-react';

interface AppsViewProps {
  apps: AndroidApp[];
  submissions: Submission[];
}

export const AppsView: React.FC<AppsViewProps> = ({ apps, submissions }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [playStoreUrl, setPlayStoreUrl] = useState('');
  const [landingPageUrl, setLandingPageUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Search & Feedback
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setPlayStoreUrl('');
    setLandingPageUrl('');
    setNotes('');
    setEditingId(null);
    setShowCreateForm(false);
    setErrorMsg(null);
  };

  const handleOpenCreate = () => {
    setName('');
    setPlayStoreUrl('');
    setLandingPageUrl('');
    setNotes('');
    setEditingId(null);
    setShowCreateForm(true);
    setErrorMsg(null);
  };

  const handleOpenEdit = (app: AndroidApp) => {
    setName(app.name);
    setPlayStoreUrl(app.playStoreUrl || '');
    setLandingPageUrl(app.landingPageUrl || '');
    setNotes(app.notes || '');
    setEditingId(app.id);
    setShowCreateForm(true);
    setErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('App name is required');
      return;
    }

    try {
      setSubmitting(true);
      const data: AppFormData = {
        name: name.trim(),
        playStoreUrl: playStoreUrl.trim(),
        landingPageUrl: landingPageUrl.trim(),
        notes: notes.trim(),
      };

      if (editingId) {
        await updateApp(editingId, data);
        setSuccessMsg('Android App updated successfully.');
      } else {
        await createApp(data);
        setSuccessMsg('Android App created successfully.');
      }
      resetForm();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setErrorMsg(null);
      await deleteApp(id, submissions);
      setDeletingId(null);
      setSuccessMsg('Android App deleted successfully.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete app.');
    }
  };

  // Submission count map per app (derived)
  const submissionCountMap = new Map<string, number>();
  submissions.forEach((s) => {
    submissionCountMap.set(s.appId, (submissionCountMap.get(s.appId) || 0) + 1);
  });

  // Filtered apps based on search query
  const filteredApps = apps.filter((app) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      app.name.toLowerCase().includes(q) ||
      (app.playStoreUrl || '').toLowerCase().includes(q) ||
      (app.landingPageUrl || '').toLowerCase().includes(q) ||
      (app.notes || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Android Applications</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your Android apps portfolio. Each app can be linked to multiple website backlink submissions.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          data-testid="btn-add-app"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Android App
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div data-testid="app-error-alert" className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 dark:text-rose-400 hover:text-rose-900 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div data-testid="app-success-alert" className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Collapsible Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 rounded-xl p-5 shadow-xs relative transition-colors" data-testid="app-form-card">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {editingId ? 'Edit Android App' : 'Add New Android App'}
            </h3>
            <button
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  App Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Habit Tracker Pro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-app-name"
                  className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Play Store URL
                </label>
                <input
                  type="text"
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  value={playStoreUrl}
                  onChange={(e) => setPlayStoreUrl(e.target.value)}
                  data-testid="input-app-url"
                  className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Landing Page URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={landingPageUrl}
                  onChange={(e) => setLandingPageUrl(e.target.value)}
                  data-testid="input-app-landing-url"
                  className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                placeholder="Target keywords, package ID, or other notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-app-notes"
                className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                data-testid="btn-submit-app"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingId ? 'Update App' : 'Save App'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search apps by name, URL, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-apps"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Total: {apps.length} {apps.length === 1 ? 'App' : 'Apps'}
        </span>
      </div>

      {/* Apps Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {filteredApps.length === 0 ? (
          <div className="p-12 text-center" data-testid="apps-empty-state">
            <Smartphone className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Android Apps found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {apps.length === 0
                ? 'Add your first Android app to begin tracking backlinks.'
                : 'No apps matched your search.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid="apps-table">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">App Name</th>
                  <th className="py-3 px-4">Play Store URL</th>
                  <th className="py-3 px-4">Landing Page URL</th>
                  <th className="py-3 px-4 text-center">Submissions</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredApps.map((app) => {
                  const subCount = submissionCountMap.get(app.id) || 0;
                  return (
                    <tr
                      key={app.id}
                      data-testid={`app-row-${app.id}`}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white" data-testid={`app-name-${app.id}`}>
                        {app.name}
                      </td>

                      <td className="py-3 px-4 text-xs">
                        {app.playStoreUrl ? (
                          <a
                            href={app.playStoreUrl.startsWith('http') ? app.playStoreUrl : `https://${app.playStoreUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            View on Play Store
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs" data-testid={`app-landing-url-${app.id}`}>
                        {app.landingPageUrl ? (
                          <a
                            href={app.landingPageUrl.startsWith('http') ? app.landingPageUrl : `https://${app.landingPageUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            Visit Landing Page
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      {/* Related Submission Count (Derived) */}
                      <td className="py-3 px-4 text-center">
                        <span
                          data-testid={`app-sub-count-${app.id}`}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            subCount > 0
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {subCount} {subCount === 1 ? 'submission' : 'submissions'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate" title={app.notes}>
                        {app.notes || <span className="text-slate-400 italic">-</span>}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(app)}
                            data-testid={`btn-edit-app-${app.id}`}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded cursor-pointer transition-colors"
                            title="Edit App"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {deletingId === app.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(app.id)}
                                data-testid={`btn-confirm-delete-app-${app.id}`}
                                className="px-2 py-1 bg-rose-600 text-white text-xs font-semibold rounded hover:bg-rose-700 cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (subCount > 0) {
                                  setErrorMsg(
                                    `Cannot delete "${app.name}" because it is used in ${subCount} submission(s). Please delete or reassign those submissions first.`
                                  );
                                } else {
                                  setDeletingId(app.id);
                                }
                              }}
                              data-testid={`btn-delete-app-${app.id}`}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer transition-colors"
                              title={
                                subCount > 0
                                  ? `Blocked: used in ${subCount} submission(s)`
                                  : 'Delete App'
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
