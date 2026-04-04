// ===== Player Dashboard JS =====
const API_BASE = '/api/player';

// ===== Globals =====
let dashboardData = null;
let currentChannel = 'general';
let chatPollTimer = null;
let allTeamPlayers = [];
let chatPendingFiles = [];
let onlineUsers = [];

const PlayerAPI = {
    getToken: () => localStorage.getItem('css_player_token'),
    setToken: (t) => localStorage.setItem('css_player_token', t),
    getPlayer: () => JSON.parse(localStorage.getItem('css_player') || 'null'),
    setPlayer: (p) => localStorage.setItem('css_player', JSON.stringify(p)),
    isLoggedIn: () => !!PlayerAPI.getToken() && !!PlayerAPI.getPlayer(),

    async request(url, options = {}) {
        const token = PlayerAPI.getToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(url, { ...options, headers });
        if (res.status === 401) { PlayerAPI.logout(); return; }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur');
        return data;
    },

    async login(email, password) {
        const data = await this.request(`${API_BASE}/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setToken(data.token);
        this.setPlayer(data.player);
        return data;
    },

    logout() {
        localStorage.removeItem('css_player_token');
        localStorage.removeItem('css_player');
        if (chatPollTimer) clearInterval(chatPollTimer);
        document.getElementById('playerLoginScreen').style.display = '';
        document.getElementById('playerDashboard').style.display = 'none';
    }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    if (PlayerAPI.isLoggedIn()) showDashboard();
    setupLoginForm();
});

function setupLoginForm() {
    document.getElementById('playerLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('loginError');
        errorEl.style.display = 'none';
        const email = document.getElementById('playerLoginEmail').value.trim();
        const password = document.getElementById('playerLoginPassword').value;
        if (!email || !password) { errorEl.textContent = 'Veuillez remplir tous les champs'; errorEl.style.display = 'block'; return; }
        try {
            await PlayerAPI.login(email, password);
            showDashboard();
        } catch (err) {
            errorEl.textContent = err.message || 'Identifiants incorrects';
            errorEl.style.display = 'block';
        }
    });
}

async function showDashboard() {
    document.getElementById('playerLoginScreen').style.display = 'none';
    document.getElementById('playerDashboard').style.display = '';
    try {
        dashboardData = await PlayerAPI.request(`${API_BASE}/dashboard`);
        if (!dashboardData) return;
        allTeamPlayers = [...(dashboardData.teammates || [])];
        if (dashboardData.player) {
            allTeamPlayers.push({ id: dashboardData.player.id, name: dashboardData.player.name, number: dashboardData.player.number, category: dashboardData.player.category, image: dashboardData.player.image, rating: dashboardData.player.rating, stats: dashboardData.player.stats });
        }
        renderDashboard(dashboardData);
    } catch (err) { console.error('Dashboard load error:', err); }
}

function renderDashboard(data) {
    const { player, personalStats, recentPerformance, upcomingFixtures, standings, teammates, coaches } = data;
    const isCoach = player.category === 'coach' || player.category === 'staff';
    const staffRole = player.role || '';
    const catLabels = { goalkeepers:'Gardien', defenders:'Défenseur', midfielders:'Milieu', attackers:'Attaquant', coach:'Entraîneur', staff:'Staff' };

    // Store globally for other functions
    window._staffRole = staffRole;
    window._playerCategory = player.category;



    const imgSrc = player.image || defaultAvatar(player.number || '⚽');
    const ratingColor = (player.rating || 0) >= 7 ? '#2ecc71' : (player.rating || 0) >= 5 ? '#f39c12' : '#e74c3c';

    // Fill sidebar profile
    const roleLabel = isCoach && staffRole ? esc(staffRole) : (catLabels[player.category] || player.category);
    document.getElementById('pdbSidebarProfile').innerHTML = `
        <img src="${esc(imgSrc)}" class="pdb-sidebar-avatar" onerror="this.src='${defaultAvatar('👤')}'">
        <div>
            <div class="pdb-sidebar-name">${esc(player.name)}</div>
            <div class="pdb-sidebar-role">${roleLabel}${!isCoach && player.number ? ' · #' + player.number : ''}</div>
            ${!isCoach ? `<div style="font-size:0.7rem;color:${ratingColor};font-weight:800;margin-top:2px;">★ ${player.rating || '-'}</div>` : ''}
        </div>
    `;

    if (!isCoach) {
        const pStats = player.stats || {};
        if (player.category === 'goalkeepers') {
            document.getElementById('pdbStats').innerHTML = `
                <div class="pdb-stat matchs"><div class="pdb-stat-icon"><i class="fas fa-futbol"></i></div><div class="pdb-stat-val">${personalStats.matchs}</div><div class="pdb-stat-label">Matchs</div></div>
                <div class="pdb-stat goals"><div class="pdb-stat-icon"><i class="fas fa-hand-paper"></i></div><div class="pdb-stat-val">${pStats.arrets||0}</div><div class="pdb-stat-label">Arrêts</div></div>
                <div class="pdb-stat assists"><div class="pdb-stat-icon"><i class="fas fa-ban"></i></div><div class="pdb-stat-val">${pStats.cleanSheets||0}</div><div class="pdb-stat-label">Clean Sheets</div></div>
                <div class="pdb-stat yellows"><div class="pdb-stat-icon"><i class="fas fa-square"></i></div><div class="pdb-stat-val">${personalStats.yellowCards}</div><div class="pdb-stat-label">C. Jaunes</div></div>
                <div class="pdb-stat reds"><div class="pdb-stat-icon"><i class="fas fa-square"></i></div><div class="pdb-stat-val">${personalStats.redCards}</div><div class="pdb-stat-label">C. Rouges</div></div>
            `;
        } else if (player.category === 'defenders') {
            document.getElementById('pdbStats').innerHTML = `
                <div class="pdb-stat matchs"><div class="pdb-stat-icon"><i class="fas fa-futbol"></i></div><div class="pdb-stat-val">${personalStats.matchs}</div><div class="pdb-stat-label">Matchs</div></div>
                <div class="pdb-stat goals"><div class="pdb-stat-icon"><i class="fas fa-bullseye"></i></div><div class="pdb-stat-val">${personalStats.goals}</div><div class="pdb-stat-label">Buts</div></div>
                <div class="pdb-stat assists"><div class="pdb-stat-icon"><i class="fas fa-shoe-prints"></i></div><div class="pdb-stat-val">${pStats.tacles||0}</div><div class="pdb-stat-label">Tacles</div></div>
                <div class="pdb-stat yellows"><div class="pdb-stat-icon"><i class="fas fa-hands-helping"></i></div><div class="pdb-stat-val">${personalStats.assists}</div><div class="pdb-stat-label">Passes D.</div></div>
                <div class="pdb-stat reds"><div class="pdb-stat-icon"><i class="fas fa-square"></i></div><div class="pdb-stat-val">${personalStats.yellowCards}</div><div class="pdb-stat-label">C. Jaunes</div></div>
            `;
        } else if (player.category === 'midfielders') {
            document.getElementById('pdbStats').innerHTML = `
                <div class="pdb-stat matchs"><div class="pdb-stat-icon"><i class="fas fa-futbol"></i></div><div class="pdb-stat-val">${personalStats.matchs}</div><div class="pdb-stat-label">Matchs</div></div>
                <div class="pdb-stat goals"><div class="pdb-stat-icon"><i class="fas fa-bullseye"></i></div><div class="pdb-stat-val">${personalStats.goals}</div><div class="pdb-stat-label">Buts</div></div>
                <div class="pdb-stat assists"><div class="pdb-stat-icon"><i class="fas fa-hands-helping"></i></div><div class="pdb-stat-val">${personalStats.assists}</div><div class="pdb-stat-label">Passes D.</div></div>
                <div class="pdb-stat yellows"><div class="pdb-stat-icon"><i class="fas fa-square"></i></div><div class="pdb-stat-val">${personalStats.yellowCards}</div><div class="pdb-stat-label">C. Jaunes</div></div>
                <div class="pdb-stat reds"><div class="pdb-stat-icon"><i class="fas fa-square"></i></div><div class="pdb-stat-val">${personalStats.redCards}</div><div class="pdb-stat-label">C. Rouges</div></div>
            `;
        } else {
            // Attackers
            document.getElementById('pdbStats').innerHTML = `
                <div class="pdb-stat matchs"><div class="pdb-stat-icon"><i class="fas fa-futbol"></i></div><div class="pdb-stat-val">${personalStats.matchs}</div><div class="pdb-stat-label">Matchs</div></div>
                <div class="pdb-stat goals"><div class="pdb-stat-icon"><i class="fas fa-bullseye"></i></div><div class="pdb-stat-val">${personalStats.goals}</div><div class="pdb-stat-label">Buts</div></div>
                <div class="pdb-stat assists"><div class="pdb-stat-icon"><i class="fas fa-hands-helping"></i></div><div class="pdb-stat-val">${personalStats.assists}</div><div class="pdb-stat-label">Passes D.</div></div>
                <div class="pdb-stat yellows"><div class="pdb-stat-icon"><i class="fas fa-crosshairs"></i></div><div class="pdb-stat-val">${pStats.tirs||0}</div><div class="pdb-stat-label">Tirs</div></div>
                <div class="pdb-stat reds"><div class="pdb-stat-icon"><i class="fas fa-square"></i></div><div class="pdb-stat-val">${personalStats.yellowCards}</div><div class="pdb-stat-label">C. Jaunes</div></div>
            `;
        }
    } else {
        const gk = teammates.filter(t => t.category === 'goalkeepers');
        const def = teammates.filter(t => t.category === 'defenders');
        const mid = teammates.filter(t => t.category === 'midfielders');
        const att = teammates.filter(t => t.category === 'attackers');

        if (staffRole.includes('Gardien')) {
            // Goalkeeper coach: GK-focused stats
            const totalSaves = gk.reduce((s,t) => s + ((t.stats||{}).arrets||0), 0);
            const totalCS = gk.reduce((s,t) => s + ((t.stats||{}).cleanSheets||0), 0);
            const avgRating = gk.length ? (gk.reduce((s,t) => s + (t.rating||0), 0) / gk.length).toFixed(1) : '-';
            document.getElementById('pdbStats').innerHTML = `
                <div class="pdb-stat matchs"><div class="pdb-stat-icon"><i class="fas fa-shield-alt"></i></div><div class="pdb-stat-val">${gk.length}</div><div class="pdb-stat-label">Gardiens</div></div>
                <div class="pdb-stat goals"><div class="pdb-stat-icon"><i class="fas fa-hand-paper"></i></div><div class="pdb-stat-val">${totalSaves}</div><div class="pdb-stat-label">Arrêts</div></div>
                <div class="pdb-stat assists"><div class="pdb-stat-icon"><i class="fas fa-ban"></i></div><div class="pdb-stat-val">${totalCS}</div><div class="pdb-stat-label">Clean Sheets</div></div>
                <div class="pdb-stat yellows"><div class="pdb-stat-icon"><i class="fas fa-star"></i></div><div class="pdb-stat-val">${avgRating}</div><div class="pdb-stat-label">Note Moy.</div></div>
                <div class="pdb-stat reds"><div class="pdb-stat-icon"><i class="fas fa-users"></i></div><div class="pdb-stat-val">${teammates.length}</div><div class="pdb-stat-label">Effectif</div></div>
            `;
        } else if (staffRole.includes('Physique')) {
            // Fitness coach: training-focused stats
            const totalMatches = teammates.reduce((s,t) => s + ((t.stats||{}).matchs||0), 0);
            const avgAge = teammates.length ? (teammates.reduce((s,t) => s + (t.age||0), 0) / teammates.length).toFixed(0) : '-';
            document.getElementById('pdbStats').innerHTML = `
                <div class="pdb-stat matchs"><div class="pdb-stat-icon"><i class="fas fa-users"></i></div><div class="pdb-stat-val">${teammates.length}</div><div class="pdb-stat-label">Joueurs</div></div>
                <div class="pdb-stat goals"><div class="pdb-stat-icon"><i class="fas fa-futbol"></i></div><div class="pdb-stat-val">${totalMatches}</div><div class="pdb-stat-label">Matchs Total</div></div>
                <div class="pdb-stat assists"><div class="pdb-stat-icon"><i class="fas fa-birthday-cake"></i></div><div class="pdb-stat-val">${avgAge}</div><div class="pdb-stat-label">Âge Moyen</div></div>
                <div class="pdb-stat yellows"><div class="pdb-stat-icon"><i class="fas fa-dumbbell"></i></div><div class="pdb-stat-val">-</div><div class="pdb-stat-label">Séances/Sem</div></div>
                <div class="pdb-stat reds"><div class="pdb-stat-icon"><i class="fas fa-heartbeat"></i></div><div class="pdb-stat-val">-</div><div class="pdb-stat-label">Condition</div></div>
            `;
        } else {
            // Head coach / Assistant: squad composition
            document.getElementById('pdbStats').innerHTML = `
                <div class="pdb-stat matchs"><div class="pdb-stat-icon"><i class="fas fa-users"></i></div><div class="pdb-stat-val">${teammates.length}</div><div class="pdb-stat-label">Joueurs</div></div>
                <div class="pdb-stat goals"><div class="pdb-stat-icon"><i class="fas fa-shield-alt"></i></div><div class="pdb-stat-val">${gk.length}</div><div class="pdb-stat-label">Gardiens</div></div>
                <div class="pdb-stat assists"><div class="pdb-stat-icon"><i class="fas fa-shield-alt"></i></div><div class="pdb-stat-val">${def.length}</div><div class="pdb-stat-label">Défenseurs</div></div>
                <div class="pdb-stat yellows"><div class="pdb-stat-icon"><i class="fas fa-running"></i></div><div class="pdb-stat-val">${mid.length}</div><div class="pdb-stat-label">Milieux</div></div>
                <div class="pdb-stat reds"><div class="pdb-stat-icon"><i class="fas fa-crosshairs"></i></div><div class="pdb-stat-val">${att.length}</div><div class="pdb-stat-label">Attaquants</div></div>
            `;
        }
    }

    // Sidebar tab visibility per role
    document.querySelectorAll('.pdb-nav-link').forEach(btn => btn.style.display = '');
    if (isCoach && staffRole.includes('Gardien')) {
        // GK Coach: hide formations, IA Coach
        ['formations', 'aicoach'].forEach(tab => {
            const btn = document.querySelector(`.pdb-nav-link[data-tab="${tab}"]`);
            if (btn) btn.style.display = 'none';
        });
    } else if (isCoach && staffRole.includes('Physique')) {
        // Fitness coach: hide formations, IA Coach
        ['formations', 'aicoach'].forEach(tab => {
            const btn = document.querySelector(`.pdb-nav-link[data-tab="${tab}"]`);
            if (btn) btn.style.display = 'none';
        });
    }

    renderPerformance(recentPerformance, isCoach, teammates);
    renderFormations(isCoach);
    renderMessaging();
    renderTraining(isCoach);
    renderAICoach(isCoach);
    renderCalendar(upcomingFixtures);
    renderStandings(standings);
    renderSquad(teammates, coaches, catLabels);
    renderProfile(player, isCoach);
    renderNotifications();
    renderInjuries(isCoach);
    renderGoals();
    renderComparison(teammates);
    renderProgressCharts();
    startNotifPolling();
    // Restore dark mode
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
}

function switchPdbTab(tabName, btn) {
    document.querySelectorAll('.pdb-nav-link').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.pdb-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('tab-' + tabName);
    if (panel) panel.classList.add('active');
    if (tabName === 'messages') loadMessages(currentChannel);
    // Close mobile sidebar
    const sidebar = document.querySelector('.pdb-sidebar');
    if (sidebar && window.innerWidth <= 768) sidebar.classList.remove('open');
}

// ===== PERFORMANCE =====
function renderPerformance(recentPerformance, isCoach, teammates) {
    const panel = document.getElementById('tab-performance');
    const staffRole = window._staffRole || '';

    if (isCoach && staffRole.includes('Gardien')) {
        // Goalkeeper coach: detailed GK analysis
        const gks = teammates.filter(t => t.category === 'goalkeepers');
        panel.innerHTML = `
            <div class="pdb-card"><div class="pdb-card-header"><h3><i class="fas fa-hand-paper" style="color:#e74c3c"></i> Analyse des Gardiens</h3></div>
                <div class="pdb-card-body"><table class="perf-table"><thead><tr><th style="text-align:left">Gardien</th><th>#</th><th>MJ</th><th>Arrêts</th><th>CS</th><th>Note</th></tr></thead>
                <tbody>${gks.map(t => { const s=t.stats||{}; const rc=(t.rating||0)>=7?'#27ae60':(t.rating||0)>=5?'#f39c12':'#e74c3c';
                    return `<tr><td><strong>${esc(t.name)}</strong></td><td>${t.number||'-'}</td><td>${s.matchs||0}</td><td style="font-weight:800;color:#3498db;">${s.arrets||0}</td><td style="font-weight:800;color:#27ae60;">${s.cleanSheets||0}</td><td><span style="color:${rc};font-weight:800">${t.rating||'-'}</span></td></tr>`; }).join('')}</tbody></table></div></div>
            <div class="pdb-card"><div class="pdb-card-header"><h3><i class="fas fa-chart-bar" style="color:#3498db"></i> Comparaison Gardiens</h3></div>
                <div class="pdb-card-body">${gks.map(t => { const s=t.stats||{}; const maxSaves=Math.max(...gks.map(g=>(g.stats||{}).arrets||0),1);
                    return `<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;font-size:0.8rem;font-weight:600;margin-bottom:4px;"><span>${esc(t.name)}</span><span>${s.arrets||0} arrêts</span></div><div style="height:8px;background:#eee;border-radius:4px;overflow:hidden;"><div style="height:100%;width:${((s.arrets||0)/maxSaves*100).toFixed(0)}%;background:linear-gradient(90deg,#3498db,#2ecc71);border-radius:4px;transition:width 0.5s;"></div></div></div>`; }).join('')}</div></div>`;
        return;
    }

    if (isCoach && staffRole.includes('Physique')) {
        // Fitness coach: physical overview of all players
        const sorted = [...teammates].sort((a,b) => (b.age||0) - (a.age||0));
        const young = teammates.filter(t => (t.age||0) < 23).length;
        const prime = teammates.filter(t => (t.age||0) >= 23 && (t.age||0) <= 29).length;
        const senior = teammates.filter(t => (t.age||0) > 29).length;
        panel.innerHTML = `
            <div class="pdb-card"><div class="pdb-card-header"><h3><i class="fas fa-heartbeat" style="color:#e74c3c"></i> Profil Physique de l'Effectif</h3></div>
                <div class="pdb-card-body">
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
                        <div style="text-align:center;padding:14px;background:#e8f5e9;border-radius:10px;"><div style="font-size:1.4rem;font-weight:900;color:#27ae60;">${young}</div><div style="font-size:0.7rem;color:#666;">Jeunes (-23)</div></div>
                        <div style="text-align:center;padding:14px;background:#e3f2fd;border-radius:10px;"><div style="font-size:1.4rem;font-weight:900;color:#2196f3;">${prime}</div><div style="font-size:0.7rem;color:#666;">Prime (23-29)</div></div>
                        <div style="text-align:center;padding:14px;background:#fff3e0;border-radius:10px;"><div style="font-size:1.4rem;font-weight:900;color:#ff9800;">${senior}</div><div style="font-size:0.7rem;color:#666;">Seniors (30+)</div></div>
                    </div>
                    <table class="perf-table"><thead><tr><th style="text-align:left">Joueur</th><th>Poste</th><th>Âge</th><th>MJ</th><th>Note</th></tr></thead>
                    <tbody>${sorted.map(t => { const s=t.stats||{}; const pl={goalkeepers:'GK',defenders:'DEF',midfielders:'MIL',attackers:'ATT'}; const rc=(t.rating||0)>=7?'#27ae60':(t.rating||0)>=5?'#f39c12':'#e74c3c';
                        const ageColor = (t.age||0) > 30 ? '#ff9800' : (t.age||0) < 23 ? '#27ae60' : '#2196f3';
                        return `<tr><td>${esc(t.name)}</td><td>${pl[t.category]||t.category}</td><td style="font-weight:700;color:${ageColor};">${t.age||'-'}</td><td>${s.matchs||0}</td><td><span style="color:${rc};font-weight:800">${t.rating||'-'}</span></td></tr>`; }).join('')}</tbody></table>
                </div></div>`;
        return;
    }

    if (isCoach) {
        const topScorers = [...teammates].sort((a, b) => ((b.stats||{}).buts||0) - ((a.stats||{}).buts||0)).slice(0, 5);
        panel.innerHTML = `
            <div class="pdb-card"><div class="pdb-card-header"><h3><i class="fas fa-trophy" style="color:#f39c12"></i> Meilleurs buteurs</h3></div>
                <div class="pdb-card-body"><table class="perf-table"><thead><tr><th style="text-align:left">Joueur</th><th>#</th><th>MJ</th><th>Buts</th><th>PD</th><th>Note</th></tr></thead>
                <tbody>${topScorers.map(t => { const s=t.stats||{}; const rc=(t.rating||0)>=7?'#27ae60':(t.rating||0)>=5?'#f39c12':'#e74c3c';
                    return `<tr><td>${esc(t.name)}</td><td>${t.number||'-'}</td><td>${s.matchs||0}</td><td class="perf-goal">${s.buts||0}</td><td class="perf-assist">${s.passes||0}</td><td><span style="color:${rc};font-weight:800">${t.rating||'-'}</span></td></tr>`; }).join('')}</tbody></table></div></div>
            <div class="pdb-card"><div class="pdb-card-header"><h3><i class="fas fa-star" style="color:#f39c12"></i> Meilleures notes</h3></div>
                <div class="pdb-card-body"><table class="perf-table"><thead><tr><th style="text-align:left">Joueur</th><th>Poste</th><th>Note</th><th>MJ</th><th>Buts</th></tr></thead>
                <tbody>${[...teammates].sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,8).map(t => { const s=t.stats||{}; const pl={goalkeepers:'GK',defenders:'DEF',midfielders:'MIL',attackers:'ATT'}; const rc=(t.rating||0)>=7?'#27ae60':(t.rating||0)>=5?'#f39c12':'#e74c3c';
                    return `<tr><td>${esc(t.name)}</td><td>${pl[t.category]||t.category}</td><td><span style="color:${rc};font-weight:900;font-size:1.1rem">${t.rating||'-'}</span></td><td>${s.matchs||0}</td><td class="perf-goal">${s.buts||0}</td></tr>`; }).join('')}</tbody></table></div></div>`;
        return;
    }
    if (recentPerformance.length === 0) {
        panel.innerHTML = `<div class="pdb-card"><div class="pdb-card-body" style="text-align:center;color:#999;padding:40px;"><i class="fas fa-chart-line" style="font-size:2rem;opacity:0.3;display:block;margin-bottom:10px;"></i>Aucune performance enregistrée</div></div>`;
        return;
    }

    const playerCat = window._playerCategory || '';
    const posLabel = { goalkeepers:'🧤 Gardien', defenders:'🛡️ Défenseur', midfielders:'🏃 Milieu', attackers:'⚡ Attaquant' };

    if (playerCat === 'goalkeepers') {
        panel.innerHTML = `<div class="pdb-card"><div class="pdb-card-header"><h3><i class="fas fa-chart-line" style="color:#3498db"></i> Performances récentes — ${posLabel[playerCat]}</h3></div>
            <div class="pdb-card-body"><table class="perf-table"><thead><tr><th style="text-align:left">Match</th><th>Score</th><th>Compétition</th><th>🧤 CS</th><th>🟨</th><th>🟥</th></tr></thead>
            <tbody>${recentPerformance.map(m => {
                const cs = (m.goals === 0 && m.assists === 0) ? (parseInt(m.homeScore)===0||parseInt(m.awayScore)===0?'✓':'—') : '—';
                return `<tr><td style="font-size:0.8rem">${esc(m.homeTeam)} vs ${esc(m.awayTeam)}<br><small style="color:#999">${formatDate(m.date)}</small></td>
                <td style="font-weight:800">${m.homeScore} - ${m.awayScore}</td><td style="font-size:0.75rem;color:#888">${esc(m.competition||'-')}</td>
                <td style="font-weight:700;color:#27ae60;">${cs}</td><td>${m.yellowCards||0}</td><td>${m.redCards||0}</td></tr>`;
            }).join('')}</tbody></table></div></div>`;
    } else {
        panel.innerHTML = `<div class="pdb-card"><div class="pdb-card-header"><h3><i class="fas fa-chart-line" style="color:#3498db"></i> Performances récentes — ${posLabel[playerCat] || '⚽ Joueur'}</h3></div>
            <div class="pdb-card-body"><table class="perf-table"><thead><tr><th style="text-align:left">Match</th><th>Score</th><th>Compétition</th><th>⚽</th><th>🅰️</th><th>🟨</th><th>🟥</th></tr></thead>
            <tbody>${recentPerformance.map(m => `<tr><td style="font-size:0.8rem">${esc(m.homeTeam)} vs ${esc(m.awayTeam)}<br><small style="color:#999">${formatDate(m.date)}</small></td>
                <td style="font-weight:800">${m.homeScore} - ${m.awayScore}</td><td style="font-size:0.75rem;color:#888">${esc(m.competition||'-')}</td>
                <td class="perf-goal">${m.goals||0}</td><td class="perf-assist">${m.assists||0}</td><td>${m.yellowCards||0}</td><td>${m.redCards||0}</td></tr>`).join('')}</tbody></table></div></div>`;
    }
}

// ===== FORMATIONS =====
let editorPositions = []; // [{slotIndex, playerId, playerName, playerNumber, playerImage, x, y, role}]
let currentFormationType = 'equilibre';

// Formation type adjustments: offset y values relative to base positions
const FORMATION_TYPE_OFFSETS = {
    'equilibre':       { defY: 0, midY: 0, atkY: 0 },
    'offensif':        { defY: -6, midY: -6, atkY: -5 },
    'defensif':        { defY: 5, midY: 4, atkY: 3 },
    'ultra-offensif':  { defY: -10, midY: -10, atkY: -6 },
    'contre-attaque':  { defY: 6, midY: 2, atkY: -8 }
};

function getAdjustedPositions(system, type) {
    const base = FORMATION_POSITIONS[system] || FORMATION_POSITIONS['4-3-3'];
    const offsets = FORMATION_TYPE_OFFSETS[type] || FORMATION_TYPE_OFFSETS['equilibre'];
    return base.map(p => {
        let dy = 0;
        if (p.y >= 68) dy = offsets.defY;      // defenders
        else if (p.y >= 40) dy = offsets.midY;  // midfielders
        else if (p.y < 40 && p.role !== 'GK') dy = offsets.atkY; // attackers
        return { ...p, y: Math.max(5, Math.min(95, p.y + dy)) };
    });
}

async function renderFormations(isCoach) {
    const panel = document.getElementById('tab-formations');
    const staffRole = window._staffRole || '';
    const canEditFormation = isCoach && !staffRole.includes('Gardien') && !staffRole.includes('Physique');
    panel.innerHTML = '<div style="text-align:center;padding:40px;color:#ccc;"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
        const formations = await PlayerAPI.request(`${API_BASE}/formations`);
        if (!formations) return;
        const headerBtn = canEditFormation ? `<button onclick="openFormationEditor()" style="padding:8px 16px;background:#27ae60;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:0.8rem;cursor:pointer;"><i class="fas fa-plus"></i> Nouvelle formation</button>` : '';
        if (formations.length === 0) {
            panel.innerHTML = `<div class="pdb-card"><div class="pdb-card-header"><h3><i class="fas fa-chess-board" style="color:#9b59b6"></i> Formations tactiques</h3>${headerBtn}</div>
                <div class="pdb-card-body" style="text-align:center;padding:40px;color:#999;"><i class="fas fa-chess-board" style="font-size:2rem;opacity:0.3;display:block;margin-bottom:10px;"></i>${canEditFormation ? 'Aucune formation créée. Créez votre première !' : 'Aucune formation publiée.'}</div></div>`;
            return;
        }
        panel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><h3 style="margin:0;font-size:1.1rem;color:#2c3e50;"><i class="fas fa-chess-board" style="color:#9b59b6"></i> Formations tactiques</h3>${headerBtn}</div>${formations.map(f => renderFormationCard(f, canEditFormation)).join('')}`;
    } catch (err) { panel.innerHTML = `<div class="pdb-card"><div class="pdb-card-body" style="color:#e74c3c;">Erreur: ${esc(err.message)}</div></div>`; }
}

function renderFormationCard(f, isCoach) {
    const id = f.id || f._id;
    const badge = f.status === 'published' ? '<span class="formation-badge published">Publiée</span>' : '<span class="formation-badge draft">Brouillon</span>';
    const actions = isCoach ? `<div style="display:flex;gap:6px;"><button onclick="openFormationEditor('${id}')" style="padding:6px 12px;background:#3498db;color:#fff;border:none;border-radius:6px;font-size:0.7rem;cursor:pointer;"><i class="fas fa-pen"></i></button><button onclick="deleteFormation('${id}')" style="padding:6px 12px;background:#e74c3c;color:#fff;border:none;border-radius:6px;font-size:0.7rem;cursor:pointer;"><i class="fas fa-trash"></i></button></div>` : '';
    const subs = (f.substitutes && f.substitutes.length) ? `<div class="formation-subs"><i class="fas fa-exchange-alt" style="color:#f39c12;margin-right:6px;"></i><strong>Remplaçants:</strong> ${f.substitutes.map(s => `#${s.playerNumber||'?'} ${esc(s.playerName)}`).join(', ')}</div>` : '';
    const notes = f.notes ? `<div class="formation-notes"><i class="fas fa-sticky-note" style="margin-right:6px;"></i>${esc(f.notes)}</div>` : '';
    const pitchHTML = renderMiniPitch(f.positions || []);
    return `<div class="formation-card"><div class="formation-card-header"><div><h4>${esc(f.name)} <span style="color:#9b59b6;font-weight:400;font-size:0.8rem;">(${esc(f.formation||'?')})</span></h4>
        <div class="formation-meta">${f.opponent?`<span><i class="fas fa-futbol"></i> vs ${esc(f.opponent)}</span>`:''}${f.matchDate?`<span><i class="fas fa-calendar"></i> ${formatDate(f.matchDate)}</span>`:''}${f.competition?`<span><i class="fas fa-trophy"></i> ${esc(f.competition)}</span>`:''}
        <span><i class="fas fa-user"></i> ${esc(f.createdByName||'')}</span></div></div><div style="display:flex;align-items:center;gap:10px;">${badge}${actions}</div></div>
        <div style="padding:16px 20px;">${pitchHTML}</div>${subs}${notes}</div>`;
}

function playerPhotoHTML(image, number) {
    if (image) return `<img src="${esc(image)}" alt="" onerror="this.parentNode.innerHTML='<span class=\\'pitch-no-photo\\'>${number||'?'}</span>'">`;
    return `<span class="pitch-no-photo">${number||'?'}</span>`;
}

function renderMiniPitch(positions) {
    const players = positions.map(p => {
        const photo = playerPhotoHTML(p.playerImage, p.playerNumber);
        return `<div class="pitch-player" style="left:${p.x}%;top:${p.y}%;"><div class="pitch-player-circle">${photo}</div><div class="pitch-player-name">${esc(p.playerName||'?')}</div><div class="pitch-player-role">${esc(p.role||'')}</div></div>`;
    }).join('');
    return `<div class="pitch"><div class="pitch-center"></div><div class="pitch-box-top"></div><div class="pitch-box-bot"></div><div class="pitch-6-top"></div><div class="pitch-6-bot"></div>${players}${positions.length===0?'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:rgba(255,255,255,.4);font-size:0.85rem;">Aucun joueur placé</div>':''}</div>`;
}

// ===== FORMATION EDITOR =====
const FORMATION_POSITIONS = {
    '4-3-3': [
        {role:'GK',x:50,y:92},{role:'RB',x:85,y:72},{role:'CB',x:62,y:75},{role:'CB',x:38,y:75},{role:'LB',x:15,y:72},
        {role:'CM',x:65,y:52},{role:'CDM',x:50,y:56},{role:'CM',x:35,y:52},
        {role:'RW',x:82,y:28},{role:'ST',x:50,y:20},{role:'LW',x:18,y:28}
    ],
    '4-4-2': [
        {role:'GK',x:50,y:92},{role:'RB',x:85,y:72},{role:'CB',x:62,y:75},{role:'CB',x:38,y:75},{role:'LB',x:15,y:72},
        {role:'RM',x:82,y:50},{role:'CM',x:62,y:52},{role:'CM',x:38,y:52},{role:'LM',x:18,y:50},
        {role:'ST',x:60,y:22},{role:'ST',x:40,y:22}
    ],
    '4-2-3-1': [
        {role:'GK',x:50,y:92},{role:'RB',x:85,y:72},{role:'CB',x:62,y:75},{role:'CB',x:38,y:75},{role:'LB',x:15,y:72},
        {role:'CDM',x:60,y:58},{role:'CDM',x:40,y:58},
        {role:'RW',x:80,y:38},{role:'CAM',x:50,y:38},{role:'LW',x:20,y:38},
        {role:'ST',x:50,y:18}
    ],
    '3-5-2': [
        {role:'GK',x:50,y:92},{role:'CB',x:70,y:75},{role:'CB',x:50,y:78},{role:'CB',x:30,y:75},
        {role:'RWB',x:88,y:52},{role:'CM',x:65,y:55},{role:'CDM',x:50,y:58},{role:'CM',x:35,y:55},{role:'LWB',x:12,y:52},
        {role:'ST',x:60,y:22},{role:'ST',x:40,y:22}
    ],
    '3-4-3': [
        {role:'GK',x:50,y:92},{role:'CB',x:70,y:75},{role:'CB',x:50,y:78},{role:'CB',x:30,y:75},
        {role:'RM',x:82,y:50},{role:'CM',x:60,y:55},{role:'CM',x:40,y:55},{role:'LM',x:18,y:50},
        {role:'RW',x:78,y:26},{role:'ST',x:50,y:20},{role:'LW',x:22,y:26}
    ],
    '4-1-4-1': [
        {role:'GK',x:50,y:92},{role:'RB',x:85,y:72},{role:'CB',x:62,y:75},{role:'CB',x:38,y:75},{role:'LB',x:15,y:72},
        {role:'CDM',x:50,y:60},
        {role:'RM',x:82,y:42},{role:'CM',x:62,y:45},{role:'CM',x:38,y:45},{role:'LM',x:18,y:42},
        {role:'ST',x:50,y:18}
    ],
    '5-3-2': [
        {role:'GK',x:50,y:92},{role:'RWB',x:88,y:68},{role:'CB',x:68,y:75},{role:'CB',x:50,y:78},{role:'CB',x:32,y:75},{role:'LWB',x:12,y:68},
        {role:'CM',x:65,y:52},{role:'CM',x:50,y:55},{role:'CM',x:35,y:52},
        {role:'ST',x:60,y:22},{role:'ST',x:40,y:22}
    ],
    '4-4-1-1': [
        {role:'GK',x:50,y:92},{role:'RB',x:85,y:72},{role:'CB',x:62,y:75},{role:'CB',x:38,y:75},{role:'LB',x:15,y:72},
        {role:'RM',x:82,y:50},{role:'CM',x:62,y:52},{role:'CM',x:38,y:52},{role:'LM',x:18,y:50},
        {role:'CAM',x:50,y:32},{role:'ST',x:50,y:18}
    ]
};

let editingFormationId = null;
let dragState = null; // { el, startX, startY, slotIndex, offsetX, offsetY, source:'bench'|'pitch' }

function openFormationEditor(id) {
    editingFormationId = id || null;
    editorPositions = [];
    currentFormationType = 'equilibre';
    document.getElementById('formEditorTitle').textContent = id ? 'Modifier la formation' : 'Nouvelle formation';
    document.getElementById('formEditId').value = id || '';
    document.getElementById('formEditName').value = '';
    document.getElementById('formEditSystem').value = '4-3-3';
    document.getElementById('formEditOpponent').value = '';
    document.getElementById('formEditDate').value = '';
    document.getElementById('formEditCompetition').value = '';
    document.getElementById('formEditNotes').value = '';
    // Reset type buttons
    document.querySelectorAll('.formation-type-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.formation-type-btn[data-type="equilibre"]').classList.add('active');

    if (id) {
        PlayerAPI.request(`${API_BASE}/formations`).then(formations => {
            const f = formations.find(x => (x.id || x._id) === id);
            if (f) {
                document.getElementById('formEditName').value = f.name || '';
                document.getElementById('formEditSystem').value = f.formation || '4-3-3';
                document.getElementById('formEditOpponent').value = f.opponent || '';
                document.getElementById('formEditDate').value = f.matchDate || '';
                document.getElementById('formEditCompetition').value = f.competition || '';
                document.getElementById('formEditNotes').value = f.notes || '';
                // Restore positions from saved formation
                const template = FORMATION_POSITIONS[f.formation || '4-3-3'] || FORMATION_POSITIONS['4-3-3'];
                editorPositions = (f.positions || []).map((p, i) => ({
                    slotIndex: i,
                    playerId: p.playerId,
                    playerName: p.playerName,
                    playerNumber: p.playerNumber,
                    playerImage: p.playerImage || findPlayerImage(p.playerId),
                    x: p.x,
                    y: p.y,
                    role: p.role || (template[i] ? template[i].role : '')
                }));
                renderEditorPitch();
                renderEditorBench();
                buildSubstituteSlots(f.substitutes || []);
            }
        });
    } else {
        renderEditorPitch();
        renderEditorBench();
        buildSubstituteSlots([]);
    }

    document.getElementById('formEditSystem').onchange = function() {
        editorPositions = [];
        currentFormationType = 'equilibre';
        document.querySelectorAll('.formation-type-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.formation-type-btn[data-type="equilibre"]').classList.add('active');
        renderEditorPitch();
        renderEditorBench();
    };
    document.getElementById('formationEditorModal').classList.add('active');
}

function findPlayerImage(playerId) {
    const p = allTeamPlayers.find(t => (t.id || t._id) === playerId);
    return p ? p.image : '';
}

function closeFormationEditor() {
    document.getElementById('formationEditorModal').classList.remove('active');
    editorPositions = [];
    dragState = null;
}

function setFormationType(type) {
    currentFormationType = type;
    document.querySelectorAll('.formation-type-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.formation-type-btn[data-type="${type}"]`).classList.add('active');
    // Reposition players based on type
    const system = document.getElementById('formEditSystem').value;
    const adjusted = getAdjustedPositions(system, type);
    editorPositions.forEach(ep => {
        if (ep.slotIndex < adjusted.length) {
            ep.x = adjusted[ep.slotIndex].x;
            ep.y = adjusted[ep.slotIndex].y;
            ep.role = adjusted[ep.slotIndex].role;
        }
    });
    renderEditorPitch();
}

function renderEditorPitch() {
    const pitch = document.getElementById('editorPitch');
    const system = document.getElementById('formEditSystem').value;
    const template = getAdjustedPositions(system, currentFormationType);
    
    let html = '<div class="pitch-center"></div><div class="pitch-box-top"></div><div class="pitch-box-bot"></div><div class="pitch-6-top"></div><div class="pitch-6-bot"></div>';
    
    template.forEach((pos, i) => {
        const assigned = editorPositions.find(ep => ep.slotIndex === i);
        if (assigned) {
            const photo = playerPhotoHTML(assigned.playerImage, assigned.playerNumber);
            html += `<div class="pitch-player draggable" data-slot="${i}" style="left:${assigned.x}%;top:${assigned.y}%;" ondblclick="removeFromPitch(${i})">
                <div class="pitch-player-circle">${photo}</div>
                <div class="pitch-player-name">${esc(assigned.playerName||'?')}</div>
                <div class="pitch-player-role">${esc(assigned.role||'')}</div>
            </div>`;
        } else {
            html += `<div class="pitch-slot" data-slot="${i}" style="left:${pos.x}%;top:${pos.y}%;" onclick="openSlotPicker(${i})">
                <div class="pitch-slot-circle"><i class="fas fa-plus" style="color:rgba(255,255,255,.4);font-size:0.7rem;"></i></div>
                <div class="pitch-slot-role">${esc(pos.role)}</div>
            </div>`;
        }
    });
    
    pitch.innerHTML = html;
    // Attach drag listeners to assigned players
    pitch.querySelectorAll('.pitch-player.draggable').forEach(el => {
        el.addEventListener('mousedown', startDragPitch);
        el.addEventListener('touchstart', startDragPitch, { passive: false });
    });
}

function renderEditorBench() {
    const bench = document.getElementById('editorBench');
    const fieldPlayers = allTeamPlayers.filter(p => p.category !== 'coach' && p.category !== 'staff');
    const usedIds = new Set(editorPositions.map(ep => ep.playerId));
    
    bench.innerHTML = fieldPlayers.map(p => {
        const pid = p.id || p._id;
        const used = usedIds.has(pid);
        const img = p.image ? `<img class="bench-player-photo" src="${esc(p.image)}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%23ccc%22/><text x=%2220%22 y=%2225%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22>${p.number||'?'}</text></svg>'">` : `<div class="bench-player-photo" style="display:flex;align-items:center;justify-content:center;background:#ddd;color:#888;font-weight:800;font-size:0.7rem;">${p.number||'?'}</div>`;
        return `<div class="bench-player${used?' used':''}" data-pid="${pid}" data-name="${esc(p.name)}" data-number="${p.number||0}" data-image="${esc(p.image||'')}">
            ${img}
            <div class="bench-player-info"><div class="bench-player-name">${p.number?'#'+p.number+' ':''}${esc(p.name)}</div></div>
        </div>`;
    }).join('');
    
    // Click bench player to assign to first empty slot
    bench.querySelectorAll('.bench-player:not(.used)').forEach(el => {
        el.addEventListener('click', () => benchPlayerClick(el));
    });
}

function benchPlayerClick(el) {
    const system = document.getElementById('formEditSystem').value;
    const template = getAdjustedPositions(system, currentFormationType);
    // Find first empty slot
    const emptySlot = template.findIndex((_, i) => !editorPositions.find(ep => ep.slotIndex === i));
    if (emptySlot === -1) return; // All slots filled
    assignPlayerToSlot(emptySlot, el.dataset.pid, el.dataset.name, parseInt(el.dataset.number)||0, el.dataset.image);
}

function openSlotPicker(slotIndex) {
    // If there's an unassigned bench player, this just highlights the slot
    // For simplicity, clicking empty slot opens a quick picker
    const system = document.getElementById('formEditSystem').value;
    const template = getAdjustedPositions(system, currentFormationType);
    const pos = template[slotIndex];
    const fieldPlayers = allTeamPlayers.filter(p => p.category !== 'coach' && p.category !== 'staff');
    const usedIds = new Set(editorPositions.map(ep => ep.playerId));
    const available = fieldPlayers.filter(p => !usedIds.has(p.id || p._id));
    
    if (available.length === 0) return;
    
    // Create a floating picker near the slot
    const existing = document.getElementById('slotPickerDropdown');
    if (existing) existing.remove();
    
    const picker = document.createElement('div');
    picker.id = 'slotPickerDropdown';
    picker.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.2);z-index:1100;max-height:350px;width:280px;overflow-y:auto;padding:8px 0;';
    picker.innerHTML = `<div style="padding:8px 16px;font-size:0.75rem;font-weight:700;color:#888;border-bottom:1px solid #eee;">${esc(pos.role)} — Choisir joueur</div>` +
        available.map(p => {
            const pid = p.id || p._id;
            const img = p.image ? `<img src="${esc(p.image)}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1px solid #ddd;" onerror="this.style.display='none'">` : `<div style="width:28px;height:28px;border-radius:50%;background:#ddd;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:800;color:#888;">${p.number||'?'}</div>`;
            return `<div onclick="pickPlayerForSlot(${slotIndex},'${pid}','${esc(p.name).replace(/'/g,"\\'")}',${p.number||0},'${esc(p.image||'').replace(/'/g,"\\'")}')" style="display:flex;align-items:center;gap:8px;padding:8px 16px;cursor:pointer;transition:background .15s;font-size:0.8rem;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background=''">${img} <span style="font-weight:600;">${p.number?'#'+p.number+' ':''}${esc(p.name)}</span></div>`;
        }).join('');
    
    document.body.appendChild(picker);
    
    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', function closePicker(e) {
            if (!picker.contains(e.target)) { picker.remove(); document.removeEventListener('click', closePicker); }
        });
    }, 50);
}

function pickPlayerForSlot(slotIndex, playerId, playerName, playerNumber, playerImage) {
    const existing = document.getElementById('slotPickerDropdown');
    if (existing) existing.remove();
    assignPlayerToSlot(slotIndex, playerId, playerName, playerNumber, playerImage);
}

function assignPlayerToSlot(slotIndex, playerId, playerName, playerNumber, playerImage) {
    const system = document.getElementById('formEditSystem').value;
    const template = getAdjustedPositions(system, currentFormationType);
    const pos = template[slotIndex];
    // Remove if already placed
    editorPositions = editorPositions.filter(ep => ep.playerId !== playerId);
    // Remove existing in this slot
    editorPositions = editorPositions.filter(ep => ep.slotIndex !== slotIndex);
    editorPositions.push({
        slotIndex, playerId, playerName, playerNumber,
        playerImage: playerImage || findPlayerImage(playerId),
        x: pos.x, y: pos.y, role: pos.role
    });
    renderEditorPitch();
    renderEditorBench();
}

function removeFromPitch(slotIndex) {
    editorPositions = editorPositions.filter(ep => ep.slotIndex !== slotIndex);
    renderEditorPitch();
    renderEditorBench();
}

// ===== DRAG AND DROP ON PITCH =====
function startDragPitch(e) {
    e.preventDefault();
    const el = e.currentTarget;
    const slotIndex = parseInt(el.dataset.slot);
    const pitch = document.getElementById('editorPitch');
    const rect = pitch.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    el.classList.add('dragging');
    
    dragState = {
        el, slotIndex, rect,
        startX: parseFloat(el.style.left),
        startY: parseFloat(el.style.top)
    };
    
    const moveHandler = (ev) => {
        ev.preventDefault();
        const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
        const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
        const px = ((cx - dragState.rect.left) / dragState.rect.width) * 100;
        const py = ((cy - dragState.rect.top) / dragState.rect.height) * 100;
        const clampX = Math.max(5, Math.min(95, px));
        const clampY = Math.max(5, Math.min(95, py));
        el.style.left = clampX + '%';
        el.style.top = clampY + '%';
    };
    
    const upHandler = (ev) => {
        el.classList.remove('dragging');
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        document.removeEventListener('touchmove', moveHandler);
        document.removeEventListener('touchend', upHandler);
        
        // Save new position
        const ep = editorPositions.find(p => p.slotIndex === slotIndex);
        if (ep) {
            ep.x = parseFloat(el.style.left);
            ep.y = parseFloat(el.style.top);
        }
        dragState = null;
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('touchend', upHandler);
}

function buildSubstituteSlots(existingSubs) {
    const container = document.getElementById('formEditSubstitutes');
    const fieldPlayers = allTeamPlayers.filter(p => p.category !== 'coach' && p.category !== 'staff');
    const options = fieldPlayers.map(p => `<option value="${p.id||p._id}" data-name="${esc(p.name)}" data-number="${p.number||''}">${p.number?'#'+p.number+' ':''}${esc(p.name)}</option>`).join('');
    const slots = Math.max(7, existingSubs.length);
    container.innerHTML = Array.from({length:slots}, (_,i) => `<select class="form-sub-select" style="padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.8rem;"><option value="">— Remplaçant ${i+1} —</option>${options}</select>`).join('');
    if (existingSubs.length > 0) {
        container.querySelectorAll('.form-sub-select').forEach((sel, i) => {
            if (existingSubs[i] && existingSubs[i].playerId) sel.value = existingSubs[i].playerId;
        });
    }
}

async function saveFormation(status) {
    const system = document.getElementById('formEditSystem').value;
    const positions = editorPositions.map(ep => ({
        playerId: ep.playerId,
        playerName: ep.playerName,
        playerNumber: ep.playerNumber,
        playerImage: ep.playerImage || '',
        x: Math.round(ep.x * 10) / 10,
        y: Math.round(ep.y * 10) / 10,
        role: ep.role
    }));
    const substitutes = [];
    document.querySelectorAll('#formEditSubstitutes .form-sub-select').forEach(sel => {
        if (sel.value) { const opt = sel.selectedOptions[0]; substitutes.push({ playerId: sel.value, playerName: opt.dataset.name, playerNumber: parseInt(opt.dataset.number)||0 }); }
    });
    const body = {
        name: document.getElementById('formEditName').value.trim() || 'Sans titre',
        formation: system, opponent: document.getElementById('formEditOpponent').value.trim(),
        matchDate: document.getElementById('formEditDate').value, competition: document.getElementById('formEditCompetition').value.trim(),
        positions, substitutes, notes: document.getElementById('formEditNotes').value.trim(), status
    };
    try {
        if (editingFormationId) await PlayerAPI.request(`${API_BASE}/formations/${editingFormationId}`, { method:'PUT', body:JSON.stringify(body) });
        else await PlayerAPI.request(`${API_BASE}/formations`, { method:'POST', body:JSON.stringify(body) });
        closeFormationEditor();
        const player = PlayerAPI.getPlayer();
        renderFormations(player.category === 'coach' || player.category === 'staff');
    } catch (err) { alert('Erreur: ' + err.message); }
}

async function deleteFormation(id) {
    if (!confirm('Supprimer cette formation ?')) return;
    try {
        await PlayerAPI.request(`${API_BASE}/formations/${id}`, { method:'DELETE' });
        const player = PlayerAPI.getPlayer();
        renderFormations(player.category === 'coach' || player.category === 'staff');
    } catch (err) { alert('Erreur: ' + err.message); }
}

// ===== TRAINING =====
let editingTrainingId = null;

async function renderTraining(isCoach) {
    const panel = document.getElementById('tab-training');
    const staffRole = window._staffRole || '';
    const canPlanTraining = isCoach;
    panel.innerHTML = '<div style="text-align:center;padding:40px;color:#ccc;"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
        const trainings = await PlayerAPI.request(`${API_BASE}/trainings`);
        if (!trainings) return;

        const playerCat = window._playerCategory || '';
        const posTrainLabels = { goalkeepers:'🧤 Entraînement', defenders:'🛡️ Entraînement', midfielders:'🏃 Entraînement', attackers:'⚡ Entraînement' };
        const titleLabel = staffRole.includes('Physique') ? '🏋️ Préparation Physique' : staffRole.includes('Gardien') ? '🧤 Entraînement Gardiens' : (isCoach ? 'Entraînement' : (posTrainLabels[playerCat] || 'Entraînement'));
        const coachBtn = canPlanTraining ? `<button onclick="openTrainingEditor()" style="padding:8px 16px;background:#e74c3c;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:0.8rem;cursor:pointer;"><i class="fas fa-plus"></i> Planifier séance</button>` : '';

        // Group by upcoming / past
        const now = new Date();
        const upcoming = trainings.filter(t => new Date(t.date) >= new Date(now.toDateString()));
        const past = trainings.filter(t => new Date(t.date) < new Date(now.toDateString()));

        // Build 2-week calendar view
        const calendarHTML = buildTrainingCalendar(trainings);

        const typeLabels = { terrain: 'Terrain', salle: 'Salle / Musculation', tactique: 'Tactique', recuperation: 'Récupération' };
        const typeIcons = { terrain: 'fas fa-futbol', salle: 'fas fa-dumbbell', tactique: 'fas fa-chess', recuperation: 'fas fa-spa' };

        const renderSession = (t) => {
            const id = t.id || t._id;
            const d = new Date(t.date);
            const dayStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
            const actions = isCoach ? `<div style="display:flex;gap:6px;"><button onclick="openTrainingEditor('${id}')" style="padding:4px 10px;background:#3498db;color:#fff;border:none;border-radius:6px;font-size:0.7rem;cursor:pointer;"><i class="fas fa-pen"></i></button><button onclick="deleteTraining('${id}')" style="padding:4px 10px;background:#e74c3c;color:#fff;border:none;border-radius:6px;font-size:0.7rem;cursor:pointer;"><i class="fas fa-trash"></i></button></div>` : '';
            const exerciseHTML = (t.exercises && t.exercises.length) ? `<div class="training-exercises">${t.exercises.map(ex => `<div class="training-exercise"><i class="fas fa-check-circle" style="color:#27ae60;font-size:0.7rem;"></i> <strong>${esc(ex.name)}</strong> ${ex.duration ? `<span style="color:#999;">— ${esc(ex.duration)}</span>` : ''} ${ex.category ? `<span class="exercise-cat">${esc(ex.category)}</span>` : ''} ${ex.intensity ? `<span class="training-intensity ${esc(ex.intensity)}" style="margin-left:auto;">${esc(ex.intensity)}</span>` : ''}</div>`).join('')}</div>` : '';
            const statusBadge = t.status === 'terminé' ? '<span style="font-size:0.65rem;background:#e8f5e9;color:#27ae60;padding:2px 8px;border-radius:10px;font-weight:700;">✓ Terminé</span>' : t.status === 'annulé' ? '<span style="font-size:0.65rem;background:#ffebee;color:#e74c3c;padding:2px 8px;border-radius:10px;font-weight:700;">Annulé</span>' : '';
            const catLabels = { all:'⚽ Collectif', goalkeepers:'🧤 Gardiens', defenders:'🛡️ Défenseurs', midfielders:'🏃 Milieux', attackers:'⚡ Attaquants' };
            const catColors = { all:'#3498db', goalkeepers:'#e67e22', defenders:'#27ae60', midfielders:'#9b59b6', attackers:'#e74c3c' };
            const tc = t.targetCategory || 'all';
            const targetBadge = `<span style="font-size:0.65rem;background:${catColors[tc]}15;color:${catColors[tc]};padding:2px 8px;border-radius:10px;font-weight:700;border:1px solid ${catColors[tc]}30;">${catLabels[tc]}</span>`;
            return `<div class="training-session">
                <div class="training-session-header">
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                            <i class="${typeIcons[t.type]||'fas fa-futbol'}" style="color:#9b59b6;"></i>
                            <strong style="font-size:0.9rem;color:#2c3e50;">${esc(t.title)}</strong>
                            <span class="training-type-badge ${esc(t.type||'terrain')}">${typeLabels[t.type]||t.type}</span>
                            ${targetBadge}
                            ${statusBadge}
                        </div>
                        <div style="font-size:0.75rem;color:#999;display:flex;gap:12px;flex-wrap:wrap;">
                            <span><i class="fas fa-calendar-day"></i> ${dayStr}</span>
                            <span><i class="fas fa-clock"></i> ${esc(t.startTime||'09:00')} - ${esc(t.endTime||'11:00')}</span>
                            ${t.location ? `<span><i class="fas fa-map-marker-alt"></i> ${esc(t.location)}</span>` : ''}
                            ${t.intensity ? `<span class="training-intensity ${esc(t.intensity)}">${esc(t.intensity)}</span>` : ''}
                        </div>
                        ${t.description ? `<div style="font-size:0.8rem;color:#666;margin-top:6px;">${esc(t.description)}</div>` : ''}
                    </div>
                    ${actions}
                </div>
                ${exerciseHTML}
            </div>`;
        };

        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h3 style="margin:0;font-size:1.1rem;color:#2c3e50;"><i class="fas fa-dumbbell" style="color:#e74c3c"></i> ${titleLabel}</h3>
                ${coachBtn}
            </div>
            ${calendarHTML}
            ${upcoming.length > 0 ? `<div style="font-size:0.8rem;font-weight:700;color:#2c3e50;margin:16px 0 10px;"><i class="fas fa-arrow-right" style="color:#27ae60;"></i> Prochaines séances</div>${upcoming.map(renderSession).join('')}` : ''}
            ${past.length > 0 ? `<div style="font-size:0.8rem;font-weight:700;color:#888;margin:20px 0 10px;"><i class="fas fa-history"></i> Séances passées</div>${past.slice(0, 10).map(renderSession).join('')}` : ''}
            ${trainings.length === 0 ? '<div class="pdb-card"><div class="pdb-card-body" style="text-align:center;padding:40px;color:#999;"><i class="fas fa-dumbbell" style="font-size:2rem;opacity:0.3;display:block;margin-bottom:10px;"></i>Aucune séance planifiée</div></div>' : ''}
        `;
    } catch (err) {
        panel.innerHTML = `<div class="pdb-card"><div class="pdb-card-body" style="color:#e74c3c;">Erreur: ${esc(err.message)}</div></div>`;
    }
}

function buildTrainingCalendar(trainings) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        days.push(d);
    }
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return `<div class="training-calendar">${days.map(d => {
        const isToday = d.getTime() === today.getTime();
        const dayTrainings = trainings.filter(t => {
            const td = new Date(t.date);
            return td.toDateString() === d.toDateString() && t.status !== 'annulé';
        });
        const dots = dayTrainings.map(t => `<div class="training-dot ${esc(t.type||'terrain')}" title="${esc(t.title)}"></div>`).join('');
        return `<div class="training-day${isToday ? ' today' : ''}">
            <div class="training-day-label">${dayNames[d.getDay()]}</div>
            <div class="training-day-num">${d.getDate()}</div>
            <div>${dots}</div>
        </div>`;
    }).join('')}</div>
    <div style="display:flex;gap:12px;margin-bottom:16px;font-size:0.7rem;color:#888;">
        <span><span class="training-dot terrain" style="display:inline-block;vertical-align:middle;"></span> Terrain</span>
        <span><span class="training-dot salle" style="display:inline-block;vertical-align:middle;"></span> Salle</span>
        <span><span class="training-dot tactique" style="display:inline-block;vertical-align:middle;"></span> Tactique</span>
        <span><span class="training-dot recuperation" style="display:inline-block;vertical-align:middle;"></span> Récupération</span>
    </div>`;
}

// Training Editor Modal (reuse a simple approach)
function openTrainingEditor(id) {
    editingTrainingId = id || null;
    const existingModal = document.getElementById('trainingEditorModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'trainingEditorModal';
    modal.className = 'form-editor-modal active';
    modal.innerHTML = `<div class="form-editor" style="width:700px;">
        <div class="form-editor-header">
            <h3><i class="fas fa-dumbbell"></i> ${id ? 'Modifier la séance' : 'Planifier une séance'}</h3>
            <button onclick="closeTrainingEditor()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:#999;"><i class="fas fa-times"></i></button>
        </div>
        <div class="form-editor-body">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                <div><label style="font-size:0.75rem;font-weight:600;color:#888;display:block;margin-bottom:4px;">Titre</label>
                    <input type="text" id="trainEditTitle" placeholder="Ex: Entraînement technique" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;"></div>
                <div><label style="font-size:0.75rem;font-weight:600;color:#888;display:block;margin-bottom:4px;">Type</label>
                    <select id="trainEditType" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;">
                        <option value="terrain">🏟️ Terrain</option>
                        <option value="salle">🏋️ Salle / Musculation</option>
                        <option value="tactique">♟️ Tactique</option>
                        <option value="recuperation">🧘 Récupération</option>
                    </select></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;">
                <div><label style="font-size:0.75rem;font-weight:600;color:#888;display:block;margin-bottom:4px;">Date</label>
                    <input type="date" id="trainEditDate" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;"></div>
                <div><label style="font-size:0.75rem;font-weight:600;color:#888;display:block;margin-bottom:4px;">Début</label>
                    <input type="time" id="trainEditStart" value="09:00" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;"></div>
                <div><label style="font-size:0.75rem;font-weight:600;color:#888;display:block;margin-bottom:4px;">Fin</label>
                    <input type="time" id="trainEditEnd" value="11:00" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;"></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                <div><label style="font-size:0.75rem;font-weight:600;color:#888;display:block;margin-bottom:4px;">Lieu</label>
                    <input type="text" id="trainEditLocation" placeholder="Stade Taïeb Mhiri" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;"></div>
                <div><label style="font-size:0.75rem;font-weight:600;color:#888;display:block;margin-bottom:4px;">Intensité</label>
                    <select id="trainEditIntensity" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;">
                        <option value="légère">Légère</option>
                        <option value="modérée" selected>Modérée</option>
                        <option value="intense">Intense</option>
                        <option value="double">Double séance</option>
                    </select></div>
            </div>
            <div style="margin-bottom:12px;"><label style="font-size:0.75rem;font-weight:600;color:#888;display:block;margin-bottom:4px;">👥 Pour qui ?</label>
                <select id="trainEditTarget" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;">
                    <option value="all">⚽ Tout l'effectif (collectif)</option>
                    <option value="goalkeepers">🧤 Gardiens uniquement</option>
                    <option value="defenders">🛡️ Défenseurs uniquement</option>
                    <option value="midfielders">🏃 Milieux uniquement</option>
                    <option value="attackers">⚡ Attaquants uniquement</option>
                </select></div>
            <div style="margin-bottom:12px;"><label style="font-size:0.75rem;font-weight:600;color:#888;display:block;margin-bottom:4px;">Description</label>
                <textarea id="trainEditDesc" rows="2" placeholder="Description de la séance..." style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;resize:vertical;"></textarea></div>
            
            <div style="font-size:0.75rem;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1.5px;margin:12px 0 8px;border-bottom:1px solid #eee;padding-bottom:6px;"><i class="fas fa-list"></i> Exercices</div>
            <div id="trainEditExercises"></div>
            <button onclick="addTrainingExercise()" style="padding:6px 14px;background:#f0f0f0;border:none;border-radius:8px;font-size:0.8rem;cursor:pointer;color:#666;margin-bottom:16px;"><i class="fas fa-plus"></i> Ajouter exercice</button>

            <div style="display:flex;gap:10px;margin-top:16px;">
                <button onclick="closeTrainingEditor()" style="flex:1;padding:12px;background:#f0f0f0;border:none;border-radius:10px;font-weight:600;cursor:pointer;color:#666;">Annuler</button>
                <button onclick="saveTraining('planifié')" style="flex:1;padding:12px;background:#f39c12;border:none;border-radius:10px;font-weight:600;cursor:pointer;color:#fff;"><i class="fas fa-save"></i> Brouillon</button>
                <button onclick="saveTraining('planifié')" style="flex:2;padding:12px;background:#e74c3c;border:none;border-radius:10px;font-weight:700;cursor:pointer;color:#fff;"><i class="fas fa-calendar-check"></i> Planifier</button>
            </div>
        </div>
    </div>`;
    document.body.appendChild(modal);

    // If editing, load data
    if (id) {
        PlayerAPI.request(`${API_BASE}/trainings`).then(trainings => {
            const t = trainings.find(x => (x.id || x._id) === id);
            if (t) {
                document.getElementById('trainEditTitle').value = t.title || '';
                document.getElementById('trainEditType').value = t.type || 'terrain';
                document.getElementById('trainEditDate').value = t.date ? t.date.split('T')[0] : '';
                document.getElementById('trainEditStart').value = t.startTime || '09:00';
                document.getElementById('trainEditEnd').value = t.endTime || '11:00';
                document.getElementById('trainEditLocation').value = t.location || '';
                document.getElementById('trainEditIntensity').value = t.intensity || 'modérée';
                document.getElementById('trainEditTarget').value = t.targetCategory || 'all';
                document.getElementById('trainEditDesc').value = t.description || '';
                const container = document.getElementById('trainEditExercises');
                container.innerHTML = '';
                (t.exercises || []).forEach(ex => addTrainingExercise(ex));
            }
        });
    } else {
        addTrainingExercise();
        addTrainingExercise();
    }
}

function closeTrainingEditor() {
    const modal = document.getElementById('trainingEditorModal');
    if (modal) modal.remove();
    editingTrainingId = null;
}

function addTrainingExercise(data) {
    const container = document.getElementById('trainEditExercises');
    const div = document.createElement('div');
    div.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:6px;margin-bottom:6px;align-items:center;';
    div.innerHTML = `
        <input type="text" class="train-ex-name" value="${esc(data?.name||'')}" placeholder="Nom exercice" style="padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.8rem;">
        <input type="text" class="train-ex-duration" value="${esc(data?.duration||'')}" placeholder="Durée" style="padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.8rem;">
        <select class="train-ex-category" style="padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.8rem;">
            <option value="">Catégorie</option>
            <option value="échauffement"${data?.category==='échauffement'?' selected':''}>Échauffement</option>
            <option value="technique"${data?.category==='technique'?' selected':''}>Technique</option>
            <option value="physique"${data?.category==='physique'?' selected':''}>Physique</option>
            <option value="tactique"${data?.category==='tactique'?' selected':''}>Tactique</option>
            <option value="musculation"${data?.category==='musculation'?' selected':''}>Musculation</option>
            <option value="cardio"${data?.category==='cardio'?' selected':''}>Cardio</option>
            <option value="étirements"${data?.category==='étirements'?' selected':''}>Étirements</option>
        </select>
        <select class="train-ex-intensity" style="padding:8px;border:1px solid #ddd;border-radius:6px;font-size:0.8rem;">
            <option value="faible"${data?.intensity==='faible'?' selected':''}>Faible</option>
            <option value="modéré"${!data?.intensity||data?.intensity==='modéré'?' selected':''}>Modéré</option>
            <option value="intense"${data?.intensity==='intense'?' selected':''}>Intense</option>
            <option value="max"${data?.intensity==='max'?' selected':''}>Max</option>
        </select>
        <button onclick="this.parentElement.remove()" style="padding:6px 10px;background:#ffebee;color:#e74c3c;border:none;border-radius:6px;cursor:pointer;font-size:0.8rem;"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(div);
}

async function saveTraining(status) {
    const exercises = [];
    document.querySelectorAll('#trainEditExercises > div').forEach(row => {
        const name = row.querySelector('.train-ex-name').value.trim();
        if (name) {
            exercises.push({
                name,
                duration: row.querySelector('.train-ex-duration').value.trim(),
                category: row.querySelector('.train-ex-category').value,
                intensity: row.querySelector('.train-ex-intensity').value
            });
        }
    });
    const body = {
        title: document.getElementById('trainEditTitle').value.trim() || 'Séance sans titre',
        type: document.getElementById('trainEditType').value,
        date: document.getElementById('trainEditDate').value,
        startTime: document.getElementById('trainEditStart').value,
        endTime: document.getElementById('trainEditEnd').value,
        location: document.getElementById('trainEditLocation').value.trim(),
        intensity: document.getElementById('trainEditIntensity').value,
        targetCategory: document.getElementById('trainEditTarget').value,
        description: document.getElementById('trainEditDesc').value.trim(),
        exercises,
        status
    };
    if (!body.date) { alert('Veuillez choisir une date'); return; }
    try {
        if (editingTrainingId) await PlayerAPI.request(`${API_BASE}/trainings/${editingTrainingId}`, { method: 'PUT', body: JSON.stringify(body) });
        else await PlayerAPI.request(`${API_BASE}/trainings`, { method: 'POST', body: JSON.stringify(body) });
        closeTrainingEditor();
        const player = PlayerAPI.getPlayer();
        renderTraining(player.category === 'coach' || player.category === 'staff');
    } catch (err) { alert('Erreur: ' + err.message); }
}

async function deleteTraining(id) {
    if (!confirm('Supprimer cette séance ?')) return;
    try {
        await PlayerAPI.request(`${API_BASE}/trainings/${id}`, { method: 'DELETE' });
        const player = PlayerAPI.getPlayer();
        renderTraining(player.category === 'coach' || player.category === 'staff');
    } catch (err) { alert('Erreur: ' + err.message); }
}

// ===== AI COACH =====
let aiChatHistory = [];

async function renderAICoach(isCoach) {
    const panel = document.getElementById('tab-aicoach');
    const staffRole = window._staffRole || '';

    if (isCoach && staffRole.includes('Gardien')) {
        panel.innerHTML = `<div class="pdb-card"><div class="pdb-card-body" style="text-align:center;padding:40px;color:#999;"><i class="fas fa-hand-paper" style="font-size:2rem;opacity:0.3;display:block;margin-bottom:10px;"></i>Votre espace spécialisé est dans l'onglet <strong>Performance</strong>.<br>Vous y trouverez l'analyse détaillée de vos gardiens.</div></div>`;
        return;
    }
    if (isCoach && staffRole.includes('Physique')) {
        panel.innerHTML = `<div class="pdb-card"><div class="pdb-card-body" style="text-align:center;padding:40px;color:#999;"><i class="fas fa-heartbeat" style="font-size:2rem;opacity:0.3;display:block;margin-bottom:10px;"></i>Votre espace spécialisé est dans l'onglet <strong>Performance</strong>.<br>Vous y trouverez le profil physique complet de l'effectif.</div></div>`;
        return;
    }
    if (isCoach && !staffRole.includes('Adjoint')) {
        panel.innerHTML = `<div class="pdb-card"><div class="pdb-card-body" style="text-align:center;padding:40px;color:#999;"><i class="fas fa-robot" style="font-size:2rem;opacity:0.3;display:block;margin-bottom:10px;"></i>L'IA Coach est disponible pour les joueurs uniquement.<br>Chaque joueur voit un programme personnalisé.</div></div>`;
        return;
    }
    panel.innerHTML = '<div style="text-align:center;padding:40px;color:#ccc;"><i class="fas fa-spinner fa-spin"></i> Analyse en cours...</div>';
    try {
        const data = await PlayerAPI.request(`${API_BASE}/ai-coach`);
        if (!data) return;

        const { player, stats, recommendations } = data;
        const catLabels = { goalkeepers: 'Gardien', defenders: 'Défenseur', midfielders: 'Milieu', attackers: 'Attaquant' };

        let headerHtml = `<div class="ai-coach-header">
            <div class="ai-coach-avatar"><i class="fas fa-robot"></i></div>
            <div>
                <h3 style="margin:0 0 4px;font-size:1.1rem;">IA Coach — Programme personnalisé</h3>
                <p style="margin:0;font-size:0.85rem;opacity:0.8;">Analyse pour <strong>${esc(player.name)}</strong> — ${catLabels[player.category]||player.category} #${player.number||'?'}</p>
                <div style="display:flex;gap:16px;margin-top:8px;font-size:0.8rem;opacity:0.7;">
                    <span>⚽ ${stats.matchCount} matchs</span>
                    <span>🎯 ${stats.goals} buts</span>
                    <span>🅰️ ${stats.assists} passes D.</span>
                    <span>📊 ${stats.attendanceRate}% présence</span>
                    <span>🏋️ ${stats.trainingsThisMonth} séances/mois</span>
                </div>
            </div>
        </div>`;

        let recsHtml = '';
        for (const rec of recommendations) {
            if (rec.type === 'programme') {
                recsHtml += `<div class="ai-program-card">
                    <div class="ai-program-header"><i class="fas fa-dumbbell" style="color:#9b59b6;"></i><h4>${esc(rec.title)}</h4></div>
                    <div class="ai-program-body">${rec.items.map(prog => `
                        <div class="ai-exercise-block">
                            <h5><i class="fas fa-fire" style="color:#e74c3c;margin-right:6px;"></i>${esc(prog.name)}</h5>
                            <ul class="ai-exercise-list">${prog.exercises.map(ex => `<li>${esc(ex)}</li>`).join('')}</ul>
                            <div class="ai-exercise-meta">
                                <span><i class="fas fa-clock"></i> ${esc(prog.duration)}</span>
                                <span><i class="fas fa-redo"></i> ${esc(prog.frequency)}</span>
                            </div>
                        </div>`).join('')}
                    </div>
                </div>`;
            } else if (rec.type === 'analyse') {
                recsHtml += `<div class="ai-program-card">
                    <div class="ai-program-header"><i class="fas fa-heartbeat" style="color:#e74c3c;"></i><h4>${esc(rec.title)}</h4></div>
                    <div class="ai-program-body">${rec.items.map(note => `
                        <div class="ai-note ${note.priority||'medium'}">
                            <span style="font-size:1.2rem;">${note.icon||'📊'}</span>
                            <span>${esc(note.text)}</span>
                        </div>`).join('')}
                    </div>
                </div>`;
            } else if (rec.type === 'planning') {
                const typeIcons = { terrain: '🏟️', salle: '🏋️', tactique: '♟️', recuperation: '🧘' };
                recsHtml += `<div class="ai-program-card">
                    <div class="ai-program-header"><i class="fas fa-calendar-week" style="color:#3498db;"></i><h4>${esc(rec.title)}</h4></div>
                    <div class="ai-program-body">
                        <table class="ai-week-plan">
                            <thead><tr><th>Jour</th><th>Séance</th><th>Type</th><th>Intensité</th></tr></thead>
                            <tbody>${rec.items.map(day => `<tr>
                                <td style="font-weight:700;color:#2c3e50;">${esc(day.day)}</td>
                                <td>${esc(day.session)}</td>
                                <td>${typeIcons[day.type]||'⚽'} ${esc(day.type)}</td>
                                <td><span class="training-intensity ${day.intensity === 'Intense' ? 'intense' : day.intensity === 'Légère' || day.intensity === 'Repos' ? 'légère' : 'modérée'}">${esc(day.intensity)}</span></td>
                            </tr>`).join('')}</tbody>
                        </table>
                    </div>
                </div>`;
            } else if (rec.type === 'nutrition') {
                recsHtml += `<div class="ai-program-card">
                    <div class="ai-program-header"><i class="fas fa-apple-alt" style="color:#27ae60;"></i><h4>${esc(rec.title)}</h4></div>
                    <div class="ai-program-body">${rec.items.map(tip => `
                        <div class="ai-nutrition-tip">
                            <i class="fas fa-utensils" style="color:#f39c12;"></i>
                            <span>${esc(tip)}</span>
                        </div>`).join('')}
                    </div>
                </div>`;
            }
        }

        const chatbotHtml = `<div class="ai-chatbot">
            <div class="ai-chatbot-header">
                <i class="fas fa-comments"></i>
                <span>Chat IA Coach</span>
                <span class="bot-status"><i class="fas fa-circle" style="color:#2ecc71;font-size:0.5rem;margin-right:4px;"></i>En ligne</span>
            </div>
            <div class="ai-chat-messages" id="aiChatMessages"></div>
            <div class="ai-chat-input-area">
                <input type="text" id="aiChatInput" placeholder="Pose ta question au coach..." onkeydown="if(event.key==='Enter')sendAIChat()">
                <button onclick="sendAIChat()" title="Envoyer"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>`;

        panel.innerHTML = `<div class="ai-coach-layout">
            ${headerHtml}
            <div class="ai-coach-recs">${recsHtml}</div>
            ${chatbotHtml}
        </div>`;

        // Restore chat history or show welcome
        const msgContainer = document.getElementById('aiChatMessages');
        if (aiChatHistory.length) {
            aiChatHistory.forEach(m => addAIChatBubble(m.text, m.role, m.time, false));
        } else {
            const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const welcome = `Salut ${esc(player.name.split(' ').pop())} ! 👋 Je suis ton IA Coach.\n\nPose-moi une question sur :\n• 💪 Exercices physiques\n• 🥗 Nutrition\n• ♟️ Tactique\n• 🧘 Récupération\n• 📊 Tes stats\n• 🧠 Mental`;
            addAIChatBubble(welcome, 'bot', now, true);
        }
        msgContainer.scrollTop = msgContainer.scrollHeight;

    } catch (err) {
        panel.innerHTML = `<div class="pdb-card"><div class="pdb-card-body" style="color:#e74c3c;">Erreur: ${esc(err.message)}</div></div>`;
    }
}

function addAIChatBubble(text, role, time, save) {
    const container = document.getElementById('aiChatMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `ai-chat-msg ${role}`;
    div.innerHTML = `${esc(text)}<span class="msg-time">${time}</span>`;
    container.appendChild(div);
    if (save) aiChatHistory.push({ text, role, time });
}

async function sendAIChat() {
    const input = document.getElementById('aiChatInput');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    addAIChatBubble(msg, 'user', now, true);

    const container = document.getElementById('aiChatMessages');
    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'ai-chat-typing';
    typing.id = 'aiTyping';
    typing.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;

    try {
        const data = await PlayerAPI.request(`${API_BASE}/ai-chat`, {
            method: 'POST',
            body: JSON.stringify({ message: msg })
        });
        const typingEl = document.getElementById('aiTyping');
        if (typingEl) typingEl.remove();

        const replyTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        addAIChatBubble(data.reply, 'bot', replyTime, true);
    } catch (err) {
        const typingEl = document.getElementById('aiTyping');
        if (typingEl) typingEl.remove();
        addAIChatBubble('Désolé, une erreur est survenue. Réessaie ! 🔄', 'bot', now, false);
    }
    container.scrollTop = container.scrollHeight;
}

// ===== MESSAGING =====
let chatChannelData = { channels: [], groups: [], dms: [] };

async function renderMessaging() {
    const panel = document.getElementById('tab-messages');
    try {
        const [channelsData, usersOnline] = await Promise.all([
            PlayerAPI.request(`${API_BASE}/channels`),
            PlayerAPI.request(`${API_BASE}/online`)
        ]);
        if (!channelsData) return;
        chatChannelData = channelsData;
        const { channels, groups, dms } = channelsData;
        onlineUsers = usersOnline || [];
        const allItems = [...channels, ...groups, ...dms];
        const totalUnread = allItems.reduce((s, c) => s + (c.unread||0), 0);
        const labelEl = document.getElementById('tabMsgLabel');
        if (labelEl) labelEl.innerHTML = 'Messages' + (totalUnread > 0 ? ` <span style="background:#e74c3c;color:#fff;font-size:0.6rem;padding:1px 6px;border-radius:10px;font-weight:800;">${totalUnread}</span>` : '');

        const onlineList = onlineUsers.filter(u => u.online);
        const offlineList = onlineUsers.filter(u => !u.online);

        // Find current channel info
        const current = allItems.find(c => c.id === currentChannel) || channels[0] || { name: 'Général', description: '' };

        panel.innerHTML = `<div class="chat-container">
            <div class="chat-sidebar">
                <div class="chat-sidebar-header"><span>💬 Chat</span><span style="font-size:0.6rem;color:#2ecc71;font-weight:600;">${onlineList.length} en ligne</span></div>
                <div class="chat-sidebar-scroll">
                    <div class="chat-sidebar-section">Canaux</div>
                    ${channels.map(ch => `<div class="chat-channel${ch.id===currentChannel?' active':''}" data-channel="${ch.id}" onclick="switchChannel('${ch.id}','${esc(ch.name)}')">
                        <i class="${ch.icon}"></i><span>${esc(ch.name)}</span>${ch.unread>0?`<span class="ch-badge">${ch.unread}</span>`:''}</div>`).join('')}

                    <div class="chat-sidebar-section" style="margin-top:10px;">Messages privés</div>
                    <button class="chat-new-btn" onclick="openNewDMModal()"><i class="fas fa-plus-circle"></i> Nouveau message</button>
                    ${dms.map(dm => `<div class="chat-dm-item${dm.id===currentChannel?' active':''}" data-channel="${dm.id}" onclick="switchChannel('${dm.id}','${esc(dm.name)}')">
                        <img src="${esc(dm.image||'')}" class="chat-dm-avatar" onerror="this.src='${defaultAvatar(dm.name?dm.name.charAt(0):'?')}'">
                        <span class="chat-dm-name">${esc(dm.name)}</span>${dm.unread>0?`<span class="ch-badge">${dm.unread}</span>`:''}</div>`).join('')}

                    <div class="chat-sidebar-section" style="margin-top:10px;">Groupes</div>
                    <button class="chat-new-btn" onclick="openNewGroupModal()"><i class="fas fa-plus-circle"></i> Créer un groupe</button>
                    ${groups.map(g => `<div class="chat-dm-item${g.id===currentChannel?' active':''}" data-channel="${g.id}" onclick="switchChannel('${g.id}','${esc(g.name)}')">
                        <div class="chat-group-icon"><i class="fas fa-users"></i></div>
                        <span class="chat-dm-name">${esc(g.name)}</span>${g.unread>0?`<span class="ch-badge">${g.unread}</span>`:''}</div>`).join('')}

                    <div class="chat-sidebar-section" style="margin-top:10px;">En ligne (${onlineList.length})</div>
                    ${onlineList.map(u => `<div class="chat-user-item" onclick="startDM('${u.id}')" style="cursor:pointer;" title="Envoyer un message à ${esc(u.name)}">
                        <div style="position:relative"><img src="${esc(u.image||'')}" class="chat-user-avatar" onerror="this.src='${defaultAvatar(u.name?u.name.charAt(0):'?')}'"><div class="chat-user-status online"></div></div>
                        <div><div class="chat-user-name">${esc(u.name)}</div><div class="chat-user-seen" style="color:#2ecc71;">En ligne</div></div></div>`).join('')}
                    ${offlineList.length>0?`<div class="chat-sidebar-section" style="margin-top:10px;">Hors ligne (${offlineList.length})</div>
                    ${offlineList.map(u => `<div class="chat-user-item" onclick="startDM('${u.id}')" style="cursor:pointer;" title="Envoyer un message à ${esc(u.name)}">
                        <div style="position:relative"><img src="${esc(u.image||'')}" class="chat-user-avatar" onerror="this.src='${defaultAvatar(u.name?u.name.charAt(0):'?')}'"><div class="chat-user-status offline"></div></div>
                        <div><div class="chat-user-name">${esc(u.name)}</div><div class="chat-user-seen">${u.lastSeen ? formatLastSeen(u.lastSeen) : 'Jamais connecté'}</div></div></div>`).join('')}`:''}
                </div>
            </div>
            <div class="chat-main">
                <div class="chat-header"><h3 id="chatChannelName">${esc(current.name)}</h3>
                    <span style="font-size:0.7rem;color:#999;" id="chatChannelDesc">${esc(current.description||'')}</span></div>
                <div class="chat-messages" id="chatMessages"><div class="chat-empty"><i class="fas fa-comments" style="font-size:2rem;display:block;margin-bottom:10px;"></i>Chargement...</div></div>
                <div class="chat-upload-preview" id="chatUploadPreview" style="display:none;"></div>
                <div class="chat-input-area">
                    <input type="file" id="chatFileInput" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt" style="display:none" onchange="handleChatFiles(this)">
                    <button class="chat-attach-btn" onclick="document.getElementById('chatFileInput').click()" title="Joindre fichier"><i class="fas fa-paperclip"></i></button>
                    <input type="text" id="chatInput" placeholder="Écrire un message..." maxlength="2000" onkeydown="if(event.key==='Enter')sendMessage()">
                    <button class="chat-send-btn" onclick="sendMessage()"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div></div>`;
        chatPendingFiles = [];
        loadMessages(currentChannel);
        startChatPolling();
    } catch (err) { panel.innerHTML = `<div class="pdb-card"><div class="pdb-card-body" style="color:#e74c3c;">Erreur: ${esc(err.message)}</div></div>`; }
}

function formatLastSeen(dateStr) {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Vu à l\'instant';
    if (diff < 3600) return `Vu il y a ${Math.floor(diff/60)} min`;
    if (diff < 86400) return `Vu il y a ${Math.floor(diff/3600)}h`;
    if (diff < 604800) return `Vu il y a ${Math.floor(diff/86400)}j`;
    return `Vu le ${d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}`;
}

function switchChannel(channelId, channelName) {
    currentChannel = channelId;
    document.querySelectorAll('.chat-channel, .chat-dm-item').forEach(el => el.classList.toggle('active', el.dataset.channel === channelId));
    const nameEl = document.getElementById('chatChannelName');
    if (nameEl) nameEl.textContent = channelName || channelId;
    const descEl = document.getElementById('chatChannelDesc');
    if (descEl) {
        const allItems = [...(chatChannelData.channels||[]), ...(chatChannelData.groups||[]), ...(chatChannelData.dms||[])];
        const item = allItems.find(c => c.id === channelId);
        descEl.textContent = item ? item.description || '' : '';
    }
    loadMessages(channelId);
}

async function loadMessages(channel) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    try {
        const messages = await PlayerAPI.request(`${API_BASE}/messages/${channel}`);
        if (!messages) return;
        PlayerAPI.request(`${API_BASE}/messages/read/${channel}`, { method:'POST' }).catch(()=>{});
        const badge = document.querySelector(`.chat-channel[data-channel="${channel}"] .ch-badge, .chat-dm-item[data-channel="${channel}"] .ch-badge`);
        if (badge) badge.remove();

        const player = PlayerAPI.getPlayer();
        const isCoach = player.category === 'coach' || player.category === 'staff';
        const myId = player.id;

        if (messages.length === 0) {
            container.innerHTML = `<div class="chat-empty"><i class="fas fa-comments" style="font-size:2rem;display:block;margin-bottom:10px;opacity:0.3;"></i>Aucun message. Soyez le premier !</div>`;
            return;
        }
        const pinned = messages.filter(m => m.pinned);
        const regular = messages.filter(m => !m.pinned);
        let html = '';
        if (pinned.length > 0) {
            html += `<div style="font-size:0.7rem;color:#f39c12;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;"><i class="fas fa-thumbtack"></i> Messages épinglés</div>`;
            html += pinned.map(m => renderMessage(m, myId, isCoach)).join('');
            html += `<div style="border-bottom:1px solid #eee;margin:10px 0;"></div>`;
        }
        html += regular.map(m => renderMessage(m, myId, isCoach)).join('');
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    } catch (err) { container.innerHTML = `<div class="chat-empty" style="color:#e74c3c;">Erreur de chargement</div>`; }
}

function renderMessage(m, myId, isCoach) {
    const isMine = m.sender === myId || (m.sender && m.sender.toString && m.sender.toString() === myId);
    const catColors = { goalkeepers:'#f39c12', defenders:'#3498db', midfielders:'#2ecc71', attackers:'#e74c3c', coach:'#9b59b6', staff:'#95a5a6' };
    const catColor = catColors[m.senderCategory] || '#999';
    const time = new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
    const date = new Date(m.createdAt).toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
    const avatar = m.senderImage || defaultAvatar(m.senderName ? m.senderName.charAt(0) : '?');
    const mid = m.id || m._id;
    const actions = [];
    if (isMine || isCoach) actions.push(`<button onclick="deleteMessage('${mid}')" title="Supprimer"><i class="fas fa-trash"></i></button>`);
    if (isCoach) actions.push(`<button onclick="pinMessage('${mid}')" title="${m.pinned?'Désépingler':'Épingler'}"><i class="fas fa-thumbtack"></i></button>`);

    let attachHtml = '';
    if (m.attachments && m.attachments.length > 0) {
        attachHtml = '<div class="chat-msg-attachments">' + m.attachments.map(a => {
            if (a.type === 'image') return `<img src="${esc(a.url)}" class="chat-msg-img" onclick="window.open('${esc(a.url)}','_blank')" alt="${esc(a.name)}" title="${esc(a.name)}">`;
            if (a.type === 'video') return `<video src="${esc(a.url)}" class="chat-msg-video" controls preload="metadata"></video>`;
            return `<a href="${esc(a.url)}" class="chat-msg-file" target="_blank" download="${esc(a.name)}"><i class="fas fa-file-alt"></i><div class="chat-msg-file-info"><span class="chat-msg-file-name">${esc(a.name)}</span><span class="chat-msg-file-size">${formatFileSize(a.size)}</span></div></a>`;
        }).join('') + '</div>';
    }

    const textHtml = m.text ? `<div class="chat-msg-text">${escMessage(m.text)}</div>` : '';

    return `<div class="chat-msg${isMine?' mine':''}${m.pinned?' pinned':''}">
        ${!isMine?`<img src="${esc(avatar)}" class="chat-msg-avatar" onerror="this.src='${defaultAvatar('?')}'">`:''}<div>
        <div class="chat-msg-sender">${!isMine?`<span style="color:${catColor}">${esc(m.senderName)}</span>`:''}${m.pinned?'<i class="fas fa-thumbtack" style="color:#f39c12;font-size:0.6rem;"></i>':''}</div>
        <div class="chat-msg-body">${textHtml}${attachHtml}</div>
        <div class="chat-msg-time">${date} ${time}</div></div>
        ${actions.length>0?`<div class="chat-msg-actions">${actions.join('')}</div>`:''}</div>`;
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' Ko';
    return (bytes/1048576).toFixed(1) + ' Mo';
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text && chatPendingFiles.length === 0) return;
    input.value = '';

    try {
        let attachments = [];
        if (chatPendingFiles.length > 0) {
            const formData = new FormData();
            chatPendingFiles.forEach(f => formData.append('files', f));
            const token = PlayerAPI.getToken();
            const uploadRes = await fetch(`${API_BASE}/chat-upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error || 'Erreur upload');
            attachments = uploadData;
            chatPendingFiles = [];
            const preview = document.getElementById('chatUploadPreview');
            if (preview) { preview.innerHTML = ''; preview.style.display = 'none'; }
        }
        await PlayerAPI.request(`${API_BASE}/messages/${currentChannel}`, {
            method: 'POST',
            body: JSON.stringify({ text: text || '', attachments })
        });
        loadMessages(currentChannel);
    } catch (err) { alert('Erreur: ' + err.message); }
}

function handleChatFiles(input) {
    const files = Array.from(input.files);
    if (files.length === 0) return;
    chatPendingFiles = [...chatPendingFiles, ...files].slice(0, 5);
    input.value = '';
    renderUploadPreview();
}

function renderUploadPreview() {
    const preview = document.getElementById('chatUploadPreview');
    if (!preview) return;
    if (chatPendingFiles.length === 0) { preview.style.display = 'none'; preview.innerHTML = ''; return; }
    preview.style.display = 'flex';
    preview.innerHTML = chatPendingFiles.map((f, i) => {
        if (f.type.startsWith('image/')) {
            const url = URL.createObjectURL(f);
            return `<div class="chat-upload-thumb"><img src="${url}"><button class="remove-attach" onclick="removePendingFile(${i})"><i class="fas fa-times"></i></button></div>`;
        }
        if (f.type.startsWith('video/')) {
            const url = URL.createObjectURL(f);
            return `<div class="chat-upload-thumb"><video src="${url}" muted></video><button class="remove-attach" onclick="removePendingFile(${i})"><i class="fas fa-times"></i></button></div>`;
        }
        return `<div class="chat-upload-file-item"><i class="fas fa-file-alt"></i><span>${esc(f.name)}</span><button class="remove-attach" onclick="removePendingFile(${i})"><i class="fas fa-times"></i></button></div>`;
    }).join('');
}

function removePendingFile(index) {
    chatPendingFiles.splice(index, 1);
    renderUploadPreview();
}

// ===== DM & GROUP CREATION =====
async function startDM(targetId) {
    try {
        const result = await PlayerAPI.request(`${API_BASE}/dm`, {
            method: 'POST',
            body: JSON.stringify({ targetId })
        });
        if (result && result.id) {
            currentChannel = result.id;
            renderMessaging();
        }
    } catch (err) { alert('Erreur: ' + err.message); }
}

function openNewDMModal() {
    const player = PlayerAPI.getPlayer();
    const users = onlineUsers.filter(u => u.id !== player.id);
    const modal = document.createElement('div');
    modal.className = 'chat-modal-overlay';
    modal.id = 'chatModal';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `<div class="chat-modal">
        <div class="chat-modal-header"><h3><i class="fas fa-paper-plane" style="color:#e74c3c;"></i> Nouveau message privé</h3><button class="chat-modal-close" onclick="document.getElementById('chatModal').remove()"><i class="fas fa-times"></i></button></div>
        <div class="chat-modal-body">
            <input type="text" class="chat-search-input" placeholder="Rechercher un joueur..." oninput="filterDMList(this.value)">
            <div id="dmPlayerList">${users.map(u => `<div class="chat-member-check" onclick="document.getElementById('chatModal').remove();startDM('${u.id}')">
                <img src="${esc(u.image||'')}" onerror="this.src='${defaultAvatar(u.name?u.name.charAt(0):'?')}'">
                <div><div class="chat-member-check-name">${esc(u.name)}</div><div class="chat-member-check-cat">${esc(u.category||'')}</div></div>
            </div>`).join('')}</div>
        </div></div>`;
    document.body.appendChild(modal);
}

function filterDMList(query) {
    const items = document.querySelectorAll('#dmPlayerList .chat-member-check');
    const q = query.toLowerCase();
    items.forEach(item => {
        const name = item.querySelector('.chat-member-check-name')?.textContent.toLowerCase() || '';
        item.style.display = name.includes(q) ? '' : 'none';
    });
}

function openNewGroupModal() {
    const player = PlayerAPI.getPlayer();
    const users = onlineUsers.filter(u => u.id !== player.id);
    const modal = document.createElement('div');
    modal.className = 'chat-modal-overlay';
    modal.id = 'chatModal';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `<div class="chat-modal">
        <div class="chat-modal-header"><h3><i class="fas fa-users" style="color:#e74c3c;"></i> Créer un groupe</h3><button class="chat-modal-close" onclick="document.getElementById('chatModal').remove()"><i class="fas fa-times"></i></button></div>
        <div class="chat-modal-body">
            <input type="text" class="chat-search-input" id="groupNameInput" placeholder="Nom du groupe..." style="margin-bottom:12px; font-weight:700;">
            <input type="text" class="chat-search-input" placeholder="Rechercher un joueur..." oninput="filterGroupList(this.value)">
            <div id="groupPlayerList">${users.map(u => `<label class="chat-member-check">
                <input type="checkbox" value="${u.id}">
                <img src="${esc(u.image||'')}" onerror="this.src='${defaultAvatar(u.name?u.name.charAt(0):'?')}'">
                <div><div class="chat-member-check-name">${esc(u.name)}</div><div class="chat-member-check-cat">${esc(u.category||'')}</div></div>
            </label>`).join('')}</div>
        </div>
        <div class="chat-modal-footer">
            <button class="btn-cancel" onclick="document.getElementById('chatModal').remove()">Annuler</button>
            <button class="btn-confirm" onclick="createGroup()"><i class="fas fa-check"></i> Créer</button>
        </div></div>`;
    document.body.appendChild(modal);
}

function filterGroupList(query) {
    const items = document.querySelectorAll('#groupPlayerList .chat-member-check');
    const q = query.toLowerCase();
    items.forEach(item => {
        const name = item.querySelector('.chat-member-check-name')?.textContent.toLowerCase() || '';
        item.style.display = name.includes(q) ? '' : 'none';
    });
}

async function createGroup() {
    const nameInput = document.getElementById('groupNameInput');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) { alert('Veuillez entrer un nom pour le groupe'); return; }
    const checkboxes = document.querySelectorAll('#groupPlayerList input[type="checkbox"]:checked');
    const memberIds = Array.from(checkboxes).map(cb => cb.value);
    if (memberIds.length === 0) { alert('Veuillez sélectionner au moins un membre'); return; }
    try {
        const result = await PlayerAPI.request(`${API_BASE}/groups`, {
            method: 'POST',
            body: JSON.stringify({ name, memberIds })
        });
        const modal = document.getElementById('chatModal');
        if (modal) modal.remove();
        if (result && result.id) {
            currentChannel = result.id;
            renderMessaging();
        }
    } catch (err) { alert('Erreur: ' + err.message); }
}

async function deleteMessage(id) {
    try { await PlayerAPI.request(`${API_BASE}/messages/msg/${id}`, { method:'DELETE' }); loadMessages(currentChannel); }
    catch (err) { alert('Erreur: ' + err.message); }
}

async function pinMessage(id) {
    try { await PlayerAPI.request(`${API_BASE}/messages/pin/${id}`, { method:'PUT' }); loadMessages(currentChannel); }
    catch (err) { alert('Erreur: ' + err.message); }
}

function startChatPolling() {
    if (chatPollTimer) clearInterval(chatPollTimer);
    // Send initial heartbeat
    PlayerAPI.request(`${API_BASE}/heartbeat`, { method:'POST' }).catch(()=>{});
    chatPollTimer = setInterval(() => {
        const activeTab = document.querySelector('.pdb-nav-link.active');
        if (activeTab && activeTab.dataset.tab === 'messages') {
            loadMessages(currentChannel);
            PlayerAPI.request(`${API_BASE}/heartbeat`, { method:'POST' }).catch(()=>{});
            // Refresh online status in sidebar
            PlayerAPI.request(`${API_BASE}/online`).then(users => {
                if (!users) return;
                onlineUsers = users;
                updateOnlineSidebar();
            }).catch(()=>{});
        }
    }, 8000);
}

function updateOnlineSidebar() {
    const scroll = document.querySelector('.chat-sidebar-scroll');
    if (!scroll) return;
    const onlineList = onlineUsers.filter(u => u.online);
    const offlineList = onlineUsers.filter(u => !u.online);
    // Update header count
    const header = document.querySelector('.chat-sidebar-header');
    if (header) {
        const countEl = header.querySelector('span:last-child');
        if (countEl) countEl.textContent = `${onlineList.length} en ligne`;
    }
    // Find and rebuild online/offline sections (keep channels intact)
    const sections = scroll.querySelectorAll('.chat-sidebar-section');
    let onlineSection = null, offlineSection = null;
    sections.forEach(s => {
        if (s.textContent.includes('En ligne')) onlineSection = s;
        if (s.textContent.includes('Hors ligne')) offlineSection = s;
    });
    // Remove old user items and offline section
    scroll.querySelectorAll('.chat-user-item').forEach(el => el.remove());
    if (offlineSection) offlineSection.remove();
    // Rebuild after online section
    if (onlineSection) {
        onlineSection.textContent = `En ligne (${onlineList.length})`;
        let insertAfter = onlineSection;
        onlineList.forEach(u => {
            const div = document.createElement('div');
            div.className = 'chat-user-item';
            div.innerHTML = `<div style="position:relative"><img src="${esc(u.image||'')}" class="chat-user-avatar" onerror="this.src='${defaultAvatar(u.name?u.name.charAt(0):'?')}'"><div class="chat-user-status online"></div></div>
                <div><div class="chat-user-name">${esc(u.name)}</div><div class="chat-user-seen" style="color:#2ecc71;">En ligne</div></div>`;
            insertAfter.after(div);
            insertAfter = div;
        });
        if (offlineList.length > 0) {
            const offSec = document.createElement('div');
            offSec.className = 'chat-sidebar-section';
            offSec.style.marginTop = '10px';
            offSec.textContent = `Hors ligne (${offlineList.length})`;
            insertAfter.after(offSec);
            insertAfter = offSec;
            offlineList.forEach(u => {
                const div = document.createElement('div');
                div.className = 'chat-user-item';
                div.innerHTML = `<div style="position:relative"><img src="${esc(u.image||'')}" class="chat-user-avatar" onerror="this.src='${defaultAvatar(u.name?u.name.charAt(0):'?')}'"><div class="chat-user-status offline"></div></div>
                    <div><div class="chat-user-name">${esc(u.name)}</div><div class="chat-user-seen">${u.lastSeen ? formatLastSeen(u.lastSeen) : 'Jamais connecté'}</div></div>`;
                insertAfter.after(div);
                insertAfter = div;
            });
        }
    }
}

// ===== CALENDAR =====
function renderCalendar(fixtures) {
    const panel = document.getElementById('tab-calendar');
    if (fixtures.length === 0) { panel.innerHTML = `<div class="pdb-card"><div class="pdb-card-body" style="text-align:center;color:#999;padding:40px;"><i class="fas fa-calendar" style="font-size:2rem;opacity:0.3;display:block;margin-bottom:10px;"></i>Aucun match à venir</div></div>`; return; }
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    panel.innerHTML = `<div class="pdb-card"><div class="pdb-card-header"><h3><i class="fas fa-calendar-alt" style="color:#e74c3c"></i> Prochains matchs</h3></div>
        <div class="pdb-card-body"><div class="fixture-list">${fixtures.map(f => { const d = new Date(f.date);
            return `<div class="fix-card"><div class="fix-date"><div class="fix-day">${d.getDate()}</div><div class="fix-month">${months[d.getMonth()]}</div></div>
                <div class="fix-info"><div class="fix-teams">${esc(f.homeTeam||'')} vs ${esc(f.awayTeam||'')}</div>
                <div class="fix-meta"><i class="fas fa-map-marker-alt"></i> ${esc(f.venue||'-')} · ${esc(f.time||'—')} · ${esc(f.competition||'')}</div></div></div>`; }).join('')}</div></div></div>`;
}

// ===== STANDINGS =====
function renderStandings(standings) {
    const panel = document.getElementById('tab-standings');
    if (standings.length === 0) { panel.innerHTML = `<div class="pdb-card"><div class="pdb-card-body" style="text-align:center;color:#999;padding:40px;">Classement non disponible</div></div>`; return; }
    panel.innerHTML = `<div class="pdb-card"><div class="pdb-card-header"><h3><i class="fas fa-list-ol" style="color:#2ecc71"></i> Classement Ligue 1</h3></div>
        <div class="pdb-card-body" style="overflow-x:auto;"><table class="standings-mini"><thead><tr><th>#</th><th>Équipe</th><th>MJ</th><th>V</th><th>N</th><th>D</th><th>BP</th><th>BC</th><th>+/-</th><th>Pts</th></tr></thead>
        <tbody>${standings.map((s,i) => { const gd=s.goalsFor-s.goalsAgainst;
            return `<tr class="${s.isOurTeam?'our-team':''}"><td><strong>${i+1}</strong></td><td>${esc(s.name)} ${s.isOurTeam?'⭐':''}</td>
            <td>${s.played}</td><td>${s.won}</td><td>${s.drawn}</td><td>${s.lost}</td><td>${s.goalsFor}</td><td>${s.goalsAgainst}</td>
            <td style="color:${gd>=0?'#27ae60':'#e74c3c'};font-weight:700">${gd>0?'+':''}${gd}</td><td><strong>${s.points}</strong></td></tr>`; }).join('')}</tbody></table></div></div>`;
}

// ===== SQUAD =====
function renderSquad(teammates, coaches, catLabels) {
    const panel = document.getElementById('tab-squad');
    const catColors = { goalkeepers:'#f39c12', defenders:'#3498db', midfielders:'#2ecc71', attackers:'#e74c3c' };
    panel.innerHTML = `
        ${coaches.length > 0 ? `<div class="pdb-card" style="margin-bottom:20px;"><div class="pdb-card-header"><h3><i class="fas fa-clipboard" style="color:#9b59b6"></i> Staff technique</h3></div>
            <div class="pdb-card-body"><div class="teammates-grid">${coaches.map(c => `<div class="teammate-card">
                <img src="${esc(c.image||'')}" class="teammate-avatar" onerror="this.src='${defaultAvatar('👤')}'">
                <div class="teammate-name">${esc(c.name)}</div><div class="teammate-pos">${esc(c.role||catLabels[c.category]||'')}</div></div>`).join('')}</div></div></div>` : ''}
        <div class="pdb-card"><div class="pdb-card-header"><h3><i class="fas fa-users" style="color:#3498db"></i> Effectif (${teammates.length} joueurs)</h3></div>
            <div class="pdb-card-body"><div class="teammates-grid">${teammates.map(t => {
                const color = catColors[t.category]||'#999';
                const rc = (t.rating||0)>=7?'#27ae60':(t.rating||0)>=5?'#f39c12':(t.rating||0)>0?'#e74c3c':'#ccc';
                return `<div class="teammate-card"><img src="${esc(t.image||'')}" class="teammate-avatar" onerror="this.src='${defaultAvatar(t.number||'?')}'">
                    <div class="teammate-number">#${t.number||'-'}</div><div class="teammate-name">${esc(t.name)}</div>
                    <div class="teammate-pos" style="color:${color}">${catLabels[t.category]||t.category}</div>
                    ${t.rating?`<div class="teammate-rating"><span style="color:${rc};font-weight:800">${t.rating}</span>/10</div>`:''}</div>`; }).join('')}</div></div></div>`;
}

// ===== PROFILE =====
function renderProfile(player, isCoach) {
    const panel = document.getElementById('tab-profile');
    const catLabels = { goalkeepers:'Gardien', defenders:'Défenseur', midfielders:'Milieu', attackers:'Attaquant', coach:'Entraîneur', staff:'Staff' };
    const stats = player.stats || {};

    panel.innerHTML = `
        <div class="pdb-card"><div class="pdb-card-header"><h3><i class="fas fa-user" style="color:#3498db"></i> Informations personnelles</h3></div>
            <div class="pdb-card-body"><div class="profile-grid">
                <div class="profile-field"><label>Nom complet</label><div class="pf-value">${esc(player.name)}</div></div>
                <div class="profile-field"><label>Poste</label><div class="pf-value">${catLabels[player.category]||player.category}${player.role?' — '+esc(player.role):''}</div></div>
                ${player.number?`<div class="profile-field"><label>Numéro</label><div class="pf-value">#${player.number}</div></div>`:''}
                ${player.nationality?`<div class="profile-field"><label>Nationalité</label><div class="pf-value">${esc(player.nationality)}</div></div>`:''}
                ${player.age?`<div class="profile-field"><label>Âge</label><div class="pf-value">${player.age} ans</div></div>`:''}
                ${player.value?`<div class="profile-field"><label>Valeur marchande</label><div class="pf-value">${esc(player.value)}</div></div>`:''}
                ${!isCoach&&player.rating?`<div class="profile-field"><label>Note</label><div class="pf-value">${player.rating} / 10</div></div>`:''}
                ${player.email?`<div class="profile-field"><label>Email</label><div class="pf-value">${esc(player.email)}</div></div>`:''}
            </div></div></div>
        ${!isCoach?`<div class="pdb-card"><div class="pdb-card-header"><h3><i class="fas fa-chart-bar" style="color:#2ecc71"></i> Statistiques complètes</h3></div>
            <div class="pdb-card-body"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;">
                ${statBox('Matchs joués',stats.matchs||0,'#3498db')}${statBox('Buts',stats.buts||0,'#27ae60')}${statBox('Passes décisives',stats.passes||0,'#9b59b6')}
                ${statBox('Cartons jaunes',stats.yellowCards||0,'#f39c12')}${statBox('Cartons rouges',stats.redCards||0,'#e74c3c')}
                ${stats.tacles?statBox('Tacles',stats.tacles,'#3498db'):''}${stats.tirs?statBox('Tirs',stats.tirs,'#e67e22'):''}
                ${stats.cleanSheets?statBox('Clean Sheets',stats.cleanSheets,'#2c3e50'):''}${stats.arrets?statBox('Arrêts',stats.arrets,'#16a085'):''}
            </div></div></div>`:''}
        <div class="pdb-card"><div class="pdb-card-header"><h3><i class="fas fa-lock" style="color:#e74c3c"></i> Changer le mot de passe</h3></div>
            <div class="pdb-card-body"><form id="playerPasswordForm" style="max-width:400px;">
                <div class="profile-field"><label>Mot de passe actuel</label><input type="password" id="ppwdCurrent" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;" required></div>
                <div class="profile-field"><label>Nouveau mot de passe</label><input type="password" id="ppwdNew" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;" required minlength="6"></div>
                <div class="profile-field"><label>Confirmer</label><input type="password" id="ppwdConfirm" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;" required></div>
                <button type="submit" style="padding:12px 24px;background:#e74c3c;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;"><i class="fas fa-save"></i> Changer</button>
                <span id="ppwdMsg" style="margin-left:12px;font-size:0.8rem;"></span>
            </form></div></div>`;

    document.getElementById('playerPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('ppwdMsg');
        const current = document.getElementById('ppwdCurrent').value;
        const newPwd = document.getElementById('ppwdNew').value;
        const confirm = document.getElementById('ppwdConfirm').value;
        if (newPwd !== confirm) { msg.textContent = 'Les mots de passe ne correspondent pas'; msg.style.color = '#e74c3c'; return; }
        if (newPwd.length < 6) { msg.textContent = 'Min 6 caractères'; msg.style.color = '#e74c3c'; return; }
        try {
            await PlayerAPI.request(`${API_BASE}/password`, { method:'PUT', body:JSON.stringify({ currentPassword:current, newPassword:newPwd }) });
            msg.textContent = 'Mot de passe changé !'; msg.style.color = '#27ae60'; e.target.reset();
        } catch (err) { msg.textContent = err.message; msg.style.color = '#e74c3c'; }
    });
}

// ===== NOTIFICATIONS =====
let notifPollTimer = null;
function startNotifPolling() {
    updateNotifBadge();
    notifPollTimer = setInterval(updateNotifBadge, 30000);
}
async function updateNotifBadge() {
    try {
        const data = await PlayerAPI.request(`${API_BASE}/notifications`);
        const badge = document.getElementById('notifSidebarBadge');
        if (badge) {
            if (data.unreadCount > 0) { badge.textContent = data.unreadCount; badge.style.display = 'inline-flex'; }
            else { badge.style.display = 'none'; }
        }
    } catch(e) {}
}
async function renderNotifications() {
    const panel = document.getElementById('tab-notifications');
    panel.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
        const data = await PlayerAPI.request(`${API_BASE}/notifications`);
        const notifs = data.notifications || [];
        panel.innerHTML = `
            <div class="pdb-card">
                <div class="pdb-card-header">
                    <h3><i class="fas fa-bell" style="color:#e74c3c;margin-right:8px;"></i>Notifications</h3>
                    <button onclick="markAllNotifRead()" style="background:#e74c3c;color:#fff;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.75rem;">Tout marquer lu</button>
                </div>
                <div id="notifList">
                    ${notifs.length === 0 ? '<p style="text-align:center;color:#999;padding:30px;">Aucune notification</p>' :
                    notifs.map(n => `
                        <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotifRead('${n._id}', this)">
                            <div class="notif-icon" style="background:${esc(n.color || '#e74c3c')}"><i class="fas ${esc(n.icon || 'fa-bell')}"></i></div>
                            <div class="notif-text">
                                <div style="font-weight:${n.read ? '400' : '600'}">${esc(n.title)}</div>
                                <div style="color:#888;font-size:0.72rem;margin-top:2px;">${esc(n.body)}</div>
                            </div>
                            <div class="notif-time">${timeAgo(n.createdAt)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    } catch(e) { panel.innerHTML = '<p style="color:#e74c3c;padding:20px;">Erreur chargement notifications</p>'; }
}
async function markAllNotifRead() {
    try {
        await PlayerAPI.request(`${API_BASE}/notifications/read`, { method:'PUT' });
        document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
        updateNotifBadge();
    } catch(e) {}
}
async function markNotifRead(id, el) {
    try {
        await PlayerAPI.request(`${API_BASE}/notifications/${id}/read`, { method:'PUT' });
        if (el) el.classList.remove('unread');
        updateNotifBadge();
    } catch(e) {}
}
function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return Math.floor(diff/60) + 'min';
    if (diff < 86400) return Math.floor(diff/3600) + 'h';
    return Math.floor(diff/86400) + 'j';
}

// ===== INJURY TRACKER =====
async function renderInjuries(isCoach) {
    const panel = document.getElementById('tab-injuries');
    panel.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
        const data = await PlayerAPI.request(`${API_BASE}/injuries`);
        const players = data.players || [];
        const statuses = ['apte','blessé','récupération','suspendu'];
        const statusLabels = { apte:'Apte', 'blessé':'Blessé', 'récupération':'Récupération', suspendu:'Suspendu' };
        const counts = {};
        statuses.forEach(s => counts[s] = players.filter(p => p.fitnessStatus === s).length);

        panel.innerHTML = `
            <div class="pdb-card">
                <div class="pdb-card-header"><h3><i class="fas fa-heartbeat" style="color:#e74c3c;margin-right:8px;"></i>État physique de l'équipe</h3></div>
                <div class="pdb-stats" style="margin-bottom:16px;">
                    ${statuses.map(s => statBox(statusLabels[s], counts[s], s === 'apte' ? '#27ae60' : s === 'blessé' ? '#e74c3c' : s === 'récupération' ? '#ff9800' : '#9b59b6')).join('')}
                </div>
                <div id="injuryList">
                    ${players.map(p => `
                        <div class="injury-card">
                            <img src="${p.image || defaultAvatar(p.name?.[0] || '?')}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" onerror="this.src='${defaultAvatar(p.name?.[0] || '?')}'">
                            <div style="flex:1;">
                                <div style="font-weight:600;font-size:0.85rem;">${esc(p.name)} <span style="color:#999;font-size:0.7rem;">#${p.number || ''}</span></div>
                                ${p.injury ? `<div style="font-size:0.72rem;color:#888;margin-top:2px;">${esc(p.injury)}${p.expectedReturn ? ' — Retour: '+formatDate(p.expectedReturn) : ''}</div>` : ''}
                            </div>
                            <span class="injury-status ${p.fitnessStatus || 'apte'}">${statusLabels[p.fitnessStatus || 'apte']}</span>
                            ${isCoach ? `<button onclick="editInjury('${p._id}','${esc(p.name)}')" style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:0.85rem;"><i class="fas fa-edit"></i></button>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>`;
    } catch(e) { panel.innerHTML = '<p style="color:#e74c3c;padding:20px;">Erreur chargement</p>'; }
}
async function editInjury(playerId, playerName) {
    const statuses = ['apte','blessé','récupération','suspendu'];
    const html = `
        <div style="padding:20px;">
            <h4>Modifier l'état: ${esc(playerName)}</h4>
            <label style="display:block;margin:10px 0 4px;font-size:0.8rem;">Statut</label>
            <select id="injStatus" style="width:100%;padding:8px;border-radius:8px;border:1px solid #ddd;">
                ${statuses.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
            <label style="display:block;margin:10px 0 4px;font-size:0.8rem;">Blessure (optionnel)</label>
            <input id="injDesc" style="width:100%;padding:8px;border-radius:8px;border:1px solid #ddd;">
            <label style="display:block;margin:10px 0 4px;font-size:0.8rem;">Retour prévu</label>
            <input id="injReturn" type="date" style="width:100%;padding:8px;border-radius:8px;border:1px solid #ddd;">
            <div style="margin-top:14px;display:flex;gap:8px;">
                <button onclick="saveInjury('${playerId}')" style="flex:1;padding:10px;background:#e74c3c;color:#fff;border:none;border-radius:8px;cursor:pointer;">Sauvegarder</button>
                <button onclick="document.getElementById('injuryModal').remove()" style="flex:1;padding:10px;background:#eee;border:none;border-radius:8px;cursor:pointer;">Annuler</button>
            </div>
        </div>`;
    const modal = document.createElement('div');
    modal.id = 'injuryModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2000;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `<div style="background:#fff;border-radius:14px;max-width:400px;width:90%;">${html}</div>`;
    document.body.appendChild(modal);
}
async function saveInjury(playerId) {
    try {
        await PlayerAPI.request(`${API_BASE}/injuries/${playerId}`, { method:'PUT', body:JSON.stringify({
            fitnessStatus: document.getElementById('injStatus').value,
            injury: document.getElementById('injDesc').value,
            expectedReturn: document.getElementById('injReturn').value || null
        })});
        document.getElementById('injuryModal')?.remove();
        renderInjuries(true);
    } catch(e) { alert(e.message); }
}

// ===== INDIVIDUAL GOALS =====
async function renderGoals() {
    const panel = document.getElementById('tab-goals');
    panel.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
        const data = await PlayerAPI.request(`${API_BASE}/goals`);
        const goals = data.goals || [];
        const catColors = { buts:'#e74c3c', passes:'#3498db', matchs:'#27ae60', entrainement:'#ff9800', physique:'#9b59b6', autre:'#607d8b' };
        const catLabels = { buts:'Buts', passes:'Passes', matchs:'Matchs', entrainement:'Entraînement', physique:'Physique', autre:'Autre' };

        panel.innerHTML = `
            <div class="pdb-card">
                <div class="pdb-card-header">
                    <h3><i class="fas fa-bullseye" style="color:#e74c3c;margin-right:8px;"></i>Mes objectifs</h3>
                    <button onclick="showGoalForm()" style="background:#e74c3c;color:#fff;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.75rem;"><i class="fas fa-plus"></i> Nouveau</button>
                </div>
                <div id="goalFormArea" style="display:none;margin-bottom:14px;padding:14px;border:1px solid #e8eaed;border-radius:10px;">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <input id="goalTitle" placeholder="Titre de l'objectif" style="padding:8px;border:1px solid #ddd;border-radius:8px;grid-column:span 2;">
                        <select id="goalCat" style="padding:8px;border:1px solid #ddd;border-radius:8px;">
                            ${Object.keys(catLabels).map(k => `<option value="${k}">${catLabels[k]}</option>`).join('')}
                        </select>
                        <input id="goalUnit" placeholder="Unité (ex: buts)" style="padding:8px;border:1px solid #ddd;border-radius:8px;">
                        <input id="goalTarget" type="number" placeholder="Objectif" style="padding:8px;border:1px solid #ddd;border-radius:8px;">
                        <input id="goalDeadline" type="date" style="padding:8px;border:1px solid #ddd;border-radius:8px;">
                    </div>
                    <div style="margin-top:8px;display:flex;gap:8px;">
                        <button onclick="saveGoal()" style="padding:8px 16px;background:#e74c3c;color:#fff;border:none;border-radius:8px;cursor:pointer;">Créer</button>
                        <button onclick="document.getElementById('goalFormArea').style.display='none'" style="padding:8px 16px;background:#eee;border:none;border-radius:8px;cursor:pointer;">Annuler</button>
                    </div>
                </div>
                <div id="goalsList">
                    ${goals.length === 0 ? '<p style="text-align:center;color:#999;padding:30px;">Aucun objectif défini</p>' :
                    goals.map(g => {
                        const pct = g.target > 0 ? Math.min(100, Math.round(g.current / g.target * 100)) : 0;
                        const col = catColors[g.category] || '#607d8b';
                        return `
                        <div class="goal-card">
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <div>
                                    <span style="font-weight:700;font-size:0.9rem;">${esc(g.title)}</span>
                                    <span style="background:${col}15;color:${col};padding:2px 8px;border-radius:8px;font-size:0.65rem;margin-left:8px;">${catLabels[g.category] || g.category}</span>
                                    ${g.completed ? '<span style="background:#e8f5e9;color:#27ae60;padding:2px 8px;border-radius:8px;font-size:0.65rem;margin-left:4px;">✓ Atteint</span>' : ''}
                                </div>
                                <div style="display:flex;gap:6px;">
                                    <button onclick="updateGoalProgress('${g._id}', ${g.current}, ${g.target})" style="background:none;border:none;color:#3498db;cursor:pointer;" title="Mettre à jour"><i class="fas fa-edit"></i></button>
                                    <button onclick="deleteGoal('${g._id}')" style="background:none;border:none;color:#e74c3c;cursor:pointer;" title="Supprimer"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                            <div class="goal-progress"><div class="goal-progress-bar" style="width:${pct}%;background:${col};"></div></div>
                            <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:#888;">
                                <span>${g.current} / ${g.target} ${esc(g.unit || '')}</span>
                                <span>${pct}%</span>
                                ${g.deadline ? `<span>Échéance: ${formatDate(g.deadline)}</span>` : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
    } catch(e) { panel.innerHTML = '<p style="color:#e74c3c;padding:20px;">Erreur chargement objectifs</p>'; }
}
function showGoalForm() { document.getElementById('goalFormArea').style.display = 'block'; }
async function saveGoal() {
    try {
        await PlayerAPI.request(`${API_BASE}/goals`, { method:'POST', body:JSON.stringify({
            title: document.getElementById('goalTitle').value,
            category: document.getElementById('goalCat').value,
            unit: document.getElementById('goalUnit').value,
            target: parseInt(document.getElementById('goalTarget').value) || 1,
            deadline: document.getElementById('goalDeadline').value || undefined
        })});
        renderGoals();
    } catch(e) { alert(e.message); }
}
async function updateGoalProgress(id, current, target) {
    const val = prompt(`Progression actuelle (sur ${target}):`, current);
    if (val === null) return;
    const num = parseInt(val);
    if (isNaN(num)) return;
    try {
        await PlayerAPI.request(`${API_BASE}/goals/${id}`, { method:'PUT', body:JSON.stringify({ current: num, completed: num >= target }) });
        renderGoals();
    } catch(e) { alert(e.message); }
}
async function deleteGoal(id) {
    if (!confirm('Supprimer cet objectif ?')) return;
    try {
        await PlayerAPI.request(`${API_BASE}/goals/${id}`, { method:'DELETE' });
        renderGoals();
    } catch(e) { alert(e.message); }
}

// ===== PLAYER COMPARISON =====
async function renderComparison(teammates) {
    const panel = document.getElementById('tab-comparison');
    const players = teammates || allTeamPlayers || [];
    panel.innerHTML = `
        <div class="pdb-card">
            <div class="pdb-card-header"><h3><i class="fas fa-balance-scale" style="color:#e74c3c;margin-right:8px;"></i>Comparaison de joueurs</h3></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                <select id="cmpPlayer1" style="padding:10px;border:1px solid #ddd;border-radius:8px;font-size:0.85rem;">
                    <option value="">— Joueur 1 —</option>
                    ${players.map(p => `<option value="${p._id}">${esc(p.name)} #${p.number || ''}</option>`).join('')}
                </select>
                <select id="cmpPlayer2" style="padding:10px;border:1px solid #ddd;border-radius:8px;font-size:0.85rem;">
                    <option value="">— Joueur 2 —</option>
                    ${players.map(p => `<option value="${p._id}">${esc(p.name)} #${p.number || ''}</option>`).join('')}
                </select>
            </div>
            <button onclick="runComparison()" style="width:100%;padding:10px;background:#e74c3c;color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:600;margin-bottom:16px;"><i class="fas fa-arrows-alt-h"></i> Comparer</button>
            <div id="comparisonResult"></div>
        </div>`;
}
async function runComparison() {
    const id1 = document.getElementById('cmpPlayer1').value;
    const id2 = document.getElementById('cmpPlayer2').value;
    if (!id1 || !id2) { alert('Sélectionnez deux joueurs'); return; }
    if (id1 === id2) { alert('Choisissez deux joueurs différents'); return; }
    const result = document.getElementById('comparisonResult');
    result.innerHTML = '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
        const data = await PlayerAPI.request(`${API_BASE}/compare/${id1}/${id2}`);
        const p1 = data.player1, p2 = data.player2;
        const stats = [
            { label:'Note', k:'rating', max:10 },
            { label:'Buts', k:'goals' },
            { label:'Passes D.', k:'assists' },
            { label:'Matchs', k:'matchesPlayed' },
            { label:'Tacles', k:'tackles' },
            { label:'Interceptions', k:'interceptions' },
            { label:'Tirs', k:'shotsOnTarget' }
        ];
        result.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
                <div style="text-align:center;">
                    <img src="${p1.image || defaultAvatar(p1.name?.[0] || '?')}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;" onerror="this.src='${defaultAvatar(p1.name?.[0] || '?')}'">
                    <div style="font-weight:700;margin-top:6px;">${esc(p1.name)}</div>
                    <div style="font-size:0.7rem;color:#999;">#${p1.number || ''} — ${esc(p1.category || '')}</div>
                </div>
                <div style="text-align:center;">
                    <img src="${p2.image || defaultAvatar(p2.name?.[0] || '?')}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;" onerror="this.src='${defaultAvatar(p2.name?.[0] || '?')}'">
                    <div style="font-weight:700;margin-top:6px;">${esc(p2.name)}</div>
                    <div style="font-size:0.7rem;color:#999;">#${p2.number || ''} — ${esc(p2.category || '')}</div>
                </div>
            </div>
            <div id="cmpStats">
                ${stats.map(s => {
                    const v1 = p1.stats?.[s.k] ?? 0, v2 = p2.stats?.[s.k] ?? 0;
                    const mx = Math.max(v1, v2, 1);
                    return `
                    <div class="compare-stat-row">
                        <span style="width:50px;text-align:right;font-weight:${v1 >= v2 ? '700' : '400'};color:${v1 >= v2 ? '#e74c3c' : '#888'}">${v1}</span>
                        <div style="flex:1;display:flex;align-items:center;gap:4px;margin:0 10px;">
                            <div style="flex:1;height:6px;background:#eee;border-radius:3px;overflow:hidden;direction:rtl;"><div style="height:100%;width:${(v1/mx*100)}%;background:#e74c3c;border-radius:3px;"></div></div>
                            <span style="font-size:0.7rem;color:#999;min-width:60px;text-align:center;">${s.label}</span>
                            <div style="flex:1;height:6px;background:#eee;border-radius:3px;overflow:hidden;"><div style="height:100%;width:${(v2/mx*100)}%;background:#3498db;border-radius:3px;"></div></div>
                        </div>
                        <span style="width:50px;font-weight:${v2 >= v1 ? '700' : '400'};color:${v2 >= v1 ? '#3498db' : '#888'}">${v2}</span>
                    </div>`;
                }).join('')}
            </div>
            <div id="cmpRadarContainer" class="chart-container" style="margin-top:16px;">
                <canvas id="cmpRadarChart"></canvas>
            </div>`;
        // Render radar chart
        if (window.Chart) {
            const ctx = document.getElementById('cmpRadarChart').getContext('2d');
            new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: stats.map(s => s.label),
                    datasets: [{
                        label: p1.name,
                        data: stats.map(s => p1.stats?.[s.k] ?? 0),
                        borderColor: '#e74c3c', backgroundColor: 'rgba(231,76,60,0.15)', pointBackgroundColor: '#e74c3c'
                    }, {
                        label: p2.name,
                        data: stats.map(s => p2.stats?.[s.k] ?? 0),
                        borderColor: '#3498db', backgroundColor: 'rgba(52,152,219,0.15)', pointBackgroundColor: '#3498db'
                    }]
                },
                options: { responsive:true, scales:{ r:{ ticks:{ display:false }, grid:{ color:'#e0e0e0' } } }, plugins:{ legend:{ position:'bottom' } } }
            });
        }
    } catch(e) { result.innerHTML = `<p style="color:#e74c3c">${e.message}</p>`; }
}

// ===== PROGRESS CHARTS =====
async function renderProgressCharts() {
    const panel = document.getElementById('tab-charts');
    panel.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
        const [progData, attData] = await Promise.all([
            PlayerAPI.request(`${API_BASE}/progress`),
            PlayerAPI.request(`${API_BASE}/attendance-stats`)
        ]);
        const progress = progData.progress || [];
        const attendance = attData.stats || [];

        panel.innerHTML = `
            <div class="pdb-card" style="margin-bottom:16px;">
                <div class="pdb-card-header">
                    <h3><i class="fas fa-chart-area" style="color:#e74c3c;margin-right:8px;"></i>Progression (Buts & Passes D.)</h3>
                    <button onclick="exportPDF('tab-charts')" style="background:#e74c3c;color:#fff;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.75rem;"><i class="fas fa-file-pdf"></i> PDF</button>
                </div>
                <div class="chart-container"><canvas id="progressLineChart"></canvas></div>
            </div>
            <div class="pdb-card" style="margin-bottom:16px;">
                <div class="pdb-card-header"><h3><i class="fas fa-calendar-check" style="color:#27ae60;margin-right:8px;"></i>Heatmap de présence</h3></div>
                <div style="display:flex;gap:4px;margin-bottom:8px;font-size:0.65rem;color:#999;">
                    <span><span style="display:inline-block;width:12px;height:12px;background:#27ae60;border-radius:2px;vertical-align:middle;"></span> Présent</span>
                    <span style="margin-left:10px;"><span style="display:inline-block;width:12px;height:12px;background:#e74c3c;border-radius:2px;vertical-align:middle;"></span> Absent</span>
                </div>
                <div id="attendanceHeatmap" class="heatmap-grid"></div>
                <div id="attendanceSummary" style="margin-top:12px;"></div>
            </div>`;

        // Progress line chart
        if (window.Chart && progress.length > 0) {
            const ctx = document.getElementById('progressLineChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: progress.map((_, i) => 'M' + (i+1)),
                    datasets: [{
                        label: 'Buts (cumulés)',
                        data: progress.map(p => p.cumulativeGoals),
                        borderColor: '#e74c3c', backgroundColor: 'rgba(231,76,60,0.1)', fill: true, tension: 0.3
                    }, {
                        label: 'Passes D. (cumulées)',
                        data: progress.map(p => p.cumulativeAssists),
                        borderColor: '#3498db', backgroundColor: 'rgba(52,152,219,0.1)', fill: true, tension: 0.3
                    }]
                },
                options: { responsive:true, plugins:{ legend:{ position:'bottom' } }, scales:{ y:{ beginAtZero:true } } }
            });
        }

        // Attendance heatmap
        const heatmapEl = document.getElementById('attendanceHeatmap');
        if (attendance.length > 0) {
            let totalPresent = 0, totalSessions = attendance.length;
            heatmapEl.innerHTML = attendance.map(a => {
                if (a.present) totalPresent++;
                return `<div class="heatmap-cell ${a.present ? 'present' : 'absent'}" title="${formatDate(a.date)} — ${a.present ? 'Présent' : 'Absent'}"></div>`;
            }).join('');
            const pct = totalSessions > 0 ? Math.round(totalPresent / totalSessions * 100) : 0;
            document.getElementById('attendanceSummary').innerHTML = `
                <div class="pdb-stats">
                    ${statBox('Présences', totalPresent, '#27ae60')}
                    ${statBox('Absences', totalSessions - totalPresent, '#e74c3c')}
                    ${statBox('Taux', pct + '%', pct >= 80 ? '#27ae60' : pct >= 50 ? '#ff9800' : '#e74c3c')}
                </div>`;
        } else {
            heatmapEl.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Aucune donnée de présence</p>';
        }
    } catch(e) { panel.innerHTML = '<p style="color:#e74c3c;padding:20px;">Erreur chargement graphiques</p>'; }
}

// ===== DARK MODE =====
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// ===== PDF EXPORT =====
async function exportPDF(elementId) {
    const el = document.getElementById(elementId) || document.getElementById('tab-performance');
    if (!window.html2canvas || !window.jspdf) { alert('PDF libraries not loaded'); return; }
    try {
        const canvas = await html2canvas(el, { scale:2, useCORS:true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = (canvas.height * pdfW) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
        pdf.save('rapport-performance.pdf');
    } catch(e) { alert('Erreur export PDF: ' + e.message); }
}

// ===== Helpers =====
function esc(str) { if (!str) return ''; const div = document.createElement('div'); div.textContent = str; return div.innerHTML; }
function escMessage(text) { return esc(text).replace(/\n/g, '<br>'); }
function formatDate(dateStr) { if (!dateStr) return '-'; return new Date(dateStr).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }); }
function statBox(label, value, color) { return `<div style="background:#f7f8fa;border:1px solid #e8eaed;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:1.5rem;font-weight:900;color:${color}">${value}</div><div style="font-size:0.65rem;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">${label}</div></div>`; }
function defaultAvatar(text) { return `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%232c3e50%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2258%22 text-anchor=%22middle%22 fill=%22%23fff%22 font-size=%2236%22>${encodeURIComponent(text)}</text></svg>`; }

// ===== PWA Registration =====
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/service-worker.js').catch(() => {}); }
