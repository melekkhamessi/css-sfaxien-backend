/**
 * API-Football Service (v3.football.api-sports.io)
 * Fetches real football data: matches, standings, fixtures, match details
 * Free tier: 100 requests/day — data is cached in DB to minimize API calls
 */

const https = require('https');
const Settings = require('../models/Settings');

const API_HOST = 'v3.football.api-sports.io';
const TUNISIAN_LIGUE1 = 202;
const CSS_TEAM_ID = 835; // CS Sfaxien ID on API-Football

/**
 * Make a request to API-Football
 */
function apiRequest(path, apiKey) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_HOST,
            path,
            method: 'GET',
            headers: { 'x-apisports-key': apiKey }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.errors && Object.keys(parsed.errors).length > 0) {
                        reject(new Error('API Error: ' + JSON.stringify(parsed.errors)));
                    } else {
                        resolve(parsed);
                    }
                } catch (e) {
                    reject(new Error('Parse error: ' + e.message));
                }
            });
        });

        req.on('error', (err) => reject(new Error('Network error: ' + err.message)));
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')); });
        req.end();
    });
}

/**
 * Get the saved API key from settings
 */
async function getApiKey() {
    const key = await Settings.get('footballApiKey');
    if (!key) throw new Error('Clé API-Football non configurée. Allez dans Paramètres > API Football.');
    return key;
}

/**
 * Get configured team ID (default: CS Sfaxien = 835)
 */
async function getTeamId() {
    return await Settings.get('footballTeamId', CSS_TEAM_ID);
}

/**
 * Get configured league ID (default: Tunisian Ligue 1 = 202)
 */
async function getLeagueId() {
    return await Settings.get('footballLeagueId', TUNISIAN_LIGUE1);
}

/**
 * Get current season year
 */
function getCurrentSeason() {
    const now = new Date();
    // Tunisian league season spans Aug-May, so if we're past July use current year, else previous
    return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

// ========== DATA FETCHERS ==========

/**
 * Fetch league standings
 */
async function fetchStandings(apiKey, leagueId, season) {
    const data = await apiRequest(`/standings?league=${leagueId}&season=${season}`, apiKey);
    const standings = data.response?.[0]?.league?.standings?.[0];
    if (!standings || standings.length === 0) return [];

    return standings.map((team, index) => ({
        rank: index + 1,
        name: team.team.name,
        logo: team.team.logo,
        apiTeamId: team.team.id,
        isOurTeam: team.team.id === CSS_TEAM_ID || /sfax/i.test(team.team.name),
        played: team.all.played || 0,
        won: team.all.win || 0,
        drawn: team.all.draw || 0,
        lost: team.all.lose || 0,
        goalsFor: team.all.goals?.for || 0,
        goalsAgainst: team.all.goals?.against || 0,
        points: team.points || 0,
        form: (team.form || '').split('').slice(-5).map(c => c === 'W' ? 'W' : c === 'D' ? 'D' : 'L'),
        goalDifference: team.goalsDiff || 0
    }));
}

/**
 * Fetch team's recent and upcoming fixtures
 */
async function fetchTeamFixtures(apiKey, teamId, season, next, last) {
    const results = [];

    // Last N matches (results)
    if (last) {
        const data = await apiRequest(`/fixtures?team=${teamId}&season=${season}&last=${last}`, apiKey);
        if (data.response) results.push(...data.response);
    }

    // Next N matches (upcoming)
    if (next) {
        const data = await apiRequest(`/fixtures?team=${teamId}&season=${season}&next=${next}`, apiKey);
        if (data.response) results.push(...data.response);
    }

    return results.map(mapFixture);
}

/**
 * Fetch all fixtures for a league round/matchday
 */
async function fetchLeagueFixtures(apiKey, leagueId, season, round) {
    let path = `/fixtures?league=${leagueId}&season=${season}`;
    if (round) path += `&round=${encodeURIComponent(round)}`;
    const data = await apiRequest(path, apiKey);
    return (data.response || []).map(mapFixture);
}

/**
 * Fetch detailed match info (events, lineups, stats)
 */
async function fetchMatchDetails(apiKey, fixtureId) {
    // Parallel fetch of fixture, events, lineups, statistics
    const [fixtureData, eventsData, lineupsData, statsData] = await Promise.all([
        apiRequest(`/fixtures?id=${fixtureId}`, apiKey),
        apiRequest(`/fixtures/events?fixture=${fixtureId}`, apiKey),
        apiRequest(`/fixtures/lineups?fixture=${fixtureId}`, apiKey),
        apiRequest(`/fixtures/statistics?fixture=${fixtureId}`, apiKey)
    ]);

    const fixture = fixtureData.response?.[0];
    if (!fixture) throw new Error('Match non trouvé');

    const events = (eventsData.response || []).map(e => ({
        minute: e.time?.elapsed || 0,
        extra: e.time?.extra || null,
        type: mapEventType(e.type, e.detail),
        player: e.player?.name || '',
        assist: e.assist?.name || '',
        team: e.team?.name || ''
    }));

    const lineups = (lineupsData.response || []).map(l => ({
        team: l.team?.name || '',
        formation: l.formation || '',
        coach: l.coach?.name || '',
        startXI: (l.startXI || []).map(p => ({
            name: p.player?.name || '',
            number: p.player?.number || 0,
            position: mapPosition(p.player?.pos)
        })),
        substitutes: (l.substitutes || []).map(p => ({
            name: p.player?.name || '',
            number: p.player?.number || 0,
            position: mapPosition(p.player?.pos)
        }))
    }));

    const statistics = {};
    if (statsData.response && statsData.response.length >= 2) {
        const home = statsData.response[0].statistics || [];
        const away = statsData.response[1].statistics || [];
        const statMap = {
            'Ball Possession': 'possession',
            'Total Shots': 'shots',
            'Shots on Goal': 'shotsOnTarget',
            'Corner Kicks': 'corners',
            'Fouls': 'fouls',
            'Offsides': 'offsides',
            'Yellow Cards': 'yellowCards',
            'Red Cards': 'redCards',
            'Total passes': 'passes',
            'Passes accurate': 'passAccuracy',
            'Goalkeeper Saves': 'saves'
        };

        for (const [apiName, localName] of Object.entries(statMap)) {
            const h = home.find(s => s.type === apiName);
            const a = away.find(s => s.type === apiName);
            statistics[localName] = [
                parseStatValue(h?.value),
                parseStatValue(a?.value)
            ];
        }
    }

    return {
        fixture: mapFixture(fixture),
        events,
        lineups,
        statistics
    };
}

/**
 * Fetch top scorers for a league
 */
async function fetchTopScorers(apiKey, leagueId, season) {
    const data = await apiRequest(`/players/topscorers?league=${leagueId}&season=${season}`, apiKey);
    return (data.response || []).slice(0, 20).map(p => ({
        name: p.player?.name || '',
        photo: p.player?.photo || '',
        team: p.statistics?.[0]?.team?.name || '',
        goals: p.statistics?.[0]?.goals?.total || 0,
        assists: p.statistics?.[0]?.goals?.assists || 0,
        matches: p.statistics?.[0]?.games?.appearences || 0,
        rating: p.statistics?.[0]?.games?.rating ? parseFloat(p.statistics[0].games.rating) : null
    }));
}

/**
 * Check remaining API quota
 */
async function fetchApiStatus(apiKey) {
    const data = await apiRequest('/status', apiKey);
    const sub = data.response?.subscription;
    const requests = data.response?.requests;
    return {
        plan: sub?.plan || 'Unknown',
        active: sub?.active || false,
        requestsUsed: requests?.current || 0,
        requestsLimit: requests?.limit_day || 100,
        remaining: (requests?.limit_day || 100) - (requests?.current || 0)
    };
}

// ========== HELPERS ==========

function mapFixture(f) {
    const status = f.fixture?.status?.short;
    let matchStatus = 'upcoming';
    if (['FT', 'AET', 'PEN'].includes(status)) matchStatus = 'finished';
    else if (['1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(status)) matchStatus = 'live';

    const isHome = f.teams?.home?.id === CSS_TEAM_ID || /sfax/i.test(f.teams?.home?.name || '');

    return {
        apiFixtureId: f.fixture?.id,
        homeTeam: f.teams?.home?.name || '',
        awayTeam: f.teams?.away?.name || '',
        homeLogo: f.teams?.home?.logo || '',
        awayLogo: f.teams?.away?.logo || '',
        homeScore: f.goals?.home ?? null,
        awayScore: f.goals?.away ?? null,
        date: f.fixture?.date ? new Date(f.fixture.date).toISOString().split('T')[0] : '',
        time: f.fixture?.date ? new Date(f.fixture.date).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
        competition: f.league?.name || '',
        venue: f.fixture?.venue?.name || '',
        referee: f.fixture?.referee || '',
        status: matchStatus,
        statusDetail: f.fixture?.status?.long || '',
        minute: f.fixture?.status?.elapsed || null,
        isHome,
        round: f.league?.round || '',
        season: f.league?.season || getCurrentSeason()
    };
}

function mapEventType(type, detail) {
    if (type === 'Goal' && detail === 'Normal Goal') return 'goal';
    if (type === 'Goal' && detail === 'Own Goal') return 'og';
    if (type === 'Goal' && detail === 'Penalty') return 'pen';
    if (type === 'Goal' && detail === 'Missed Penalty') return 'miss';
    if (type === 'Card' && detail === 'Yellow Card') return 'yellow';
    if (type === 'Card' && detail === 'Red Card') return 'red';
    if (type === 'Card' && detail === 'Second Yellow card') return 'red';
    if (type === 'subst') return 'sub';
    if (type === 'Var') return 'var';
    return type?.toLowerCase() || 'other';
}

function mapPosition(pos) {
    const map = { G: 'Gardien', D: 'Défenseur', M: 'Milieu', F: 'Attaquant' };
    return map[pos] || pos || '';
}

function parseStatValue(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'string') {
        const num = parseInt(val.replace('%', ''));
        return isNaN(num) ? 0 : num;
    }
    return val;
}

module.exports = {
    fetchStandings,
    fetchTeamFixtures,
    fetchLeagueFixtures,
    fetchMatchDetails,
    fetchTopScorers,
    fetchApiStatus,
    getApiKey,
    getTeamId,
    getLeagueId,
    getCurrentSeason,
    CSS_TEAM_ID,
    TUNISIAN_LIGUE1
};
