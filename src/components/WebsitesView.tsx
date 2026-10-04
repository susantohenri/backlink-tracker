import React, { useState } from 'react';
import type { Website, Submission, WebsiteFormData } from '../types';
import { createWebsite, updateWebsite, deleteWebsite } from '../services/storage';
import { Plus, Search, Trash2, Edit2, ExternalLink, AlertTriangle, X, Check, Globe } from 'lucide-react';

interface WebsitesViewProps {
  websites: Website[];
  submissions: Submission[];
}

export const WebsitesView: React.FC<WebsitesViewProps> = ({ websites, submissions }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Search & Feedback
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setUrl('');
    setNotes('');
    setEditingId(null);
    setShowCreateForm(false);
    setErrorMsg(null);
  };

  const handleOpenCreate = () => {
    setName('');
    setUrl('');
    setNotes('');
    setEditingId(null);
    setShowCreateForm(true);
    setErrorMsg(null);
  };

  const handleOpenEdit = (site: Website) => {
    setName(site.name);
    setUrl(site.url || '');
    setNotes(site.notes || '');
    setEditingId(site.id);
    setShowCreateForm(true);
    setErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Website name is required');
      return;
    }

    try {
      setSubmitting(true);
      const data: WebsiteFormData = {
        name: name.trim(),
        url: url.trim(),
        notes: notes.trim(),
      };

      if (editingId) {
        await updateWebsite(editingId, data);
        setSuccessMsg('Website updated successfully.');
      } else {
        await createWebsite(data);
        setSuccessMsg('Website created successfully.');
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
      await deleteWebsite(id, submissions);
      setDeletingId(null);
      setSuccessMsg('Website deleted successfully.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete website.');
    }
  };

  // Submission count map per website (derived)
  const submissionCountMap = new Map<string, number>();
  submissions.forEach((s) => {
    submissionCountMap.set(s.websiteId, (submissionCountMap.get(s.websiteId) || 0) + 1);
  });

  // Filtered websites
  const filteredWebsites = websites.filter((site) => {
    const q = searchQuery.toLowerCase();
    return (
      site.name.toLowerCase().includes(q) ||
      (site.url || '').toLowerCase().includes(q) ||
      (site.notes || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Target Websites</h2>
          <p className="text-xs text-slate-500">
            Manage target platforms, directories, review sites, and backlink opportunities.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          data-testid="btn-add-website"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Website
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div data-testid="website-error-alert" className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-center justify-between">
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
        <div data-testid="website-success-alert" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Collapsible Form */}
      {showCreateForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-xs relative" data-testid="website-form-card">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">
              {editingId ? 'Edit Website' : 'Add New Target Website'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Product Hunt, AlternativeTo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-website-name"
                  className="w-full text-sm rounded-lg border border-slate-300 bg-white py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  placeholder="https://producthunt.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  data-testid="input-website-url"
                  className="w-full text-sm rounded-lg border border-slate-300 bg-white py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                placeholder="Domain authority, submission requirements, pricing, or instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-website-notes"
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
                disabled={submitting}
                data-testid="btn-submit-website"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingId ? 'Update Website' : 'Save Website'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search websites by name, URL, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-websites"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Total: {websites.length} {websites.length === 1 ? 'Website' : 'Websites'}
        </span>
      </div>

      {/* Websites Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredWebsites.length === 0 ? (
          <div className="p-12 text-center" data-testid="websites-empty-state">
            <Globe className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Target Websites found</p>
            <p className="text-xs text-slate-500 mt-1">
              {websites.length === 0
                ? 'Add your first target website or directory.'
                : 'No websites matched your search.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid="websites-table">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Website Name</th>
                  <th className="py-3 px-4">URL</th>
                  <th className="py-3 px-4 text-center">Submissions</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredWebsites.map((site) => {
                  const subCount = submissionCountMap.get(site.id) || 0;
                  return (
                    <tr
                      key={site.id}
                      data-testid={`website-row-${site.id}`}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900" data-testid={`website-name-${site.id}`}>
                        {site.name}
                      </td>

                      <td className="py-3 px-4 text-xs">
                        {site.url ? (
                          <a
                            href={site.url.startsWith('http') ? site.url : `https://${site.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            {site.url}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      {/* Related Submission Count (Derived) */}
                      <td className="py-3 px-4 text-center">
                        <span
                          data-testid={`website-sub-count-${site.id}`}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            subCount > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {subCount} {subCount === 1 ? 'submission' : 'submissions'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate" title={site.notes}>
                        {site.notes || <span className="text-slate-400 italic">-</span>}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(site)}
                            data-testid={`btn-edit-website-${site.id}`}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer transition-colors"
                            title="Edit Website"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {deletingId === site.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(site.id)}
                                data-testid={`btn-confirm-delete-website-${site.id}`}
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
                              onClick={() => {
                                if (subCount > 0) {
                                  setErrorMsg(
                                    `Cannot delete "${site.name}" because it is used in ${subCount} submission(s). Please delete or reassign those submissions first.`
                                  );
                                } else {
                                  setDeletingId(site.id);
                                }
                              }}
                              data-testid={`btn-delete-website-${site.id}`}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                              title={
                                subCount > 0
                                  ? `Blocked: used in ${subCount} submission(s)`
                                  : 'Delete Website'
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
