/**
 * LiveIndicator — pulsing red dot with "LIVE" text.
 * Used on cricket and football match cards to indicate a live match.
 */

export default function LiveIndicator({ size = 'sm' }) {
  const textSize = size === 'lg' ? 'text-sm' : 'text-xs';
  const dotSize  = size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2';

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold tracking-widest text-red-400 ${textSize}`}>
      <span className="relative flex">
        <span
          className={`absolute inline-flex ${dotSize} rounded-full bg-red-400 opacity-75 animate-ping`}
          aria-hidden="true"
        />
        <span className={`relative inline-flex ${dotSize} rounded-full bg-red-500`} />
      </span>
      LIVE
    </span>
  );
}
