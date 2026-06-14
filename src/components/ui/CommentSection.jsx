import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/dateFormat';

function useComments(newsId) {
  return useQuery({
    queryKey: ['comments', newsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('news_id', newsId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!newsId,
  });
}

export default function CommentSection({ newsId }) {
  const { data: comments = [], refetch } = useComments(newsId);
  const [form, setForm] = useState({ name: '', email: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    // Sanitize inputs
    const name = form.name.trim().slice(0, 100);
    const email = form.email.trim().slice(0, 200);
    const comment = form.comment.trim().slice(0, 2000);

    if (!name || !comment) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({ news_id: newsId, name, email, comment, status: 'pending' });
      if (error) throw error;
      toast.success('Comment submitted! It will appear after approval.');
      setForm({ name: '', email: '', comment: '' });
      refetch();
    } catch {
      toast.error('Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h2 className="section-title flex items-center gap-2">
        <MessageCircle className="w-5 h-5" /> Comments ({comments.length})
      </h2>

      {/* Comment list */}
      {comments.length > 0 ? (
        <div className="space-y-4 mb-6">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex-shrink-0 flex items-center justify-center text-red-700 font-bold text-sm">
                {c.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{c.name}</span>
                  <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{c.comment}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-6">No comments yet. Be the first!</p>
      )}

      {/* Comment form */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3">Leave a Comment</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Your Name *"
              maxLength={100}
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-red-500"
            />
            <input
              type="email"
              placeholder="Your Email *"
              maxLength={200}
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>
          <textarea
            placeholder="Your comment…"
            rows={4}
            maxLength={2000}
            required
            value={form.comment}
            onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-red-500 resize-none"
          />
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Post Comment'}
          </button>
        </form>
      </div>
    </section>
  );
}
