import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import SEOHead from '../components/ui/SEOHead';
import { NewsCard, SkeletonCard } from '../components/ui/NewsCard';
import { useCategoryBySlug } from '../hooks/useCategories';
import { useNewsByCategory } from '../hooks/useNews';

const PAGE_SIZE = 9;

export default function CategoryPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(1);

  const { data: category } = useCategoryBySlug(slug);
  const { data: result, isLoading } = useNewsByCategory(slug, { limit: PAGE_SIZE, page });

  const totalPages = result ? Math.ceil((result.count || 0) / PAGE_SIZE) : 1;

  return (
    <Layout>
      <SEOHead
        title={category ? `${category.name} News` : 'Category'}
        description={category?.description || `Latest ${category?.name} news`}
        image={category?.image}
      />

      {/* Category Banner */}
      <div className="bg-red-700 rounded-xl p-6 mb-6 text-white">
        {category?.image && (
          <img src={category.image} alt={category.name} className="w-full h-40 object-cover rounded-lg mb-4 opacity-40 absolute inset-0" />
        )}
        <h1 className="text-2xl font-black">{category?.name || slug}</h1>
        {category?.description && (
          <p className="text-red-100 mt-1 text-sm">{category.description}</p>
        )}
      </div>

      {/* News Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : result?.data?.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No articles found in this category.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {result?.data?.map(item => <NewsCard key={item.id} news={item} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded text-sm font-semibold transition-colors ${
                page === i + 1
                  ? 'bg-red-700 text-white'
                  : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </Layout>
  );
}
