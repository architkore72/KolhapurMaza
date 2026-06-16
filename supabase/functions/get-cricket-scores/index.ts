// supabase/functions/get-cricket-scores/index.ts
// Proxies Cricbuzz RapidAPI and returns normalised match data.
// Secrets required: RAPIDAPI_KEY (set in Supabase → Settings → Edge Functions → Secrets)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ── Rate limiting (sliding window, per-IP) ──────────────────────────────────
const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 15; // max requests per minute per IP
const rateLimitMap   = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const times = (rateLimitMap.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (times.length >= RATE_MAX) return true;
  times.push(now);
  rateLimitMap.set(ip, times);
  return false;
}

// ── Response cache (30 seconds) ──────────────────────────────────────────────
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

// ── CORS headers ─────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

// ── Match normaliser ──────────────────────────────────────────────────────────

function normaliseMatch(m: Record<string, unknown>): unknown {
  const matchInfo  = m.matchInfo  as Record<string, unknown> || {};
  const matchScore = m.matchScore as Record<string, unknown> || {};

  const t1Info  = matchInfo.team1 as Record<string, unknown> || {};
  const t2Info  = matchInfo.team2 as Record<string, unknown> || {};

  const t1Score = (matchScore.team1Score as Record<string, unknown>) || {};
  const t2Score = (matchScore.team2Score as Record<string, unknown>) || {};
  const inn1_1  = (t1Score.inngs1 as Record<string, unknown>) || {};
  const inn2_1  = (t2Score.inngs1 as Record<string, unknown>) || {};

  const state = String(matchInfo.state || '').toLowerCase();
  const status =
    state === 'in progress' || state === 'innings break' ? 'live'
    : state === 'preview'   || state === 'toss'          ? 'upcoming'
    : 'completed';

  const imageBaseUrl = 'https://cricbuzz-cricket.p.rapidapi.com';

  return {
    id:          String(matchInfo.matchId || m.matchId || ''),
    seriesName:  String(matchInfo.seriesName || ''),
    matchType:   String(matchInfo.matchFormat || matchInfo.matchDesc || '').toUpperCase().split(' ')[0] || 'T20',
    matchDesc:   String(matchInfo.matchDesc || ''),
    venue:       String((matchInfo.venueInfo as Record<string, unknown>)?.ground || ''),
    startTime:   matchInfo.startDate
      ? new Date(Number(matchInfo.startDate)).toISOString()
      : null,
    status,
    statusText:  String(matchInfo.status || ''),
    isLive:      status === 'live',
    tossText:    String(matchInfo.tossResults?.tossResultText || ''),
    team1: {
      name:      String(t1Info.teamName || ''),
      shortName: String(t1Info.teamSName || ''),
      imageId:   t1Info.imageId ? String(t1Info.imageId) : null,
      logoUrl:   t1Info.imageId
        ? `${imageBaseUrl}/img/v1/i1/c${t1Info.imageId}/i.jpg`
        : null,
    },
    team2: {
      name:      String(t2Info.teamName || ''),
      shortName: String(t2Info.teamSName || ''),
      imageId:   t2Info.imageId ? String(t2Info.imageId) : null,
      logoUrl:   t2Info.imageId
        ? `${imageBaseUrl}/img/v1/i1/c${t2Info.imageId}/i.jpg`
        : null,
    },
    score1: Object.keys(inn1_1).length ? {
      runs:    String(inn1_1.runs ?? ''),
      wickets: inn1_1.wickets !== undefined ? String(inn1_1.wickets) : undefined,
      overs:   inn1_1.overs ? String(inn1_1.overs) : undefined,
    } : null,
    score2: Object.keys(inn2_1).length ? {
      runs:    String(inn2_1.runs ?? ''),
      wickets: inn2_1.wickets !== undefined ? String(inn2_1.wickets) : undefined,
      overs:   inn2_1.overs ? String(inn2_1.overs) : undefined,
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

  const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
  if (!RAPIDAPI_KEY) {
    return new Response(JSON.stringify({ error: 'RAPIDAPI_KEY secret not configured' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // Map our type to Cricbuzz endpoint
  const endpointMap: Record<string, string> = {
    live:     'matches/v1/live',
    upcoming: 'matches/v1/upcoming',
    recent:   'matches/v1/recent',
  };
  const endpoint = endpointMap[type];

  try {
    const res = await fetch(`https://cricbuzz-cricket.p.rapidapi.com/${endpoint}`, {
      headers: {
        'X-RapidAPI-Key':  RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'cricbuzz-cricket.p.rapidapi.com',
      },
    });

    if (!res.ok) {
      throw new Error(`Cricbuzz API returned ${res.status}`);
    }

    const json = await res.json() as { typeMatches?: unknown[] };

    // Flatten all matches from all type-match groups
    const rawMatches: Record<string, unknown>[] = [];
    for (const typeGroup of json.typeMatches || []) {
      const tg = typeGroup as Record<string, unknown>;
      for (const seriesGroup of (tg.seriesMatches || []) as Record<string, unknown>[]) {
        const matches = (seriesGroup.seriesAdWrapper as Record<string, unknown>)?.matches;
        if (Array.isArray(matches)) rawMatches.push(...matches);
      }
    }

    const matches = rawMatches.map(normaliseMatch);
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
