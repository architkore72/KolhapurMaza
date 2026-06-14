import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../components/admin/AdminLayout';
import SEOHead from '../../components/ui/SEOHead';
import { supabase } from '../../lib/supabase';
import { formatShortDate } from '../../utils/dateFormat';
import { Download } from 'lucide-react';

function useSubscribers() {
  return useQuery({
    queryKey: ['admin', 'subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export default function SubscribersPage() {
  const { data: subscribers = [], isLoading } = useSubscribers();

  function exportCSV() {
    if (!subscribers.length) return;
    const header = 'id,email,created_at\n';
    const rows = subscribers.map(s => `${s.id},${s.email},${s.created_at}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout>
      <SEOHead title="Subscribers" />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Subscribers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subscribers.length} total subscribers</p>
        </div>
        <button onClick={exportCSV} disabled={!subscribers.length} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">#</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Subscribed On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading && <tr><td colSpan={3} className="px-5 py-6 text-center text-gray-500">Loading…</td></tr>}
              {subscribers.map((s, i) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3 text-gray-900 dark:text-white font-medium">{s.email}</td>
                  <td className="px-5 py-3 text-gray-500">{formatShortDate(s.created_at)}</td>
                </tr>
              ))}
              {!isLoading && !subscribers.length && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-500">No subscribers yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {isLoading && <p className="px-4 py-6 text-center text-gray-500 text-sm">Loading…</p>}
          {subscribers.map((s, i) => (
            <div key={s.id} className="px-4 py-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatShortDate(s.created_at)}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">#{i + 1}</span>
            </div>
          ))}
          {!isLoading && !subscribers.length && (
            <p className="px-4 py-8 text-center text-gray-500 text-sm">No subscribers yet</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
