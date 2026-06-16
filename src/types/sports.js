/**
 * @file sports.js
 * Shared JSDoc type definitions for the Sports Center module.
 * These are used across services, hooks, and components for type-safety via JSDoc.
 */

/**
 * @typedef {'live' | 'upcoming' | 'recent'} CricketFetchType
 */

/**
 * @typedef {'T20' | 'ODI' | 'Test' | 'T10' | 'Other'} CricketMatchFormat
 */

/**
 * @typedef {Object} CricketTeam
 * @property {string} name - Full team name
 * @property {string} shortName - Short abbreviation (e.g. "IND")
 * @property {string} [imageId] - Cricbuzz image ID for logo
 * @property {string} [logoUrl] - Resolved logo URL (if available)
 */

/**
 * @typedef {Object} CricketScore
 * @property {string} [runs]
 * @property {string} [wickets]
 * @property {string} [overs]
 * @property {string} [ballsLeft]
 * @property {string} [runRate]
 * @property {string} [target]
 */

/**
 * @typedef {Object} CricketMatch
 * @property {string} id
 * @property {string} seriesName - Tournament/series name
 * @property {string} matchType - e.g. "T20", "ODI", "Test"
 * @property {string} matchDesc - Match description (e.g. "1st T20I")
 * @property {string} venue
 * @property {string} startTime - ISO date string
 * @property {'live' | 'upcoming' | 'completed'} status
 * @property {string} statusText - Human readable status (e.g. "IND won by 5 wkts")
 * @property {CricketTeam} team1
 * @property {CricketTeam} team2
 * @property {CricketScore} [score1] - Team1 score (innings 1)
 * @property {CricketScore} [score2] - Team2 score (innings 2)
 * @property {string} [tossText]
 * @property {boolean} isLive
 */

// ─── Football Types ───────────────────────────────────────────────

/**
 * @typedef {'live' | 'fixtures' | 'results'} FootballFetchType
 */

/**
 * @typedef {Object} FootballTeam
 * @property {number} id
 * @property {string} name
 * @property {string} [logo] - URL to team logo
 */

/**
 * @typedef {Object} FootballGoals
 * @property {number|null} home
 * @property {number|null} away
 */

/**
 * @typedef {Object} FootballLeague
 * @property {number} id
 * @property {string} name
 * @property {string} [logo]
 * @property {string} [country]
 * @property {string} [flag]
 * @property {number} [round]
 * @property {string} [roundName]
 */

/**
 * @typedef {Object} FootballVenue
 * @property {string} [name]
 * @property {string} [city]
 */

/**
 * @typedef {Object} FootballMatch
 * @property {number} id
 * @property {FootballLeague} league
 * @property {FootballTeam} homeTeam
 * @property {FootballTeam} awayTeam
 * @property {FootballGoals} goals
 * @property {FootballGoals} halftime
 * @property {string} status - Short status code (e.g. "1H", "HT", "FT", "NS")
 * @property {string} statusLong - Full status text
 * @property {number|null} elapsed - Minutes elapsed
 * @property {string} date - ISO date string
 * @property {FootballVenue} venue
 * @property {boolean} isLive
 */

/**
 * @typedef {Object} FootballStandingTeam
 * @property {number} id
 * @property {string} name
 * @property {string} [logo]
 */

/**
 * @typedef {Object} FootballStandingStats
 * @property {number} played
 * @property {number} win
 * @property {number} draw
 * @property {number} lose
 * @property {number} goals
 * @property {number} goalsAgainst
 */

/**
 * @typedef {Object} FootballStanding
 * @property {number} rank
 * @property {FootballStandingTeam} team
 * @property {number} points
 * @property {number} goalsDiff
 * @property {string} form - Last 5 results (e.g. "WWDLW")
 * @property {FootballStandingStats} all
 * @property {FootballStandingStats} home
 * @property {FootballStandingStats} away
 * @property {string} [description] - Promotion/relegation text
 */

/**
 * Known popular football leagues with their API-Football IDs.
 */
export const POPULAR_LEAGUES = [
  { id: 39,  name: 'Premier League',  country: 'England',   flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 140, name: 'La Liga',         country: 'Spain',     flag: '🇪🇸' },
  { id: 135, name: 'Serie A',         country: 'Italy',     flag: '🇮🇹' },
  { id: 78,  name: 'Bundesliga',      country: 'Germany',   flag: '🇩🇪' },
  { id: 61,  name: 'Ligue 1',         country: 'France',    flag: '🇫🇷' },
  { id: 2,   name: 'UEFA Champions League', country: 'Europe', flag: '🇪🇺' },
  { id: 3,   name: 'UEFA Europa League',    country: 'Europe', flag: '🇪🇺' },
  { id: 1,   name: 'World Cup',       country: 'World',     flag: '🌍' },
  { id: 323, name: 'ISL',             country: 'India',     flag: '🇮🇳' },
];

/**
 * Cricket match type display config.
 */
export const CRICKET_TYPES = [
  { key: 'all',   label: 'All' },
  { key: 'T20',   label: 'T20' },
  { key: 'ODI',   label: 'ODI' },
  { key: 'Test',  label: 'Test' },
  { key: 'T10',   label: 'T10' },
];

/**
 * Football live status short codes.
 */
export const LIVE_STATUSES = new Set([
  '1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE',
]);
