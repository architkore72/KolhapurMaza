/**
 * @file footballService.js
 * Fetches football data via Supabase Edge Functions:
 *   - get-football-scores  → live / fixtures / results
 *   - get-football-standings → league tables
 *
 * @module footballService
 */

import { supabase } from '../lib/supabase';

/**
 * Fetch football matches from the Edge Function.
 *
 * @param {'live' | 'fixtures' | 'results'} type
 * @param {number} [leagueId] - Optional API-Football league ID to filter
 * @returns {Promise<import('../types/sports.js').FootballMatch[]>}
 */
export async function fetchFootballScores(type = 'live', leagueId = null) {
  const body = { type };
  if (leagueId) body.leagueId = leagueId;

  const { data, error } = await supabase.functions.invoke('get-football-scores', {
    body,
  });

  if (error) {
    console.error('[FootballService] Edge function error:', error);
    throw new Error(error.message || 'Failed to fetch football scores');
  }

  return data?.matches ?? [];
}

/**
 * Fetch league standings.
 *
 * @param {number} leagueId - API-Football league ID
 * @param {number} [season] - Season year (defaults to current year)
 * @returns {Promise<import('../types/sports.js').FootballStanding[]>}
 */
export async function fetchFootballStandings(leagueId, season) {
  const currentSeason = season ?? new Date().getFullYear();

  const { data, error } = await supabase.functions.invoke('get-football-standings', {
    body: { leagueId, season: currentSeason },
  });

  if (error) {
    console.error('[FootballService] Standings error:', error);
    throw new Error(error.message || 'Failed to fetch standings');
  }

  return data?.standings ?? [];
}
