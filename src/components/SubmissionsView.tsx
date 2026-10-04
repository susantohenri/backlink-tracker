import React, { useState } from 'react';
import type { AndroidApp, Website, Submission, SubmissionStatus, SubmissionFormData } from '../types';
import { StatusBadge } from './StatusBadge';
import { createSubmission, updateSubmission, deleteSubmission } from '../services/storage';
import { Plus, Search, Filter, Trash2, Edit2, ExternalLink, AlertTriangle, X, Check } from 'lucide-react';

interface SubmissionsViewProps {
  apps: AndroidApp[];
  websites: Website[];
  submissions: Submission[];
}

export const SubmissionsView: React.FC<SubmissionsViewProps> = ({
  apps,
  websites,
  submissions,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [selectedAppId, setSelectedAppId] = useState('');
  const [selectedWebsiteId, setSelectedWebsiteId] = useState('');
  const [formStatus, setFormStatus] = useState<SubmissionStatus>('TODO');
  const [formDate, setFormDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [appFilter, setAppFilter] = useState<string>('ALL');
  const [websiteFilter, setWebsiteFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'app_asc' | 'website_asc' | 'status'>('date_desc');

  // UI feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const appMap = new Map<string, AndroidApp>(apps.map((a) => [a.id, a]));
  const websiteMap = new Map<string, Website>(websites.map((w) => [w.id, w]));

  const resetForm = () => {
    setSelectedAppId(apps[0]?.id || '');
    setSelectedWebsiteId(websites[0]?.id || '');
    setFormStatus('TODO');
    setFormDate('');
    setFormNotes('');
    setEditingId(null);
    setShowCreateForm(false);
    setErrorMsg(null);
  };

  const handleOpenCreate = () => {
    setSelectedAppId(apps[0]?.id || '');
    setSelectedWebsiteId(websites[0]?.id || '');
    setFormStatus('TODO');
    setFormDate('');
    setFormNotes('');
    setEditingId(null);
    setShowCreateForm(true);
    setErrorMsg(null);
  };

  const handleOpenEdit = (sub: Submission) => {
    setSelectedAppId(sub.appId);
    setSelectedWebsiteId(sub.websiteId);
    setFormStatus(sub.status);
    setFormDate(sub.submissionDate || '');
    setFormNotes(sub.notes || '');
    setEditingId(sub.id);
    setShowCreateForm(true);
    setErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedAppId) {
      setErrorMsg('Please select an Android App');
      return;
    }
    if (!selectedWebsiteId) {
      setErrorMsg('Please select a Website');
      return;
    }

    try {
      setSubmitting(true);
      const data: SubmissionFormData = {
        appId: selectedAppId,
        websiteId: selectedWebsiteId,
        status: formStatus,
        submissionDate: formDate,
        notes: formNotes,
      };

      if (editingId) {
        await updateSubmission(editingId, data, submissions);
        setSuccessMsg('Submission updated successfully.');
      } else {
        await createSubmission(data, submissions);
        setSuccessMsg('Submission created successfully.');
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
      await deleteSubmission(id);
      setDeletingId(null);
      setSuccessMsg('Submission deleted successfully.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete submission');
    }
  };

  const handleQuickStatus = async (sub: Submission, newStatus: SubmissionStatus) => {
    try {
      const updates: { status: SubmissionStatus; submissionDate?: string } = { status: newStatus };
      if ((newStatus === 'WAITING' || newStatus === 'APPROVED') && !sub.submissionDate) {
        updates.submissionDate = new Date().toISOString().split('T')[0];
      }
      await updateSubmission(sub.id, updates);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // Filtered & Sorted Submissions
  const filteredSubmissions = submissions
    .filter((sub) => {
      const app = appMap.get(sub.appId);
      const website = websiteMap.get(sub.websiteId);
      const appName = app ? app.name.toLowerCase() : '';
      const websiteName = website ? website.name.toLowerCase() : '';
      const notes = (sub.notes || '').toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch = appName.includes(q) || websiteName.includes(q) || notes.includes(q);
      const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
      const matchesApp = appFilter === 'ALL' || sub.appId === appFilter;
      const matchesWebsite = websiteFilter === 'ALL' || sub.websiteId === websiteFilter;

      return matchesSearch && matchesStatus && matchesApp && matchesWebsite;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === 'app_asc') {
        const nameA = appMap.get(a.appId)?.name || '';
        const nameB = appMap.get(b.appId)?.name || '';
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'website_asc') {
        const siteA = websiteMap.get(a.websiteId)?.name || '';
        const siteB = websiteMap.get(b.websiteId)?.name || '';
        return siteA.localeCompare(siteB);
      }
      if (sortBy === 'status') {
        const order = { TODO: 1, WAITING: 2, APPROVED: 3, REJECTED: 4 };
        return order[a.status] - order[b.status];
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">App × Website Submissions</h2>
          <p className="text-xs text-slate-500">
            Track and manage backlink submissions across all registered Android Apps and Websites.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          data-testid="btn-add-submission"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Submission
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div data-testid="submission-error-alert" className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-900 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div data-testid="submission-success-alert" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Collapsible Create/Edit Form Panel */}
      {showCreateForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-xs relative" data-testid="submission-form-card">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">
              {editingId ? 'Edit Submission' : 'Create New Submission'}
            </h3>
            <button
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Android App <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  disabled={apps.length === 0}
                  data-testid="input-submission-app"
                  className="w-full text-sm rounded-lg border border-slate-300 bg-white py-2 px-3 focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                  required
                >
                  {apps.length === 0 ? (
                    <option value="">No apps available. Create an app first.</option>
                  ) : (
                    apps.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Website <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedWebsiteId}
                  onChange={(e) => setSelectedWebsiteId(e.target.value)}
                  disabled={websites.length === 0}
                  data-testid="input-submission-website"
                  className="w-full text-sm rounded-lg border border-slate-300 bg-white py-2 px-3 focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                  required
                >
                  {websites.length === 0 ? (
                    <option value="">No websites available. Create a website first.</option>
                  ) : (
                    websites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name} ({site.url})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status (Default: TODO)
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as SubmissionStatus)}
                  data-testid="input-submission-status"
                  className="w-full text-sm rounded-lg border border-slate-300 bg-white py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="TODO">TODO</option>
                  <option value="WAITING">WAITING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submission Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  data-testid="input-submission-date"
                  className="w-full text-sm rounded-lg border border-slate-300 bg-white py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Submission details</label>
              <input
                type="text"
                placeholder="e.g. Submitted guest post form, contact: editor@example.com"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                data-testid="input-submission-notes"
                className="w-full text-sm rounded-lg border border-slate-300 bg-white py-2 px-3 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || apps.length === 0 || websites.length === 0}
                data-testid="btn-submit-submission"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingId ? 'Update Submission' : 'Create Submission'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search query */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by app, website, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-submissions"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              data-testid="filter-status"
              className="w-full py-2 px-3 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">TODO</option>
              <option value="WAITING">WAITING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* App filter */}
          <div>
            <select
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              data-testid="filter-app"
              className="w-full py-2 px-3 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Android Apps</option>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Website filter */}
          <div>
            <select
              value={websiteFilter}
              onChange={(e) => setWebsiteFilter(e.target.value)}
              data-testid="filter-website"
              className="w-full py-2 px-3 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Websites</option>
              {websites.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>
              Showing {filteredSubmissions.length} of {submissions.length} submissions
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              data-testid="sort-submissions"
              className="py-1 px-2 text-xs rounded border border-slate-200 bg-white"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="app_asc">App Name (A-Z)</option>
              <option value="website_asc">Website Name (A-Z)</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center" data-testid="submissions-empty-state">
            <p className="text-sm font-semibold text-slate-700">No submissions found</p>
            <p className="text-xs text-slate-500 mt-1">
              {submissions.length === 0
                ? 'Get started by creating your first App × Website submission above.'
                : 'No submissions matched your current filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid="submissions-table">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Android App</th>
                  <th className="py-3 px-4">Website</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredSubmissions.map((sub) => {
                  const app = appMap.get(sub.appId);
                  const website = websiteMap.get(sub.websiteId);

                  return (
                    <tr
                      key={sub.id}
                      data-testid={`submission-row-${sub.id}`}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* App Name resolved dynamically */}
                      <td className="py-3 px-4 font-semibold text-slate-900" data-testid={`sub-app-name-${sub.id}`}>
                        {app ? app.name : <span className="text-rose-500 italic">Unknown App</span>}
                      </td>

                      {/* Website Name resolved dynamically */}
                      <td className="py-3 px-4" data-testid={`sub-website-name-${sub.id}`}>
                        <div className="font-medium text-slate-900">{website ? website.name : 'Unknown Website'}</div>
                        {website?.url && (
                          <a
                            href={website.url.startsWith('http') ? website.url : `https://${website.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 hover:underline mt-0.5"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            {website.url}
                          </a>
                        )}
                      </td>

                      {/* Status + Quick toggle */}
                      <td className="py-3 px-4" data-testid={`sub-status-${sub.id}`}>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={sub.status} />
                          <select
                            value={sub.status}
                            onChange={(e) => handleQuickStatus(sub, e.target.value as SubmissionStatus)}
                            data-testid={`quick-status-dropdown-${sub.id}`}
                            className="text-xs py-1 px-1.5 border border-slate-200 rounded bg-white text-slate-600 hover:border-slate-300"
                            title="Quick change status"
                          >
                            <option value="TODO">TODO</option>
                            <option value="WAITING">WAITING</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {sub.submissionDate || <span className="text-slate-400 italic">Not set</span>}
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate" title={sub.notes}>
                        {sub.notes || <span className="text-slate-400 italic">-</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(sub)}
                            data-testid={`btn-edit-submission-${sub.id}`}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer transition-colors"
                            title="Edit Submission"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {deletingId === sub.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(sub.id)}
                                data-testid={`btn-confirm-delete-submission-${sub.id}`}
                                className="px-2 py-1 bg-rose-600 text-white text-xs font-semibold rounded hover:bg-rose-700 cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(sub.id)}
                              data-testid={`btn-delete-submission-${sub.id}`}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                              title="Delete Submission"
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
