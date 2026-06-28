import { Link } from 'react-router-dom';
import { useBreakingNews } from '../../hooks/useNews';

export default function BreakingTicker() {
  const { data: items = [] } = useBreakingNews();

  if (!items.length) return null;

  // Duplicate items to create a seamless infinite loop
  const allItems = [...items, ...items];

  return (
    <div className="bg-red-700 text-white flex items-center overflow-hidden h-8 max-w-full">
      <span className="bg-red-900 px-3 h-full flex items-center text-xs font-bold uppercase tracking-wider whitespace-nowrap flex-shrink-0 z-10">
        Breaking
      </span>
      <div className="relative flex-1 min-w-0 overflow-hidden h-full flex items-center">
        <div className="ticker-track">
          {allItems.map((item, i) => (
            <Link
              key={i}
              to={`/news/${item.slug}`}
              className="ticker-item"
            >
              {item.title}
              <span className="ticker-dot">●</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
