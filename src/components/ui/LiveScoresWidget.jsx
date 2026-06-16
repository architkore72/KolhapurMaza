import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCricketScores } from '../../services/cricketService';
import { useQuery } from '@tanstack/react-query';

const TABS = ['RECENT', 'LIVE', 'UPCOMING'];

function ScoreRow({ match }) {
  const t1 = match.team1;
  const t2 = match.team2;
  const s1 = match.score1;
  const s2 = match.score2;

  return (
    <div className="border-b border-gray-100 dark:border-gray-700 py-2.5 last:border-0">
      {/* Teams & Scores */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-1 items-center text-center text-xs">
        {/* Team 1 */}
        <div className="flex flex-col items-center gap-0.5">
          {t1.logoUrl && (
            <img src={t1.logoUrl} alt={t1.shortName} className="w-5 h-5 object-contain" onError={e => e.target.style.display='none'} />
          )}
          <span className="font-bold text-gray-800 dark:text-gray-100">{t1.shortName}</span>
          {s1 && (
            <span className="text-gray-500 dark:text-gray-400 text-[10px]">
              {s1.runs}{s1.wickets !== undefined ? `/${s1.wickets}` : ''}
              {s1.overs ? ` (${s1.overs})` : ''}
            </span>
          )}
        </div>

        {/* VS */}
        <span className="text-gray-400 font-semibold text-[10px]">vs</span>

        {/* Team 2 */}
        <div className="flex flex-col items-center gap-0.5">
          {t2.logoUrl && (
            <img src={t2.logoUrl} alt={t2.shortName} className="w-5 h-5 object-contain" onError={e => e.target.style.display='none'} />
          )}
          <span className="font-bold text-gray-800 dark:text-gray-100">{t2.shortName}</span>
          {s2 && (
            <span className="text-gray-500 dark:text-gray-400 text-[10px]">
              {s2.runs}{s2.wickets !== undefined ? `/${s2.wickets}` : ''}
              {s2.overs ? ` (${s2.overs})` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="mt-1.5 flex items-center gap-1.5 justify-center flex-wrap">
        {match.isLive && (
          <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </span>
        )}
        <span className="text-[10px] text-center text-blue-700 dark:text-blue-400 font-medium leading-tight">
          {match.statusText.length > 40 ? match.statusText.slice(0, 40) + '…' : match.statusText}
        </span>
      </div>

      {/* Series */}
      <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">
        {match.seriesName.length > 45 ? match.seriesName.slice(0, 45) + '…' : match.seriesName}
      </p>
    </div>
  );
}

export default function LiveScoresWidget() {
  const [activeTab, setActiveTab] = useState('RECENT');

  const tabType = activeTab.toLowerCase();

  const { data: matches = [], isLoading, isError } = useQuery({
    queryKey: ['cricket-widget', tabType],
    queryFn: () => fetchCricketScores(tabType),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-blue-700 px-3 py-2 flex items-center justify-between">
        <span className="text-white text-sm font-bold tracking-wide">🏏 Live Cricket</span>
        <Link to="/sports" className="text-blue-200 hover:text-white text-[10px] font-semibold transition-colors">
          View All →
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-[11px] font-bold tracking-wide transition-colors ${
              activeTab === tab
                ? 'bg-blue-700 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-3 max-h-80 overflow-y-auto">
        {isLoading && (
          <div className="py-6 text-center">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {isError && (
          <p className="py-4 text-center text-xs text-gray-400">Unable to load scores</p>
        )}

        {!isLoading && !isError && matches.length === 0 && (
          <p className="py-4 text-center text-xs text-gray-400">
            No {activeTab.toLowerCase()} matches right now
          </p>
        )}

        {!isLoading && matches.slice(0, 6).map(match => (
          <ScoreRow key={match.id} match={match} />
        ))}
      </div>

      {/* Footer link */}
      <div className="bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700 py-1.5 text-center">
        <Link to="/sports" className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold hover:underline">
          Full Scorecard & Standings →
        </Link>
      </div>
    </div>
  );
}
