import { useBreakingNews } from '../../hooks/useNews';

export default function BreakingTicker() {
  const { data: items = [] } = useBreakingNews();

  if (!items.length) return null;

  const text = items.map(n => n.title).join('   •   ');

  return (
    <div className="bg-red-700 text-white flex items-center overflow-hidden h-8">
      <span className="bg-red-900 px-3 h-full flex items-center text-xs font-bold uppercase tracking-wider whitespace-nowrap flex-shrink-0">
        Breaking
      </span>
      <div className="relative flex-1 overflow-hidden h-full flex items-center">
        <span className="ticker-animate text-sm px-4">
          {text}
        </span>
      </div>
    </div>
  );
}
