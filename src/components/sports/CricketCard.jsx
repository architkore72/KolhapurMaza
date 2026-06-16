/**
 * CricketCard — glassmorphism card for a single cricket match.
 * Shows teams, scores, match type, venue, status, and live indicator.
 *
 * @param {{ match: import('../../types/sports.js').CricketMatch, onSelect: Function, isFavorite: boolean, onToggleFavorite: Function }} props
 */

import { memo } from 'react';
import { MapPin, Star, ChevronRight, Clock } from 'lucide-react';
import LiveIndicator from './LiveIndicator';
import { formatDistanceToNow, parseISO } from 'date-fns';

/** Map match type to pill colour class */
const TYPE_COLOURS = {
  T20:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  ODI:  'bg-green-500/20 text-green-300 border-green-500/30',
  Test: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  T10:  'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

function TeamRow({ team, score }) {
  const scoreText = score?.runs !== undefined
    ? `${score.runs}${score.wickets !== undefined ? `/${score.wickets}` : ''}`
    : null;
  const oversText = score?.overs ? `(${score.overs})` : null;

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Team logo or fallback initials */}
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt={team.name}
            className="w-9 h-9 rounded-full object-contain bg-white/5 p-0.5 shrink-0"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <span
          className="w-9 h-9 rounded-full bg-white/10 text-xs font-bold flex items-center justify-center shrink-0 text-white"
          style={{ display: team.logoUrl ? 'none' : 'flex' }}
        >
          {team.shortName?.slice(0, 3) || team.name?.slice(0, 3)}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate leading-tight">{team.name}</p>
          {team.shortName && (
            <p className="text-xs text-white/50">{team.shortName}</p>
          )}
        </div>
      </div>

      {/* Score */}
      {scoreText && (
        <div className="text-right shrink-0 ml-2">
          <span className="text-base font-bold text-white">{scoreText}</span>
          {oversText && (
            <span className="block text-xs text-white/50">{oversText}</span>
          )}
        </div>
      )}
    </div>
  );
}

function CricketCard({ match, onSelect, isFavorite, onToggleFavorite }) {
  const typeColour = TYPE_COLOURS[match.matchType] || 'bg-white/10 text-white/70 border-white/10';

  // Format start time for upcoming matches
  const timeAgo = (() => {
    try {
      if (match.startTime) {
        return formatDistanceToNow(parseISO(match.startTime), { addSuffix: true });
      }
    } catch {
      return null;
    }
    return null;
  })();

  return (
    <article
      className="sports-glass-card group relative cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30"
      onClick={() => onSelect(match)}
      aria-label={`${match.team1.name} vs ${match.team2.name} — ${match.statusText}`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${typeColour}`}>
          {match.matchType}
        </span>
        <div className="flex items-center gap-2">
          {match.isLive && <LiveIndicator />}
          {!match.isLive && match.status === 'upcoming' && timeAgo && (
            <span className="text-xs text-white/50 flex items-center gap-1">
              <Clock size={11} /> {timeAgo}
            </span>
          )}
          {/* Favourite toggle */}
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(match.id); }}
            className="text-white/40 hover:text-yellow-400 transition-colors"
            aria-label={isFavorite ? 'Remove favourite' : 'Add favourite'}
          >
            <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-yellow-400' : ''} />
          </button>
        </div>
      </div>

      {/* Series name */}
      <p className="text-xs text-white/50 mb-2 truncate font-medium">{match.seriesName}</p>

      {/* Teams & scores */}
      <div className="divide-y divide-white/5">
        <TeamRow team={match.team1} score={match.score1} />
        <TeamRow team={match.team2} score={match.score2} />
      </div>

      {/* Status text */}
      {match.statusText && (
        <p className={`mt-3 text-xs font-semibold px-2 py-1 rounded ${
          match.isLive
            ? 'text-red-300 bg-red-500/10'
            : match.status === 'completed'
            ? 'text-white/60 bg-white/5'
            : 'text-emerald-300 bg-emerald-500/10'
        }`}>
          {match.statusText}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
        <span className="text-xs text-white/40 flex items-center gap-1 truncate">
          <MapPin size={11} /> {match.venue || 'Venue TBC'}
        </span>
        <ChevronRight size={14} className="text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
      </div>
    </article>
  );
}

export default memo(CricketCard);
