/**
 * @file cricketService.js
 * Fetches cricket match data via the Supabase Edge Function `get-cricket-scores`.
 * The Edge Function proxies the Cricbuzz RapidAPI — no key is exposed client-side.
 *
 * @module cricketService
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

/**
 * Fetch cricket scores from the Supabase Edge Function.
 *
 * @param {'live' | 'upcoming' | 'recent'} type - Match type to fetch
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

  if (!data?.matches) {
    return [];
  }

  return data.matches;
}
