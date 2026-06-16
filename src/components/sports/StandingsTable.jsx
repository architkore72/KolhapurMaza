/**
 * StandingsTable — sortable league standings table for football.
 *
 * @param {{ standings: import('../../types/sports.js').FootballStanding[], isLoading: boolean }} props
 */

import { memo } from 'react';
import { Trophy } from 'lucide-react';

function FormBadge({ result }) {
  const colours = {
    W: 'bg-green-500',
    D: 'bg-yellow-500',
    L: 'bg-red-500',
  };
  return (
    <span
      className={`w-4 h-4 rounded-sm text-[9px] font-bold flex items-center justify-center text-white ${colours[result] || 'bg-white/10'}`}
    >
      {result}
    </span>
  );
}

function StandingsTable({ standings, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-white/5" />
        ))}
      </div>
    );
  }

  if (!standings?.length) {
    return (
      <div className="text-center py-10 text-white/40">
        <Trophy size={40} className="mx-auto mb-2 opacity-30" />
        <p>Standings not available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ scrollbarWidth: 'thin' }}>
      <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr className="text-xs text-white/40 uppercase tracking-wide border-b border-white/5">
            <th className="py-2 px-2 text-left w-6">#</th>
            <th className="py-2 px-2 text-left">Team</th>
            <th className="py-2 px-2 text-center">P</th>
            <th className="py-2 px-2 text-center">W</th>
            <th className="py-2 px-2 text-center">D</th>
            <th className="py-2 px-2 text-center">L</th>
            <th className="py-2 px-2 text-center">GD</th>
            <th className="py-2 px-2 text-center font-bold">Pts</th>
            <th className="py-2 px-2 text-center hidden md:table-cell">Form</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => {
            // Description classes: Champions League zone, Europa, relegation
            const desc = row.description?.toLowerCase() || '';
            const zoneColour = desc.includes('champions league')
              ? 'border-l-2 border-blue-400'
              : desc.includes('europa league')
              ? 'border-l-2 border-orange-400'
              : desc.includes('relegation')
              ? 'border-l-2 border-red-500'
              : '';

            return (
              <tr
                key={row.team.id}
                className={`border-b border-white/5 hover:bg-white/5 transition-colors ${zoneColour}`}
              >
                {/* Rank */}
                <td className="py-2.5 px-2 text-white/50 font-bold text-xs">{row.rank}</td>

                {/* Team */}
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-2">
                    {row.team.logo && (
                      <img src={row.team.logo} alt={row.team.name} className="w-5 h-5 object-contain" />
                    )}
                    <span className="font-semibold text-white text-xs sm:text-sm">{row.team.name}</span>
                  </div>
                </td>

                {/* Stats */}
                <td className="py-2.5 px-2 text-center text-white/60">{row.all.played}</td>
                <td className="py-2.5 px-2 text-center text-green-400">{row.all.win}</td>
                <td className="py-2.5 px-2 text-center text-yellow-400">{row.all.draw}</td>
                <td className="py-2.5 px-2 text-center text-red-400">{row.all.lose}</td>
                <td className={`py-2.5 px-2 text-center font-semibold text-xs ${
                  row.goalsDiff > 0 ? 'text-green-400' : row.goalsDiff < 0 ? 'text-red-400' : 'text-white/60'
                }`}>
                  {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-black text-white">{row.points}</span>
                </td>

                {/* Form (desktop only) */}
                <td className="py-2.5 px-2 hidden md:table-cell">
                  <div className="flex gap-0.5 justify-center">
                    {(row.form || '').split('').slice(-5).map((r, i) => (
                      <FormBadge key={i} result={r} />
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 px-2 text-xs text-white/40">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400" /> UEFA Champions League</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-400" /> UEFA Europa League</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> Relegation</span>
      </div>
    </div>
  );
}

export default memo(StandingsTable);
