import React, { useState } from 'react';
import type { AndroidApp, Website, Submission, SubmissionStatus, SubmissionFormData } from '../types';
import { StatusBadge } from './StatusBadge';
import { SearchableSelect, type SearchableSelectOption } from './SearchableSelect';
import { createSubmission, updateSubmission, deleteSubmission } from '../services/storage';
import { Plus, Search, Filter, Trash2, Edit2, ExternalLink, AlertTriangle, X, Check, Link as LinkIcon } from 'lucide-react';

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
  // User requirement: default status is APPROVED
  const [formStatus, setFormStatus] = useState<SubmissionStatus>('APPROVED');
  // User requirement: submission date jgn otomatis ambil today
  const [formDate, setFormDate] = useState('');
  const [formPostUrl, setFormPostUrl] = useState('');
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

  // Options for SearchableSelect
  const appOptions: SearchableSelectOption[] = apps.map((a) => ({
    value: a.id,
    label: a.name,
    subLabel: a.playStoreUrl,
    description: a.notes,
  }));

  const websiteOptions: SearchableSelectOption[] = websites.map((w) => ({
    value: w.id,
    label: w.name,
    badge: typeof w.dr === 'number' ? `DR ${w.dr}` : undefined,
    subLabel: w.url,
    description: w.notes,
  }));

  const resetForm = () => {
    setSelectedAppId(apps[0]?.id || '');
    setSelectedWebsiteId(websites[0]?.id || '');
    setFormStatus('APPROVED');
    setFormDate(''); // never auto-default to today
    setFormPostUrl('');
    setFormNotes('');
    setEditingId(null);
    setShowCreateForm(false);
    setErrorMsg(null);
  };

  const handleOpenCreate = () => {
    setSelectedAppId(apps[0]?.id || '');
    setSelectedWebsiteId(websites[0]?.id || '');
    setFormStatus('APPROVED');
    setFormDate(''); // never auto-default to today
    setFormPostUrl('');
    setFormNotes('');
    setEditingId(null);
    setShowCreateForm(true);
    setErrorMsg(null);
  };

  const handleOpenEdit = (sub: Submission) => {
    setSelectedAppId(sub.appId);
    setSelectedWebsiteId(sub.websiteId);
    setFormStatus(sub.status);
    setFormDate(sub.submissionDate || ''); // preserve saved date, never auto-fill today
    setFormPostUrl(sub.postUrl || '');
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
        postUrl: formPostUrl.trim(),
        notes: formNotes.trim(),
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

  // Filtered & Sorted Submissions
  const filteredSubmissions = submissions
    .filter((sub) => {
      const app = appMap.get(sub.appId);
      const website = websiteMap.get(sub.websiteId);
      const appName = app ? app.name.toLowerCase() : '';
      const websiteName = website ? website.name.toLowerCase() : '';
      const websiteNotes = (website?.notes || '').toLowerCase();
      const subNotes = (sub.notes || '').toLowerCase();
      const postUrl = (sub.postUrl || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        appName.includes(q) ||
        websiteName.includes(q) ||
        websiteNotes.includes(q) ||
        subNotes.includes(q) ||
        postUrl.includes(q);

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
        const order = { APPROVED: 1, WAITING: 2, TODO: 3, REJECTED: 4 };
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* App Searchable Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Android App <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={appOptions}
                  value={selectedAppId}
                  onChange={setSelectedAppId}
                  placeholder={apps.length === 0 ? 'No apps available' : 'Search & select app...'}
                  disabled={apps.length === 0}
                  testId="input-submission-app"
                />
              </div>

              {/* Website Searchable Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Website <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={websiteOptions}
                  value={selectedWebsiteId}
                  onChange={setSelectedWebsiteId}
                  placeholder={websites.length === 0 ? 'No websites available' : 'Search & select website...'}
                  disabled={websites.length === 0}
                  testId="input-submission-website"
                />
              </div>

              {/* Status Select: Default APPROVED */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as SubmissionStatus)}
                  data-testid="input-submission-status"
                  className="w-full text-sm rounded-lg border border-slate-300 bg-white py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="WAITING">WAITING</option>
                  <option value="TODO">TODO</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              {/* Post URL */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Post URL / Live Backlink URL
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="https://example.com/blog/my-android-app-review"
                    value={formPostUrl}
                    onChange={(e) => setFormPostUrl(e.target.value)}
                    data-testid="input-submission-post-url"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Submission Date: No Auto Today */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submission Date <span className="text-slate-400 font-normal">(optional)</span>
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

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Submission Notes</label>
              <input
                type="text"
                placeholder="e.g. Submitted form, contacted editor, account login info..."
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
              placeholder="Search by app, website, post URL, or notes..."
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
              <option value="APPROVED">APPROVED</option>
              <option value="WAITING">WAITING</option>
              <option value="TODO">TODO</option>
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
                  {w.name} {typeof w.dr === 'number' ? `(DR ${w.dr})` : ''}
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
                  <th className="py-3 px-4">Post URL</th>
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
                        <div>{app ? app.name : <span className="text-rose-500 italic">Unknown App</span>}</div>
                        {app?.playStoreUrl && (
                          <a
                            href={app.playStoreUrl.startsWith('http') ? app.playStoreUrl : `https://${app.playStoreUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-slate-400 hover:text-slate-600 hover:underline mt-0.5"
                          >
                            <ExternalLink className="w-2.5 h-2.5 mr-1" />
                            Play Store
                          </a>
                        )}
                      </td>

                      {/* Website Name resolved dynamically + Website Notes */}
                      <td className="py-3 px-4" data-testid={`sub-website-name-${sub.id}`}>
                        <div className="font-medium text-slate-900 flex items-center gap-1.5">
                          <span>{website ? website.name : 'Unknown Website'}</span>
                          {typeof website?.dr === 'number' && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              DR {website.dr}
                            </span>
                          )}
                        </div>
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
                        {/* Requirement: kolom website, tambahkan website.note */}
                        {website?.notes && (
                          <p
                            className="text-[11px] text-slate-500 italic mt-1 max-w-xs line-clamp-2"
                            title={website.notes}
                            data-testid={`sub-website-notes-${sub.id}`}
                          >
                            {website.notes}
                          </p>
                        )}
                      </td>

                      {/* Requirement: kolom status, hapus dropdown -> hanya StatusBadge */}
                      <td className="py-3 px-4" data-testid={`sub-status-${sub.id}`}>
                        <StatusBadge status={sub.status} />
                      </td>

                      {/* Requirement: tambahkan kolom post url */}
                      <td className="py-3 px-4 text-xs" data-testid={`sub-post-url-${sub.id}`}>
                        {sub.postUrl ? (
                          <a
                            href={sub.postUrl.startsWith('http') ? sub.postUrl : `https://${sub.postUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-emerald-600 hover:text-emerald-800 hover:underline font-medium max-w-xs truncate"
                            title={sub.postUrl}
                          >
                            <LinkIcon className="w-3 h-3 mr-1 shrink-0" />
                            <span className="truncate max-w-[180px]">{sub.postUrl}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Submission Date: only shown if set */}
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {sub.submissionDate || <span className="text-slate-400 italic">-</span>}
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
