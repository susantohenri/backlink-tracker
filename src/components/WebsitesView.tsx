import React, { useState } from 'react';
import type { Website, Submission, WebsiteFormData } from '../types';
import { createWebsite, updateWebsite, deleteWebsite, createWebsitesBatch } from '../services/storage';
import { PRESET_WEBSITES } from '../data/presetWebsites';
import { Plus, Search, Trash2, Edit2, ExternalLink, AlertTriangle, X, Check, Globe, ArrowUpDown, Sparkles } from 'lucide-react';

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
  const [dr, setDr] = useState('');
  const [notes, setNotes] = useState('');

  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'dr_desc' | 'dr_asc' | 'name_asc' | 'name_desc' | 'newest'>('dr_desc');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const resetForm = () => {
    setName('');
    setUrl('');
    setDr('');
    setNotes('');
    setEditingId(null);
    setShowCreateForm(false);
    setErrorMsg(null);
  };

  const handleOpenCreate = () => {
    setName('');
    setUrl('');
    setDr('');
    setNotes('');
    setEditingId(null);
    setShowCreateForm(true);
    setErrorMsg(null);
  };

  const handleOpenEdit = (site: Website) => {
    setName(site.name);
    setUrl(site.url || '');
    setDr(site.dr !== undefined && site.dr !== null ? String(site.dr) : '');
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
      const parsedDr = dr.trim() !== '' ? parseInt(dr.trim(), 10) : undefined;
      const data: WebsiteFormData = {
        name: name.trim(),
        url: url.trim(),
        dr: isNaN(parsedDr as number) ? undefined : parsedDr,
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

  const handleSeedPresets = async () => {
    try {
      setSeeding(true);
      setErrorMsg(null);
      // Filter out websites that already exist by name or URL
      const existingNames = new Set(websites.map((w) => w.name.toLowerCase().trim()));
      const existingUrls = new Set(websites.map((w) => (w.url || '').toLowerCase().trim().replace(/\/+$/, '')));

      const missing = PRESET_WEBSITES.filter((p) => {
        const normName = p.name.toLowerCase().trim();
        const normUrl = p.url.toLowerCase().trim().replace(/\/+$/, '');
        return !existingNames.has(normName) && !existingUrls.has(normUrl);
      });

      if (missing.length === 0) {
        setSuccessMsg('All 116 preset websites are already present.');
        return;
      }

      const count = await createWebsitesBatch(missing);
      setSuccessMsg(`Successfully imported ${count} target websites.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to import preset websites.');
    } finally {
      setSeeding(false);
    }
  };

  // Submission count map per website (derived)
  const submissionCountMap = new Map<string, number>();
  submissions.forEach((s) => {
    submissionCountMap.set(s.websiteId, (submissionCountMap.get(s.websiteId) || 0) + 1);
  });

  // Filtered and Sorted websites
  const filteredWebsites = websites
    .filter((site) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        site.name.toLowerCase().includes(q) ||
        (site.url || '').toLowerCase().includes(q) ||
        (site.notes || '').toLowerCase().includes(q) ||
        (site.dr !== undefined && String(site.dr).includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'dr_desc') {
        return (b.dr ?? -1) - (a.dr ?? -1);
      }
      if (sortBy === 'dr_asc') {
        return (a.dr ?? 999) - (b.dr ?? 999);
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      return 0; // 'newest' preserving default order
    });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Target Websites</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage target platforms, directories, review sites, and backlink opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {websites.length < PRESET_WEBSITES.length && (
            <button
              onClick={handleSeedPresets}
              disabled={seeding}
              data-testid="btn-seed-websites"
              className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Import pre-configured list of high-DR backlink sites"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600 dark:text-indigo-400" />
              {seeding ? 'Importing...' : `Import Presets (${PRESET_WEBSITES.length})`}
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            data-testid="btn-add-website"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Website
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div data-testid="website-error-alert" className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-200 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div data-testid="website-success-alert" className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Collapsible Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 rounded-xl p-5 shadow-xs relative transition-colors" data-testid="website-form-card">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {editingId ? 'Edit Website' : 'Add New Target Website'}
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
                  Website Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Product Hunt, AlternativeTo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-website-name"
                  className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Domain Rating (DR)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 74"
                  value={dr}
                  onChange={(e) => setDr(e.target.value)}
                  data-testid="input-website-dr"
                  className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  placeholder="https://producthunt.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  data-testid="input-website-url"
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
                placeholder="Domain authority, submission requirements, pricing, or instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-website-notes"
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
                data-testid="btn-submit-website"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingId ? 'Update Website' : 'Save Website'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Sort Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search websites by name, URL, DR, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-websites"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="dr_desc">DR: High to Low</option>
              <option value="dr_asc">DR: Low to High</option>
              <option value="name_asc">Name: A → Z</option>
              <option value="name_desc">Name: Z → A</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold shrink-0">
            Total: {filteredWebsites.length} {filteredWebsites.length === 1 ? 'Site' : 'Sites'}
          </span>
        </div>
      </div>

      {/* Websites Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {filteredWebsites.length === 0 ? (
          <div className="p-12 text-center" data-testid="websites-empty-state">
            <Globe className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Target Websites found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {websites.length === 0
                ? 'Add your first target website or click "Import Presets" to load 116 curated websites.'
                : 'No websites matched your search.'}
            </p>
            {websites.length === 0 && (
              <button
                onClick={handleSeedPresets}
                disabled={seeding}
                className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {seeding ? 'Importing...' : `Import All 116 Preset Websites`}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid="websites-table">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Website Name</th>
                  <th className="py-3 px-4 text-center">DR</th>
                  <th className="py-3 px-4">URL</th>
                  <th className="py-3 px-4 text-center">Submissions</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredWebsites.map((site) => {
                  const subCount = submissionCountMap.get(site.id) || 0;
                  return (
                    <tr
                      key={site.id}
                      data-testid={`website-row-${site.id}`}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white" data-testid={`website-name-${site.id}`}>
                        {site.name}
                      </td>

                      {/* Domain Rating Badge */}
                      <td className="py-3 px-4 text-center">
                        {typeof site.dr === 'number' ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                              site.dr >= 80
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                : site.dr >= 60
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                                : site.dr >= 40
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            DR {site.dr}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs">
                        {site.url ? (
                          <a
                            href={site.url.startsWith('http') ? site.url : `https://${site.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline font-medium"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1 shrink-0" />
                            <span className="truncate max-w-xs">{site.url}</span>
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
                            subCount > 0 ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {subCount} {subCount === 1 ? 'submission' : 'submissions'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate" title={site.notes}>
                        {site.notes || <span className="text-slate-400 italic">-</span>}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(site)}
                            data-testid={`btn-edit-website-${site.id}`}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded cursor-pointer transition-colors"
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
                                className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
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
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer transition-colors"
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
