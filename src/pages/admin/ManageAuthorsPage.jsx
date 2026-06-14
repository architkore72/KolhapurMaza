import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import SEOHead from '../../components/ui/SEOHead';
import { useAuthors, useCreateAuthor, useUpdateAuthor, useDeleteAuthor } from '../../hooks/useAuthors';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { name: '', email: '', bio: '', photo: '' };

export default function ManageAuthorsPage() {
  const { data: authors = [], isLoading } = useAuthors();
  const createAuthor = useCreateAuthor();
  const updateAuthor = useUpdateAuthor();
  const deleteAuthor = useDeleteAuthor();

  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  function openCreate() { setForm(EMPTY); setEditId(null); setShowForm(true); }
  function openEdit(a) { setForm({ name: a.name, email: a.email || '', bio: a.bio || '', photo: a.photo || '' }); setEditId(a.id); setShowForm(true); }

  async function handleSubmit(e) {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const payload = { name: form.name.trim(), email: form.email.trim(), bio: form.bio.trim(), photo: form.photo.trim() };
    try {
      if (editId) {
        await updateAuthor.mutateAsync({ id: editId, ...payload });
        toast.success('Author updated');
      } else {
        await createAuthor.mutateAsync(payload);
        toast.success('Author created');
      }
      setShowForm(false); setForm(EMPTY);
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await deleteAuthor.mutateAsync(id); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  }

  const inp = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-red-500';

  return (
    <AdminLayout>
      <SEOHead title="Manage Authors" />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Authors</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add Author</button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 mb-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">{editId ? 'Edit' : 'New'} Author</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inp} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Photo URL</label>
              <input type="url" value={form.photo} onChange={e => setForm(f => ({ ...f, photo: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
              <input value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className={inp} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary flex items-center gap-1"><Check className="w-4 h-4" /> Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded border border-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"><X className="w-4 h-4" /> Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Author</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Bio</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading && <tr><td colSpan={4} className="px-5 py-6 text-center text-gray-500">Loading…</td></tr>}
              {authors.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {a.photo
                        ? <img src={a.photo} alt={a.name} className="w-8 h-8 rounded-full object-cover" />
                        : <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-700 font-bold text-sm">{a.name[0]?.toUpperCase()}</div>
                      }
                      <span className="font-medium text-gray-900 dark:text-white">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{a.email || '—'}</td>
                  <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{a.bio || '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 justify-center">
                      <button onClick={() => openEdit(a)} className="text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(a.id, a.name)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {isLoading && <p className="px-4 py-6 text-center text-gray-500 text-sm">Loading…</p>}
          {authors.map(a => (
            <div key={a.id} className="p-4 flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {a.photo
                  ? <img src={a.photo} alt={a.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-700 font-bold flex-shrink-0">{a.name[0]?.toUpperCase()}</div>
                }
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{a.name}</p>
                  <p className="text-xs text-gray-500 truncate">{a.email || 'No email'}</p>
                  {a.bio && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{a.bio}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button onClick={() => openEdit(a)} className="text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(a.id, a.name)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
