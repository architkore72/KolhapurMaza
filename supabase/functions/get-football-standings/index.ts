// supabase/functions/get-football-standings/index.ts
// Returns league standings from API-Football.
// Secrets required: API_FOOTBALL_KEY

export {};

// ── Cache (5 minutes for standings) ──────────────────────────────────────────
interface CacheEntry { data: unknown; ts: number }
const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS  = 5 * 60_000;

function getCached(key: string): unknown | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { responseCache.delete(key); return null; }
  return entry.data;
}
function setCache(key: string, data: unknown): void {
  responseCache.set(key, { data, ts: Date.now() });
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const times = (rateLimitMap.get(ip) || []).filter(t => now - t < 60_000);
  if (times.length >= 10) return true;
  times.push(now);
  rateLimitMap.set(ip, times);
  return false;
}

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

function normaliseStanding(row: Record<string, unknown>): unknown {
  const team = row.team as Record<string, unknown> || {};
  const all  = row.all  as Record<string, unknown> || {};
  const home = row.home as Record<string, unknown> || {};
  const away = row.away as Record<string, unknown> || {};

  const mapStats = (s: Record<string, unknown>) => ({
    played:       Number(s.played || 0),
    win:          Number(s.win    || 0),
    draw:         Number(s.draw   || 0),
    lose:         Number(s.lose   || 0),
    goals:        Number((s.goals as Record<string, unknown>)?.for ?? 0),
    goalsAgainst: Number((s.goals as Record<string, unknown>)?.against ?? 0),
  });

  return {
    rank:        Number(row.rank        || 0),
    points:      Number(row.points      || 0),
    goalsDiff:   Number(row.goalsDiff   || 0),
    form:        String(row.form        || ''),
    description: String(row.description || ''),
    team: {
      id:   Number(team.id   || 0),
      name: String(team.name || ''),
      logo: String(team.logo || ''),
    },
    all:  mapStats(all),
    home: mapStats(home),
    away: mapStats(away),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let leagueId = 39;
  let season   = new Date().getFullYear();

  try {
    const body = await req.json();
    if (body?.leagueId) leagueId = Number(body.leagueId);
    if (body?.season)   season   = Number(body.season);
  } catch { /* defaults */ }

  const cacheKey = `standings:${leagueId}:${season}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { ...CORS, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  const API_KEY = Deno.env.get('API_FOOTBALL_KEY');
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: 'API_FOOTBALL_KEY not configured' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${season}`,
      { headers: { 'x-apisports-key': API_KEY } },
    );

    if (!res.ok) throw new Error(`API-Football returned ${res.status}`);

    const json = await res.json() as { response?: unknown[] };
    const rawStandings = (json.response?.[0] as Record<string, unknown>)?.league as Record<string, unknown>;
    const rawGroups    = (rawStandings?.standings || []) as Record<string, unknown>[][];
    // standings is an array of groups (e.g., single group for PL, multiple for World Cup)
    const flattened    = rawGroups.flat().map(r => normaliseStanding(r));

    const payload = {
      standings:  flattened,
      leagueId,
      season,
      fetchedAt:  new Date().toISOString(),
    };
    setCache(cacheKey, payload);

    return new Response(JSON.stringify(payload), {
      headers: { ...CORS, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[get-football-standings]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
