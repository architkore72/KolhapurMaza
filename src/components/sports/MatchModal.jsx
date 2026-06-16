/**
 * MatchModal — full-screen detail modal for a cricket or football match.
 * Animates in from bottom, closes on backdrop click or Escape key.
 *
 * @param {{ match: object|null, sport: 'cricket'|'football', onClose: Function }} props
 */

import { useEffect, memo } from 'react';
import { X, MapPin, Clock, Trophy, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import LiveIndicator from './LiveIndicator';
import { LIVE_STATUSES } from '../../types/sports.js';

function CricketDetail({ match }) {
  return (
    <div className="space-y-4">
      {/* Toss */}
      {match.tossText && (
        <div className="bg-white/5 rounded-xl p-3 text-sm text-white/70">
          🏏 {match.tossText}
        </div>
      )}

      {/* Innings detail */}
      <div className="space-y-3">
        {[
          { team: match.team1, score: match.score1 },
          { team: match.team2, score: match.score2 },
        ].map(({ team, score }, idx) => (
          <div key={idx} className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={team.name} className="w-10 h-10 rounded-full object-contain bg-white/5 p-0.5" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                  {team.shortName?.slice(0, 3)}
                </div>
              )}
              <div>
                <p className="font-bold text-white">{team.name}</p>
                {team.shortName && <p className="text-xs text-white/50">{team.shortName}</p>}
              </div>
            </div>
            {score ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Stat label="Score" value={`${score.runs ?? '—'}${score.wickets !== undefined ? `/${score.wickets}` : ''}`} />
                <Stat label="Overs" value={score.overs ?? '—'} />
                {score.runRate && <Stat label="Run Rate" value={score.runRate} />}
                {score.target && <Stat label="Target" value={score.target} />}
              </div>
            ) : (
              <p className="text-sm text-white/40">Yet to bat</p>
            )}
          </div>
        ))}
      </div>

      {/* Status */}
      <div className={`rounded-xl p-3 text-sm font-semibold text-center ${
        match.isLive ? 'bg-red-500/10 text-red-300' : 'bg-white/5 text-white/70'
      }`}>
        {match.statusText}
      </div>
    </div>
  );
}

function FootballDetail({ match }) {
  const isLive = LIVE_STATUSES.has(match.status);
  return (
    <div className="space-y-4">
      {/* Big score */}
      <div className="flex items-center justify-around py-4">
        <TeamSide team={match.homeTeam} goals={match.goals.home} />
        <div className="text-center">
          <p className="text-5xl font-black text-white tabular-nums">
            {match.goals.home ?? '0'} — {match.goals.away ?? '0'}
          </p>
          {isLive && match.elapsed && (
            <p className="text-red-400 font-bold mt-1">{match.elapsed}'</p>
          )}
          {match.status === 'HT' && (
            <p className="text-white/60 text-sm mt-1">Half Time</p>
          )}
          {match.status === 'FT' && (
            <p className="text-white/60 text-sm mt-1">Full Time</p>
          )}
        </div>
        <TeamSide team={match.awayTeam} goals={match.goals.away} />
      </div>

      {/* Half time score */}
      {match.halftime.home !== null && (
        <div className="bg-white/5 rounded-xl p-3 text-center text-sm text-white/60">
          Half Time: {match.halftime.home} – {match.halftime.away}
        </div>
      )}

      {/* League info */}
      <div className="bg-white/5 rounded-xl p-4 grid grid-cols-2 gap-3">
        <Stat label="League" value={match.league.name} />
        <Stat label="Round" value={match.league.roundName || '—'} />
        {match.venue?.name && <Stat label="Venue" value={match.venue.name} />}
        {match.venue?.city && <Stat label="City" value={match.venue.city} />}
      </div>
    </div>
  );
}

function TeamSide({ team, goals }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {team.logo ? (
        <img src={team.logo} alt={team.name} className="w-16 h-16 object-contain" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white">
          {team.name?.slice(0, 3).toUpperCase()}
        </div>
      )}
      <p className="text-sm font-bold text-white text-center max-w-[80px] leading-tight">{team.name}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-white/40 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function MatchModal({ match, sport, onClose }) {
  // Close on Escape
  useEffect(() => {
    if (!match) return;
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [match, onClose]);

  if (!match) return null;

  const isCricket = sport === 'cricket';
  const title = isCricket
    ? `${match.team1?.name} vs ${match.team2?.name}`
    : `${match.homeTeam?.name} vs ${match.awayTeam?.name}`;

  const isLive = isCricket ? match.isLive : LIVE_STATUSES.has(match.status);

  let dateStr = '';
  try {
    const d = isCricket ? match.startTime : match.date;
    if (d) dateStr = format(parseISO(d), 'EEEE, d MMMM yyyy • HH:mm');
  } catch { /* noop */ }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Panel */}
      <div
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15,15,30,0.97) 0%, rgba(30,15,40,0.97) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between p-5 pb-3"
          style={{ background: 'inherit', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-center gap-2 mb-1">
              {isLive && <LiveIndicator size="lg" />}
              <span className="text-xs text-white/50 font-medium">
                {isCricket ? match.matchType : match.league?.name}
              </span>
            </div>
            <h2 className="text-base font-bold text-white leading-tight">{title}</h2>
            {dateStr && (
              <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                <Calendar size={11} /> {dateStr}
              </p>
            )}
            {(isCricket ? match.venue : match.venue?.name) && (
              <p className="text-xs text-white/40 mt-0.5 flex items-center gap-1">
                <MapPin size={11} />
                {isCricket ? match.venue : `${match.venue.name}${match.venue.city ? `, ${match.venue.city}` : ''}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {isCricket ? <CricketDetail match={match} /> : <FootballDetail match={match} />}
        </div>
      </div>
    </div>
  );
}

export default memo(MatchModal);
