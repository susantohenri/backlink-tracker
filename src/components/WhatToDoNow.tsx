import React, { useState } from 'react';
import type { AndroidApp, Website, Submission, SubmissionStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { updateSubmission } from '../services/storage';
import { ExternalLink, CheckCircle2, Clock, Check, AlertCircle, ArrowRight, Edit3, X, Save } from 'lucide-react';

interface WhatToDoNowProps {
  apps: AndroidApp[];
  websites: Website[];
  submissions: Submission[];
  onNavigate: (tab: 'apps' | 'websites' | 'submissions') => void;
}

export const WhatToDoNow: React.FC<WhatToDoNowProps> = ({
  apps,
  websites,
  submissions,
  onNavigate,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<SubmissionStatus>('TODO');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editPostUrl, setEditPostUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // App & Website map for quick resolution
  const appMap = new Map<string, AndroidApp>(apps.map((a) => [a.id, a]));
  const websiteMap = new Map<string, Website>(websites.map((w) => [w.id, w]));

  // Calculate derived counts
  const todoCount = submissions.filter((s) => s.status === 'TODO').length;
  const waitingCount = submissions.filter((s) => s.status === 'WAITING').length;
  const approvedCount = submissions.filter((s) => s.status === 'APPROVED').length;
  const rejectedCount = submissions.filter((s) => s.status === 'REJECTED').length;

  // Queue prioritization: TODO first, WAITING second
  const todoItems = submissions.filter((s) => s.status === 'TODO');
  const waitingItems = submissions.filter((s) => s.status === 'WAITING');
  const queue = [...todoItems, ...waitingItems];

  const handleStartEdit = (sub: Submission) => {
    setEditingId(sub.id);
    setEditStatus(sub.status);
    setEditNotes(sub.notes || '');
    setEditDate(sub.submissionDate || '');
    setEditPostUrl(sub.postUrl || '');
    setActionError(null);
  };

  const handleQuickStatusChange = async (sub: Submission, newStatus: SubmissionStatus) => {
    try {
      setActionError(null);
      // User requirement: Do NOT automatically take today's date
      await updateSubmission(sub.id, { status: newStatus });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      setSaving(true);
      setActionError(null);
      await updateSubmission(id, {
        status: editStatus,
        notes: editNotes,
        submissionDate: editDate,
        postUrl: editPostUrl.trim(),
      });
      setEditingId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">To Do Queue</p>
            <p data-testid="metric-todo-count" className="text-3xl font-extrabold text-amber-900 dark:text-amber-200 mt-1">
              {todoCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ready for submission</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-lg text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Waiting</p>
            <p data-testid="metric-waiting-count" className="text-3xl font-extrabold text-blue-900 dark:text-blue-200 mt-1">
              {waitingCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Submitted, pending review</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Approved</p>
            <p data-testid="metric-approved-count" className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-200 mt-1">
              {approvedCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Live backlinks</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Rejected</p>
            <p data-testid="metric-rejected-count" className="text-3xl font-extrabold text-rose-900 dark:text-rose-200 mt-1">
              {rejectedCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Declined / invalid</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-lg text-rose-600 dark:text-rose-400">
            <X className="w-6 h-6" />
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-lg text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-600 dark:text-rose-400 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Work Queue */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">What To Do Now</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily execution queue: {todoCount} tasks waiting to submit, {waitingCount} awaiting approval.
            </p>
          </div>
          <button
            onClick={() => onNavigate('submissions')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center self-start sm:self-auto cursor-pointer"
          >
            Manage all submissions <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="p-12 text-center" data-testid="queue-empty-state">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">All caught up!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              There are no pending submissions in the queue right now. You can create new submissions or add more target websites.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={() => onNavigate('apps')}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer"
              >
                + Add App
              </button>
              <button
                onClick={() => onNavigate('websites')}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer"
              >
                + Add Website
              </button>
              <button
                onClick={() => onNavigate('submissions')}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg cursor-pointer"
              >
                + Create Submission
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {queue.map((sub) => {
              const app = appMap.get(sub.appId);
              const website = websiteMap.get(sub.websiteId);
              const isEditing = editingId === sub.id;

              return (
                <div
                  key={sub.id}
                  data-testid={`queue-item-${sub.id}`}
                  className={`p-5 transition-colors ${
                    sub.status === 'TODO'
                      ? 'bg-white dark:bg-slate-900 hover:bg-amber-50/30 dark:hover:bg-amber-950/20'
                      : 'bg-slate-50/40 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={sub.status} />
                        <span className="font-bold text-slate-900 dark:text-white text-base" data-testid={`queue-item-app-${sub.id}`}>
                          {app ? app.name : <span className="text-rose-500 italic">Unknown App</span>}
                        </span>
                        <span className="text-slate-400">×</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-base inline-flex items-center gap-1.5" data-testid={`queue-item-website-${sub.id}`}>
                          <span>{website ? website.name : <span className="text-rose-500 italic">Unknown Website</span>}</span>
                          {typeof website?.dr === 'number' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              DR {website.dr}
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        {website?.url && (
                          <a
                            href={website.url.startsWith('http') ? website.url : `https://${website.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline font-medium"
                            data-testid={`queue-item-link-${sub.id}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            {website.url}
                          </a>
                        )}
                        {app?.playStoreUrl && (
                          <a
                            href={app.playStoreUrl.startsWith('http') ? app.playStoreUrl : `https://${app.playStoreUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:underline"
                          >
                            Play Store URL
                          </a>
                        )}
                        {sub.postUrl && (
                          <a
                            href={sub.postUrl.startsWith('http') ? sub.postUrl : `https://${sub.postUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline font-medium"
                            title={sub.postUrl}
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            Live Post URL
                          </a>
                        )}
                        {sub.submissionDate && (
                          <span>Submitted on: <strong className="text-slate-700 dark:text-slate-300">{sub.submissionDate}</strong></span>
                        )}
                      </div>

                      {website?.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50/70 dark:bg-slate-800/60 p-2 rounded-md border border-slate-200/50 dark:border-slate-700/60 max-w-2xl">
                          <strong className="text-slate-600 dark:text-slate-300 not-italic">Website Note:</strong> {website.notes}
                        </p>
                      )}

                      {sub.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-2 rounded-md border border-slate-200/60 dark:border-slate-700 max-w-2xl">
                          <strong className="text-slate-700 dark:text-slate-200">Notes:</strong> {sub.notes}
                        </p>
                      )}
                    </div>

                    {/* Quick action buttons / Edit inline */}
                    <div className="flex items-center gap-2 self-start lg:self-center">
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                        <button
                          title="Mark TODO"
                          onClick={() => handleQuickStatusChange(sub, 'TODO')}
                          data-testid={`quick-status-todo-${sub.id}`}
                          className={`px-2 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                            sub.status === 'TODO'
                              ? 'bg-amber-500 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          TODO
                        </button>
                        <button
                          title="Mark WAITING"
                          onClick={() => handleQuickStatusChange(sub, 'WAITING')}
                          data-testid={`quick-status-waiting-${sub.id}`}
                          className={`px-2 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                            sub.status === 'WAITING'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          WAITING
                        </button>
                        <button
                          title="Mark APPROVED"
                          onClick={() => handleQuickStatusChange(sub, 'APPROVED')}
                          data-testid={`quick-status-approved-${sub.id}`}
                          className={`px-2 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                            sub.status === 'APPROVED'
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          APPROVED
                        </button>
                        <button
                          title="Mark REJECTED"
                          onClick={() => handleQuickStatusChange(sub, 'REJECTED')}
                          data-testid={`quick-status-rejected-${sub.id}`}
                          className={`px-2 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                            sub.status === 'REJECTED'
                              ? 'bg-rose-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          REJECTED
                        </button>
                      </div>

                      <button
                        onClick={() => (isEditing ? setEditingId(null) : handleStartEdit(sub))}
                        data-testid={`edit-queue-item-${sub.id}`}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                        title="Edit Submission details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Edit Drawer */}
                  {isEditing && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as SubmissionStatus)}
                            data-testid={`edit-status-select-${sub.id}`}
                            className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1.5 px-2 focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="TODO">TODO</option>
                            <option value="WAITING">WAITING</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Submission Date</label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            data-testid={`edit-date-input-${sub.id}`}
                            className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1.5 px-2 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Post URL</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={editPostUrl}
                            onChange={(e) => setEditPostUrl(e.target.value)}
                            data-testid={`edit-post-url-input-${sub.id}`}
                            className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1.5 px-2 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                          <input
                            type="text"
                            placeholder="Add brief notes..."
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            data-testid={`edit-notes-input-${sub.id}`}
                            className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1.5 px-2 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleSaveEdit(sub.id)}
                          data-testid={`save-edit-button-${sub.id}`}
                          className="inline-flex items-center px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded cursor-pointer disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5 mr-1" />
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
