// supabase/functions/get-football-scores/index.ts
// Proxies API-Football and returns normalised match data.
// Secrets required: API_FOOTBALL_KEY (set in Supabase → Settings → Edge Functions → Secrets)

export {};

// ── Rate limiting ─────────────────────────────────────────────────────────────
const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 20;
const rateLimitMap   = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const times = (rateLimitMap.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (times.length >= RATE_MAX) return true;
  times.push(now);
  rateLimitMap.set(ip, times);
  return false;
}

// ── Cache ─────────────────────────────────────────────────────────────────────
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

// ── CORS ──────────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

const LIVE_STATUSES = new Set([
  '1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE',
]);

// ── Normaliser ────────────────────────────────────────────────────────────────

function normaliseMatch(f: Record<string, unknown>): unknown {
  const fixture  = f.fixture  as Record<string, unknown> || {};
  const league   = f.league   as Record<string, unknown> || {};
  const teams    = f.teams    as Record<string, unknown> || {};
  const goals    = f.goals    as Record<string, unknown> || {};
  const score    = f.score    as Record<string, unknown> || {};
  const status   = fixture.status as Record<string, unknown> || {};
  const venue    = fixture.venue  as Record<string, unknown> || {};
  const elapsed  = status.elapsed as number | null ?? null;
  const shortSt  = String(status.short || '');

  return {
    id: Number(fixture.id || 0),
    league: {
      id:        Number(league.id || 0),
      name:      String(league.name || ''),
      logo:      String(league.logo || ''),
      country:   String(league.country || ''),
      flag:      String(league.flag || ''),
      roundName: String(league.round || ''),
    },
    homeTeam: {
      id:   Number((teams.home as Record<string, unknown>)?.id || 0),
      name: String((teams.home as Record<string, unknown>)?.name || ''),
      logo: String((teams.home as Record<string, unknown>)?.logo || ''),
    },
    awayTeam: {
      id:   Number((teams.away as Record<string, unknown>)?.id || 0),
      name: String((teams.away as Record<string, unknown>)?.name || ''),
      logo: String((teams.away as Record<string, unknown>)?.logo || ''),
    },
    goals: {
      home: goals.home !== undefined ? Number(goals.home) : null,
      away: goals.away !== undefined ? Number(goals.away) : null,
    },
    halftime: {
      home: (score.halftime as Record<string, unknown>)?.home !== undefined
        ? Number((score.halftime as Record<string, unknown>).home) : null,
      away: (score.halftime as Record<string, unknown>)?.away !== undefined
        ? Number((score.halftime as Record<string, unknown>).away) : null,
    },
    status:     shortSt,
    statusLong: String(status.long || ''),
    elapsed,
    date:    String(fixture.date || ''),
    venue: {
      name: String(venue.name || ''),
      city: String(venue.city || ''),
    },
    isLive: LIVE_STATUSES.has(shortSt),
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let type: string = 'live';
  let leagueId: number | null = null;

  try {
    const body = await req.json();
    if (['live', 'fixtures', 'results'].includes(body?.type)) type = body.type;
    if (body?.leagueId) leagueId = Number(body.leagueId);
  } catch { /* defaults */ }

  const cacheKey = `football:${type}:${leagueId ?? 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { ...CORS, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  const API_KEY = Deno.env.get('API_FOOTBALL_KEY');
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: 'API_FOOTBALL_KEY secret not configured' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // Build query params
  const params = new URLSearchParams();
  const today  = new Date().toISOString().split('T')[0];

  if (type === 'live') {
    params.set('live', 'all');
    if (leagueId) params.set('league', String(leagueId));
  } else if (type === 'fixtures') {
    params.set('date', today);
    if (leagueId) params.set('league', String(leagueId));
    params.set('season', String(new Date().getFullYear()));
    params.set('status', 'NS-TBD');  // Not started / TBD
  } else {
    // results — last 10 finished
    params.set('date', today);
    if (leagueId) params.set('league', String(leagueId));
    params.set('season', String(new Date().getFullYear()));
    params.set('status', 'FT-AET-PEN');
  }

  try {
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?${params}`, {
      headers: { 'x-apisports-key': API_KEY },
    });

    if (!res.ok) throw new Error(`API-Football returned ${res.status}`);

    const json = await res.json() as { response?: unknown[] };
    const matches = (json.response || []).map(f => normaliseMatch(f as Record<string, unknown>));
    const payload = { matches, fetchedAt: new Date().toISOString(), type };

    setCache(cacheKey, payload);

    return new Response(JSON.stringify(payload), {
      headers: { ...CORS, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[get-football-scores]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
