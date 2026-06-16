import { Link } from 'react-router-dom';
import { formatShortDate } from '../../utils/dateFormat';

// Lazy-load image — uses object-contain so portrait images never crop
function NewsImage({ src, alt, className = '' }) {
  return (
    <img
      src={src || '/placeholder-news.jpg'}
      alt={alt}
      className={`object-contain w-full h-full bg-gray-100 dark:bg-gray-800 transition-transform duration-300 group-hover:scale-105 ${className}`}
      loading="lazy"
      onError={(e) => { e.target.src = '/placeholder-news.jpg'; }}
    />
  );
}

// Resolve the article path — fall back to ID for legacy articles with empty slugs
function articlePath(news) {
  return `/news/${news.slug || news.id}`;
}

// Large hero card (left side of featured section)
export function HeroCard({ news }) {
  if (!news) return <SkeletonHeroCard />;
  return (
    <Link
      to={articlePath(news)}
      className="relative block h-[420px] rounded-xl overflow-hidden group shadow-lg"
    >
      <NewsImage src={news.featured_image} alt={news.title} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {news.categories && (
          <span className="category-badge mb-2 inline-block">{news.categories.name}</span>
        )}
        <h2 className="text-white text-xl font-bold leading-snug line-clamp-3 mb-2">
          {news.title}
        </h2>
        <p className="text-gray-300 text-sm">
          {news.authors?.name && <span>{news.authors.name} · </span>}
          {formatShortDate(news.created_at)}
        </p>
      </div>
    </Link>
  );
}

// Small featured card (right side of featured section)
export function FeaturedSmallCard({ news }) {
  if (!news) return <SkeletonSmallCard />;
  return (
    <Link
      to={articlePath(news)}
      className="flex gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors"
    >
      <div className="w-24 h-20 flex-shrink-0 rounded overflow-hidden">
        <NewsImage src={news.featured_image} alt={news.title} />
      </div>
      <div className="flex-1 min-w-0">
        {news.categories && (
          <span className="category-badge text-[10px] mb-1 inline-block">{news.categories.name}</span>
        )}
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-red-700 transition-colors">
          {news.title}
        </h3>
        <p className="text-xs text-gray-500 mt-1">{formatShortDate(news.created_at)}</p>
      </div>
    </Link>
  );
}

// Standard news grid card
export function NewsCard({ news }) {
  if (!news) return <SkeletonCard />;
  return (
    <article className="news-card group">
      <Link to={articlePath(news)} className="block">
        <div className="h-48 overflow-hidden">
          <NewsImage src={news.featured_image} alt={news.title} />
        </div>
        <div className="p-4">
          {news.categories && (
            <span className="category-badge mb-2 inline-block">{news.categories.name}</span>
          )}
          <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-red-700 transition-colors">
            {news.title}
          </h3>
          {news.short_description && (
            <p 
              className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3"
              style={news.short_description_color ? { color: news.short_description_color } : undefined}
            >
              {news.short_description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{formatShortDate(news.created_at)}</span>
            <span className="text-xs font-semibold text-red-700 hover:underline">Read More →</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

// Horizontal list card (sidebar/latest)
export function ListCard({ news, showImage = true }) {
  if (!news) return <SkeletonListCard />;
  return (
    <Link
      to={articlePath(news)}
      className="flex gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 -mx-2 transition-colors"
    >
      {showImage && (
        <div className="w-20 h-16 flex-shrink-0 rounded overflow-hidden">
          <NewsImage src={news.featured_image} alt={news.title} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-red-700 transition-colors">
          {news.title}
        </h4>
        <p className="text-xs text-gray-500 mt-1">{formatShortDate(news.created_at)}</p>
      </div>
    </Link>
  );
}

// ---- Skeletons ----

export function SkeletonCard() {
  return (
    <div className="news-card">
      <div className="skeleton h-48" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-1/4" />
        <div className="skeleton h-5 w-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonHeroCard() {
  return <div className="skeleton h-[420px] rounded-xl" />;
}

export function SkeletonSmallCard() {
  return (
    <div className="flex gap-3 p-2">
      <div className="skeleton w-24 h-20 rounded flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonListCard() {
  return (
    <div className="flex gap-3 p-2">
      <div className="skeleton w-20 h-16 rounded flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}
