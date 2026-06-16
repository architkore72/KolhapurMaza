/**
 * LeagueFilter — horizontal scrollable pill filter.
 * Used for football leagues or cricket match types.
 *
 * @param {{ items: Array<{id:string|number, label:string, flag?:string, logo?:string}>, selected: string|number|null, onSelect: Function, allLabel?: string }} props
 */

import { memo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function LeagueFilter({ items, selected, onSelect, allLabel = 'All' }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 160, behavior: 'smooth' });
  };

  return (
    <div className="relative flex items-center gap-1">
      {/* Left arrow */}
      <button
        onClick={() => scroll(-1)}
        className="shrink-0 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors hidden sm:flex"
        aria-label="Scroll left"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Scrollable pill row */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* "All" pill */}
        <button
          id="filter-all"
          onClick={() => onSelect(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
            selected === null
              ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          {allLabel}
        </button>

        {items.map(item => (
          <button
            key={item.id}
            id={`filter-${item.id}`}
            onClick={() => onSelect(item.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
              selected === item.id
                ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.flag && <span>{item.flag}</span>}
            {item.logo && (
              <img src={item.logo} alt="" className="w-3.5 h-3.5 object-contain" />
            )}
            {item.label}
          </button>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll(1)}
        className="shrink-0 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors hidden sm:flex"
        aria-label="Scroll right"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export default memo(LeagueFilter);
