// supabase/functions/get-cricket-scores/index.ts
// Proxies CricAPI (cricapi.com) and returns normalised match data.
// Secrets required: RAPIDAPI_KEY = your CricAPI key (Supabase → Settings → Edge Functions → Secrets)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ── Rate limiting (sliding window, per-IP) ────────────────────────────────────
const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 15;
const rateLimitMap   = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now   = Date.now();
  const times = (rateLimitMap.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (times.length >= RATE_MAX) return true;
  times.push(now);
  rateLimitMap.set(ip, times);
  return false;
}

// ── Response cache (30 seconds) ───────────────────────────────────────────────
interface CacheEntry { data: unknown; ts: number }
const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS  = 30_000;

function getCached(key: string): unknown | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { responseCache.delete(key); return null; }
  return entry.data;
}
function setCache(key: string, data: unknown): void {
  responseCache.set(key, { data, ts: Date.now() });
}

// ── CORS headers ──────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

// ── CricAPI normaliser ────────────────────────────────────────────────────────
function normaliseMatch(m: Record<string, unknown>): unknown {
  const teamInfo = (m.teamInfo as Record<string, unknown>[]) || [];
  const scores   = (m.score   as Record<string, unknown>[]) || [];

  const t1Info = teamInfo[0] as Record<string, unknown> | undefined;
  const t2Info = teamInfo[1] as Record<string, unknown> | undefined;

  const matchStarted = Boolean(m.matchStarted);
  const matchEnded   = Boolean(m.matchEnded);
  const status = matchEnded ? 'completed' : matchStarted ? 'live' : 'upcoming';

  const t1Name = String(t1Info?.name || (m.teams as string[])?.[0] || 'Team 1');
  const t2Name = String(t2Info?.name || (m.teams as string[])?.[1] || 'Team 2');

  // Scores: each inning entry has { r, w, o, inning }
  // First inning of team1, first inning of team2
  const score1 = scores.find(s =>
    String(s.inning || '').toLowerCase().includes(t1Name.toLowerCase().split(' ')[0])
    && String(s.inning || '').toLowerCase().includes('inning 1')
  ) || scores[0];

  const score2 = scores.find(s =>
    String(s.inning || '').toLowerCase().includes(t2Name.toLowerCase().split(' ')[0])
    && String(s.inning || '').toLowerCase().includes('inning 1')
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
      shortName: String(t1Info?.shortname || t1Name.substring(0, 4).toUpperCase()),
      logoUrl:   t1Info?.img ? String(t1Info.img) : null,
    },
    team2: {
      name:      t2Name,
      shortName: String(t2Info?.shortname || t2Name.substring(0, 4).toUpperCase()),
      logoUrl:   t2Info?.img ? String(t2Info.img) : null,
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

// ── Handler ───────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let type = 'live';
  try {
    const body = await req.json();
    if (['live', 'upcoming', 'recent'].includes(body?.type)) type = body.type;
  } catch { /* use default */ }

  const cacheKey = `cricket:${type}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { ...CORS, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  const API_KEY = Deno.env.get('RAPIDAPI_KEY');
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: 'RAPIDAPI_KEY secret not configured' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // CricAPI v1 — currentMatches for live/upcoming, matches for recent
  const url = type === 'recent'
    ? `https://api.cricapi.com/v1/matches?apikey=${API_KEY}&offset=0`
    : `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CricAPI returned HTTP ${res.status}`);

    const json = await res.json() as { data?: unknown[]; status?: string };
    if (json.status !== 'success') throw new Error(`CricAPI error: status=${json.status}`);

    const rawMatches = (json.data || []) as Record<string, unknown>[];

    let filtered = rawMatches;
    if (type === 'live')     filtered = rawMatches.filter(m => m.matchStarted && !m.matchEnded);
    if (type === 'upcoming') filtered = rawMatches.filter(m => !m.matchStarted);
    if (type === 'recent')   filtered = rawMatches.filter(m => m.matchEnded);

    const matches = filtered.map(normaliseMatch);
    const payload = { matches, fetchedAt: new Date().toISOString(), type };

    setCache(cacheKey, payload);

    return new Response(JSON.stringify(payload), {
      headers: { ...CORS, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[get-cricket-scores]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
