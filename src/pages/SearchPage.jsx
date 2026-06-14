import { useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import SEOHead from '../components/ui/SEOHead';
import { NewsCard, SkeletonCard } from '../components/ui/NewsCard';
import { useSearchNews } from '../hooks/useNews';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialQ = params.get('q') || '';
  const [input, setInput] = useState(initialQ);

  const { data: results = [], isLoading } = useSearchNews(initialQ);

  function handleSearch(e) {
    e.preventDefault();
    if (input.trim()) navigate(`/search?q=${encodeURIComponent(input.trim())}`);
  }

  return (
    <Layout>
      <SEOHead
        title={initialQ ? `Search: ${initialQ}` : 'Search News'}
        description={`Search results for "${initialQ}"`}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
          {initialQ ? `Results for "${initialQ}"` : 'Search News'}
        </h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Search articles…"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 text-sm"
          />
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Search className="w-4 h-4" /> Search
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!isLoading && initialQ.length > 2 && results.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No results found for &quot;{initialQ}&quot;</p>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-4">{results.length} article(s) found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(item => <NewsCard key={item.id} news={item} />)}
          </div>
        </>
      )}
    </Layout>
  );
}
