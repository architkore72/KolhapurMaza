import { useParams, Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaWhatsapp, FaLink } from 'react-icons/fa';
import { MessageCircle, User, Calendar, Eye } from 'lucide-react';
import Layout from '../components/layout/Layout';
import SEOHead from '../components/ui/SEOHead';
import { NewsCard, SkeletonCard } from '../components/ui/NewsCard';
import AdBanner from '../components/ui/AdBanner';
import { useNewsDetail, useRelatedNews } from '../hooks/useNews';
import { formatDate } from '../utils/dateFormat';
import toast from 'react-hot-toast';
import CommentSection from '../components/ui/CommentSection';

function ShareButton({ href, label, icon: Icon, color }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`flex items-center gap-2 px-4 py-2 rounded text-white text-sm font-medium transition-opacity hover:opacity-90 ${color}`}
    >
      <Icon size={16} /> {label}
    </a>
  );
}

export default function NewsDetailPage() {
  const { slug } = useParams();
  const { data: news, isLoading, error } = useNewsDetail(slug);
  const { data: related = [] } = useRelatedNews(news?.categories?.id, news?.id);

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  function copyLink() {
    navigator.clipboard.writeText(pageUrl).then(() => toast.success('Link copied!'));
  }

  if (isLoading) return (
    <Layout>
      <div className="space-y-4">
        <div className="skeleton h-8 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-80 rounded-xl" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </Layout>
  );

  if (error || !news) return (
    <Layout>
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">Article not found</h2>
        <Link to="/" className="btn-primary mt-4 inline-block">Back to Home</Link>
      </div>
    </Layout>
  );

  const shareText = encodeURIComponent(news.title);
  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = encodeURIComponent(`${originUrl}/share/${encodeURIComponent(news.slug)}`);

  return (
    <Layout>
      <SEOHead
        title={news.meta_title || news.title}
        description={news.meta_description || news.short_description}
        image={news.featured_image}
        url={pageUrl}
        type="article"
      />
          {/* Ad Banner — below article */}
      <div className="mb-6">
        <AdBanner position="header" />
      </div>

      <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Featured Image */}
        {news.featured_image && (
          <img
            src={news.featured_image}
            alt={news.title}
            className="w-full h-64 sm:h-96 object-cover"
          />
        )}

        <div className="p-5 sm:p-8">
          {/* Category */}
          {news.categories && (
            <Link to={`/category/${news.categories.slug}`} className="category-badge mb-3 inline-block">
              {news.categories.name}
            </Link>
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight mb-4">
            {news.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
            {news.authors && (
              <span className="flex items-center gap-1">
                {news.authors.photo
                  ? <img src={news.authors.photo} alt={news.authors.name} className="w-6 h-6 rounded-full object-cover" />
                  : <User className="w-4 h-4" />
                }
                {news.authors.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(news.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {news.views?.toLocaleString() || 0} views
            </span>
          </div>

          {/* Short description */}
          {news.short_description && (
            <p 
              className="text-lg text-gray-600 dark:text-gray-300 font-medium mb-5 italic"
              style={news.short_description_color ? { color: news.short_description_color } : undefined}
            >
              {news.short_description}
            </p>
          )}

          {/* Content */}
          <div
            className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-red-700 prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: news.content || '' }}
          />

          {/* Share Buttons */}
          <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Share this article:</p>
            <div className="flex flex-wrap gap-2">
              <ShareButton
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                label="Facebook"
                icon={FaFacebook}
                color="bg-blue-600"
              />
              <ShareButton
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                label="Twitter"
                icon={FaTwitter}
                color="bg-sky-500"
              />
              <ShareButton
                href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
                label="WhatsApp"
                icon={FaWhatsapp}
                color="bg-green-600"
              />
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 rounded bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition-colors"
              >
                <FaLink size={14} /> Copy Link
              </button>
            </div>
          </div>
        </div>
      </article>

    

      {/* Related News */}
      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="section-title">Related News</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map(item => <NewsCard key={item.id} news={item} />)}
          </div>
        </section>
      )}

      {/* Ad Banner — between related news and comments */}
      <div className="mt-6">
        <AdBanner position="footer" />
      </div>

      {/* Comments */}
      <CommentSection newsId={news.id} />
    </Layout>
  );
}
