import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import SEOHead from '../../components/ui/SEOHead';
import { useCreateNews, useUpdateNews } from '../../hooks/useNews';
import { useCategories } from '../../hooks/useCategories';
import { useAuthors } from '../../hooks/useAuthors';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { slugify } from '../../utils/slugify';
import toast from 'react-hot-toast';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Link as LinkIcon, Image as ImageIcon, Quote, Undo, Redo } from 'lucide-react';

function EditorToolbar({ editor }) {
  if (!editor) return null;
  const btn = (action, label, Icon, active) => (
    <button
      type="button"
      onClick={action}
      title={label}
      className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${active ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
      {btn(() => editor.chain().focus().toggleBold().run(), 'Bold', Bold, editor.isActive('bold'))}
      {btn(() => editor.chain().focus().toggleItalic().run(), 'Italic', Italic, editor.isActive('italic'))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', Heading2, editor.isActive('heading', { level: 2 }))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', Heading3, editor.isActive('heading', { level: 3 }))}
      {btn(() => editor.chain().focus().toggleBulletList().run(), 'Bullet List', List, editor.isActive('bulletList'))}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), 'Numbered List', ListOrdered, editor.isActive('orderedList'))}
      {btn(() => editor.chain().focus().toggleBlockquote().run(), 'Quote', Quote, editor.isActive('blockquote'))}
      <button
        type="button"
        title="Add Link"
        onClick={() => {
          const url = window.prompt('Enter URL');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        title="Insert Image"
        onClick={() => {
          const url = window.prompt('Enter image URL');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
      <div className="w-px bg-gray-300 dark:bg-gray-500 mx-1" />
      {btn(() => editor.chain().focus().undo().run(), 'Undo', Undo)}
      {btn(() => editor.chain().focus().redo().run(), 'Redo', Redo)}
    </div>
  );
}

const EMPTY_FORM = {
  title: '', slug: '', short_description: '', featured_image: '',
  category_id: '', author_id: '', status: 'draft',
  is_featured: false, is_breaking: false,
  meta_title: '', meta_description: '', tags: '',
};

export default function EditNewsPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const { data: categories = [] } = useCategories();
  const { data: authors = [] } = useAuthors();

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      // Disable link in StarterKit to avoid duplicate (some versions include it)
      StarterKit.configure({ link: false }),
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write your article content here…' }),
    ],
  });

  // Load existing article
  const { data: existing } = useQuery({
    queryKey: ['admin', 'news', 'edit', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('news').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || '',
        slug: existing.slug || '',
        short_description: existing.short_description || '',
        featured_image: existing.featured_image || '',
        category_id: existing.category_id || '',
        author_id: existing.author_id || '',
        status: existing.status || 'draft',
        is_featured: existing.is_featured || false,
        is_breaking: existing.is_breaking || false,
        meta_title: existing.meta_title || '',
        meta_description: existing.meta_description || '',
        tags: '',
      });
      if (editor && existing.content) {
        editor.commands.setContent(existing.content);
      }
    }
  }, [existing, editor]);

  function handleTitleChange(e) {
    const title = e.target.value;
    setForm(f => ({
      ...f,
      title,
      slug: f.slug === slugify(f.title) || !f.slug ? slugify(title) : f.slug,
      meta_title: f.meta_title === f.title || !f.meta_title ? title : f.meta_title,
    }));
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setImageUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `news/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('news-images').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('news-images').getPublicUrl(path);
      setForm(f => ({ ...f, featured_image: publicUrl }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setImageUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.slug.trim()) { toast.error('Slug is required'); return; }

    setSaving(true);
    try {
      // Ensure slug is never empty (Marathi/non-ASCII titles produce empty slugify output)
      const resolvedSlug = slugify(form.slug) || slugify(form.title) || `article-${Date.now()}`;
      const payload = {
        title: form.title.trim(),
        slug: resolvedSlug,
        short_description: form.short_description.trim(),
        featured_image: form.featured_image.trim(),
        category_id: form.category_id || null,
        author_id: form.author_id || null,
        status: form.status,
        is_featured: form.is_featured,
        is_breaking: form.is_breaking,
        meta_title: form.meta_title.trim(),
        meta_description: form.meta_description.trim(),
        content: editor ? editor.getHTML() : '',
        updated_at: new Date().toISOString(),
      };

      if (isEdit) {
        await updateNews.mutateAsync({ id, ...payload });
        toast.success('Article updated');
      } else {
        await createNews.mutateAsync(payload);
        toast.success('Article created');
      }
      navigate('/admin/news');
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-red-500';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <AdminLayout>
      <SEOHead title={isEdit ? 'Edit Article' : 'Create Article'} />
      <div className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {isEdit ? 'Edit Article' : 'Create Article'}
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin/news')}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              form="news-form"
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-60 text-sm"
            >
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Publish'}
            </button>
          </div>
        </div>

        <form id="news-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 space-y-4">
                <div>
                  <label className={labelCls}>Title *</label>
                  <input type="text" value={form.title} onChange={handleTitleChange} required className={inputCls} placeholder="Article headline" />
                </div>
                <div>
                  <label className={labelCls}>Slug</label>
                  <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className={inputCls} placeholder="url-friendly-slug" />
                </div>
                <div>
                  <label className={labelCls}>Short Description</label>
                  <textarea rows={3} value={form.short_description} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Brief summary (shown in cards and search)" maxLength={300} />
                </div>

                {/* Rich Text Editor */}
                <div>
                  <label className={labelCls}>Content *</label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <EditorToolbar editor={editor} />
                    <EditorContent
                      editor={editor}
                      className="min-h-[300px] px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none prose dark:prose-invert max-w-none"
                    />
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 space-y-4">
                <h2 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">SEO Settings</h2>
                <div>
                  <label className={labelCls}>Meta Title</label>
                  <input type="text" value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} className={inputCls} maxLength={70} />
                </div>
                <div>
                  <label className={labelCls}>Meta Description</label>
                  <textarea rows={2} value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} className={`${inputCls} resize-none`} maxLength={160} />
                </div>
              </div>
            </div>

            {/* Sidebar settings */}
            <div className="space-y-5">
              {/* Publish settings */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 space-y-4">
                <h2 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Publish</h2>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="w-4 h-4 accent-red-700" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Featured News</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_breaking} onChange={e => setForm(f => ({ ...f, is_breaking: e.target.checked }))} className="w-4 h-4 accent-red-700" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Breaking News</span>
                </label>
              </div>

              {/* Category & Author */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 space-y-4">
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className={inputCls}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Author</label>
                  <select value={form.author_id} onChange={e => setForm(f => ({ ...f, author_id: e.target.value }))} className={inputCls}>
                    <option value="">Select author</option>
                    {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Featured Image */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 space-y-3">
                <h2 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Featured Image</h2>
                {form.featured_image && (
                  <img src={form.featured_image} alt="Featured" className="w-full h-40 object-cover rounded-lg" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-red-700 file:text-white hover:file:bg-red-800 cursor-pointer"
                />
                {imageUploading && <p className="text-xs text-gray-500">Uploading…</p>}
                <div>
                  <label className={labelCls}>Or paste image URL</label>
                  <input type="url" value={form.featured_image} onChange={e => setForm(f => ({ ...f, featured_image: e.target.value }))} className={inputCls} placeholder="https://example.com/image.jpg" />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
