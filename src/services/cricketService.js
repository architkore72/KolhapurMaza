/**
 * @file cricketService.js
 * Fetches cricket match data directly from CricAPI v1.
 *
 * @module cricketService
 */

const API_KEY = import.meta.env.VITE_CRICAPI_KEY;

function normaliseMatch(m) {
  const teamInfo = m.teamInfo || [];
  const scores   = m.score   || [];

  const t1Info = teamInfo[0];
  const t2Info = teamInfo[1];

  const matchStarted = Boolean(m.matchStarted);
  const matchEnded   = Boolean(m.matchEnded);
  const status = matchEnded ? 'completed' : matchStarted ? 'live' : 'upcoming';

  const t1Name = t1Info?.name || m.teams?.[0] || 'Team 1';
  const t2Name = t2Info?.name || m.teams?.[1] || 'Team 2';

  const score1 = scores.find(s =>
    String(s.inning || '').toLowerCase().includes(t1Name.toLowerCase().split(' ')[0]) &&
    String(s.inning || '').toLowerCase().includes('inning 1')
  ) || scores[0];

  const score2 = scores.find(s =>
    String(s.inning || '').toLowerCase().includes(t2Name.toLowerCase().split(' ')[0]) &&
    String(s.inning || '').toLowerCase().includes('inning 1')
  ) || scores[1];

  return {
    id:         String(m.id || ''),
    seriesName: String(m.name || ''),
    matchType:  String(m.matchType || 'T20').toUpperCase(),
    matchDesc:  String(m.name || ''),
    venue:      String(m.venue || ''),
    startTime:  m.dateTimeGMT ? new Date(String(m.dateTimeGMT)).toISOString() : null,
    status,
    statusText: String(m.status || ''),
    isLive:     status === 'live',
    tossText:   '',
    team1: {
      name:      t1Name,
      shortName: t1Info?.shortname || t1Name.substring(0, 4).toUpperCase(),
      logoUrl:   t1Info?.img || null,
    },
    team2: {
      name:      t2Name,
      shortName: t2Info?.shortname || t2Name.substring(0, 4).toUpperCase(),
      logoUrl:   t2Info?.img || null,
    },
    score1: score1 ? {
      runs:    String(score1.r ?? ''),
      wickets: score1.w !== undefined ? String(score1.w) : undefined,
      overs:   score1.o !== undefined ? String(score1.o) : undefined,
    } : null,
    score2: score2 ? {
      runs:    String(score2.r ?? ''),
      wickets: score2.w !== undefined ? String(score2.w) : undefined,
      overs:   score2.o !== undefined ? String(score2.o) : undefined,
    } : null,
  };
}

/**
 * Fetch cricket scores directly from CricAPI v1.
 *
 * @param {'live' | 'upcoming' | 'recent'} type
 * @returns {Promise<import('../types/sports.js').CricketMatch[]>}
 */
export async function fetchCricketScores(type = 'live') {
  if (!API_KEY) {
    console.warn('[CricketService] VITE_CRICAPI_KEY is not set');
    return [];
  }

  const endpoint = type === 'recent'
    ? `https://api.cricapi.com/v1/matches?apikey=${API_KEY}&offset=0`
    : `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`;

  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`CricAPI returned HTTP ${res.status}`);

  const json = await res.json();
  if (json.status !== 'success') {
    throw new Error(`CricAPI error: ${json.reason || json.status || 'unknown'}`);
  }

  const raw = json.data || [];
  let filtered = raw;
  if (type === 'live')     filtered = raw.filter(m => m.matchStarted && !m.matchEnded);
  if (type === 'upcoming') filtered = raw.filter(m => !m.matchStarted);
  if (type === 'recent')   filtered = raw.filter(m => m.matchEnded);

  return filtered.map(normaliseMatch);
}
