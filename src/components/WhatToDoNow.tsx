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
    setActionError(null);
  };

  const handleQuickStatusChange = async (sub: Submission, newStatus: SubmissionStatus) => {
    try {
      setActionError(null);
      const updates: { status: SubmissionStatus; submissionDate?: string } = { status: newStatus };
      if ((newStatus === 'WAITING' || newStatus === 'APPROVED') && !sub.submissionDate) {
        updates.submissionDate = new Date().toISOString().split('T')[0];
      }
      await updateSubmission(sub.id, updates);
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
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">To Do Queue</p>
            <p data-testid="metric-todo-count" className="text-3xl font-extrabold text-amber-900 mt-1">
              {todoCount}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Ready for submission</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Waiting</p>
            <p data-testid="metric-waiting-count" className="text-3xl font-extrabold text-blue-900 mt-1">
              {waitingCount}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Submitted, pending review</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Approved</p>
            <p data-testid="metric-approved-count" className="text-3xl font-extrabold text-emerald-900 mt-1">
              {approvedCount}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Live backlinks</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Rejected</p>
            <p data-testid="metric-rejected-count" className="text-3xl font-extrabold text-rose-900 mt-1">
              {rejectedCount}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Declined / invalid</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <X className="w-6 h-6" />
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Work Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">What To Do Now</h2>
            <p className="text-xs text-slate-500">
              Daily execution queue: {todoCount} tasks waiting to submit, {waitingCount} awaiting approval.
            </p>
          </div>
          <button
            onClick={() => onNavigate('submissions')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center self-start sm:self-auto cursor-pointer"
          >
            Manage all submissions <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="p-12 text-center" data-testid="queue-empty-state">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">All caught up!</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              There are no pending submissions in the queue right now. You can create new submissions or add more target websites.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={() => onNavigate('apps')}
                className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                + Add App
              </button>
              <button
                onClick={() => onNavigate('websites')}
                className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                + Add Website
              </button>
              <button
                onClick={() => onNavigate('submissions')}
                className="px-3.5 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 cursor-pointer"
              >
                + Create Submission
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queue.map((sub) => {
              const app = appMap.get(sub.appId);
              const website = websiteMap.get(sub.websiteId);
              const isEditing = editingId === sub.id;

              return (
                <div
                  key={sub.id}
                  data-testid={`queue-item-${sub.id}`}
                  className={`p-5 transition-colors ${
                    sub.status === 'TODO' ? 'bg-white hover:bg-amber-50/30' : 'bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={sub.status} />
                        <span className="font-bold text-slate-900 text-base" data-testid={`queue-item-app-${sub.id}`}>
                          {app ? app.name : <span className="text-rose-500 italic">Unknown App</span>}
                        </span>
                        <span className="text-slate-400">×</span>
                        <span className="font-semibold text-slate-800 text-base inline-flex items-center gap-1.5" data-testid={`queue-item-website-${sub.id}`}>
                          <span>{website ? website.name : <span className="text-rose-500 italic">Unknown Website</span>}</span>
                          {typeof website?.dr === 'number' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              DR {website.dr}
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {website?.url && (
                          <a
                            href={website.url.startsWith('http') ? website.url : `https://${website.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
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
                            className="inline-flex items-center text-slate-500 hover:text-slate-800 hover:underline"
                          >
                            Play Store URL
                          </a>
                        )}
                        {sub.submissionDate && (
                          <span>Submitted on: <strong className="text-slate-700">{sub.submissionDate}</strong></span>
                        )}
                      </div>

                      {sub.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-200/60 max-w-2xl">
                          <strong className="text-slate-700">Notes:</strong> {sub.notes}
                        </p>
                      )}
                    </div>

                    {/* Quick action buttons / Edit inline */}
                    <div className="flex items-center gap-2 self-start lg:self-center">
                      <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button
                          title="Mark TODO"
                          onClick={() => handleQuickStatusChange(sub, 'TODO')}
                          data-testid={`quick-status-todo-${sub.id}`}
                          className={`px-2 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                            sub.status === 'TODO' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          TODO
                        </button>
                        <button
                          title="Mark WAITING"
                          onClick={() => handleQuickStatusChange(sub, 'WAITING')}
                          data-testid={`quick-status-waiting-${sub.id}`}
                          className={`px-2 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                            sub.status === 'WAITING' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          WAITING
                        </button>
                        <button
                          title="Mark APPROVED"
                          onClick={() => handleQuickStatusChange(sub, 'APPROVED')}
                          data-testid={`quick-status-approved-${sub.id}`}
                          className={`px-2 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                            sub.status === 'APPROVED' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          APPROVED
                        </button>
                        <button
                          title="Mark REJECTED"
                          onClick={() => handleQuickStatusChange(sub, 'REJECTED')}
                          data-testid={`quick-status-rejected-${sub.id}`}
                          className={`px-2 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                            sub.status === 'REJECTED' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          REJECTED
                        </button>
                      </div>

                      <button
                        onClick={() => (isEditing ? setEditingId(null) : handleStartEdit(sub))}
                        data-testid={`edit-queue-item-${sub.id}`}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                        title="Edit Submission details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Edit Drawer */}
                  {isEditing && (
                    <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as SubmissionStatus)}
                            data-testid={`edit-status-select-${sub.id}`}
                            className="w-full text-xs rounded-md border border-slate-300 bg-white py-1.5 px-2 focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="TODO">TODO</option>
                            <option value="WAITING">WAITING</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Submission Date</label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            data-testid={`edit-date-input-${sub.id}`}
                            className="w-full text-xs rounded-md border border-slate-300 bg-white py-1.5 px-2 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                          <input
                            type="text"
                            placeholder="Add brief notes..."
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            data-testid={`edit-notes-input-${sub.id}`}
                            className="w-full text-xs rounded-md border border-slate-300 bg-white py-1.5 px-2 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded cursor-pointer"
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
