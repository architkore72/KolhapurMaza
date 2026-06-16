/**
 * @file useFootballScores.js
 * React Query hooks for fetching football match data and standings.
 * Each hook auto-refreshes every 20 seconds.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchFootballScores, fetchFootballStandings } from '../services/footballService';

const REFETCH_INTERVAL = 20_000;        // 20 seconds for scores
const STANDINGS_INTERVAL = 5 * 60_000; // 5 minutes for standings

/**
 * Hook for football matches (live / fixtures / results).
 * @param {'live'|'fixtures'|'results'} type
 * @param {number|null} leagueId - Filter by league (null = all)
 */
export function useFootballScores(type = 'live', leagueId = null) {
  return useQuery({
    queryKey: ['football', type, leagueId],
    queryFn: () => fetchFootballScores(type, leagueId),
    refetchInterval: REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
    retry: 2,
    retryDelay: 3000,
  });
}

/**
 * Hook for football league standings.
 * @param {number} leagueId
 * @param {number} [season]
 */
export function useFootballStandings(leagueId, season) {
  return useQuery({
    queryKey: ['football-standings', leagueId, season],
    queryFn: () => fetchFootballStandings(leagueId, season),
    refetchInterval: STANDINGS_INTERVAL,
    staleTime: 4 * 60_000,
    retry: 2,
    enabled: !!leagueId,
  });
}
