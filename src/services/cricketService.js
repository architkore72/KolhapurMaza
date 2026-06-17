/**
 * @file cricketService.js
 * Fetches cricket match data via Supabase Edge Functions:
 *   - get-cricket-scores
 *
 * @module cricketService
 */

import { supabase } from '../lib/supabase';

/**
 * Fetch cricket scores from the Edge Function.
 *
 * @param {'live' | 'upcoming' | 'recent'} type
 * @returns {Promise<import('../types/sports.js').CricketMatch[]>}
 */
export async function fetchCricketScores(type = 'live') {
  const { data, error } = await supabase.functions.invoke('get-cricket-scores', {
    body: { type },
  });

  if (error) {
    console.error('[CricketService] Edge function error:', error);
    throw new Error(error.message || 'Failed to fetch cricket scores');
  }

  return data?.matches ?? [];
}
