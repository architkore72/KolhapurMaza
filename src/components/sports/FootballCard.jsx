/**
 * FootballCard — glassmorphism card for a single football match.
 * Shows home/away teams with logos, score, elapsed time, league, venue.
 *
 * @param {{ match: import('../../types/sports.js').FootballMatch, onSelect: Function, isFavorite: boolean, onToggleFavorite: Function }} props
 */

import { memo } from 'react';
import { MapPin, Star, ChevronRight, Clock } from 'lucide-react';
import LiveIndicator from './LiveIndicator';
import { format, parseISO } from 'date-fns';
import { LIVE_STATUSES } from '../../types/sports.js';

function TeamBlock({ team, goals, isHome }) {
  const align = isHome ? 'items-start' : 'items-end';
  const textAlign = isHome ? 'text-left' : 'text-right';

  return (
    <div className={`flex flex-col ${align} gap-2 flex-1`}>
      {/* Logo */}
      {team.logo ? (
        <img
          src={team.logo}
          alt={team.name}
          className="w-12 h-12 object-contain drop-shadow-md"
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
          {team.name?.slice(0, 3).toUpperCase()}
        </div>
      )}
      <p className={`text-sm font-semibold text-white leading-tight ${textAlign} w-full`}>
        {team.name}
      </p>
      {/* Score */}
      <span className="text-3xl font-black text-white tabular-nums">
        {goals ?? '-'}
      </span>
    </div>
  );
}

function FootballCard({ match, onSelect, isFavorite, onToggleFavorite }) {
  const isLive = LIVE_STATUSES.has(match.status);

  // Display time: elapsed minutes for live, or formatted date for upcoming/finished
  const timeDisplay = (() => {
    if (isLive && match.elapsed) return `${match.elapsed}'`;
    if (match.status === 'HT') return 'HT';
    if (match.status === 'FT') return 'FT';
    if (match.status === 'NS') {
      try { return format(parseISO(match.date), 'dd MMM, HH:mm'); } catch { return ''; }
    }
    return match.statusLong || match.status;
  })();

  return (
    <article
      className="sports-glass-card group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30"
      onClick={() => onSelect(match)}
      aria-label={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
    >
      {/* League + fav button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          {match.league.logo && (
            <img src={match.league.logo} alt={match.league.name} className="w-4 h-4 object-contain" />
          )}
          <span className="text-xs text-white/60 font-medium truncate">{match.league.name}</span>
          {match.league.flag && <span className="text-xs">{match.league.flag}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLive && <LiveIndicator />}
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(match.id); }}
            className="text-white/40 hover:text-yellow-400 transition-colors"
            aria-label={isFavorite ? 'Remove favourite' : 'Add favourite'}
          >
            <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-yellow-400' : ''} />
          </button>
        </div>
      </div>

      {/* Teams + Score row */}
      <div className="flex items-center justify-between gap-2 py-2">
        <TeamBlock team={match.homeTeam} goals={match.goals.home} isHome />

        {/* Center: time / score divider */}
        <div className="flex flex-col items-center gap-1 shrink-0 px-2">
          <span className={`text-lg font-black ${isLive ? 'text-red-400' : 'text-white/60'}`}>
            {match.goals.home !== null && match.goals.away !== null
              ? `${match.goals.home} - ${match.goals.away}`
              : 'vs'}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isLive
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-white/10 text-white/60'
          }`}>
            {timeDisplay}
          </span>
          {match.status === 'HT' && (
            <span className="text-xs text-white/40">
              {match.halftime.home} - {match.halftime.away} HT
            </span>
          )}
        </div>

        <TeamBlock team={match.awayTeam} goals={match.goals.away} isHome={false} />
      </div>

      {/* Footer: venue + chevron */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
        <span className="text-xs text-white/40 flex items-center gap-1 truncate">
          {match.venue?.name
            ? <><MapPin size={11} /> {match.venue.name}{match.venue.city ? `, ${match.venue.city}` : ''}</>
            : <><Clock size={11} /> {match.league.roundName || 'Match day'}</>
          }
        </span>
        <ChevronRight size={14} className="text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
      </div>
    </article>
  );
}

export default memo(FootballCard);
