/**
 * @file useCricketScores.js
 * React Query hooks for fetching cricket match data.
 * Each hook auto-refreshes every 20 seconds.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchCricketScores } from '../services/cricketService';

const REFETCH_INTERVAL = 20_000; // 20 seconds

/**
 * Shared query factory for cricket scores.
 * @param {'live'|'upcoming'|'recent'} type
 */
function useCricket(type) {
  return useQuery({
    queryKey: ['cricket', type],
    queryFn: () => fetchCricketScores(type),
    refetchInterval: REFETCH_INTERVAL,
    refetchIntervalInBackground: false, // only refresh when tab is active
    staleTime: 15_000,
    retry: 2,
    retryDelay: 3000,
  });
}

/** Hook for live cricket matches */
export function useLiveCricket() {
  return useCricket('live');
}

/** Hook for upcoming cricket matches */
export function useUpcomingCricket() {
  return useCricket('upcoming');
}

/** Hook for recent cricket results */
export function useRecentCricket() {
  return useCricket('recent');
}
