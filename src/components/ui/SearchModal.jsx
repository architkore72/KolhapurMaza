import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useSearchNews } from '../../hooks/useNews';
import { formatShortDate } from '../../utils/dateFormat';

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { data: results = [], isFetching } = useSearchNews(query);

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-16 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="text-gray-400 w-5 h-5 flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search news…"
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white text-lg"
          />
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </form>

        {query.trim().length > 2 && (
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {isFetching && (
              <div className="p-4 text-center text-sm text-gray-500">Searching…</div>
            )}
            {!isFetching && results.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">No results found</div>
            )}
            {results.map(item => (
              <button
                key={item.id}
                onClick={() => { navigate(`/news/${item.slug}`); onClose(); }}
                className="w-full text-left flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {item.featured_image && (
                  <img src={item.featured_image} alt={item.title} className="w-16 h-12 object-cover rounded" loading="lazy" />
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.categories?.name} · {formatShortDate(item.created_at)}</p>
                </div>
              </button>
            ))}
            {results.length > 0 && (
              <button
                onClick={handleSubmit}
                className="w-full p-3 text-center text-sm text-red-700 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                See all results for &quot;{query}&quot;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
