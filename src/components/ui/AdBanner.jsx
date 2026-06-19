import { useState, useEffect } from 'react';
import { useAdvertisements } from '../../hooks/useAdvertisements';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BreakingTicker from './BreakingTicker';

// Height classes per position
const HEIGHT = {
  header: 'h-130 sm:h-100',
  sidebar: 'h-32',
  footer: 'h-20 sm:h-24',
};

export default function AdBanner({ position = 'sidebar' }) {
  const { data: ads = [] } = useAdvertisements(position);
  const [current, setCurrent] = useState(0);

  // Auto-slide every 4 seconds when multiple ads
  useEffect(() => {
    if (ads.length < 2) return;
    const timer = setInterval(() => {
      setCurrent(i => (i + 1) % ads.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [ads.length]);

  // Reset index if ads change
  useEffect(() => { setCurrent(0); }, [ads.length]);

  if (!ads.length) return null;

  const ad = ads[current];
  const height = HEIGHT[position] || 'h-28';

  return (
    <>
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${height} bg-gray-100 dark:bg-gray-800`}>
      {/* Ad image */}
      <a
        href={ad.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ad.title}
        className="block w-full h-full"
      >
        <img
          src={ad.image}
          alt={ad.title}
          className="w-full h-full object-contain transition-opacity duration-500"
          loading="lazy"
          key={ad.id}
        />
      </a>

      {/* Prev / Next buttons — only when multiple ads */}
      {ads.length > 1 && (
        <>
          <button
            onClick={() => setCurrent(i => (i - 1 + ads.length) % ads.length)}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
            aria-label="Previous ad"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrent(i => (i + 1) % ads.length)}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
            aria-label="Next ad"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Ad ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}

      {/* "Advertisement" label */}
      <span className="absolute top-1 right-1 text-[10px] bg-black/30 text-white px-1.5 py-0.5 rounded leading-none">
        Ad
      </span>
    </div>
    {position === 'header' && (
      <div className="my-3">
        <BreakingTicker />
      </div>
    )}
    </>
  );
}

